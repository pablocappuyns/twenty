# Plan de implementación — CRM Kernel Legal sobre Twenty

Basado en el modelo de `01_MODELO_DATOS_MAPEO.md` y los puntos de extensión reales de Twenty verificados en el código.

## Arquitectura de la adaptación

Twenty ya trae los mecanismos para toda la lógica dura. La adaptación se apoya en:

| Necesidad Kernel | Mecanismo Twenty | Ubicación en el código |
|---|---|---|
| Objetos legales (Lead, Expediente, Factura...) | Objetos **custom sembrados vía API de metadata** al crear el workspace (NO standard objects) | `.../metadata-modules/object-metadata/object-metadata.resolver.ts` |
| Campos y enums | 27 tipos de FieldMetadata (SELECT, CURRENCY, RELATION, RICH_TEXT...) | `packages/twenty-shared/src/types/FieldMetadataType.ts` |
| **Guardas duras** (bloquear transición/envío/grabación) | `@WorkspaceQueryHook` tipo `PRE_HOOK` | `.../workspace-query-hook/` |
| Motor de estados del lead | PRE_HOOK en `lead.updateOne` que valida transición | idem |
| Auto-tareas, notificaciones, escalado, recordatorios | Motor de **workflows** (trigger database-event/cron + acciones) | `packages/twenty-server/src/modules/workflow/` |
| Lógica custom puntual | **Logic functions** (serverless) invocadas desde workflow | `.../core-modules/logic-function/` |
| IA (triaje, resumen, Q&A, borradores) | Módulo `ai-agent` (ya integra LLM) + wrapper pseudonimización | `.../metadata-modules/ai/` |
| Roles y permisos (8 roles, campo/fila) | RBAC: role + object-permission + field-permission + row-level-predicate | `.../metadata-modules/role/`, `.../object-permission/`, `.../row-level-permission-predicate/` |
| Audit before/after | `TimelineActivity` + ampliación de propiedades | `packages/twenty-server/src/modules/timeline/` |
| Email @kernellegal.com + ingesta correo | Módulo messaging (drivers Gmail/Microsoft) | `packages/twenty-server/src/modules/messaging/` |
| Tema/marca Kernel | CSS vars de tema + branding de workspace | `packages/twenty-ui/src/theme-constants/`, `packages/twenty-front/src/modules/ui/theme/` |

**Modo de trabajo (corregido tras spike):** los objetos standard de Twenty son un **registro cerrado** tipado (`AllStandardObjectName` + `STANDARD_OBJECTS` en `twenty-shared`); añadir uno toca ficheros core compartidos y garantiza conflictos en cada update upstream. Por eso los objetos legales NO se definen como standard objects. Se **siembran vía la API de metadata** (`createObject`/`createField`) en un paso de bootstrap del workspace legal. Siguen siendo "custom" pero programáticos y versionados → cada despacho arranca con el modelo completo, sin tocar el core.

La lógica (guardas, workflows, scoring, IA) sí vive en módulos NestJS nuevos bajo `packages/twenty-server/src/modules/kernel-*`. Las guardas se registran como clases `@WorkspaceQueryHook` con key `<nombreObjeto>.<método>` (verificado: el nombre de objeto es string libre, matchea objetos custom). Esto sigue siendo un fork del monorepo (AGPL aplica), pero el roce con updates se reduce a los módulos `kernel-*`, no a ficheros core compartidos.

---

## P0 — Fundación (depende de: nada)

**Objetivo:** entorno listo y cimientos transversales. Sin funcionalidad de negocio visible.

- Levantar dev env local (`bash packages/twenty-utils/setup-dev-env.sh`), verificar front+server+worker.
- **Spike técnico (crítico, primero):** prototipar UN objeto standard custom + UN PRE_HOOK que bloquee un update + UN workflow disparado por evento. Confirma el patrón antes de escalar a 35 objetos. Sin esto el resto es teoría.
- 8 roles en RBAC (`DIRECCION, ADMINISTRACION, ABOGADO, JEFE_DEPARTAMENTO, PARALEGAL, CONTABILIDAD, COLABORADOR_EXTERNO, LECTOR`) con matriz de permisos objeto/campo/fila.
- `AppConfig` (objeto o settings) para parámetros configurables (pesos scoring 40/30/30, plazos, umbrales, destinatarios).
- Ampliar audit: helper que enriquezca `TimelineActivity` con before/after por campo en toda mutación.
- Capa IA `kernel-ai`: `pseudonymize()` / `reidentify()` / guardarraíl anti-PII que envuelve las llamadas al módulo `ai-agent` existente.
- Abstracción email: confirmar driver Microsoft del módulo messaging; fallback transaccional conmutable por env.
- Tema Kernel (colores, logo, favicon, nombre) — bajo riesgo, se puede dejar para P0 o diferir.

**Aceptación:** login con los 8 roles verificado en servidor; toda mutación deja audit before/after; guardarraíl aborta ante PII; workflow de prueba dispara; despliegue operativo.

