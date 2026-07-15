import { FieldMetadataType } from 'twenty-shared/types';

// Declarative definition of the Kernel Legal data model. The seeder command
// turns this into Twenty custom objects + fields. Kept as data so the model is
// reviewable in one place and reproducible on every workspace.

type LegalSelectOption = {
  label: string;
  value: string;
  color: string;
};

export type LegalFieldDefinition = {
  name: string;
  label: string;
  type: FieldMetadataType;
  description?: string;
  isNullable?: boolean;
  options?: LegalSelectOption[];
};

export type LegalObjectDefinition = {
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  icon: string;
  description: string;
  fields: LegalFieldDefinition[];
};

const TAG_COLORS = [
  'blue',
  'green',
  'orange',
  'red',
  'purple',
  'sky',
  'turquoise',
  'yellow',
  'pink',
  'gray',
  'iris',
  'jade',
  'crimson',
];

// Build SELECT options from raw values, cycling colors deterministically.
const options = (values: string[]): LegalSelectOption[] =>
  values.map((value, index) => ({
    value,
    label: value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    color: TAG_COLORS[index % TAG_COLORS.length],
  }));

const LEGAL_AREA = options([
  'CIVIL',
  'PENAL',
  'LABORAL',
  'FAMILIA',
  'BANCARIO',
  'MERCANTIL',
  'ADMINISTRATIVO',
  'EXTRANJERIA',
  'INMOBILIARIO',
]);

const LEAD_CHANNEL = options(['LEGALITAS', 'WEB', 'LLAMADA', 'RECOMENDACION']);

const LEAD_TYPE = options(['CONSULTA', 'CASO', 'CASO_POTENCIAL']);

const LEAD_STATUS = options([
  'NUEVO',
  'PENDIENTE_CONTACTO',
  'CONTACTADO',
  'CITA_CONCERTADA',
  'CITA_REALIZADA',
  'PENDIENTE_DOCUMENTACION',
  'PRESUPUESTO_PENDIENTE',
  'PRESUPUESTO_ENVIADO',
  'SEGUIMIENTO_ACTIVO',
  'ACEPTADO',
  'PERDIDO',
  'EXPEDIENTE_ABIERTO',
  'ARCHIVADO',
]);

const LOSS_REASON = options([
  'PRECIO',
  'NO_RESPONDE',
  'YA_TIENE_ABOGADO',
  'NO_ENCAJA',
  'FALTA_DOCUMENTACION',
  'FUERA_DE_PLAZO',
  'NO_ACUDE_VISITA',
  'PRESUPUESTO_RECHAZADO',
  'ASUNTO_NO_RENTABLE',
  'OTRO',
]);

const REFERRER_TYPE = options(['CLIENTE', 'TRABAJADOR', 'EXTERNO']);

const PROPOSAL_STATUS = options(['PENDIENTE', 'APROBADO', 'RECHAZADO']);

const VISIT_MODALITY = options(['PRESENCIAL', 'TELEFONICA', 'TELEMATICA']);

const ABSENCE_TYPE = options([
  'VACACIONES',
  'BAJA',
  'PERMISO',
  'SATURACION',
  'NO_DISPONIBLE',
]);

const NOTIFICATION_CHANNEL = options(['PUSH', 'EMAIL', 'SMS']);

const EMAIL_KIND = options([
  'PREVISITA',
  'SEGUIMIENTO',
  'RECORDATORIO',
  'SOLICITUD_DOCUMENTACION',
]);

const TRANSCRIPTION_SOURCE = options([
  'TEAMS',
  'AUDIO_PRESENCIAL',
  'UPLOAD_MANUAL',
]);

const VISIT_RESULT = options([
  'HOJA_FIRMADA_PAGADA',
  'HOJA_FIRMADA_PENDIENTE_PAGO',
  'PENDIENTE_ACEPTACION_PRESUPUESTO',
  'PENDIENTE_DOCUMENTACION_VIABILIDAD',
  'CIERRE_REMISION',
]);

