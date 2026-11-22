# Parking Comunidad — expedientes por vivienda, reincidencias y notificaciones

## Entrega en rama aislada

Rama: `feat/housing-case-history-notifications`, basada en `supabase-poc`.
No hay merge, despliegue en PRE/PRO ni correos reales activados.
El trabajo local pendiente del usuario, incluido GESTOR descartado, **no se ha tocado**:
GitHub no ofrece acceso al estado de archivos sin commit del Mac.

### Funcionalidades incorporadas

- Bandejas de incidencias y solicitudes: agrupación por vivienda (por defecto),
  por matrícula/vehículo y vista plana, con filtros y apertura individual.
- Ficha existente de vivienda: histórico de incidencias y solicitudes, KPI
  30/90/365 días, apertura de expedientes y recuentos independientes de
  vivienda y responsable en el momento de la incidencia.
- Atribución histórica: el responsable se congela al asociar la incidencia
  con la vivienda; el cambio posterior de responsable no reescribe el historial.
  Incidencias antiguas sin atribución verificada **no** se imputan al nuevo dueño.
- Bandeja de correos (outbox) mediante triggers: ADMIN al crear incidentes
  y solicitudes; ADMIN y responsable congelado al cerrar o resolver.
- Informes de cierre: el frontend mantiene el generador original jsPDF para
  el archivo ADMIN, con fotos y seguimientos. El PDF dirigido al propietario
  omite evidencias, textos confidenciales y matrículas ajenas.
  Ambos se suben a almacenamiento privado con autorización ADMIN.
- Trabajo programado para procesar outbox y generar Excel semanal.
  El lunes a partir de las 08:00 Europe/Madrid genera la semana anterior
  con cuatro hojas: Resumen, Creadas y abiertas, Pendientes anteriores,
  Reincidencias. Incluye protección contra fórmulas introducidas en textos.
- Botón ADMIN en Incidencias para preparar el Excel semanal manualmente.
- Enlaces de correo con identificadores de expediente, autenticados
  y sujetos a controles de acceso vigentes. No son enlaces públicos.

### Limitaciones explícitas antes de PRE

- La generación automática del PDF de cierre depende del flujo de cierre en
  el navegador ADMIN. Si el caso se cierra por otro canal o falla la creación
  del PDF, el outbox queda **bloqueado** para impedir emails sin adjunto.
  Existe botón de recuperación «Preparar PDF de cierre». Esto debe validarse.
- El Excel generado manualmente se almacena en privado y se pone en cola;
  el botón no descarga directamente el archivo al navegador.
- El envío de email real requiere credenciales y aprobación explícita. El valor
  predeterminado del sistema es dry-run y **no marca como enviados** mensajes
  que no salieron al proveedor.
- La programación GitHub Actions solo se ejecutará automáticamente cuando
  esté configurada en la rama predeterminada y sus secretos existan.
  Mientras tanto no hay programación de envíos real.
- El bundle estático `assets/js/app.bundle.js` se reconstruye con
  `npm run build:frontend` pero los cambios generados no se versionaron
  en esta rama. Antes de PRE hace falta incluir el bundle producido y revisar
  que sea reproducible.
- Faltan pruebas autenticadas end-to-end con usuarios ADMIN, CONTROL y
  PROPIETARIO, múltiples viviendas y una segunda comunidad. Las pruebas
  automáticas disponibles no sustituyen la validación funcional.
- No se ha probado el envío por un proveedor real ni su entrega/bounces.
- No se han ejecutado los navegadores de la aplicación aquí.
- No aplicar sanciones automáticas: estos números son registros de incidencias,
  no decisiones sobre culpabilidad o penalización.

## Validación aislada

GitHub Actions `housing-case-validation.yml` ejecuta:
- Comprobación de sintaxis de frontend (ESM analizado como módulo).
- `npm ci`, `npm test`, `npm run build:frontend`, `npm run build:vite`.
- `deno check --node-modules-dir=auto` de la Edge Function.
- `supabase start`, `supabase test db`, con PostgreSQL aislado en CI.

Comprobar la ejecución más reciente antes de integrar. Las pruebas
`supabase/tests/006_incident_owner_attribution.sql` y
`supabase/tests/007_case_notifications.sql` cubren estructura, snapshot,
recuento, creación, cierre y deduplicación de notificaciones.

## Preparación de correo y programación — sin activar

Edge Function: `supabase/functions/parking-notifications/index.ts`.

Variables de entorno privadas previstas:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (solo Edge Functions).
- `PARKING_APP_URL` (URL HTTPS real de la aplicación).
- `PARKING_CRON_SECRET` (secreto largo y aleatorio para tick).
- `RESEND_API_KEY` y `PARKING_MAIL_FROM` (remitente validado).
- `PARKING_EMAIL_DRY_RUN` (mantener distinto de `false` hasta autorización).

GitHub Actions requiere los secretos:
- `PARKING_NOTIFICATION_URL`: URL completa de la Edge Function.
- `PARKING_CRON_SECRET`: valor correspondiente al secreto Edge.

La programación corre cada 15 minutos, pero el generador semanal comprueba
hora local Europe/Madrid y solo procesa el periodo anterior un lunes a partir
de las 08:00. La combinación `community_id + period_start` impide repetir
la generación ordinaria del informe en una misma semana.

## Orden de aceptación antes de desplegar

1. Revisar los cambios remotos contra `supabase-poc` y los cambios sin commit
   de la máquina. No sobreescribir ni resetear datos ni GESTOR pendiente sin
   inventario explícito de cambios.
2. Ejecutar y revisar SQL/RLS con fixtures y usuarios autenticados ficticios;
   comprobar que los roles no obtienen permisos de otro perfil.
3. Revisar interfaz en móvil y desktop; agrupaciones, fichas, filtros, enlaces,
   indicadores y PDF completo con seis evidencias.
4. Validar PDFs ADMIN y OWNER y confirmar textos comunicables y su privacidad.
5. Validar Excel con semanas sin incidencias, semanas con pendientes, DST
   invierno/verano, fechas, enlaces y ausencia de secretos.
6. Probar correo en sandbox del proveedor y outbox ante reintentos,
   errores, expiración de permisos y fallos de almacenamiento privado.
7. Regenerar bundle, ejecutar toda la suite y decidir despliegue PRE.
8. No pasar a producción ni activar email sin aprobación.

**No requiere ni introduce GESTOR.**