---

## P1 — Modelo de datos base (depende de: P0)

**Objetivo:** los ~35 objetos legales existen, navegables en la UI, con relaciones y seeds.

- Definir como standard objects: `Lead`, `LawyerProfile`, `Referrer`, `Referral`, `QuestionnaireTemplate`, `Question`, `QuestionResponse`, `Appointment`, `Availability`, `Absence`, `Substitution`, `EmailTemplate`, `Tariff`, `TariffItem`, `ClientFile`, `DocumentChecklist`, `DocumentItem`, `VisitTranscription`, `VisitOutcome`, `AIConversation`, `AIMessage`, `Budget`, `BudgetValidation`, `GeneralConditions`, `FollowUp`, `LeadLoss`, `Metric`, `MetricSnapshot`, `Expediente`, `ExpedienteStage`, `Factura`, `FacturaPago`, `Documento`, `LeadProposal`, `SatisfactionSurvey`, `CallLog`, `ExternalSyncLog`, `AppConfig`.
- `Client` → reutilizar `Person`/`Company` con campos custom (`isStrategic`, `strategicNotes`, `externalSource/Id`).
- Todos los enums como SELECT/MULTI_SELECT; importes como CURRENCY; JSON como RAW_JSON.
- Seeds: 9 áreas, 12 abogados con tramos (`LawyerProfile`), plantillas de cuestionario y email base.

**Aceptación:** cada objeto navegable con vistas/filtros nativos; relaciones correctas; seeds cargados; sin lógica aún.

---

## P2 — Captación y triaje (depende de: P1 + email) — LA MÁS DENSA

**Objetivo:** entra un lead por los 4 canales, se puntúa y se asigna.

- **Motor de estados:** PRE_HOOK en `lead.updateOne` valida transiciones entre los 13 estados (rechaza saltos inválidos).
- **Cuestionario guiado** dinámico servido desde `QuestionnaireTemplate`/`Question` (frontend custom, flujo <3 min).
- **Scoring 1-10** ponderado 40/30/30 (logic function pura, pesos desde `AppConfig`); el CRM sugiere, humano ajusta; 3 factores visibles.
- **Asignación** por scoring+área (sugiere, confirma humano); regla de co-asignación (González+Saavedra); leads 8-10 `urgent=true`.
- **4 canales:** web (form → lead auto), llamada (cuestionario manual), recomendación (`Referral` obligatorio), **Legalitas** (ingesta correo → extracción IA Haiku → **pseudonimización previa** → `LeadProposal` en cola de aprobación → alta de `Lead`).

**Aceptación:** lead por llamada <3 min; correo Legalitas de prueba genera LeadProposal con campos mapeados y pseudonimizado (verificado en log); scoring editable; asignación con confirmación; transiciones inválidas bloqueadas; todo en audit.

---

## P3 — Agenda, tareas y notificaciones (depende de: P2)

- Agenda por abogado (`Availability`), `Appointment` con modalidad/sala/enlace Teams; Administración agenda desde el lead.
- Ausencias/sustituciones: al crear `Absence`, workflow transfiere tareas/citas/presupuestos al sustituto; bloquea disponibilidad.
- **Auto-tareas** (workflow por trigger): contacto inicial, confirmación cita, generar presupuesto, seguimientos, etc., con plazos desde `AppConfig`; vencidas en rojo.
- **Notificaciones** (workflow): 1ª al responsable, escalado a supervisor a 24h; canales push+email (SMS diferido a P10). Tabla de eventos del punto 16.
- `Tariff`/`TariffItem` por área; flag `closed` (Civil/Penal cerrados → exención validación).

**Aceptación:** citas sin doble-reserva; sustitución transfiere todo con trazabilidad; tareas se auto-crean con plazo correcto; escalado a 24h dispara.

---

## P4 — Visita, ficha RGPD, transcripción, IA (depende de: P3 + M365 Teams)

- Email de preparación de visita al pasar a `CITA_CONCERTADA` (contenido desde cuestionario + punto 13).
- `DocumentChecklist` por área; marcar pendiente dispara tarea y puede pasar a `PENDIENTE_DOCUMENTACION`.
- **GUARDA DURA (consentimiento):** PRE_HOOK impide iniciar grabación/transcripción sin `ClientFile.consentSigned=true` firmado. Innegociable.
- **Transcripción:** Teams vía Graph (`[BLOQUEANTE]` M365) o audio presencial; pipeline pseudonimizar → resumen Sonnet → reidentificar → `VisitTranscription`. Nunca se guarda el vídeo.
- `VisitOutcome` 5 escenarios; `CIERRE_REMISION` exige causa tasada.
- **Módulo IA por lead:** Q&A sobre expediente, resumen, borradores de gestión — acotado, sin estrategia jurídica; permisos por rol; pseudonimización obligatoria.

