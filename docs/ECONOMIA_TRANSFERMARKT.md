# Economía del mercado · Super Soccer

Actualizado el 12 de noviembre de 2026. Las referencias son las medias por jugador que Transfermarkt publica para la temporada 2026/27. El universo del juego usa plantillas de 16 jugadores (once titulares y cinco suplentes), así que las cifras son una calibración del juego, no una copia literal de plantillas reales.

| País | Primera | Segunda | Tercera | Competiciones de referencia |
|---|---:|---:|---:|---|
| Inglaterra | €25,79 M | €3,46 M | €565.000 | [Premier League](https://www.transfermarkt.com/premier-league/startseite/wettbewerb/GB1/saison_id/2026/plus/1), [Championship](https://www.transfermarkt.com/championship/startseite/wettbewerb/GB2), [League One](https://www.transfermarkt.com/league-one/startseite/wettbewerb/GB3) |
| España | €10,49 M | €1,04 M | €187.000 | [LaLiga](https://www.transfermarkt.com/laliga/startseite/wettbewerb/ES1/saison_id/2026/plus/1), [LaLiga2](https://www.transfermarkt.com/laliga2/startseite/wettbewerb/ES2), [Primera Federación](https://www.transfermarkt.com/primera-federacion-grupo-1/startseite/wettbewerb/E3G1) |
| Alemania | €9,01 M | €1,21 M | €237.000 | [Bundesliga](https://www.transfermarkt.com/bundesliga/startseite/wettbewerb/L1), [2. Bundesliga](https://www.transfermarkt.com/2-bundesliga/startseite/wettbewerb/L2), [3. Liga](https://www.transfermarkt.com/3-liga/startseite/wettbewerb/L3) |
| Italia | €8,45 M | €854.000 | €203.000 | [Serie A](https://www.transfermarkt.com/serie-a/startseite/wettbewerb/IT1), [Serie B](https://www.transfermarkt.com/serie-b/startseite/wettbewerb/IT2), [Serie C](https://www.transfermarkt.com/serie-c-girone-c/startseite/wettbewerb/IT3C) |
| Francia | €8,83 M | €1,10 M | €145.000 | [Ligue 1](https://www.transfermarkt.com/ligue-1/startseite/wettbewerb/FR1), [Ligue 2](https://www.transfermarkt.com/fr2/startseite/wettbewerb/FR2), [Ligue 3](https://www.transfermarkt.com/z/startseite/wettbewerb/FR3) |
| Portugal | €3,98 M | €434.000 | €37.000 | [Liga Portugal](https://www.transfermarkt.com/liga-portugal/startseite/wettbewerb/PO1), [Liga Portugal 2](https://www.transfermarkt.com/liga-portugal-2/startseite/wettbewerb/PO2), [Liga 3](https://www.transfermarkt.com/liga-3/startseite/wettbewerb/PT3A) |
| Países Bajos | €2,85 M | €299.000 | €4.000 | [Eredivisie](https://www.transfermarkt.com/eredivisie/startseite/wettbewerb/NL1), [Eerste Divisie](https://www.transfermarkt.com/Keuken-Kampioen-Divisie/startseite/wettbewerb/NL2), [Tweede Divisie](https://www.transfermarkt.com/tweede-divisie/startseite/wettbewerb/NTD) |

## Valoración de jugadores

El valor arranca en €100.000 y crece de forma exponencial con la media del jugador. Se ajusta por edad, potencial, país y división, redondea a €10.000 y tiene un máximo de €220 M, acorde con el máximo observado en la Premier League 26/27. El ajuste por liga toma como referencia las medias anteriores y se modera con raíz cuadrada para que el rendimiento individual siga pesando.

Como anclas antes de los ajustes de edad, potencial y liga: media 60 ≈ €610.000; media 70 ≈ €3,72 M; media 80 ≈ €22,7 M; media 90 ≈ €138,7 M. Las promesas, la veteranía y la competición pueden subir o bajar el valor final.

- Menores de 23 años: ×1,45.
- Mayores de 30 años: ×0,62.
- Potencial: prima proporcional a la diferencia entre potencial y media actual.
- Traspasos: el precio sugerido se ajusta por titularidad, contrato restante y cambio de país. Los agentes libres muestran su valor estimado y piden una prima de firma.
- Cesiones: la oferta sugerida es una parte del precio de traspaso.

## Valor de plantilla y presupuesto

El valor de plantilla es la suma de los valores estimados de sus jugadores. El presupuesto de inicio es el 12% de esa suma, redondeado a €100.000 y limitado por división: €5–180 M en Primera, €500.000–35 M en Segunda y €100.000–8 M en Tercera. Transfermarkt no publica el presupuesto de fichajes de cada club, así que este porcentaje es una regla transparente del juego, no un dato atribuido a Transfermarkt.

Los ingresos de televisión, entradas y premios también bajan en las divisiones inferiores. Al cargar o importar una carrera antigua, se convierte el saldo con la relación entre su presupuesto inicial anterior y el nuevo para conservar el estado financiero de la partida, también si ya usaba la economía de la versión anterior.

Transfermarkt aclara que sus valores son estimaciones de mercado, no importes de traspaso pagados ni tarifas oficiales; también indica que no usa un algoritmo único para asignarlos. Esta implementación usa esas valoraciones como referencia de escala para una economía ficticia de arcade.

Fuente metodológica: [definición de valor de mercado de Transfermarkt](https://www.transfermarkt.com/navigation/mwdefinition).
