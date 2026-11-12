# Validación de la edición 1.0

## Pruebas automatizadas

`npm run check` comprueba sintaxis JavaScript y JSON. `npm test` ejecuta 22 pruebas del motor, competiciones, mercado, evolución y persistencia. `npm run build` genera una distribución estática sin dependencias.

Casos cubiertos:

- Calendarios pares e impares, sin doble participación en una jornada, con una localía y una visita por rival.
- Cuadros de 8, 16, 26, 28 y 32 clubes sin participantes duplicados o perdidos.
- Una temporada europea completa: 31 campeones, tablas y goles consistentes.
- Cinco temporadas consecutivas: rosters válidos, IDs únicos y tamaños de división constantes.
- Ascensos/descensos y nuevas temporadas de liga/copa de ocho.
- Compra y venta con conservación de fondos y estadísticas de temporada/carrera; presupuesto, contratos y restricciones de mercado/plantilla.
- Cantera una vez por curso; inversión cobrada y evolución sin superar potencial; retiradas.
- Exportación/importación, referencias inválidas, datos corruptos y restauración de la generación anterior.
- Tandas de penaltis reproducibles con ganador único y lanzamientos coherentes.
- Una retransmisión completa con aplicación única de resultado.
- Guardado en mitad de una animación y reanudación que produce el mismo resultado.
- Resultado estadístico idéntico a distintas velocidades de reproducción y tasas de fotogramas.
- Cambios del descanso incluidos en la selección de la segunda mitad y equipo que permanece en inferioridad tras una expulsión.

## Comprobación en navegador

Se revisan apertura, creación y carga de carrera, retransmisión Canvas, velocidades, pausa, autoguardado, salida/reanudación, descanso, cambios, resultado, navegación de gestión, fichas, filtros y operaciones de mercado. También se revisan las pantallas de guardado y el estado de consola de la aplicación.

La calidad visual y el rendimiento dependen del navegador y hardware. El dibujo precachea el estadio, limita el DPR a 2 y utiliza un conjunto fijo de 120 partículas; el modo Ligero utiliza DPR 1 y omite sombras. No se afirma haber medido 60 FPS en todas las máquinas ni haber probado físicamente todos los dispositivos.

## Límites conocidos

- El modo local de desarrollo requiere Node.js 20+ o Python 3; abrir `index.html` con `file://` no es un método compatible con módulos ES.
- Las carreras completas requieren varios MB; IndexedDB es el almacenamiento principal. El respaldo localStorage puede quedarse sin espacio y lo notifica.
- El autoguardado final de `pagehide` depende del navegador. Exportar y guardar antes de cerrar sigue siendo recomendable.
- Las animaciones representan acontecimientos del modelo estadístico. No son una reconstrucción de físicas o decisiones de futbolistas de un partido real.
- Las ligas y reglas son simplificadas y los nombres/valoraciones ficticios. No incluye selecciones ni todo el catálogo de la referencia comercial.
