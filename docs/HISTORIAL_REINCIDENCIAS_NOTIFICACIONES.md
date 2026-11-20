# Historial por vivienda, reincidencias y notificaciones

## Estado de esta rama
Primera entrega implementada: esquema SQL con atribución histórica de responsable y
contadores por vivienda y propietario. **No está desplegada ni probada en Supabase local.**
La rama nace de `supabase-poc` remoto, sin arrastrar los cambios locales descartados
del rol GESTOR. No se han enviado correos ni creado tareas programadas.

## Alcance funcional acordado
- Mantener las vistas por matrícula, agregar agrupación principal por vivienda
  para incidencias y solicitudes y ampliar la ficha de vivienda existente.
- Reincidencia por vivienda y por propietario, con totales, abiertas,
  periodo de 365 días y desglose por tipo. Seguir diferenciando
  incidencias de seguimientos e intentos de un mismo evento.
- Registrar el responsable asociado **al vincular el caso a la vivienda**.
  La atribución no cambia al modificar el responsable de la vivienda.
  Los incidentes históricos no se atribuyen automáticamente: requieren conciliación.
- No calcular ni aplicar penalizaciones automáticamente: los contadores no
  equivalen a infracciones sancionables confirmadas.
- Email al perfil ADMIN al abrir incidencia o solicitud: datos mínimos y enlace
  profundo autenticado al expediente.
- Al cerrar incidencia: email a ADMIN y responsable con informe PDF existente
  adjunto. La versión para propietario no debe revelar información interna ni
  datos personales de terceros.
- Al aprobar/rechazar solicitud: email a ADMIN y responsable con resultado y enlace.
- Notificaciones asíncronas mediante outbox idempotente, con reintentos y log
  de envíos; no bloquear el cierre del caso por fallos de correo.
- Informe **Excel XLSX** semanal, lunes 08:00 `Europe/Madrid`, para la semana
  anterior. Hojas: Resumen, Creadas y aún abiertas, Pendientes anteriores,
  Reincidencias. Envío automático a ADMIN con archivo adjunto.
- Aislamiento por comunidad mediante RLS y autorización en backend.
- Sin rol GESTOR ni cambios directos en PRE / producción.

## Migración de esta entrega
`supabase/migrations/20261120120000_incident_owner_attribution.sql`

- La vista por propietario cuenta solo incidentes atribuidos expresamente.
- La fecha del incidente define el periodo de 365 días.
- El campo histórico no se puede sobrescribir mediante actualizaciones
  ordinarias, salvo una corrección de vivienda.
- Los contadores no multiplican seguimientos.
- Las vistas `security_invoker` aplican la RLS del usuario.
- Aún hacen falta pruebas de integración con dos usuarios y comunidades
  diferentes, y pruebas del comportamiento del trigger.

## Validación pendiente antes de integrar
1. Probar en Supabase local aislado con `npx supabase test db`.
2. Probar propietario cambiado después de creada la incidencia:
   propietario histórico debe conservarse.
3. Probar vinculación tardía de incidencia sin vivienda y corrección de vivienda.
4. Comprobar visibilidad RLS, permisos y ausencia de datos de otra comunidad.
5. Implementar UI, colas de notificación, PDF, XLSX y planificación.
6. Revisar cambios y aprobar explícitamente despliegue a PRE.
