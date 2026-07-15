import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { KERNEL_LEGAL_AUDITED_OBJECTS } from 'src/modules/kernel-legal/constants/audited-objects.constant';
import { rememberAuditBefore } from 'src/modules/kernel-legal/query-hooks/audit-before-store';

type AuditableRecord = ObjectLiteral & { id: string };

// Captura el estado previo del registro antes de una actualización para que el
// POST_HOOK de auditoría pueda guardar beforeValue. Solo objetos auditados.
@WorkspaceQueryHook(`*.updateOne`)
export class AuditCaptureBeforePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: UpdateOneResolverArgs<AuditableRecord>,
  ): Promise<UpdateOneResolverArgs<AuditableRecord>> {
    if (
      !KERNEL_LEGAL_AUDITED_OBJECTS.has(objectName) ||
      !isDefined(payload.id)
    ) {
      return payload;
    }

    try {
      const before =
        await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
          async () => {
            const repository =
              await this.globalWorkspaceOrmManager.getRepository<AuditableRecord>(
                authContext.workspace.id,
                objectName,
                { shouldBypassPermissionChecks: true },
              );

            return repository.findOne({ where: { id: payload.id } });
          },
          authContext,
        );

      if (isDefined(before)) {
        rememberAuditBefore(`${objectName}:${payload.id}`, before);
      }
    } catch {
      // La captura del before es best-effort; nunca bloquea la actualización.
    }

    return payload;
  }
}
