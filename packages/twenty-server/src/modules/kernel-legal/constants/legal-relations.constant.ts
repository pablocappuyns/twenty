import { RelationType } from 'twenty-shared/types';

// Relations between Kernel Legal objects (and to standard Person / WorkspaceMember).
// All are MANY_TO_ONE from the source object (which holds the foreign key).
// targetFieldLabel is the inverse field created on the target object and must be
// unique per target object. The seeder creates these after all objects exist.

export type LegalRelationDefinition = {
  sourceObject: string;
  name: string;
  label: string;
  icon: string;
  type: RelationType;
  targetObject: string;
  targetFieldLabel: string;
  targetFieldIcon: string;
};

const manyToOne = (
  sourceObject: string,
  name: string,
  label: string,
  icon: string,
  targetObject: string,
  targetFieldLabel: string,
  targetFieldIcon: string,
): LegalRelationDefinition => ({
  sourceObject,
  name,
  label,
  icon,
  type: RelationType.MANY_TO_ONE,
  targetObject,
  targetFieldLabel,
  targetFieldIcon,
});

export const KERNEL_LEGAL_RELATIONS: LegalRelationDefinition[] = [
  // Lead core
  manyToOne('lead', 'client', 'Cliente', 'IconUser', 'person', 'Leads', 'IconTargetArrow'),
  manyToOne('lead', 'assignedLawyer', 'Abogado asignado', 'IconGavel', 'workspaceMember', 'Leads asignados', 'IconTargetArrow'),
  manyToOne('lead', 'coAssignedLawyer', 'Abogado acompañante', 'IconGavel', 'workspaceMember', 'Leads co-asignados', 'IconTargetArrow'),

  // Infra / profile
  manyToOne('lawyerProfile', 'member', 'Miembro', 'IconUser', 'workspaceMember', 'Perfil de abogado', 'IconGavel'),
  manyToOne('auditLog', 'actor', 'Usuario', 'IconUser', 'workspaceMember', 'Auditoría', 'IconHistory'),

  // Cuestionario
  manyToOne('question', 'template', 'Plantilla', 'IconClipboardList', 'questionnaireTemplate', 'Preguntas', 'IconHelpCircle'),

  // Agenda
  manyToOne('appointment', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Citas', 'IconCalendarEvent'),
  manyToOne('appointment', 'lawyer', 'Abogado', 'IconGavel', 'workspaceMember', 'Citas', 'IconCalendarEvent'),
  manyToOne('availability', 'lawyer', 'Abogado', 'IconGavel', 'workspaceMember', 'Disponibilidades', 'IconClock'),
  manyToOne('absence', 'lawyer', 'Abogado', 'IconGavel', 'workspaceMember', 'Ausencias', 'IconBeach'),
  manyToOne('absence', 'substitute', 'Sustituto', 'IconUser', 'workspaceMember', 'Sustituciones cubiertas', 'IconArrowsExchange'),
  manyToOne('substitution', 'absence', 'Ausencia', 'IconBeach', 'absence', 'Sustituciones', 'IconArrowsExchange'),

  // Notificaciones
  manyToOne('notification', 'recipient', 'Destinatario', 'IconUser', 'workspaceMember', 'Notificaciones', 'IconBell'),
  manyToOne('notification', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Notificaciones', 'IconBell'),

  // Tarifarios
  manyToOne('tariffItem', 'tariff', 'Tarifario', 'IconReceipt', 'tariff', 'Conceptos', 'IconListNumbers'),

  // Visita / ficha / IA
  manyToOne('clientFile', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Ficha de cliente', 'IconFileDescription'),
  manyToOne('documentChecklist', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Checklist de documentación', 'IconChecklist'),
  manyToOne('documentItem', 'checklist', 'Checklist', 'IconChecklist', 'documentChecklist', 'Documentos', 'IconFileCheck'),
  manyToOne('visitTranscription', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Transcripciones', 'IconFileText'),
  manyToOne('visitOutcome', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Resultado de visita', 'IconChecks'),
  manyToOne('aiConversation', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Conversaciones IA', 'IconMessageChatbot'),
  manyToOne('aiConversation', 'ownerMember', 'Usuario', 'IconUser', 'workspaceMember', 'Conversaciones IA', 'IconMessageChatbot'),
  manyToOne('aiMessage', 'conversation', 'Conversación', 'IconMessageChatbot', 'aiConversation', 'Mensajes', 'IconMessage'),

  // Presupuestos
  manyToOne('budget', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Presupuestos', 'IconFileInvoice'),
  manyToOne('budget', 'lawyer', 'Abogado', 'IconGavel', 'workspaceMember', 'Presupuestos', 'IconFileInvoice'),
  manyToOne('budgetValidation', 'budget', 'Presupuesto', 'IconFileInvoice', 'budget', 'Validación', 'IconShieldCheck'),
  manyToOne('budgetValidation', 'validator', 'Validador', 'IconUser', 'workspaceMember', 'Validaciones de presupuesto', 'IconShieldCheck'),

  // Seguimiento / métricas
  manyToOne('followUp', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Seguimientos', 'IconPhoneCall'),
  manyToOne('followUp', 'ownerMember', 'Usuario', 'IconUser', 'workspaceMember', 'Seguimientos', 'IconPhoneCall'),
  manyToOne('leadLoss', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Pérdida', 'IconThumbDown'),
  manyToOne('metric', 'ownerMember', 'Usuario', 'IconUser', 'workspaceMember', 'Métricas', 'IconChartBar'),
  manyToOne('metricSnapshot', 'metric', 'Métrica', 'IconChartBar', 'metric', 'Snapshots', 'IconChartLine'),

  // Referidos
  manyToOne('referrer', 'client', 'Cliente referente', 'IconUser', 'person', 'Referencias', 'IconUserShare'),

  // F7: integraciones y fidelización
  manyToOne('callLog', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Llamadas', 'IconPhone'),
  manyToOne('satisfactionSurvey', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Encuestas', 'IconMoodSmile'),
  manyToOne('referral', 'referrer', 'Referente', 'IconUserShare', 'referrer', 'Referencias', 'IconShare'),
  manyToOne('referral', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Referencia recibida', 'IconShare'),
  manyToOne('referral', 'clientReferrer', 'Cliente referente', 'IconUser', 'person', 'Referidos aportados', 'IconShare'),

  // F8: expediente
  manyToOne('expediente', 'lead', 'Lead', 'IconTargetArrow', 'lead', 'Expediente', 'IconFolder'),
  manyToOne('expediente', 'assignedLawyer', 'Abogado responsable', 'IconGavel', 'workspaceMember', 'Expedientes asignados', 'IconFolder'),
  manyToOne('expedienteStage', 'expediente', 'Expediente', 'IconFolder', 'expediente', 'Etapas', 'IconListCheck'),

  // F9: facturación
  manyToOne('factura', 'expediente', 'Expediente', 'IconFolder', 'expediente', 'Facturas', 'IconFileEuro'),
  manyToOne('facturaPago', 'factura', 'Factura', 'IconFileEuro', 'factura', 'Pagos', 'IconCash'),

  // F14: documentos
  manyToOne('documento', 'expediente', 'Expediente', 'IconFolder', 'expediente', 'Documentos', 'IconFile'),
  manyToOne('documento', 'uploadedByMember', 'Subido por', 'IconUser', 'workspaceMember', 'Documentos subidos', 'IconFile'),
];
