# Diseño de Super Soccer

## Objetivo

Una carrera de entrenador para PC, en navegador y sin conexión. El jugador decide quién juega, qué sistema utiliza el equipo y cómo invierte el presupuesto. Los futbolistas actúan automáticamente en una retransmisión animada. No hay movimientos, pases o tiros controlados por el usuario ni resolución instantánea de su partido.

## Pilares

**Construir:** contratar talento, equilibrar presupuesto y salarios, mantener una plantilla disponible y preparar el relevo generacional. **Observar:** convertir la simulación estadística en una retransmisión legible con progresión temporal, jugadas y celebraciones. **Decidir:** cambiar planteamiento y titulares en el descanso, con consecuencias en la segunda mitad. **Conservar:** continuar la misma carrera durante temporadas y entre dispositivos mediante copias exportables.

## Bucle

Revisar rival y estado del club → alinear y preparar la táctica → ver el primer tiempo → decidir en el descanso → ver el segundo tiempo y posibles penaltis → registrar estadísticas, economía y resultados continentales → desarrollar la plantilla → avanzar hacia la próxima jornada. El cierre de temporada reparte títulos y premios; la siguiente resuelve divisiones, contratos, edad, retiradas y nuevas generaciones.

## Universo

Siete países europeos, dos divisiones por país, copas y supercopas nacionales y tres torneos continentales. 188 clubes y 2.256 jugadores iniciales. Los clubes tienen identidad visual propia y nombres ficticios reconocibles. Las plantillas crecen o cambian mediante fichajes, cantera y regeneración. Liga/copa de ocho y amistosos permiten sesiones independientes más cortas.

## Simulación y presentación

Cinco titulares: un portero y cuatro jugadores. Los siete atributos, el físico y la moral alimentan ataque, defensa y circulación. El plan y la formación modifican esos valores; la dificultad ajusta la ventaja del entrenador. Una distribución de Poisson produce goles por periodo; los autores y asistentes se eligen ponderando posición y atributos. La segunda mitad utiliza la alineación y táctica elegidas en el descanso. Las acciones se escenifican en Canvas con reloj, marcador y registro. La velocidad de visionado no influye en el cálculo estadístico.

## Interacción y estética

Ratón para gestión; Espacio/Esc para pausa, 1–4 para velocidad y F para pantalla completa. Panel de escritorio, verde petróleo, lima y marfil; tipografía editorial, estadio isométrico, escudos geométricos y jugadores de proporciones reducidas. Sonido y música sintetizados originales, opcionales. Los menús siguen siendo utilizables en pantallas pequeñas, aunque PC es la plataforma principal.

## Persistencia y límites

Tres ranuras, autoguardado, copia previa, archivos portables y validación. El navegador almacena todo localmente. Se excluyen multijugador, control directo, equipos oficiales licenciados, anuncios, pagos y un catálogo completo mundial de selecciones y ligas. El motor presenta simulaciones de gestión, no pretende reproducir una física de fútbol profesional.
