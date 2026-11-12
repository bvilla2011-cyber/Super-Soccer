# Arquitectura

| Módulo | Responsabilidad |
| --- | --- |
| `src/data.js` | Países, clubes, plantillas reproducibles, atributos, potenciales, valores, formaciones y escudos. |
| `src/competitions.js` | Calendarios de ida/vuelta, clasificación y sorteos con pases directos. |
| `src/simulation.js` | Fuerza estadística, simulación completa o por mitades, autores, notas y tandas de penaltis. |
| `src/career.js` | Universo de temporada, progreso de eventos, resultados, mercado, economía, desarrollo, ascensos, contratos y palmarés. |
| `src/match.js` | Director temporal de la retransmisión y snapshot reanudable. |
| `src/entities.js` / `physics.js` | Geometría del campo, posiciones y utilidades de animación. No exponen controles de futbolistas. |
| `src/render.js` | Estadio cacheado, jugadores, balón, porterías, cámara y partículas con un máximo de 120 objetos. |
| `src/storage.js` | IndexedDB, respaldo localStorage, generaciones actual/anterior, checksum y validación de importaciones. |
| `src/ui.js` / `app.js` | Vistas, interacción, pizarra, fichas, ciclo de retransmisión y autoguardado. |
| `src/audio.js` | Efectos, ambiente y música procedural con Web Audio. |

## Una jornada

`prepareEvent` materializa eliminatorias pendientes sin repetir el sorteo. `nextFixture` localiza el encuentro del entrenador. `MatchSimulation` calcula y anima el primer periodo. En el descanso se actualizan las decisiones del entrenador y se calcula el segundo. La tanda, si procede, tiene un registro de lanzamientos y presentación temporal. `advance` verifica que el resultado pertenece al encuentro pendiente, lo aplica una vez y simula los otros estadios de esa jornada. Después guarda el universo y elimina el snapshot del partido terminado.

El generador visual tiene estado separado del generador estadístico. Los FPS y las velocidades 1× a 8× no cambian el resultado. El callback de final solo se emite una vez.

## Temporadas

54 eventos en la carrera europea: 38 jornadas continentales, cinco rondas de copa nacional, diez citas europeas y una jornada de supercopas. Los países de 18 clubes y las segundas divisiones tienen descansos cuando su calendario termina. Los torneos continentales de 16 equipos terminan una ronda antes que los de 32. Las plazas europeas se seleccionan del curso anterior sin duplicar participantes entre torneos.

El historial retiene los últimos 30 resúmenes de temporada, mientras el palmarés y los totales de jugadores y entrenador continúan. Los resultados detallados solo se mantienen en la temporada actual para limitar el tamaño del guardado.

## Guardado

Un sobre versionado contiene `{world, match}` serializado y un checksum FNV-1a. Este checksum detecta daños accidentales, no es una firma de seguridad ni un sistema antitrampas. IndexedDB conserva dos generaciones por ranura y las escrituras se encolan. Si el guardado actual está dañado y existe una copia válida, se ofrece/restaura la anterior. La importación limita tamaño, IDs, colores, listas, referencias y rangos numéricos antes de aceptar el universo.

Los datos son del navegador/origen; no se sincronizan con una cuenta. No hay secretos ni backend. El autoguardado se realiza cada diez segundos durante el partido, al ocultar la pestaña y después de eventos o cambios de gestión. `pagehide` intenta un último guardado; la garantía práctica es el último autoguardado completado. Exportar proporciona una copia independiente.

## Distribución

El compilador copia HTML/ESM/CSS/SVG y genera una versión del caché a partir del contenido. No descarga dependencias ni fuentes. `npm run dev` es un servidor estático Node; los lanzadores también aceptan Python. La versión publicada precachea todos los recursos y permite navegación sin red después de su primera instalación. Desarrollo usa red local sin caché para que los cambios sean visibles.
