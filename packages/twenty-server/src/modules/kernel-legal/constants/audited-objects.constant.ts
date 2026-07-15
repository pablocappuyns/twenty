// Objetos del núcleo legal cuya actividad se registra en el log de auditoría
// (trazabilidad RGPD). Se excluyen los objetos de configuración y los estándar
// de Twenty (ya cubiertos por su timeline nativo).
export const KERNEL_LEGAL_AUDITED_OBJECTS = new Set<string>([
  'lead',
  'leadLoss',
  'budget',
  'budgetValidation',
  'expediente',
  'expedienteStage',
  'factura',
  'facturaPago',
  'clientFile',
  'visitTranscription',
  'visitOutcome',
  'documento',
]);
