import { Module } from '@nestjs/common';

import { LeadLossReasonRequiredPreQueryHook } from 'src/modules/kernel-legal/query-hooks/lead-loss-reason-required.pre-query.hook';

@Module({
  providers: [LeadLossReasonRequiredPreQueryHook],
})
export class KernelLegalQueryHookModule {}