const CIERRE_CAUSA = options([
  'ABOGADO_OFICIO',
  'ANTIECONOMICO',
  'RENUNCIA_COSTE',
  'NO_VIABILIDAD',
  'ILOCALIZABLE',
]);

const AI_ROLE = options(['USER', 'ASSISTANT']);

const FEE_TYPE = options(['FIJO', 'VARIABLE', 'MIXTO']);

const BUDGET_STATUS = options([
  'BORRADOR',
  'PENDIENTE_VALIDACION',
  'VALIDADO',
  'RECHAZADO_VALIDADOR',
  'ENVIADO',
  'ACEPTADO',
  'RECHAZADO_CLIENTE',
  'CADUCADO',
]);

const FOLLOWUP_KIND = options([
  'EMAIL',
  'LLAMADA',
  'RECORDATORIO',
  'OBJECION',
]);

const METRIC_KEY = options([
  'CONV_LEAD_VISITA',
  'CONV_VISITA_PRESUPUESTO',
  'VELOCIDAD_RESPUESTA',
  'LEADS_POR_CANAL',
]);

const CALL_DIRECTION = options(['IN', 'OUT']);

const SYNC_SYSTEM = options(['KMALEON', 'CENTRALITA', 'M365']);

const SYNC_DIRECTION = options(['INBOUND', 'OUTBOUND']);

const SYNC_STATUS = options(['OK', 'ERROR', 'PENDING']);

const EXPEDIENTE_STATUS = options([
  'ACTIVO',
  'SUSPENDIDO',
  'ARCHIVADO',
  'CERRADO',
]);

const FACTURA_STATUS = options([
  'BORRADOR',
  'ENVIADA',
  'PAGADA',
  'VENCIDA',
  'ANULADA',
]);

const PAGO_METHOD = options(['TRANSFERENCIA', 'TARJETA', 'EFECTIVO', 'BIZUM']);

const PAGO_LEGALITAS_STATUS = options([
  'PENDIENTE_RECONOCIMIENTO',
  'PRUEBA_APORTADA',
  'RECLAMACION_ENVIADA',
  'RESPUESTA_PENDIENTE',
  'REGULARIZADO',
  'INCIDENCIA_CERRADA',
]);

