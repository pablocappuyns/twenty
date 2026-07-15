// Máquina de estados del lead (spec 17E, 13 estados). El motor valida que no
// haya saltos inválidos. El grafo es un embudo hacia delante con:
// - PERDIDO alcanzable desde cualquier estado activo (con motivo, otra guarda),
// - vuelta atrás puntual para reagendar/reactivar,
// - ARCHIVADO como estado terminal.
export const LEAD_STATUS_TRANSITIONS: Record<string, string[]> = {
  NUEVO: ['PENDIENTE_CONTACTO', 'CONTACTADO', 'PERDIDO'],
  PENDIENTE_CONTACTO: ['CONTACTADO', 'PERDIDO'],
  CONTACTADO: ['CITA_CONCERTADA', 'PRESUPUESTO_PENDIENTE', 'PERDIDO'],
  CITA_CONCERTADA: ['CITA_REALIZADA', 'CONTACTADO', 'PERDIDO'],
  CITA_REALIZADA: [
    'PENDIENTE_DOCUMENTACION',
    'PRESUPUESTO_PENDIENTE',
    'PERDIDO',
  ],
  PENDIENTE_DOCUMENTACION: ['PRESUPUESTO_PENDIENTE', 'PERDIDO'],
  PRESUPUESTO_PENDIENTE: ['PRESUPUESTO_ENVIADO', 'PERDIDO'],
  PRESUPUESTO_ENVIADO: ['SEGUIMIENTO_ACTIVO', 'ACEPTADO', 'PERDIDO'],
  SEGUIMIENTO_ACTIVO: ['ACEPTADO', 'PERDIDO'],
  ACEPTADO: ['EXPEDIENTE_ABIERTO', 'ARCHIVADO'],
  EXPEDIENTE_ABIERTO: ['ARCHIVADO'],
  PERDIDO: ['PENDIENTE_CONTACTO', 'ARCHIVADO'],
  ARCHIVADO: [],
};
