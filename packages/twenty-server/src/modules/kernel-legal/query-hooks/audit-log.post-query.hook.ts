import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { KERNEL_LEGAL_AUDITED_OBJECTS } from 'src/modules/kernel-legal/constants/audited-objects.constant';

type AuditableRecord = ObjectLiteral & { id?: string | null };

type AuditEntry = {
  action: string;
  entityType: string;
  entityId: string;
  beforeValue: AuditableRecord | null;
  afterValue: AuditableRecord | null;
  actorId: string | null;
};

const actorIdFromContext = (
  authContext: WorkspaceAuthContext,
): string | null => {
  return authContext.type === 'user' ? authContext.workspaceMemberId : null;
};

const auditLogger = new Logger('KernelLegalAuditLog');

const toRecords = (
  payload: AuditableRecord[] | AuditableRecord,
): AuditableRecord[] => {
  return Array.isArray(payload) ? payload : [payload];
};

// Snapshot serializable del registro (los resultados llevan getters/relaciones
// que pueden no ser JSON puro). Si no serializa, se guarda solo el id.
const toSnapshot = (record: AuditableRecord): AuditableRecord => {
  try {
    return JSON.parse(JSON.stringify(record)) as AuditableRecord;
  } catch {
    return { id: record.id };
  }
};

// Escritor compartido: registra una entrada de auditoría por cada registro
// afectado. beforeValue en updateOne queda pendiente (requiere captura pre-write);
// hoy se registra el estado resultante (create/update) o el borrado (delete).
const writeAudit = async (
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  authContext: WorkspaceAuthContext,
  objectName: string,
  payload: AuditableRecord[] | AuditableRecord,
  buildEntry: (record: AuditableRecord) => Omit<AuditEntry, 'entityType'>,
): Promise<void> => {
  if (!KERNEL_LEGAL_AUDITED_OBJECTS.has(objectName)) {
    return;
  }

  const entries = toRecords(payload)
    .filter((record): record is AuditableRecord => isDefined(record?.id))
    .map((record) => ({ entityType: objectName, ...buildEntry(record) }));

  if (entries.length === 0) {
    return;
  }

  // La auditoría nunca debe romper la escritura del usuario (ya está confirmada).
  try {
    await globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const auditRepository =
        await globalWorkspaceOrmManager.getRepository<ObjectLiteral>(
          authContext.workspace.id,
          'auditLog',
          { shouldBypassPermissionChecks: true },
        );

      await auditRepository.save(entries);
    }, authContext);
  } catch (error) {
    auditLogger.error(
      `No se pudo registrar la auditoría de ${objectName}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

@Injectable()
@WorkspaceQueryHook({
  key: `*.createOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class AuditLogCreatePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: AuditableRecord[] | AuditableRecord,
  ): Promise<void> {
    await writeAudit(
      this.globalWorkspaceOrmManager,
      authContext,
      objectName,
      payload,
      (record) => ({
        action: 'CREATE',
        entityId: record.id as string,
        beforeValue: null,
        afterValue: toSnapshot(record),
        actorId: actorIdFromContext(authContext),
      }),
    );
  }
}

@Injectable()
@WorkspaceQueryHook({
  key: `*.updateOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class AuditLogUpdatePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: AuditableRecord[] | AuditableRecord,
  ): Promise<void> {
    await writeAudit(
      this.globalWorkspaceOrmManager,
      authContext,
      objectName,
      payload,
      (record) => ({
        action: 'UPDATE',
        entityId: record.id as string,
        beforeValue: null,
        afterValue: toSnapshot(record),
        actorId: actorIdFromContext(authContext),
      }),
    );
  }
}

@Injectable()
@WorkspaceQueryHook({
  key: `*.deleteOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class AuditLogDeletePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: AuditableRecord[] | AuditableRecord,
  ): Promise<void> {
    await writeAudit(
      this.globalWorkspaceOrmManager,
      authContext,
      objectName,
      payload,
      (record) => ({
        action: 'DELETE',
        entityId: record.id as string,
        beforeValue: toSnapshot(record),
        afterValue: null,
        actorId: actorIdFromContext(authContext),
      }),
    );
  }
}
