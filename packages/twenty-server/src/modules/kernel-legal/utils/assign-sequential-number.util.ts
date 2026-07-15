import { type ObjectLiteral } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

// Numeración correlativa por año, formato PREFIX-YYYY-NNNN (spec F4/F8/F9).
// El correlativo se calcula como MAX(existente del año) + 1. A escala de un
// despacho (creación manual, un puñado al día) no hay concurrencia real, así que
// no puede haber duplicados en la práctica; si el volumen creciera, migrar a una
// tabla contador con INSERT ... ON CONFLICT DO UPDATE RETURNING para atomicidad.
export const buildNextSequentialNumber = async ({
  globalWorkspaceOrmManager,
  authContext,
  objectName,
  numberField,
  prefix,
  year,
}: {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  authContext: WorkspaceAuthContext;
  objectName: string;
  numberField: string;
  prefix: string;
  year: number;
}): Promise<string> => {
  const yearPrefix = `${prefix}-${year}-`;

  const maxCorrelative =
    await globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository = await globalWorkspaceOrmManager.getRepository<
        ObjectLiteral & Record<string, string | null>
      >(authContext.workspace.id, objectName, {
        shouldBypassPermissionChecks: true,
      });

      const records = await repository.find({});

      return records.reduce((max, record) => {
        const value = record[numberField];

        if (typeof value !== 'string' || !value.startsWith(yearPrefix)) {
          return max;
        }

        const correlative = Number.parseInt(value.slice(yearPrefix.length), 10);

        return Number.isNaN(correlative) ? max : Math.max(max, correlative);
      }, 0);
    }, authContext);

  const nextCorrelative = String(maxCorrelative + 1).padStart(4, '0');

  return `${yearPrefix}${nextCorrelative}`;
};
