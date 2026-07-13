import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
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

type LeadRecord = ObjectLiteral & {
  id: string;
  status?: string | null;
  lossReason?: string | null;
};

const LOST_STATUS = 'PERDIDO';

// Guarda dura (spec 17E): un lead no puede pasar a PERDIDO sin motivo de pérdida.
// El motivo puede venir en este update o ya existir en el registro, por eso se
// consulta el estado persistido cuando el payload no lo trae.
@WorkspaceQueryHook(`lead.updateOne`)
export class LeadLossReasonRequiredPreQueryHook
  implements WorkspacePreQueryHookInstance
{
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<LeadRecord>,
  ): Promise<UpdateOneResolverArgs<LeadRecord>> {
    const isBecomingLost = payload.data?.status === LOST_STATUS;

    if (!isBecomingLost || isNonEmptyString(payload.data.lossReason)) {
      return payload;
    }

    const existingLossReason =
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

          return lead?.lossReason ?? null;
        },
        authContext,
      );

    if (!isNonEmptyString(existingLossReason)) {
      throw new GraphqlQueryRunnerException(
        'No se puede marcar el lead como PERDIDO sin un motivo de pérdida.',
        GraphqlQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        {
          userFriendlyMessage: msg`Selecciona un motivo de pérdida antes de marcar el lead como perdido.`,
        },
      );
    }

    return payload;
  }
}
