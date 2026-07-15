import { AsyncLocalStorage } from 'node:async_hooks';

// Comparte el estado previo (before) capturado en el PRE_HOOK con el POST_HOOK
// dentro de la misma petición. El PRE y el POST de una mutación corren en la
// misma cadena async, así que enterWith() propaga el store hacia delante.
export const auditBeforeStore = new AsyncLocalStorage<Map<string, unknown>>();

export const rememberAuditBefore = (key: string, value: unknown): void => {
  let store = auditBeforeStore.getStore();

  if (!store) {
    store = new Map<string, unknown>();
    auditBeforeStore.enterWith(store);
  }

  store.set(key, value);
};

export const recallAuditBefore = (key: string): unknown => {
  return auditBeforeStore.getStore()?.get(key);
};
