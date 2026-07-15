import { isNonEmptyString } from '@sniptt/guards';
import { type ObjectLiteral } from 'typeorm';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildNextSequentialNumber } from 'src/modules/kernel-legal/utils/assign-sequential-number.util';

type NumberedRecord = ObjectLiteral & Record<string, unknown>;

const assignNumber = async ({
  globalWorkspaceOrmManager,
  authContext,
  payload,
  objectName,
  numberField,
  prefix,
}: {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  authContext: WorkspaceAuthContext;
  payload: CreateOneResolverArgs<NumberedRecord>;
  objectName: string;
  numberField: string;
  prefix: string;
}): Promise<CreateOneResolverArgs<NumberedRecord>> => {
  // Respeta un número asignado a mano (importación, migración).
  if (isNonEmptyString(payload.data?.[numberField])) {
    return payload;
  }

  payload.data[numberField] = await buildNextSequentialNumber({
    globalWorkspaceOrmManager,
    authContext,
    objectName,
    numberField,
    prefix,
    year: new Date().getFullYear(),
  });

  return payload;
};

@WorkspaceQueryHook(`budget.createOne`)
export class BudgetNumberPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<NumberedRecord>,
  ): Promise<CreateOneResolverArgs<NumberedRecord>> {
    return assignNumber({
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      authContext,
      payload,
      objectName: 'budget',
      numberField: 'budgetNumber',
      prefix: 'PRE',
    });
  }
}

@WorkspaceQueryHook(`expediente.createOne`)
export class ExpedienteNumberPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<NumberedRecord>,
  ): Promise<CreateOneResolverArgs<NumberedRecord>> {
    return assignNumber({
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      authContext,
      payload,
      objectName: 'expediente',
      numberField: 'expedienteNumber',
      prefix: 'EXP',
    });
  }
}

@WorkspaceQueryHook(`factura.createOne`)
export class FacturaNumberPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<NumberedRecord>,
  ): Promise<CreateOneResolverArgs<NumberedRecord>> {
    return assignNumber({
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      authContext,
      payload,
      objectName: 'factura',
      numberField: 'facturaNumber',
      prefix: 'FAC',
    });
  }
}