**Aceptación:** grabación bloqueada sin consentimiento firmado (verificado server-side); transcripción pseudonimizada; IA responde solo sobre asuntos permitidos al rol.

---

## P5 — Presupuestos (depende de: P4)

- `Budget` con estructura completa; numeración correlativa **`KL-YYYY-NNN`** (logic function con lock); firma electrónica (`signToken`).
- **GUARDA DURA (validación):** PRE_HOOK bloquea paso a `ENVIADO` sin `BudgetValidation.approved=true` del validador del área correcto (salvo exención `Tariff.closed`). Alerta de importe bajo (umbral `AppConfig`).
- Flujo: abogado genera → validador aprueba → envío al cliente → `PRESUPUESTO_ENVIADO` → activa seguimiento (P6).

**Aceptación:** envío imposible sin validación (salvo exención); numeración sin huecos ni colisiones; alerta importe bajo dispara.

---

## P6 — Seguimiento, conversión y métricas (depende de: P5)

- `FollowUp` registra intentos post-visita (email/llamada/recordatorio/objeción).
- **GUARDA DURA (pérdida):** PRE_HOOK impide `PERDIDO` sin `LossReason`; si `OTRO`, texto obligatorio.
- Conversión: `HOJA_FIRMADA_PAGADA` → `ACEPTADO` → `EXPEDIENTE_ABIERTO` (crea `Expediente`, P7).
- Métricas por usuario (`Metric`/`MetricSnapshot`) por job cron; comparativas por abogado solo Dirección (row-level).

**Aceptación:** no se pierde lead sin motivo; conversión abre expediente; métricas calculadas y con permisos.

---

## P7 — Expediente y facturación (depende de: P6) — EN ALCANCE (decisión Kernel)

**Objetivo:** el CRM gestiona expediente y factura, no Kmaleon.

- `Expediente` + `ExpedienteStage` + `ExpedienteStatus`; numeración propia; etapas con plazos.
- `Factura` + `FacturaPago` (`FacturaStatus`, `PagoMethod`, `PagoLegalitasStatus`); IVA, total, tracking de cobro y de pagos Legalitas.
- Estados de factura y cobro visibles en filtros/dashboard.

**Aceptación:** abrir expediente desde lead aceptado; emitir factura, registrar pagos parciales, ver estado de cobro; económico restringido por rol.

---

## P8 — Visualización y analítica (depende de: P7)

- Filtros/búsqueda/orden/export → **nativos de Twenty** (ajuste, no construcción). Vistas guardadas nativas.
- Dashboard vivo (punto 17B): leads, citas, presupuestos, conversión por canal, tiempo de respuesta, tareas vencidas, carga por abogado, facturación, cobros, motivos de pérdida. Vistas conmutables despacho/depto/abogado/canal.
- Informe mensual para socios (4 bloques). Export masivo solo Dirección, siempre a audit.

**Aceptación:** filtros mínimos del 17A presentes; dashboard con drill-down; export respeta permisos.

---

## P9 — Documentos (depende de: P7)

- `Documento` con versionado sobre `Attachment` de Twenty + campos custom (versión, parent). Adjuntos a expediente.

**Aceptación:** subir/versionar documento en expediente; permisos por rol.

---

## P10 — Integraciones y cierre (depende de: P8; desbloqueos externos)

- **Kmaleon** (opcional, sync): `ExternalSyncLog`, campos `externalSource/Id`. `[BLOQUEANTE]` API Wolters Kluwer.
- **Centralita:** `CallLog` automático. `[BLOQUEANTE]` API.
- **M365 completo:** correo, calendario, transcripciones Teams.
- **SMS:** activar canal (confirmaciones, urgentes). `[PENDIENTE]` proveedor/coste.
- **Fidelización:** `SatisfactionSurvey` al cierre; newsletter por área.

**Aceptación:** cada integración se activa al llegar su desbloqueo; el CRM ya es funcional autónomo desde P8.

---

## Pilotaje (transversal, tras P5-P6)

Technical testing → piloto usuarios seleccionados → lanzamiento; feedback semanal ~6 semanas. Arranque limpio, sin migración histórica.

---

## Orden recomendado y bloqueantes

Secuencia obligada por dependencias: **P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7**. P8/P9 pueden solaparse tras P7. P10 en paralelo según desbloqueos.

Bloqueantes externos (no paran el desarrollo, sí producción):
- M365 admin consent (correo @kernellegal.com + transcripción Teams).
- API Kmaleon, API centralita.
- Textos legales: condiciones generales presupuesto, epígrafe consentimiento RGPD (DPO), umbral importe bajo, tarifarios 6 áreas.
- Anthropic: confirmación no-entrenamiento + DPIA antes de producción.

## Primer paso concreto

**P0 + el spike técnico.** Prototipar 1 objeto standard + 1 PRE_HOOK + 1 workflow valida el patrón completo antes de escalar. Es lo que quita el 80% del riesgo del proyecto.
