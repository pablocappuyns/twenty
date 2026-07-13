# Mapeo del modelo de datos Kernel Legal → Twenty

Traducción de las 39 entidades del CRM (schema Prisma real en `KC/Kernel Legal/CRM/prisma/schema.prisma`, más avanzado que la memoria técnica) al modelo de Twenty.

## Cómo leer la columna "Camino"

- **[S]** Reutiliza objeto estándar de Twenty (Person, Company, Task, Note, Attachment, WorkspaceMember, Role). Cero desarrollo.
- **[M]** Objeto/campo custom vía motor de metadata de Twenty. No-code, se crea por API de metadata y se siembra al crear el workspace. Cero backend.
- **[C]** Requiere código NestJS: lógica de negocio, guardas duras, hooks, workflows o integraciones. Es el trabajo caro.

Regla general: la **estructura** de casi todo es [M]; la **lógica** (estados, guardas, IA, scoring, numeración, integraciones) es [C].

## Tipos de campo Twenty usados

Enums Prisma → campo `SELECT` (o `MULTI_SELECT` si es lista). `Decimal` importe → `CURRENCY`. `Json` → `RAW_JSON`. Relaciones → `RELATION` (many-to-one / one-to-many). `DateTime` → `DATE_TIME`. Texto largo → `RICH_TEXT` o `TEXT`.

---

## F0 — Núcleo e infraestructura

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| `User` | `WorkspaceMember` (estándar) + campos custom `department`, `isJefeDepartamento` | [S]+[M] | Los miembros son nativos. `LawyerProfile` va aparte. |
| `RoleName` (8 roles) | Roles/permisos RBAC de Twenty | [S]+[C] | Twenty tiene roles configurables. El detalle fino (permiso por campo: ocultar económico a no-Dirección) necesita ajuste [C]. |
| `AuditLog` (before/after JSON) | Objeto custom `AuditLog` | [M]+[C] | Twenty tiene timeline propio, pero el before/after total exigido se implementa con un helper `withAudit()` en las mutaciones [C]. |
| `AppConfig` (key→value JSON) | Objeto custom `AppConfig` o settings de workspace | [M] | Umbrales, pesos scoring, plazos, destinatarios. Editable en panel admin. |

---

## F1 — Captación, cliente y lead

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| `Client` | `Person` (particular) + `Company` (empresa) estándar | [S] | Gana emails/phones/timeline gratis. `isStrategic`/`strategicNotes` como campos custom [M]. `externalSource`/`externalId` custom para Kmaleon. |
| `Lead` | Objeto custom `Lead` (alternativa: extender `Opportunity`) | [M]+[C] | Núcleo. Pipeline Kanban por `status` nativo. Estados/scoring/urgencia = campos; motor de transiciones = [C]. |
| `LeadStatus` (13) | Campo `SELECT` en Lead | [M] | Kanban de Twenty usa este campo como columnas. |
| `LegalArea` (9) | Campo `SELECT` | [M] | Reutilizado por muchos objetos. |
| `LeadChannel`, `LeadType` | Campo `SELECT` | [M] | |
| `LawyerProfile` (áreas + tramos scoring) | Objeto custom `LawyerProfile` | [M] | Relación 1-1 con WorkspaceMember. Seeds con la tabla de 12 abogados. |
| `Referrer` / `Referral` | Objetos custom | [M]+[C] | Panel de referidos con casos cerrados por referente = consulta [C]. |
| `QuestionnaireTemplate` / `Question` / `QuestionResponse` | Objetos custom | [M]+[C] | Cuestionario guiado dinámico. El flujo <3 min y la UI guiada = frontend custom [C]. |
| `LeadProposal` (cola IA del correo) | Objeto custom + módulo | [M]+[C] | Ingesta correo Legalitas + extracción IA + cola de aprobación = [C] pesado. |

---

## F2 — Agenda, tareas, notificaciones

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| `Appointment` | Objeto custom `Appointment` (o `CalendarEvent` estándar) | [M]+[C] | Agenda interna por abogado, salas, Teams autogenerado. Genera enlace Teams = [C]. |
| `Availability` | Objeto custom | [M] | Franjas por día. |
| `Absence` / `Substitution` | Objetos custom | [M]+[C] | Transferencia automática de tareas/citas/presupuestos al sustituto = [C]. |
| `Task` + `TaskType` (10) | `Task` estándar + campos custom | [S]+[M]+[C] | Tareas nativas. Auto-generación por disparador y plazos configurables = workflows [C]. |
| `Notification` | Objeto custom + motor | [M]+[C] | Escalado a supervisor a 24h, canales push/email/SMS = [C]. |
| `EmailTemplate` | Objeto custom | [M] | Editable por área. Envío real = EmailProvider [C]. |
| `Tariff` / `TariffItem` | Objetos custom | [M] | Flag `closed` para exención de validación. |

---

## F3 — Visita, ficha, resultado, IA

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| `ClientFile` (consentimiento RGPD) | Objeto custom | [M]+[C] | **GUARDA DURA:** no grabar sin `consentSigned=true` firmado. Se implementa server-side [C]. |
| `DocumentChecklist` / `DocumentItem` | Objetos custom | [M]+[C] | Marcar pendiente dispara tarea y cambia estado = [C]. |
| `VisitTranscription` | Objeto custom + pipeline | [M]+[C] | Transcripción Teams (Graph) o audio presencial → pseudonimizar → resumen Sonnet → reidentificar = [C] pesado. |
| `VisitOutcome` + `VisitResult` (5) + `CierreCausa` | Objeto custom + SELECTs | [M]+[C] | Causa obligatoria en `CIERRE_REMISION` = validación [C]. |
| `AIConversation` / `AIMessage` | Objetos custom + módulo IA | [M]+[C] | Q&A sobre expediente, permisos por rol, pseudonimización obligatoria = [C]. |

