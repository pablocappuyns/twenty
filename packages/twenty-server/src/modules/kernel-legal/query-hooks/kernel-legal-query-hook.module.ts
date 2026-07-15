import { Module } from '@nestjs/common';

import { BudgetAcceptedOpensExpedientePostQueryHook } from 'src/modules/kernel-legal/query-hooks/budget-accepted-opens-expediente.post-query.hook';
import { BudgetValidationRequiredPreQueryHook } from 'src/modules/kernel-legal/query-hooks/budget-validation-required.pre-query.hook';
import { FacturaPaidWhenSettledPostQueryHook } from 'src/modules/kernel-legal/query-hooks/factura-paid-when-settled.post-query.hook';
import { LeadLossReasonRequiredPreQueryHook } from 'src/modules/kernel-legal/query-hooks/lead-loss-reason-required.pre-query.hook';
import {
  LeadScoringCreatePreQueryHook,
  LeadScoringUpdatePreQueryHook,
} from 'src/modules/kernel-legal/query-hooks/lead-scoring.pre-query.hook';
import { LeadStatusTransitionPreQueryHook } from 'src/modules/kernel-legal/query-hooks/lead-status-transition.pre-query.hook';
import { RgpdConsentRequiredPreQueryHook } from 'src/modules/kernel-legal/query-hooks/rgpd-consent-required.pre-query.hook';
import {
  BudgetNumberPreQueryHook,
  ExpedienteNumberPreQueryHook,
  FacturaNumberPreQueryHook,
} from 'src/modules/kernel-legal/query-hooks/sequential-number.pre-query.hook';

@Module({
  providers: [
    LeadLossReasonRequiredPreQueryHook,
    LeadStatusTransitionPreQueryHook,
    LeadScoringCreatePreQueryHook,
    LeadScoringUpdatePreQueryHook,
    BudgetValidationRequiredPreQueryHook,
    RgpdConsentRequiredPreQueryHook,
    BudgetNumberPreQueryHook,
    ExpedienteNumberPreQueryHook,
    FacturaNumberPreQueryHook,
    BudgetAcceptedOpensExpedientePostQueryHook,
    FacturaPaidWhenSettledPostQueryHook,
  ],
})
export class KernelLegalQueryHookModule {}
