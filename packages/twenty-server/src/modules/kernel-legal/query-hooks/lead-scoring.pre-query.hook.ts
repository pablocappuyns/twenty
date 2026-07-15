import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type CreateOneResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  computeLeadScore,
  type LeadScoreFactors,
} from 'src/modules/kernel-legal/utils/compute-lead-score.util';

type LeadRecord = ObjectLiteral & {
  score?: number | null;
  scoreFactors?: LeadScoreFactors | string | null;
};

const parseFactors = (
  raw: LeadScoreFactors | string | null | undefined,
): LeadScoreFactors | null => {
  if (!isDefined(raw)) {
    return null;
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as LeadScoreFactors;
    } catch {
      return null;
    }
  }

  return raw;
};

// Recalcula el scoring sugerido cuando cambian los factores. El campo score
// sigue siendo editable a mano: si el payload no trae scoreFactors, no se toca.
const applyScore = (data: LeadRecord | undefined): void => {
  if (!isDefined(data) || !('scoreFactors' in data)) {
    return;
  }

  const factors = parseFactors(data.scoreFactors);

  if (!isDefined(factors)) {
    return;
  }

  data.score = computeLeadScore(factors);
};

@WorkspaceQueryHook(`lead.createOne`)
export class LeadScoringCreatePreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<LeadRecord>,
  ): Promise<CreateOneResolverArgs<LeadRecord>> {
    applyScore(payload.data);

    return payload;
  }
}

@WorkspaceQueryHook(`lead.updateOne`)
export class LeadScoringUpdatePreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<LeadRecord>,
  ): Promise<UpdateOneResolverArgs<LeadRecord>> {
    applyScore(payload.data);

    return payload;
  }
}