export const KERNEL_LEGAL_OBJECTS: LegalObjectDefinition[] = [
  {
    nameSingular: 'appConfig',
    namePlural: 'appConfigs',
    labelSingular: 'Parámetro',
    labelPlural: 'Configuración',
    icon: 'IconSettings',
    description: 'Parámetros configurables sin desarrollo (pesos scoring, plazos, umbrales)',
    fields: [
      { name: 'configKey', label: 'Clave', type: FieldMetadataType.TEXT },
      { name: 'configValue', label: 'Valor', type: FieldMetadataType.RAW_JSON, isNullable: true },
      { name: 'updatedByRef', label: 'Actualizado por', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'auditLog',
    namePlural: 'auditLogs',
    labelSingular: 'Registro de auditoría',
    labelPlural: 'Auditoría',
    icon: 'IconHistory',
    description: 'Trazabilidad total: usuario, acción, entidad, antes/después',
    fields: [
      { name: 'action', label: 'Acción', type: FieldMetadataType.TEXT },
      { name: 'entityType', label: 'Tipo de entidad', type: FieldMetadataType.TEXT },
      { name: 'entityId', label: 'ID de entidad', type: FieldMetadataType.TEXT },
      { name: 'beforeValue', label: 'Antes', type: FieldMetadataType.RAW_JSON, isNullable: true },
      { name: 'afterValue', label: 'Después', type: FieldMetadataType.RAW_JSON, isNullable: true },
      { name: 'ip', label: 'IP', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'lawyerProfile',
    namePlural: 'lawyerProfiles',
    labelSingular: 'Perfil de abogado',
    labelPlural: 'Perfiles de abogado',
    icon: 'IconGavel',
    description: 'Áreas y tramos de scoring por abogado (punto 2)',
    fields: [
      { name: 'areas', label: 'Áreas', type: FieldMetadataType.MULTI_SELECT, options: LEGAL_AREA, isNullable: true },
      { name: 'scoreMin', label: 'Scoring mínimo', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'scoreMax', label: 'Scoring máximo', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'notes', label: 'Notas', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'lead',
    namePlural: 'leads',
    labelSingular: 'Lead',
    labelPlural: 'Leads',
    icon: 'IconTargetArrow',
    description: 'Núcleo del sistema: ciclo de vida completo del potencial cliente',
    fields: [
      { name: 'channel', label: 'Canal', type: FieldMetadataType.SELECT, options: LEAD_CHANNEL, isNullable: true },
      { name: 'area', label: 'Área', type: FieldMetadataType.SELECT, options: LEGAL_AREA, isNullable: true },
      { name: 'actuationType', label: 'Tipo de actuación', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'leadType', label: 'Tipo', type: FieldMetadataType.SELECT, options: LEAD_TYPE, isNullable: true },
      { name: 'description', label: 'Descripción', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'status', label: 'Estado', type: FieldMetadataType.SELECT, options: LEAD_STATUS, isNullable: true },
      { name: 'score', label: 'Scoring', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'scoreFactors', label: 'Factores de scoring', type: FieldMetadataType.RAW_JSON, isNullable: true },
      { name: 'urgent', label: 'Urgente', type: FieldMetadataType.BOOLEAN, isNullable: true },
      { name: 'legalitasLawyer', label: 'Abogado origen Legalitas', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'lossReason', label: 'Motivo de pérdida', type: FieldMetadataType.SELECT, options: LOSS_REASON, isNullable: true },
      { name: 'externalSource', label: 'Origen externo', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'externalId', label: 'ID externo', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'referrer',
    namePlural: 'referrers',
    labelSingular: 'Referente',
    labelPlural: 'Referentes',
    icon: 'IconUserShare',
    description: 'Quién refiere un lead (punto 9)',
    fields: [
      { name: 'referrerType', label: 'Tipo', type: FieldMetadataType.SELECT, options: REFERRER_TYPE, isNullable: true },
      { name: 'externalName', label: 'Nombre externo', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'externalRelation', label: 'Relación', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'questionnaireTemplate',
    namePlural: 'questionnaireTemplates',
    labelSingular: 'Plantilla de cuestionario',
    labelPlural: 'Plantillas de cuestionario',
    icon: 'IconClipboardList',
    description: 'Cuestionario guiado por área/actuación (corazón de la captación)',
    fields: [
      { name: 'area', label: 'Área', type: FieldMetadataType.SELECT, options: LEGAL_AREA, isNullable: true },
      { name: 'actuationGroup', label: 'Grupo de actuación', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'question',
    namePlural: 'questions',
    labelSingular: 'Pregunta',
    labelPlural: 'Preguntas',
    icon: 'IconHelpCircle',
    description: 'Pregunta del cuestionario guiado (datos, no hardcode)',
    fields: [
      { name: 'text', label: 'Texto', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'position', label: 'Orden', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'required', label: 'Obligatoria', type: FieldMetadataType.BOOLEAN, isNullable: true },
    ],
  },
  {
    nameSingular: 'leadProposal',
    namePlural: 'leadProposals',
    labelSingular: 'Propuesta de lead',
    labelPlural: 'Propuestas de lead',
    icon: 'IconInbox',
    description: 'Cola de revisión de leads extraídos por IA del correo Legalitas',
    fields: [
      { name: 'emailFrom', label: 'Email origen', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'emailSubject', label: 'Asunto', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'aiSummary', label: 'Resumen IA', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'extractedName', label: 'Nombre extraído', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'extractedPhone', label: 'Teléfono extraído', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'extractedEmail', label: 'Email extraído', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'extractedArea', label: 'Área extraída', type: FieldMetadataType.SELECT, options: LEGAL_AREA, isNullable: true },
      { name: 'aiConfidence', label: 'Confianza IA', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'rawSnippet', label: 'Extracto original', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'proposalStatus', label: 'Estado', type: FieldMetadataType.SELECT, options: PROPOSAL_STATUS, isNullable: true },
    ],
  },

  // ── F2: agenda, tareas, notificaciones ──────────────────────────────────
  {
    nameSingular: 'appointment',
    namePlural: 'appointments',
    labelSingular: 'Cita',
    labelPlural: 'Citas',
    icon: 'IconCalendarEvent',
    description: 'Cita/visita del lead (punto 6)',
    fields: [
      { name: 'modality', label: 'Modalidad', type: FieldMetadataType.SELECT, options: VISIT_MODALITY, isNullable: true },
      { name: 'room', label: 'Sala', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'meetingUrl', label: 'Enlace reunión', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'startsAt', label: 'Inicio', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'endsAt', label: 'Fin', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'changeReason', label: 'Motivo de cambio', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'availability',
    namePlural: 'availabilities',
    labelSingular: 'Disponibilidad',
    labelPlural: 'Disponibilidades',
    icon: 'IconClock',
    description: 'Franjas de disponibilidad por abogado',
    fields: [
      { name: 'weekday', label: 'Día de la semana', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'startTime', label: 'Hora inicio', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'endTime', label: 'Hora fin', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'absence',
    namePlural: 'absences',
    labelSingular: 'Ausencia',
    labelPlural: 'Ausencias',
    icon: 'IconBeach',
    description: 'Ausencias y bloqueo de agenda (punto 17C)',
    fields: [
      { name: 'absenceType', label: 'Tipo', type: FieldMetadataType.SELECT, options: ABSENCE_TYPE, isNullable: true },
      { name: 'reason', label: 'Motivo', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'startDate', label: 'Desde', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'endDate', label: 'Hasta', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'affectedAreas', label: 'Áreas afectadas', type: FieldMetadataType.MULTI_SELECT, options: LEGAL_AREA, isNullable: true },
    ],
  },
  {
    nameSingular: 'substitution',
    namePlural: 'substitutions',
    labelSingular: 'Sustitución',
    labelPlural: 'Sustituciones',
    icon: 'IconArrowsExchange',
    description: 'Transferencia de trabajo al sustituto (punto 17C)',
    fields: [
      { name: 'reassignedAt', label: 'Reasignado el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'transferred', label: 'Elementos transferidos', type: FieldMetadataType.RAW_JSON, isNullable: true },
    ],
  },
  {
    nameSingular: 'notification',
    namePlural: 'notifications',
    labelSingular: 'Notificación',
    labelPlural: 'Notificaciones',
    icon: 'IconBell',
    description: 'Notificaciones con escalado (punto 16)',
    fields: [
      { name: 'eventName', label: 'Evento', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'channels', label: 'Canales', type: FieldMetadataType.MULTI_SELECT, options: NOTIFICATION_CHANNEL, isNullable: true },
      { name: 'escalated', label: 'Escalada', type: FieldMetadataType.BOOLEAN, isNullable: true },
      { name: 'readAt', label: 'Leída el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'payload', label: 'Payload', type: FieldMetadataType.RAW_JSON, isNullable: true },
    ],
  },
  {
    nameSingular: 'emailTemplate',
    namePlural: 'emailTemplates',
    labelSingular: 'Plantilla de email',
    labelPlural: 'Plantillas de email',
    icon: 'IconMail',
    description: 'Plantillas editables (previsita, seguimiento)',
    fields: [
      { name: 'area', label: 'Área', type: FieldMetadataType.SELECT, options: LEGAL_AREA, isNullable: true },
      { name: 'kind', label: 'Tipo', type: FieldMetadataType.SELECT, options: EMAIL_KIND, isNullable: true },
      { name: 'subject', label: 'Asunto', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'body', label: 'Cuerpo', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'editable', label: 'Editable', type: FieldMetadataType.BOOLEAN, isNullable: true },
    ],
  },
  {
    nameSingular: 'tariff',
    namePlural: 'tariffs',
    labelSingular: 'Tarifario',
    labelPlural: 'Tarifarios',
    icon: 'IconReceipt',
    description: 'Tarifario por área; closed exime de validación (punto 8)',
    fields: [
      { name: 'area', label: 'Área', type: FieldMetadataType.SELECT, options: LEGAL_AREA, isNullable: true },
      { name: 'closed', label: 'Cerrado', type: FieldMetadataType.BOOLEAN, isNullable: true },
    ],
  },
  {
    nameSingular: 'tariffItem',
    namePlural: 'tariffItems',
    labelSingular: 'Concepto de tarifario',
    labelPlural: 'Conceptos de tarifario',
    icon: 'IconListNumbers',
    description: 'Línea de tarifario',
    fields: [
      { name: 'concept', label: 'Concepto', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'amount', label: 'Importe', type: FieldMetadataType.CURRENCY, isNullable: true },
    ],
  },

  // ── F3: visita, ficha, resultado, IA ────────────────────────────────────
  {
    nameSingular: 'clientFile',
    namePlural: 'clientFiles',
    labelSingular: 'Ficha de cliente',
    labelPlural: 'Fichas de cliente',
    icon: 'IconFileDescription',
    description: 'Ficha + consentimiento RGPD (punto 7). Guarda dura de grabación',
    fields: [
      { name: 'consentSigned', label: 'Consentimiento firmado', type: FieldMetadataType.BOOLEAN, isNullable: true },
      { name: 'consentText', label: 'Texto de consentimiento', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'signedAt', label: 'Firmado el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'signatureRef', label: 'Referencia de firma', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'documentChecklist',
    namePlural: 'documentChecklists',
    labelSingular: 'Checklist de documentación',
    labelPlural: 'Checklists de documentación',
    icon: 'IconChecklist',
    description: 'Checklist de documentación por área/actuación (puntos 4, 13)',
    fields: [
      { name: 'area', label: 'Área', type: FieldMetadataType.SELECT, options: LEGAL_AREA, isNullable: true },
    ],
  },
  {
    nameSingular: 'documentItem',
    namePlural: 'documentItems',
    labelSingular: 'Documento requerido',
    labelPlural: 'Documentos requeridos',
    icon: 'IconFileCheck',
    description: 'Línea del checklist de documentación',
    fields: [
      { name: 'concept', label: 'Concepto', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'received', label: 'Recibido', type: FieldMetadataType.BOOLEAN, isNullable: true },
      { name: 'receivedAt', label: 'Recibido el', type: FieldMetadataType.DATE_TIME, isNullable: true },
    ],
  },
  {
    nameSingular: 'visitTranscription',
    namePlural: 'visitTranscriptions',
    labelSingular: 'Transcripción de visita',
    labelPlural: 'Transcripciones de visita',
    icon: 'IconFileText',
    description: 'Transcripción + resumen (nunca el vídeo)',
    fields: [
      { name: 'source', label: 'Origen', type: FieldMetadataType.SELECT, options: TRANSCRIPTION_SOURCE, isNullable: true },
      { name: 'transcript', label: 'Transcripción', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'summary', label: 'Resumen', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'visitOutcome',
    namePlural: 'visitOutcomes',
    labelSingular: 'Resultado de visita',
    labelPlural: 'Resultados de visita',
    icon: 'IconChecks',
    description: 'Resultado de la visita, 5 escenarios',
    fields: [
      { name: 'result', label: 'Resultado', type: FieldMetadataType.SELECT, options: VISIT_RESULT, isNullable: true },
      { name: 'cierreCausa', label: 'Causa de cierre', type: FieldMetadataType.SELECT, options: CIERRE_CAUSA, isNullable: true },
      { name: 'notes', label: 'Notas', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'aiConversation',
    namePlural: 'aiConversations',
    labelSingular: 'Conversación IA',
    labelPlural: 'Conversaciones IA',
    icon: 'IconMessageChatbot',
    description: 'Módulo IA por lead (Q&A, resumen, borradores)',
    fields: [
      { name: 'topic', label: 'Tema', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'aiMessage',
    namePlural: 'aiMessages',
    labelSingular: 'Mensaje IA',
    labelPlural: 'Mensajes IA',
    icon: 'IconMessage',
    description: 'Mensaje de una conversación IA',
    fields: [
      { name: 'messageRole', label: 'Rol', type: FieldMetadataType.SELECT, options: AI_ROLE, isNullable: true },
      { name: 'content', label: 'Contenido', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },

  // ── F4: presupuestos ────────────────────────────────────────────────────
  {
    nameSingular: 'budget',
    namePlural: 'budgets',
    labelSingular: 'Presupuesto',
    labelPlural: 'Presupuestos',
    icon: 'IconFileInvoice',
    description: 'Presupuesto con circuito de validación (puntos 8, 14)',
    fields: [
      { name: 'budgetNumber', label: 'Número', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'area', label: 'Área', type: FieldMetadataType.SELECT, options: LEGAL_AREA, isNullable: true },
      { name: 'description', label: 'Descripción', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'scopeIncluded', label: 'Alcance incluido', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'scopeExcluded', label: 'Alcance excluido', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'feeType', label: 'Tipo de honorarios', type: FieldMetadataType.SELECT, options: FEE_TYPE, isNullable: true },
      { name: 'amount', label: 'Importe', type: FieldMetadataType.CURRENCY, isNullable: true },
      { name: 'vat', label: 'IVA', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'paymentTerms', label: 'Condiciones de pago', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'validUntil', label: 'Válido hasta', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'status', label: 'Estado', type: FieldMetadataType.SELECT, options: BUDGET_STATUS, isNullable: true },
      { name: 'requiresValidation', label: 'Requiere validación', type: FieldMetadataType.BOOLEAN, isNullable: true },
      { name: 'generalConditionsVersion', label: 'Versión condiciones', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'signatureRef', label: 'Referencia de firma', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'signedAt', label: 'Firmado el', type: FieldMetadataType.DATE_TIME, isNullable: true },
    ],
  },
  {
    nameSingular: 'budgetValidation',
    namePlural: 'budgetValidations',
    labelSingular: 'Validación de presupuesto',
    labelPlural: 'Validaciones de presupuesto',
    icon: 'IconShieldCheck',
    description: 'Circuito de validación por área (guarda dura de envío)',
    fields: [
      { name: 'approved', label: 'Aprobado', type: FieldMetadataType.BOOLEAN, isNullable: true },
      { name: 'lowAmountAlert', label: 'Alerta importe bajo', type: FieldMetadataType.BOOLEAN, isNullable: true },
      { name: 'comment', label: 'Comentario', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'decidedAt', label: 'Decidido el', type: FieldMetadataType.DATE_TIME, isNullable: true },
    ],
  },
  {
    nameSingular: 'generalConditions',
    namePlural: 'generalConditionsList',
    labelSingular: 'Condiciones generales',
    labelPlural: 'Condiciones generales',
    icon: 'IconFileText',
    description: 'Condiciones generales versionadas del presupuesto',
    fields: [
      { name: 'version', label: 'Versión', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'body', label: 'Texto', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'active', label: 'Activa', type: FieldMetadataType.BOOLEAN, isNullable: true },
    ],
  },

  // ── F5: seguimiento, conversión, métricas ───────────────────────────────
  {
    nameSingular: 'followUp',
    namePlural: 'followUps',
    labelSingular: 'Seguimiento',
    labelPlural: 'Seguimientos',
    icon: 'IconPhoneCall',
    description: 'Intento de seguimiento post-visita (punto 10)',
    fields: [
      { name: 'kind', label: 'Tipo', type: FieldMetadataType.SELECT, options: FOLLOWUP_KIND, isNullable: true },
      { name: 'outcome', label: 'Resultado', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'notes', label: 'Notas', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'scheduledAt', label: 'Programado para', type: FieldMetadataType.DATE_TIME, isNullable: true },
    ],
  },
  {
    nameSingular: 'leadLoss',
    namePlural: 'leadLosses',
    labelSingular: 'Pérdida de lead',
    labelPlural: 'Pérdidas de lead',
    icon: 'IconThumbDown',
    description: 'Motivo obligatorio al perder (punto 17E)',
    fields: [
      { name: 'reason', label: 'Motivo', type: FieldMetadataType.SELECT, options: LOSS_REASON, isNullable: true },
      { name: 'otherText', label: 'Otro (texto)', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'metric',
    namePlural: 'metrics',
    labelSingular: 'Métrica',
    labelPlural: 'Métricas',
    icon: 'IconChartBar',
    description: 'Métricas por usuario (base de gamificación)',
    fields: [
      { name: 'metricKey', label: 'Indicador', type: FieldMetadataType.SELECT, options: METRIC_KEY, isNullable: true },
    ],
  },
  {
    nameSingular: 'metricSnapshot',
    namePlural: 'metricSnapshots',
    labelSingular: 'Snapshot de métrica',
    labelPlural: 'Snapshots de métrica',
    icon: 'IconChartLine',
    description: 'Valor de métrica por periodo',
    fields: [
      { name: 'period', label: 'Periodo', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'snapshotValue', label: 'Valor', type: FieldMetadataType.NUMBER, isNullable: true },
    ],
  },

  // ── F7: integraciones y fidelización ────────────────────────────────────
  {
    nameSingular: 'referral',
    namePlural: 'referrals',
    labelSingular: 'Referido',
    labelPlural: 'Referidos',
    icon: 'IconShare',
    description: 'Lead aportado por un referente (punto 9)',
    fields: [
      { name: 'notes', label: 'Notas', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'callLog',
    namePlural: 'callLogs',
    labelSingular: 'Registro de llamada',
    labelPlural: 'Registros de llamada',
    icon: 'IconPhone',
    description: 'Llamada registrada por la centralita (punto 6)',
    fields: [
      { name: 'direction', label: 'Sentido', type: FieldMetadataType.SELECT, options: CALL_DIRECTION, isNullable: true },
      { name: 'durationSec', label: 'Duración (s)', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'outcome', label: 'Resultado', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'externalId', label: 'ID externo', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'callerPhone', label: 'Teléfono llamante', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'agentPhone', label: 'Teléfono agente', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'externalSyncLog',
    namePlural: 'externalSyncLogs',
    labelSingular: 'Log de sincronización',
    labelPlural: 'Logs de sincronización',
    icon: 'IconRefresh',
    description: 'Sincronización con Kmaleon / centralita / M365 (punto 17F)',
    fields: [
      { name: 'system', label: 'Sistema', type: FieldMetadataType.SELECT, options: SYNC_SYSTEM, isNullable: true },
      { name: 'entityType', label: 'Tipo de entidad', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'entityId', label: 'ID de entidad', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'direction', label: 'Sentido', type: FieldMetadataType.SELECT, options: SYNC_DIRECTION, isNullable: true },
      { name: 'syncStatus', label: 'Estado', type: FieldMetadataType.SELECT, options: SYNC_STATUS, isNullable: true },
      { name: 'payload', label: 'Payload', type: FieldMetadataType.RAW_JSON, isNullable: true },
      { name: 'errorMessage', label: 'Error', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'satisfactionSurvey',
    namePlural: 'satisfactionSurveys',
    labelSingular: 'Encuesta de satisfacción',
    labelPlural: 'Encuestas de satisfacción',
    icon: 'IconMoodSmile',
    description: 'Encuesta al cierre del expediente (punto 11)',
    fields: [
      { name: 'token', label: 'Token', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'sentAt', label: 'Enviada el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'surveyScore', label: 'Puntuación', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'feedback', label: 'Comentarios', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },

  // ── F8: expediente (gestionado por el CRM) ──────────────────────────────
  {
    nameSingular: 'expediente',
    namePlural: 'expedientes',
    labelSingular: 'Expediente',
    labelPlural: 'Expedientes',
    icon: 'IconFolder',
    description: 'Expediente jurídico gestionado por el CRM',
    fields: [
      { name: 'expedienteNumber', label: 'Número', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'area', label: 'Área', type: FieldMetadataType.SELECT, options: LEGAL_AREA, isNullable: true },
      { name: 'title', label: 'Título', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'expedienteStatus', label: 'Estado', type: FieldMetadataType.SELECT, options: EXPEDIENTE_STATUS, isNullable: true },
      { name: 'kmaleonRef', label: 'Referencia Kmaleon', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'notes', label: 'Notas', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },
  {
    nameSingular: 'expedienteStage',
    namePlural: 'expedienteStages',
    labelSingular: 'Etapa de expediente',
    labelPlural: 'Etapas de expediente',
    icon: 'IconListCheck',
    description: 'Etapa/hito del expediente con plazo',
    fields: [
      { name: 'title', label: 'Título', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'description', label: 'Descripción', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'dueAt', label: 'Vence el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'completedAt', label: 'Completada el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'position', label: 'Orden', type: FieldMetadataType.NUMBER, isNullable: true },
    ],
  },

  // ── F9: facturación (gestionada por el CRM) ─────────────────────────────
  {
    nameSingular: 'factura',
    namePlural: 'facturas',
    labelSingular: 'Factura',
    labelPlural: 'Facturas',
    icon: 'IconFileEuro',
    description: 'Factura del expediente con seguimiento de cobro',
    fields: [
      { name: 'facturaNumber', label: 'Número', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'concept', label: 'Concepto', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'amount', label: 'Base', type: FieldMetadataType.CURRENCY, isNullable: true },
      { name: 'vat', label: 'IVA', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'total', label: 'Total', type: FieldMetadataType.CURRENCY, isNullable: true },
      { name: 'facturaStatus', label: 'Estado', type: FieldMetadataType.SELECT, options: FACTURA_STATUS, isNullable: true },
      { name: 'issuedAt', label: 'Emitida el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'dueAt', label: 'Vence el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'notes', label: 'Notas', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'isLegalitas', label: 'Es Legalitas', type: FieldMetadataType.BOOLEAN, isNullable: true },
    ],
  },
  {
    nameSingular: 'facturaPago',
    namePlural: 'facturaPagos',
    labelSingular: 'Pago de factura',
    labelPlural: 'Pagos de factura',
    icon: 'IconCash',
    description: 'Pago (parcial) de una factura',
    fields: [
      { name: 'amount', label: 'Importe', type: FieldMetadataType.CURRENCY, isNullable: true },
      { name: 'method', label: 'Método', type: FieldMetadataType.SELECT, options: PAGO_METHOD, isNullable: true },
      { name: 'paidAt', label: 'Pagado el', type: FieldMetadataType.DATE_TIME, isNullable: true },
      { name: 'notes', label: 'Notas', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'legalitasStatus', label: 'Estado Legalitas', type: FieldMetadataType.SELECT, options: PAGO_LEGALITAS_STATUS, isNullable: true },
      { name: 'proofUrl', label: 'Justificante', type: FieldMetadataType.TEXT, isNullable: true },
    ],
  },

  // ── F14: documentos ─────────────────────────────────────────────────────
  {
    nameSingular: 'documento',
    namePlural: 'documentos',
    labelSingular: 'Documento',
    labelPlural: 'Documentos',
    icon: 'IconFile',
    description: 'Documento del expediente con versionado',
    fields: [
      { name: 'documentName', label: 'Nombre', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'url', label: 'URL', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'fileSize', label: 'Tamaño', type: FieldMetadataType.NUMBER, isNullable: true },
      { name: 'mimeType', label: 'Tipo MIME', type: FieldMetadataType.TEXT, isNullable: true },
      { name: 'docVersion', label: 'Versión', type: FieldMetadataType.NUMBER, isNullable: true },
    ],
  },
];
