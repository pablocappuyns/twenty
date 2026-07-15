import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildNextSequentialNumber } from 'src/modules/kernel-legal/utils/assign-sequential-number.util';

type BudgetRecord = ObjectLiteral & {
  id: string;
  status?: string | null;
  area?: string | null;
  description?: string | null;
  leadId?: string | null;
};

type ExpedienteRecord = ObjectLiteral & { id: string; leadId?: string | null };
type LeadRecord = ObjectLiteral & { id: string; status?: string | null };

const ACCEPTED_STATUS = 'ACEPTADO';
const EXPEDIENTE_OPEN_STATUS = 'EXPEDIENTE_ABIERTO';

// Automatización de conversión (HANDOFF): al aceptar un presupuesto se abre el
// expediente del lead (numerado EXP-YYYY-NNNN) y el lead pasa a EXPEDIENTE_ABIERTO.
// Idempotente: si el lead ya tiene expediente, no crea otro.
@Injectable()
@WorkspaceQueryHook({
  key: `budget.updateOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class BudgetAcceptedOpensExpedientePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: BudgetRecord[] | BudgetRecord,
  ): Promise<void> {
    const budgetId = Array.isArray(payload) ? payload[0]?.id : payload?.id;

    if (!isDefined(budgetId)) {
      return;
    }

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const workspaceId = authContext.workspace.id;

      const budgetRepository =
        await this.globalWorkspaceOrmManager.getRepository<BudgetRecord>(
          workspaceId,
          'budget',
          { shouldBypassPermissionChecks: true },
        );

      const budget = await budgetRepository.findOne({
        where: { id: budgetId },
      });

      if (
        !isDefined(budget) ||
        budget.status !== ACCEPTED_STATUS ||
        !isDefined(budget.leadId)
      ) {
        return;
      }

      const expedienteRepository =
        await this.globalWorkspaceOrmManager.getRepository<ExpedienteRecord>(
          workspaceId,
          'expediente',
          { shouldBypassPermissionChecks: true },
        );

      const existingExpediente = await expedienteRepository.findOne({
        where: { leadId: budget.leadId },
      });

      if (isDefined(existingExpediente)) {
        return;
      }

      const expedienteNumber = await buildNextSequentialNumber({
        globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
        authContext,
        objectName: 'expediente',
        numberField: 'expedienteNumber',
        prefix: 'EXP',
        year: new Date().getFullYear(),
      });

      await expedienteRepository.save({
        expedienteNumber,
        leadId: budget.leadId,
        area: budget.area ?? null,
        title: budget.description ?? null,
        expedienteStatus: 'ACTIVO',
      });

      const leadRepository =
        await this.globalWorkspaceOrmManager.getRepository<LeadRecord>(
          workspaceId,
          'lead',
          { shouldBypassPermissionChecks: true },
        );

      await leadRepository.save({
        id: budget.leadId,
        status: EXPEDIENTE_OPEN_STATUS,
      });
    }, authContext);
  }
}
