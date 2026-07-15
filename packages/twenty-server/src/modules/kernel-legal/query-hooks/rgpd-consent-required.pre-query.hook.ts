import { msg } from '@lingui/core/macro';
import { type ObjectLiteral } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';

import {
  GraphqlQueryRunnerException,
  GraphqlQueryRunnerExceptionCode,
} from 'src/engine/api/graphql/graphql-query-runner/errors/graphql-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

type TranscriptionRecord = ObjectLiteral & {
  leadId?: string | null;
};

type ClientFileRecord = ObjectLiteral & {
  id: string;
  consentSigned?: boolean | null;
};

// Guarda dura (spec 7): no se puede registrar una transcripción/grabación de una
// visita sin el consentimiento RGPD firmado en la ficha del cliente del lead.
@WorkspaceQueryHook(`visitTranscription.createOne`)
export class RgpdConsentRequiredPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<TranscriptionRecord>,
  ): Promise<CreateOneResolverArgs<TranscriptionRecord>> {
    const leadId = payload.data?.leadId;

    if (!isDefined(leadId)) {
      return payload;
    }

    const clientFile =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const clientFileRepository =
            await this.globalWorkspaceOrmManager.getRepository<ClientFileRecord>(
              authContext.workspace.id,
              'clientFile',
              { shouldBypassPermissionChecks: true },
            );

          return clientFileRepository.findOne({ where: { leadId } });
        },
        authContext,
      );

    if (clientFile?.consentSigned !== true) {
      throw new GraphqlQueryRunnerException(
        'No se puede registrar la grabación sin consentimiento RGPD firmado.',
        GraphqlQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        {
          userFriendlyMessage: msg`El cliente debe firmar el consentimiento RGPD antes de grabar la visita.`,
        },
      );
    }

    return payload;
  }
}
