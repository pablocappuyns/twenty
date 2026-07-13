import { isDefined } from 'twenty-shared/utils';

import {
  GraphqlQueryRunnerException,
  GraphqlQueryRunnerExceptionCode,
} from 'src/engine/api/graphql/graphql-query-runner/errors/graphql-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

type LeadUpdatePayload = {
  status?: string;
  lossReason?: string;
};

// Guarda dura (spec 17E): un lead no puede pasar a PERDIDO sin un motivo de pérdida.
@WorkspaceQueryHook(`lead.updateOne`)
export class LeadLossReasonRequiredPreQueryHook
  implements WorkspacePreQueryHookInstance
{
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<LeadUpdatePayload>,
  ): Promise<UpdateOneResolverArgs<LeadUpdatePayload>> {
    const data = payload.data;

    if (data?.status === 'PERDIDO' && !isDefined(data.lossReason)) {
      throw new GraphqlQueryRunnerException(
        'No se puede marcar el lead como PERDIDO sin un motivo de pérdida.',
        GraphqlQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        {
          userFriendlyMessage:
            'Selecciona un motivo de pérdida antes de marcar el lead como perdido.',
        },
      );
    }

    return payload;
  }
}
