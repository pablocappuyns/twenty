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
];
