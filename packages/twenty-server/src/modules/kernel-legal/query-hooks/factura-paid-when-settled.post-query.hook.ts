import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

type CurrencyValue = { amountMicros?: number | string | null } | null;

type FacturaPagoRecord = ObjectLiteral & {
  id: string;
  facturaId?: string | null;
  amount?: CurrencyValue;
};

type FacturaRecord = ObjectLiteral & {
  id: string;
  facturaStatus?: string | null;
  total?: CurrencyValue;
};

const PAID_STATUS = 'PAGADA';

const toMicros = (value: CurrencyValue | undefined): number => {
  const amountMicros = value?.amountMicros;

  if (!isDefined(amountMicros)) {
    return 0;
  }

  const parsed = Number(amountMicros);

  return Number.isNaN(parsed) ? 0 : parsed;
};

// Automatización (HANDOFF): una factura pasa a PAGADA en cuanto la suma de sus
// pagos alcanza el total. Se ejecuta al registrar cada pago. Idempotente.
@Injectable()
@WorkspaceQueryHook({
  key: `facturaPago.createOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class FacturaPaidWhenSettledPostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: FacturaPagoRecord[] | FacturaPagoRecord,
  ): Promise<void> {
    const pagoId = Array.isArray(payload) ? payload[0]?.id : payload?.id;

    if (!isDefined(pagoId)) {
      return;
    }

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const workspaceId = authContext.workspace.id;

      const pagoRepository =
        await this.globalWorkspaceOrmManager.getRepository<FacturaPagoRecord>(
          workspaceId,
          'facturaPago',
          { shouldBypassPermissionChecks: true },
        );

      const pago = await pagoRepository.findOne({ where: { id: pagoId } });

      if (!isDefined(pago?.facturaId)) {
        return;
      }

      const facturaRepository =
        await this.globalWorkspaceOrmManager.getRepository<FacturaRecord>(
          workspaceId,
          'factura',
          { shouldBypassPermissionChecks: true },
        );

      const factura = await facturaRepository.findOne({
        where: { id: pago.facturaId },
      });

      if (
        !isDefined(factura) ||
        factura.facturaStatus === PAID_STATUS ||
        toMicros(factura.total) <= 0
      ) {
        return;
      }

      const pagos = await pagoRepository.find({
        where: { facturaId: pago.facturaId },
      });

      const paidMicros = pagos.reduce(
        (sum, current) => sum + toMicros(current.amount),
        0,
      );

      if (paidMicros >= toMicros(factura.total)) {
        await facturaRepository.save({
          id: factura.id,
          facturaStatus: PAID_STATUS,
        });
      }
    }, authContext);
  }
}
