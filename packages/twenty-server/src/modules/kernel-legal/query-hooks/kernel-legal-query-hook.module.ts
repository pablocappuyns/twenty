import { Module } from '@nestjs/common';

import { BudgetValidationRequiredPreQueryHook } from 'src/modules/kernel-legal/query-hooks/budget-validation-required.pre-query.hook';
import { LeadLossReasonRequiredPreQueryHook } from 'src/modules/kernel-legal/query-hooks/lead-loss-reason-required.pre-query.hook';
import { RgpdConsentRequiredPreQueryHook } from 'src/modules/kernel-legal/query-hooks/rgpd-consent-required.pre-query.hook';

@Module({
  providers: [
    LeadLossReasonRequiredPreQueryHook,
    BudgetValidationRequiredPreQueryHook,
    RgpdConsentRequiredPreQueryHook,
  ],
})
export class KernelLegalQueryHookModule {}
