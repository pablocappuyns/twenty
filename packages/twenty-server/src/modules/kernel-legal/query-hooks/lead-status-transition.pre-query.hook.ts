import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

import {
  GraphqlQueryRunnerException,
  GraphqlQueryRunnerExceptionCode,
} from 'src/engine/api/graphql/graphql-query-runner/errors/graphql-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { LEAD_STATUS_TRANSITIONS } from 'src/modules/kernel-legal/constants/legal-lead-status.constant';

type LeadRecord = ObjectLiteral & {
  id: string;
  status?: string | null;
};

// Motor de transiciones del lead (spec 17E): valida que el cambio de estado
// siga el grafo permitido. No bloquea updates que no tocan el estado ni los
// que dejan el estado igual.
@WorkspaceQueryHook(`lead.updateOne`)
export class LeadStatusTransitionPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<LeadRecord>,
  ): Promise<UpdateOneResolverArgs<LeadRecord>> {
    const nextStatus = payload.data?.status;

    if (!isDefined(nextStatus)) {
      return payload;
    }

    const currentStatus =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const leadRepository =
            await this.globalWorkspaceOrmManager.getRepository<LeadRecord>(
              authContext.workspace.id,
              'lead',
              { shouldBypassPermissionChecks: true },
            );

          const lead = await leadRepository.findOne({
            where: { id: payload.id },
          });

          return lead?.status ?? null;
        },
        authContext,
      );

    if (!isDefined(currentStatus) || currentStatus === nextStatus) {
      return payload;
    }

    const allowedNextStatuses = LEAD_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new GraphqlQueryRunnerException(
        `Transición de estado no permitida: ${currentStatus} -> ${nextStatus}.`,
        GraphqlQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        {
          userFriendlyMessage: msg`No se puede cambiar el lead a ese estado desde el estado actual.`,
        },
      );
    }

    return payload;
  }
}
