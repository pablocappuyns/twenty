import { msg } from '@lingui/core/macro';
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

type BudgetRecord = ObjectLiteral & {
  id: string;
  status?: string | null;
  requiresValidation?: boolean | null;
};

const SENT_STATUS = 'ENVIADO';
const VALIDATED_STATUS = 'VALIDADO';

// Guarda dura (spec 8, 14): un presupuesto no puede enviarse al cliente sin
// haber pasado el circuito de validación. Se exime solo si requiresValidation
// es explícitamente false (importe bajo). Si el flag es null se exige validación.
@WorkspaceQueryHook(`budget.updateOne`)
export class BudgetValidationRequiredPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<BudgetRecord>,
  ): Promise<UpdateOneResolverArgs<BudgetRecord>> {
    const isBecomingSent = payload.data?.status === SENT_STATUS;

    if (!isBecomingSent) {
      return payload;
    }

    const budget =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const budgetRepository =
            await this.globalWorkspaceOrmManager.getRepository<BudgetRecord>(
              authContext.workspace.id,
              'budget',
              { shouldBypassPermissionChecks: true },
            );

          return budgetRepository.findOne({ where: { id: payload.id } });
        },
        authContext,
      );

    const requiresValidation =
      payload.data?.requiresValidation ?? budget?.requiresValidation ?? true;

    if (!requiresValidation) {
      return payload;
    }

    if (budget?.status !== VALIDATED_STATUS) {
      throw new GraphqlQueryRunnerException(
        'No se puede enviar el presupuesto sin validación previa.',
        GraphqlQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        {
          userFriendlyMessage: msg`El presupuesto debe estar validado antes de enviarse al cliente.`,
        },
      );
    }

    return payload;
  }
}