---

## F4 — Presupuestos

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| `Budget` + `BudgetStatus` (8) | Objeto custom | [M]+[C] | Numeración `KL-YYYY-NNN` correlativa + firma electrónica (`signToken`) = [C]. |
| `BudgetValidation` | Objeto custom | [M]+[C] | **GUARDA DURA:** bloquear envío hasta `approved=true` del validador del área. Alerta importe bajo. Server-side [C]. |
| `GeneralConditions` (versionado) | Objeto custom | [M] | Texto `[PENDIENTE]` aporta Kernel. |

---

## F5 — Seguimiento y conversión

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| `FollowUp` | Objeto custom | [M] | Registro de intentos post-visita. |
| `LeadLoss` + `LossReason` (10) | Objeto custom + SELECT | [M]+[C] | **GUARDA DURA:** no pasar a `PERDIDO` sin motivo; si `OTRO`, texto obligatorio. [C]. |
| `Metric` / `MetricSnapshot` | Objetos custom + cálculo | [M]+[C] | Conversión, velocidad respuesta, leads/canal. Cálculo periódico = job [C]. |

---

## F6 — Visualización

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| Filtros/búsqueda/orden/export (17A) | **Nativo de Twenty** | [S] | Vistas, filtros, orden, export ya vienen. Gran ahorro. |
| `SavedView` | **Vistas de Twenty** (estándar) | [S] | Twenty ya guarda vistas por usuario. Posiblemente no necesitas objeto propio. |
| Panel de control vivo (17B) | Dashboards Twenty + custom | [S]+[C] | Twenty tiene dashboards; indicadores legales específicos = [C]. |

---

## F7 — Integraciones

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| `ExternalSyncLog` | Objeto custom | [M]+[C] | Log de sync Kmaleon/centralita/M365. |
| `CallLog` | Objeto custom | [M]+[C] | Integración centralita `[BLOQUEANTE]`. |
| `SatisfactionSurvey` | Objeto custom | [M]+[C] | Encuesta al cierre; token público de respuesta = [C]. |

---

## F8-F14 — Expediente, facturación, documentos (fuera de la memoria, sí en el schema real)

| Entidad Prisma | Representación en Twenty | Camino | Notas |
|---|---|---|---|
| `Expediente` + `ExpedienteStage` + `ExpedienteStatus` | Objetos custom | [M]+[C] | Solapa con Kmaleon. **Decisión pendiente:** ¿el CRM gestiona expediente o solo lo abre en Kmaleon? |
| `Factura` + `FacturaPago` + `FacturaStatus`/`PagoMethod`/`PagoLegalitasStatus` | Objetos custom | [M]+[C] | Facturación propia. Solapa con contabilidad de Kmaleon. Revisar alcance. |
| `Documento` (versionado) | `Attachment` estándar de Twenty + custom | [S]+[M] | Twenty adjunta ficheros a registros. Versionado = campo custom. |

---

## Resumen de esfuerzo

- **Gratis con Twenty [S]:** vistas/filtros/orden/export, tasks, adjuntos, timeline, personas/empresas, roles base, dashboards base. ~30-40% del plumbing.
- **No-code [M]:** ~35 objetos custom + campos. Trabajo de configuración, no de código, pero mucho.
- **Código NestJS [C] (lo que define el proyecto):**
  1. Motor de estados del lead (13 estados, transiciones validadas).
  2. 4 guardas duras (consentimiento, validación presupuesto, motivo pérdida, pseudonimización pre-IA).
  3. Pipeline IA completo (pseudonimizar/reidentificar/guardarraíl + Haiku/Sonnet).
  4. Scoring 1-10 ponderado configurable.
  5. Ingesta correo Legalitas + cola LeadProposal.
  6. Transcripción Teams/audio.
  7. Numeración KL-YYYY-NNN + firma electrónica presupuesto.
  8. Audit log before/after total.
  9. Auto-generación de tareas por disparador con plazos.
  10. Escalado de notificaciones.
  11. Integraciones Kmaleon / centralita / M365 (`[BLOQUEANTE]` externas).

## Estrategia de empaquetado (para que sea vendible/replicable)

Para vender el CRM a más despachos, los ~35 objetos custom NO se crean a mano por workspace. Se **siembran en código** al crear el workspace (definición versionada + seed), y la lógica [C] vive en módulos NestJS del server. Así cada nuevo cliente arranca con el modelo legal completo. Esto implica tocar el core de Twenty → conflictos en cada update + obligación AGPL de publicar. Alternativa: mantener los objetos como metadata exportable/importable y la lógica como app/extension separada si Twenty lo soporta (a verificar).

## Decisiones abiertas que bloquean el diseño

1. `Client` → ¿objetos estándar Person/Company de Twenty, o objeto custom `Client` unificado?
2. `Lead` → ¿custom nuevo o extender `Opportunity` estándar?
3. Expediente + Factura → ¿alcance real, o se deja a Kmaleon?
4. Empaquetado → ¿seed en core (fork) o extension separada?
