# Métricas, compatibilidad y datos anónimos

## Conectividad
Metricool muestra Instagram y TikTok conectados para la marca uniformerstudio. YouTube no está conectado en la marca visible. No se han creado posts: faltan archivos de vídeo finales y fechas; la herramienta de programación requiere media y campos por plataforma. No se ha activado informe semanal recurrente.

## Appwrite: propuesta de esquema aislado
No hay proyecto UniFormer de campaña en el contexto Appwrite, y el operador disponible no expone creación de proyecto (solo acceso a proyectos existentes). No se ha tocado STARSHIP-SABOTAGE ni PADELUM. Crear un proyecto nuevo desde consola cuando esté habilitado, nombrado `uniformer-season0-analytics`, región UE (Frankfurt si está disponible), separado de cualquier juego.

No guardar datos personales, IP, user-agent completo, IDs de usuario, correos, nombres de centros o edades. Evitar cookies y fingerprinting. Usar eventos agregados con periodo de retención corto.
- `campaign_events`: `event_type` enum (landing_view, play_click, poll_vote, campaign_event, load_error), `campaign` string, `asset_id` string opcional, `choice` enum opcional, `browser_family` enum grueso opcional, `device_class` enum (desktop/tablet/mobile/unknown), `created_at` timestamp. Sin identificador persistente.
- `daily_aggregates`: fecha, evento, campaña, recuento entero; acceso solo backend.
- Voto: opción predefinida y evento agregado. No recoger texto libre.
- Permisos: lectura agregada solo administradores; escritura mediante Function validada con allowlist de eventos y límites de frecuencia, sin crear perfil de visitante. Desactivar acceso público directo de escritura a tablas.
- Minimizar campos: si no hacen falta para la pregunta de negocio, no recogerlos. Retención sugerida 90 días y después eliminar/agregar.
- No crear colección/tablas ni función porque no existe proyecto aislado ni asistente de creación disponible.

### Integración web propuesta
Al publicar página Próximamente, el frontend debe invocar una Function de Appwrite con payload mínimo: `{event_type, campaign, asset_id?, choice?}`. Appwrite Function valida valores, agrega/guarda solo evento, nunca devuelve datos de visitantes. No mandar eventos en el juego sin consentimiento y análisis de política del centro. No instalar SDK/llaves secretas de servidor en frontend. Configuración pública solo endpoint y project ID; API key solo secret de Function.

## Prueba de compatibilidad en instituto (plantilla)
| Centro/código anónimo | Equipo/clase aproximada | Navegador/versión mayor | Resolución | Tiempo de carga | Controles | Filtro de red | Observaciones |
|---|---|---|---|---|---|---|---|
| | | | | | teclado/ratón | permitido/bloqueado/desconocido | |

No rellenar centro, alumno ni identificadores personales. Hacer prueba solo con autorización del centro, en recreo o con profesor.

### Guía de 5 pasos (5 minutos)
1. Abre la URL oficial en un ordenador autorizado; anota solo código aleatorio de prueba, no el nombre del centro.
2. Anota navegador y versión principal, resolución y si la página abre.
3. Cronometra desde cargar hasta menú listo; registra error visible si lo hay.
4. Comprueba teclado/ratón con instrucciones de pantalla, sin guardar nombres de jugadores.
5. Anota si filtro de red bloquea el sitio y borra cualquier historial/archivo local si el equipo lo requiere. No fuerces filtros ni políticas.
