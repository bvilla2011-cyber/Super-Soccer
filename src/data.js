import { clamp, random, hash } from './utils.js';

// Un universo ficticio. Los nombres, escudos, camisetas y valoraciones son propios.
const seed = (name, rating, color, accent = '#f3f0df', stars = []) => ({ name, rating, colors: [color, accent], stars });
export const COUNTRIES = [
  { id: 'es', name: 'España', flag: 'ES', league: 'Liga del Sol', cup: 'Copa de la Corona', second: 'Liga del Sol · Ascenso',
    clubs: [
      seed('Madrid Blanco',89,'#ece9de','#d2ac54',[['K. Mbapé','DEL',91,94],['V. Junius','DEL',90,94],['J. Belingam','MED',90,95]]),
      seed('Barcelona Azulgrana',88,'#a82f4e','#29448b',[['L. Yamir','DEL',88,97],['P. Pedrián','MED',88,94],['R. Levandos','DEL',87,87],['R. Raphiná','DEL',87,90],['F. Fermín','MED',84,90],['J. Kundé','DEF',86,89]]),
      seed('Atlético Capital',85,'#dc3349','#eee8da',[['J. Álvarez','DEL',86,92],['A. Grizán','DEL',85,85],['A. Lukmán','DEL',87,90],['K. Lee','MED',84,90]]),
      seed('Bilbao Leones',81,'#cb3143','#eee8da',[['N. Wiliams','DEL',86,93],['I. Wiliams','DEL',83,87],['O. Sancet','MED',83,88]]),seed('Villarreal Amarillo',80,'#e7ce34','#173864'),seed('Betis del Sur',80,'#268e67'),seed('San Sebastián Real',80,'#2872ad'),seed('Sevilla Nervión',77,'#dfded6','#b23749'),seed('Valencia Turia',77,'#ece7db','#26272a'),seed('Vigo Celeste',77,'#74c4df'),seed('Girona Roig',77,'#e14650'),seed('Osasuna Navarra',76,'#bd3347','#223859'),seed('Mallorca Isla',75,'#ca3042'),seed('Getafe Azul',75,'#2a63b3'),seed('Espanyol Cornellà',75,'#3484bd'),seed('Rayo Valle',75,'#f0e9dc','#c73344'),seed('Alavés Vitoria',74,'#3c65bc'),seed('Levante Mar',73,'#862f4c','#31568e'),seed('Elche Palmeras',73,'#e7e9dc','#35925f'),seed('Oviedo Azul',73,'#2469b6')
    ], reserves: ['Zaragoza Ebro','Santander Racing','Málaga Costa','Cádiz Bahía','Granada Nazarí','Almería Desierto','Deportivo Atlántico','Sporting Asturias'] },
  { id: 'en', name: 'Inglaterra', flag: 'EN', league: 'Crown Premier', cup: 'Copa de las Islas', second: 'Crown Championship',
    clubs: [seed('Manchester Celeste',89,'#75bce0','#eef0dc',[['E. Haland','DEL',93,96],['P. Fodené','MED',87,92]]),seed('Liverpool Mersey',88,'#d73548','#f1e7d2',[['M. Salá','DEL',90,90],['F. Virtz','MED',88,94]]),seed('Arsenal North',88,'#d73549','#e9e4d8',[['B. Sakán','DEL',88,94],['M. Odegard','MED',88,92],['E. Ezé','MED',85,89],['D. Rís','MED',87,90],['M. Saliba','DEF',86,90],['V. Gyökeres','DEL',87,91]]),seed('Chelsea Bridge',85,'#3158be','#f0e9d9',[['C. Palmier','MED',87,93]]),seed('Newcastle Tyne',83,'#252e36','#dcdeda'),seed('Manchester Rojo',83,'#d63d45','#e9dacc',[['B. Fernán','MED',86,86]]),seed('Tottenham Lily',83,'#e9eadf','#22334f'),seed('Aston Birmingham',82,'#743d55','#7dbad0'),seed('Brighton Gulls',80,'#3265b4'),seed('Nottingham Forestal',79,'#c83442'),seed('Bournemouth Coast',78,'#b93145','#263039'),seed('Crystal South',78,'#3456a8','#c93f4d'),seed('Brentford Bees',78,'#ca3c47'),seed('Everton Dock',77,'#3152aa'),seed('Fulham River',77,'#e2e5d9','#263039'),seed('West Ham Irons',78,'#75334e','#84bad1'),seed('Wolverhampton Gold',77,'#e6aa38','#222c35'),seed('Leeds White',76,'#e5e9df','#e1c646'),seed('Burnley Clarets',75,'#823852','#79bbd5'),seed('Sunderland Wear',75,'#d74850')], reserves:['Leicester Foxes','Southampton Saints','Ipswich Blue','Coventry Sky','Middlesbrough Red','Norwich Canaries','Watford Hornets','Sheffield Steel'] },
  { id: 'de', name: 'Alemania', flag: 'DE', league: 'Meister Liga', cup: 'Copa de los Estados', second: 'Meister 2',
    clubs:[seed('Bayern Múnich Rojo',89,'#d53d49','#e6e9e4',[['H. Kain','DEL',92,92],['J. Musial','MED',89,96],['L. Díaz','DEL',87,90],['M. Olisé','DEL',88,93],['J. Kimmich','MED',88,89],['A. Davies','DEF',86,91]]),seed('Leverkusen Fábrica',85,'#d83646','#252b32',[['A. Grimado','DEF',84,88]]),seed('Dortmund Abejas',85,'#e6cf34','#293138'),seed('Leipzig Toros',83,'#e9e7db','#d3424b'),seed('Frankfurt Águilas',82,'#202c35','#d4404a'),seed('Stuttgart Neckar',81,'#f0e5da','#c43443'),seed('Freiburg Bosque',79,'#c83144'),seed('Mainz Rin',78,'#c93549'),seed('Bremen Verdes',78,'#378d68'),seed('Gladbach Potros',78,'#e6e9de','#3c8b68'),seed('Wolfsburg Lobos',78,'#7fbf4b'),seed('Hoffenheim Azul',77,'#4278bc'),seed('Augsburg Fugger',76,'#e9e3d8','#c53346'),seed('Union Berlín Este',77,'#ce3742'),seed('Hamburgo Puerto',75,'#e9e7df','#2c66a5'),seed('Colonia Cabras',75,'#d84150'),seed('St. Pauli Barrio',74,'#785a48'),seed('Heidenheim Colina',74,'#3755a2','#c23a46')], reserves:['Schalke Mineros','Hannover Norte','Hertha Capital','Düsseldorf Fortuna','Karlsruhe Baden','Kaiserslautern Diablos','Núremberg Burgo','Darmstadt Lirios'] },
  { id:'it',name:'Italia',flag:'IT',league:'Calcio Elite',cup:'Coppa delle Città',second:'Calcio Ascenso',
    clubs:[seed('Milano Nerazzurro',88,'#2859a6','#263139',[['L. Martino','DEL',89,92],['N. Barel','MED',87,90],['M. Thuram','DEL',87,89],['F. Di Marco','DEF',85,88]]),seed('Napoli Vesuvio',85,'#57b5d1'),seed('Torino Juventa',85,'#e1e4db','#273039',[['K. Yildan','MED',83,93]]),seed('Milano Rossonero',84,'#c43643','#26313a',[['R. Leaoz','DEL',86,91]]),seed('Bergamo Dea',83,'#365ca2','#252d33'),seed('Roma Capitolio',82,'#873a3e','#d8ae4c',[['P. Dybalo','MED',85,85]]),seed('Lazio Aquila',81,'#8ac3dc'),seed('Fiorentina Viola',81,'#7552ac'),seed('Bologna Portici',80,'#ae3348','#314f7e'),seed('Como Lago',78,'#3164b0'),seed('Torino Granata',78,'#803848'),seed('Udine Friuli',77,'#e8e8dc','#252e34'),seed('Génova Grifón',77,'#b93444','#294b7c'),seed('Sassuolo Verde',76,'#36965e','#23313a'),seed('Parma Ducale',76,'#ecd45a','#385daf'),seed('Cagliari Isla',75,'#a82f43','#34557f'),seed('Verona Scala',75,'#365da4','#e1be43'),seed('Lecce Salento',74,'#e0be42','#c73543'),seed('Pisa Torre',74,'#3361a2','#26323a'),seed('Cremona Violín',73,'#bb3b49','#bcc4c6')], reserves:['Palermo Rosa','Samp Génova','Venecia Laguna','Empoli Toscana','Monza Corona','Bari Gallo','Spezia Golfo','Frosinone León'] },
  { id:'fr',name:'Francia',flag:'FR',league:'Ligue Lumière',cup:'Coupe du Lys',second:'Lumière 2',
    clubs:[seed('Paris Saint-Lumière',89,'#294477','#ca3b4c',[['O. Dembéléo','DEL',90,91],['D. Dué','MED',84,95],['A. Hakim','DEF',88,91],['K. Kvarats','DEL',90,93],['V. Tinia','MED',87,91],['M. Marquin','DEF',86,88]]),seed('Marsella Vieux Port',83,'#6ebbd6'),seed('Mónaco Principado',82,'#e5e5d9','#ce3c45'),seed('Lille Dogues',81,'#bb3246'),seed('Lyon Ródano',81,'#e9e4d7','#3d69a9'),seed('Niza Riviera',80,'#c13646','#27313b'),seed('Estrasburgo Alsace',79,'#3674b7'),seed('Lens Sang et Or',79,'#d9b43c','#b93448'),seed('Rennes Bretaña',78,'#c93648','#29333b'),seed('Toulouse Violeta',77,'#8466b5'),seed('Brest Armor',77,'#c73747'),seed('Auxerre Borgoña',76,'#e4e7dd','#3f67a8'),seed('Nantes Canarios',76,'#d6c545','#3e9568'),seed('Le Havre Océano',74,'#5d9ac7','#2e4570'),seed('Angers Anjou',74,'#e7e6db','#2a353c'),seed('Metz Lorena',74,'#873c51'),seed('Lorient Merlus',74,'#dd853d'),seed('Paris Rive',75,'#304978')], reserves:['Saint-Étienne Verde','Reims Champaña','Montpellier Hérault','Caen Normandía','Bastia Córcega','Troyes Aube','Grenoble Alpes','Nancy Cardos'] },
  { id:'pt',name:'Portugal',flag:'PT',league:'Liga Atlântica',cup:'Taça dos Navegantes',second:'Atlântica 2',
    clubs:[seed('Lisboa Leones',85,'#409b6b','#e6e9dc',[['P. Gonçal','MED',84,89],['F. Ioanidis','DEL',84,87],['G. Catamo','DEL',82,88],['G. Inácio','DEF',85,89]]),seed('Benfica Águilas',85,'#cb3541','#e5e4d8'),seed('Porto Dragones',84,'#3472b7','#e3e8e1'),seed('Braga Minho',80,'#c8374c'),seed('Guimarães Castillo',77,'#eee8da','#2c3338'),seed('Famalicão Ave',75,'#396bb1'),seed('Santa Clara Azores',74,'#cc3e4c'),seed('Moreira Cónegos',73,'#4a9865'),seed('Estoril Costa',73,'#e3c948','#4174ab'),seed('Rio Ave Vila',74,'#3f956c'),seed('Arouca Montaña',73,'#dbbb47','#315881'),seed('Gil Barcelos',73,'#bb354b'),seed('Nacional Madeira',72,'#e7e5d9','#2c353d'),seed('Casa Lisboa',72,'#e7e8de','#2b343d'),seed('Estrela Amadora',72,'#b63d4f','#4b925e'),seed('Alverca Ribatejo',71,'#b33b4c','#395c85'),seed('Tondela Beira',71,'#cbbf45','#3c8d6d'),seed('AVS Norte',71,'#c33b49')], reserves:['Boavista Ajedrez','Farense Algarve','Vizela Azul','Chaves Termas','Marítimo Isla','Académica Coimbra','Leixões Mar','Paços Castores'] },
  { id:'nl',name:'Países Bajos',flag:'NL',league:'Ere Liga',cup:'Beker de Oranje',second:'Ere Ascenso',
    clubs:[seed('Eindhoven Philips',85,'#d3474e','#eee7dc',[['G. Til','MED',82,86],['R. Pepí','DEL',82,86],['I. Perišić','DEL',79,80]]),seed('Ámsterdam Ajaxia',83,'#d23f4b','#eee9df',[['M. Godts','DEL',82,89],['O. Glukh','MED',81,89],['R. Moro','DEL',80,86],['K. Dolberg','DEL',80,80]]),seed('Róterdam Feyen',83,'#e7e6db','#ca3a46',[['A. Hadj Mousá','DEL',82,88],['G. Borgés','DEL',80,86],['T. Steijn','MED',81,85]]),seed('Alkmaar AZeta',79,'#c6384b'),seed('Twente Enschede',79,'#ca3848'),seed('Utrecht Catedral',77,'#cb3b4c'),seed('Go Ahead Deventer',75,'#d9b33b','#c43745'),seed('Heerenveen Frisia',74,'#4c7fba'),seed('Groningen Norte',74,'#3b9a71'),seed('Nijmegen NECa',74,'#bb3d4d','#399264'),seed('Sparta Róterdam',74,'#ce3d49'),seed('Fortuna Sittard',73,'#d7bc44','#478e65'),seed('Zwolle Azul',73,'#3879b8'),seed('Heracles Almelo',73,'#e3e7df','#2b333a'),seed('Excelsior Puerto',72,'#24323b','#bd384c'),seed('Volendam Naranja',71,'#d8873c'),seed('Breda NACa',72,'#e0c13b','#27343a'),seed('Telstar Blanco',71,'#e5e9df','#436fa4')], reserves:['Willem Tilburg','RKC Waalwijk','Almere Ciudad','Den Haag Dunas','Cambuur Leeuwarden','Roda Kerkrade','Emmen Drenthe','Vitesse Arnhem'] }
];

export const POSITIONS = ['POR','DEF','MED','DEL'];
const formation = (name, roles, bases, attack=0, defense=0) => ({name,roles,bases,attack,defense});
export const FORMATIONS = {
  '4-4-2': formation('Equilibrado · 4-4-2', ['POR','DEF','DEF','DEF','DEF','MED','MED','MED','MED','DEL','DEL'], [[.055,.5],[.24,.17],[.24,.39],[.24,.61],[.24,.83],[.46,.17],[.46,.39],[.46,.61],[.46,.83],[.73,.34],[.73,.66],], 1, 1),
  '4-3-3': formation('Ofensivo · 4-3-3', ['POR','DEF','DEF','DEF','DEF','MED','MED','MED','DEL','DEL','DEL'], [[.055,.5],[.24,.17],[.24,.39],[.24,.61],[.24,.83],[.48,.24],[.48,.5],[.48,.76],[.75,.2],[.75,.5],[.75,.8]], 5, -3),
  '4-2-3-1': formation('Control · 4-2-3-1', ['POR','DEF','DEF','DEF','DEF','MED','MED','MED','MED','MED','DEL'], [[.055,.5],[.24,.17],[.24,.39],[.24,.61],[.24,.83],[.42,.37],[.42,.63],[.61,.2],[.61,.5],[.61,.8],[.8,.5]], 2, 2),
  '3-5-2': formation('Presión · 3-5-2', ['POR','DEF','DEF','DEF','MED','MED','MED','MED','MED','DEL','DEL'], [[.055,.5],[.25,.22],[.25,.5],[.25,.78],[.48,.14],[.52,.32],[.48,.5],[.52,.68],[.48,.86],[.75,.34],[.75,.66]], 3, -1),
  '3-4-3': formation('Ataque · 3-4-3', ['POR','DEF','DEF','DEF','MED','MED','MED','MED','DEL','DEL','DEL'], [[.055,.5],[.25,.22],[.25,.5],[.25,.78],[.48,.2],[.48,.4],[.48,.6],[.48,.8],[.75,.2],[.75,.5],[.75,.8]], 6, -4),
  // Legacy formation ids remain loadable; old saves are migrated to 4-4-2.
  '2-1-1': formation('Equilibrado · 4-4-2', ['POR','DEF','DEF','DEF','DEF','MED','MED','MED','MED','DEL','DEL'], [[.055,.5],[.24,.17],[.24,.39],[.24,.61],[.24,.83],[.46,.17],[.46,.39],[.46,.61],[.46,.83],[.73,.34],[.73,.66]], 1, 1),
  '1-2-1': formation('Posesión · 4-2-3-1', ['POR','DEF','DEF','DEF','DEF','MED','MED','MED','MED','MED','DEL'], [[.055,.5],[.24,.17],[.24,.39],[.24,.61],[.24,.83],[.42,.37],[.42,.63],[.61,.2],[.61,.5],[.61,.8],[.8,.5]], 2, 2),
  '1-1-2': formation('Ofensivo · 4-3-3', ['POR','DEF','DEF','DEF','DEF','MED','MED','MED','DEL','DEL','DEL'], [[.055,.5],[.24,.17],[.24,.39],[.24,.61],[.24,.83],[.48,.24],[.48,.5],[.48,.76],[.75,.2],[.75,.5],[.75,.8]], 5, -3)
};
export const DIFFICULTIES = {
  rookie:{name:'Debutante',reaction:.65,accuracy:.78,speed:.92,bonus:5},
  club:{name:'Profesional',reaction:.32,accuracy:.91,speed:1,bonus:0},
  legend:{name:'Leyenda',reaction:.16,accuracy:.98,speed:1.05,bonus:-4}
};
const first = ['Álex','Dani','Leo','Marco','Adri','Nico','Bruno','Hugo','Luca','Thiago','Oliver','Lucas','Noah','Enzo','Sami','Mateo','Tom','Amir','Iker','Joel','Alan','Max','Rui','Milan','Jules','Rayan','Karim','Iván','Jan','Finn','Otto','Elias','Yuri','Óscar','Adam','Sergi','Gael','Luis','Diego','Pablo'];
const last = ['Silva','Ferrán','Costa','Navarro','Moretti','Bauer','Rossi','Martin','Soler','Dubois','Meijer','Santos','Vidal','Torres','Klein','Romano','Walker','Lefèvre','Duarte','Salas','Vega','Neri','Dias','Meyer','Vermeer','Blanco','Brooks','Mendes','Roca','García','Nolan','Lopes','Rivas','King','Almeida','Peeters','Serrano','Laurent','Fontana','Castro'];
export const ATTRIBUTE_NAMES = { pace:'Ritmo',shot:'Disparo',pass:'Pase',defense:'Defensa',control:'Control',stamina:'Resistencia',keeping:'Portería' };
const ICONIC_LOOKS={
  'K. Mbapé':{skin:2,hair:3,hairstyle:1},'V. Junius':{skin:3,hair:0,hairstyle:0},'J. Belingam':{skin:1,hair:1,hairstyle:2},
  'L. Yamir':{skin:1,hair:0,hairstyle:3},'P. Pedrián':{skin:0,hair:0,hairstyle:1},'R. Levandos':{skin:0,hair:1,hairstyle:4},
  'E. Haland':{skin:0,hair:2,hairstyle:4},'P. Fodené':{skin:0,hair:2,hairstyle:1},'M. Salá':{skin:2,hair:0,hairstyle:3},
  'F. Virtz':{skin:0,hair:1,hairstyle:1},'B. Sakán':{skin:2,hair:0,hairstyle:0},'M. Odegard':{skin:0,hair:1,hairstyle:4},
  'H. Kain':{skin:0,hair:1,hairstyle:1},'J. Musial':{skin:0,hair:0,hairstyle:2},'A. Grimado':{skin:2,hair:0,hairstyle:3},
  'L. Díaz':{skin:2,hair:0,hairstyle:3},'M. Olisé':{skin:2,hair:0,hairstyle:3},'J. Kimmich':{skin:0,hair:1,hairstyle:1},'A. Davies':{skin:2,hair:0,hairstyle:3},
  'L. Martino':{skin:0,hair:1,hairstyle:1},'N. Barel':{skin:0,hair:1,hairstyle:1},'M. Thuram':{skin:2,hair:0,hairstyle:3},'F. Di Marco':{skin:0,hair:1,hairstyle:1},
  'J. Álvarez':{skin:1,hair:1,hairstyle:1},'A. Grizán':{skin:0,hair:1,hairstyle:4},'A. Lukmán':{skin:2,hair:0,hairstyle:3},'K. Lee':{skin:1,hair:0,hairstyle:1},
  'P. Gonçal':{skin:1,hair:0,hairstyle:1},'F. Ioanidis':{skin:0,hair:1,hairstyle:1},'G. Catamo':{skin:2,hair:0,hairstyle:3},'G. Inácio':{skin:1,hair:0,hairstyle:1},
  'G. Til':{skin:0,hair:1,hairstyle:1},'R. Pepí':{skin:2,hair:0,hairstyle:3},'I. Perišić':{skin:0,hair:1,hairstyle:1},'M. Godts':{skin:0,hair:1,hairstyle:1},'O. Glukh':{skin:0,hair:1,hairstyle:2},'R. Moro':{skin:0,hair:0,hairstyle:1},'K. Dolberg':{skin:0,hair:1,hairstyle:1},
  'A. Hadj Mousá':{skin:2,hair:0,hairstyle:3},'G. Borgés':{skin:2,hair:0,hairstyle:3},'T. Steijn':{skin:0,hair:1,hairstyle:1},'R. Raphiná':{skin:2,hair:0,hairstyle:3},'F. Fermín':{skin:0,hair:0,hairstyle:1},'J. Kundé':{skin:2,hair:0,hairstyle:2},'N. Wiliams':{skin:2,hair:0,hairstyle:3},'I. Wiliams':{skin:2,hair:0,hairstyle:3},'O. Sancet':{skin:0,hair:1,hairstyle:1},
  'E. Ezé':{skin:2,hair:0,hairstyle:3},'D. Rís':{skin:0,hair:1,hairstyle:2},'M. Saliba':{skin:2,hair:0,hairstyle:3},'V. Gyökeres':{skin:0,hair:1,hairstyle:4},
  'K. Kvarats':{skin:0,hair:1,hairstyle:1},'V. Tinia':{skin:1,hair:0,hairstyle:1},'M. Marquin':{skin:2,hair:0,hairstyle:3}
};
export function overall(player) {
  const a = player.attributes;
  const weights = {POR:[.08,.01,.09,.1,.06,.06,.6],DEF:[.16,.06,.16,.36,.1,.14,.02],MED:[.13,.14,.29,.12,.2,.11,.01],DEL:[.22,.34,.13,.04,.19,.07,.01]}[player.position];
  return Math.round(Object.keys(ATTRIBUTE_NAMES).reduce((sum,key,i)=>sum+a[key]*weights[i],0));
}
export const MARKET_REFERENCE_AVERAGES = {
  en:[25_790_000,3_460_000,565_000], es:[10_490_000,1_040_000,187_000],
  de:[9_010_000,1_210_000,237_000], it:[8_450_000,854_000,203_000],
  fr:[8_830_000,1_100_000,145_000], pt:[3_980_000,434_000,37_000],
  nl:[2_850_000,299_000,4_000]
};
export const MARKET_REFERENCE_AVERAGES_V2 = {
  en:[21_350_000,3_470_000,565_000], es:[10_370_000,1_030_000,187_000],
  de:[9_010_000,1_210_000,237_000], it:[8_450_000,830_000,203_000],
  fr:[8_830_000,1_100_000,145_000], pt:[3_980_000,434_000,37_000],
  nl:[2_860_000,299_000,4_000]
};
// Recent completed champions, normalized as points per match. Samples differ by available archive.
export const TITLE_POINTS_PER_GAME={en:2.35,es:2.39,de:2.42,it:2.37,fr:2.32,pt:2.56,nl:2.46};
const REFERENCE_MODEL_AVERAGES={1:15_000_000,2:1_250_000,3:380_000};
export const ECONOMY_VERSION=5;
export function playerValue(p,team=null,marketAverages=MARKET_REFERENCE_AVERAGES) {
  const value=overall(p),ageFactor=p.age<23?1.45:p.age>30?.62:1;
  const potentialFactor=1+Math.max(0,p.potential-value)/22;
  const marketAverage=marketAverages[team?.country]?.[team?.division-1];
  const context=marketAverage?Math.sqrt(marketAverage/REFERENCE_MODEL_AVERAGES[team.division]):1;
  const estimate=100_000*(1.195**(value-50))*ageFactor*potentialFactor*context;
  return Math.round(clamp(estimate,10_000,220_000_000)/10_000)*10_000;
}
export function teamMarketValue(team,marketAverages=MARKET_REFERENCE_AVERAGES) {
  return team.roster.reduce((sum,p)=>sum+playerValue(p,team,marketAverages),0);
}
export function initialTransferBudget(team,marketAverages=MARKET_REFERENCE_AVERAGES) {
  const limits={1:[5_000_000,180_000_000],2:[500_000,35_000_000],3:[100_000,8_000_000]}[team.division]??[100_000,8_000_000];
  return Math.round(clamp(teamMarketValue(team,marketAverages)*.12,...limits)/100_000)*100_000;
}
export const wage = (p,team=null) => Math.round(playerValue(p,team) / 4800 / 100) * 100 + 200;
const KIT_PATTERNS=['solid','halves','stripes','sash','hoops','diamonds'];
const AWAY_COLORS=['#f0eee4','#23324e','#69c8c0','#d1b653','#ca4b57','#4e3b8d','#b9d8e5','#e18b4c'];
export function teamKits(teamId,colors=['#387eae','#e6dec1']) {
  const n=parseInt(hash(teamId),16)>>>0,homePattern=KIT_PATTERNS[n%KIT_PATTERNS.length],awayPattern=KIT_PATTERNS[(n+3)%KIT_PATTERNS.length];
  const away=AWAY_COLORS[(n>>>5)%AWAY_COLORS.length];
  return {home:{primary:colors[0],secondary:colors[1],accent:colors[1],pattern:homePattern},away:{primary:away,secondary:colors[0],accent:colors[1],pattern:awayPattern}};
}
export function upgradeTeamRoster(team) {
  let changed=false;
  const oldLength=team.roster?.length??0;
  team.roster??=[];team.lineup??=[];
  if(!team.kits){team.kits=teamKits(team.id,team.colors);changed=true;}
  if(oldLength<25) {
    const targets={POR:3,DEF:8,MED:8,DEL:6};
    const rng=random(parseInt(hash(`eleven-${team.id}`),16)>>>0),base=Math.max(48,teamRating(team)-7);
    for(const role of POSITIONS) {
      let count=team.roster.filter(p=>p.position===role).length;
      while(count<targets[role]) {
        let number=12+team.roster.length;while(team.roster.some(p=>p.number===number))number++;
        const player=makePlayer(rng,`upgrade-${team.id}-${team.roster.length}`,clamp(base+rng.int(-3,4),45,89),role);
        player.number=number;team.roster.push(player);count++;changed=true;
      }
    }
    const preferred=team.lineup.map(id=>team.roster.find(p=>p.id===id)).filter(Boolean),chosen=[];
    for(const [role,count] of [['POR',1],['DEF',4],['MED',4],['DEL',2]]) {
      const pool=[...preferred.filter(p=>p.position===role),...team.roster.filter(p=>p.position===role&&!preferred.includes(p)).sort((a,b)=>overall(b)-overall(a))];
      for(const p of pool.slice(0,count))if(!chosen.includes(p))chosen.push(p);
    }
    team.lineup=chosen.map(p=>p.id);team.formation='4-4-2';changed=true;
  } else {
    const valid=team.lineup.filter(id=>team.roster.some(p=>p.id===id));
    if(valid.length!==team.lineup.length){team.lineup=valid;changed=true;}
    if(!FORMATIONS[team.formation]||['2-1-1','1-2-1','1-1-2'].includes(team.formation)){team.formation='4-4-2';changed=true;}
    if(team.lineup.length!==11) {
      const preferred=team.lineup.map(id=>team.roster.find(p=>p.id===id)).filter(Boolean),chosen=[];
      for(const [role,count] of [['POR',1],['DEF',4],['MED',4],['DEL',2]]) {
        const pool=[...preferred.filter(p=>p.position===role),...team.roster.filter(p=>p.position===role&&!preferred.includes(p)).sort((a,b)=>overall(b)-overall(a))];
        for(const p of pool.slice(0,count))if(!chosen.includes(p))chosen.push(p);
      }
      team.lineup=chosen.map(p=>p.id);team.formation='4-4-2';changed=true;
    }
  }
  return changed;
}
export function formationCoordinates(team,players) {
  const shape=FORMATIONS[team.formation]??FORMATIONS['4-4-2'],used=new Set(),roleOrder={POR:0,DEF:1,MED:2,DEL:3};
  return players.map(p=>{
    let best=-1,bestScore=Infinity;
    for(let i=0;i<shape.roles.length;i++)if(!used.has(i)) {
      const role=shape.roles[i],score=role===p.position?0:1+Math.abs((roleOrder[role]??0)-(roleOrder[p.position]??0));
      if(score<bestScore){best=i;bestScore=score;}
    }
    if(best<0)return shape.bases[0];used.add(best);return shape.bases[best];
  });
}
export const emptyStats = () => ({matches:0,minutes:0,goals:0,assists:0,shots:0,saves:0,yellow:0,red:0,rating:0});
export function makePlayer(rng, id, rating, position, star = null) {
  const age = star ? (/Yamir|Dué|Yildan/.test(star[0]) ? 19 : /Levandos|Salá|Grizán/.test(star[0]) ? 33 : rng.int(23,28)) : rng.int(18,33);
  const attrs = {};
  for (const key of Object.keys(ATTRIBUTE_NAMES)) attrs[key] = clamp(rating + rng.int(-8,8),20,97);
  if (position !== 'POR') attrs.keeping = rng.int(12,34);
  if (position === 'POR') { attrs.shot = rng.int(22,44); attrs.keeping = rating + rng.int(-2,4); }
  if (position === 'DEL') attrs.defense = clamp(rating-26,25,70);
  if (position === 'DEF') attrs.shot = clamp(rating-20,25,75);
  const name=star?.[0] ?? `${rng.pick(first)} ${rng.pick(last)}`,look=ICONIC_LOOKS[name];
  const p = {id,name,position,age,attributes:attrs,potential:0,fitness:100,morale:75,form:7,injury:0,ban:0,yellows:0,contract:rng.int(2,5),number:0,training:0,stats:emptyStats(),career:emptyStats(),skin:look?.skin??rng.int(0,4),hair:look?.hair??rng.int(0,5),hairstyle:look?.hairstyle??rng.int(0,5),iconic:!!look};
  p.potential = Math.max(overall(p),star?.[3] ?? clamp(overall(p)+(age<24 ? rng.int(4,19) : rng.int(0,4)),35,97));
  return p;
}
export function createTeams(seedNumber) {
  const rng = random(seedNumber); const teams = [];
  for (const c of COUNTRIES) {
    const extra={es:['Castellón Costa','Burgos Catedral','Huesca Pirineos','Tenerife Volcán'],en:['Bristol Robins','Hull Humber','Stoke Potters','Derby Rams'],de:['Fürth Trébol','Paderborn Oeste','Magdeburgo Azul','Braunschweig León'],it:['Cesena Blanco','Modena Canarios','Perugia Umbra','Salerno Granate'],fr:['Amiens Norte','Dijon Borgoña','Clermont Auvernia','Guingamp Bretaña'],pt:['Penafiel Valle','Feirense Azul','Portimão Mar','Viseu Norte'],nl:['Venlo Frontera','Maastricht Mosa','Dordrecht Verde','Helmond Sur']}[c.id];
    const reserveNames=[...c.reserves,...extra];
    const third=Array.from({length:8},(_,i)=>`${c.name} Atlético ${['Norte','Sur','Este','Oeste','Unión','Ciudad','Deportivo','Estrella'][i]}`);
    const all = [...c.clubs, ...reserveNames.map((name,i)=>seed(name, 64+i%5, ['#5380b0','#b74a55','#479273','#c8ac48'][i%4])),...third.map((name,i)=>seed(name,58+i%5,['#814bac','#df743e','#4388ba','#379673'][i%4]))];
    all.forEach((t,i)=>{
      const id = `${c.id}-${i+1}`;
      const team = {id,name:t.name,short:t.name.split(' ').slice(0,2).join(' '),code:t.name.replace(/[^a-zA-Z]/g,'').slice(0,3).toUpperCase(),country:c.id,division:i<c.clubs.length?1:i<c.clubs.length+reserveNames.length?2:3,colors:t.colors,kits:teamKits(id,t.colors),stadium:`Estadio ${t.name.split(' ')[0]}`,capacity:12000+(t.rating-60)*1800,budget:0,formation:'4-4-2',tactic:'balanced',academy:1,trainingLevel:1,roster:[],lineup:[],honours:[],form:[]};
  const roles = ['POR','DEF','DEF','DEF','DEF','MED','MED','MED','MED','DEL','DEL','POR','DEF','MED','DEL','DEF','POR','DEF','DEF','MED','MED','MED','DEL','DEL','DEL'];
      roles.forEach((position,j)=>{
        const star = t.stars.find(s=>s[1]===position && !team.roster.some(p=>p.name===s[0]));
        const p = makePlayer(rng,`${id}-p${j}`,star?.[2] ?? t.rating-rng.int(0,j<5?6:12),position,star);
        p.number = [1,4,5,3,2,6,8,10,7,9,11,13,12,14,15,16][j]; team.roster.push(p);
      });
      team.lineup = team.roster.slice(0,11).map(p=>p.id);team.budget=initialTransferBudget(team);teams.push(team);
    });
  }
  return { teams, rngState:rng.state() };
}
export const teamById = (world,id) => world.teams.find(t=>t.id===id);
export const countryById = id => COUNTRIES.find(c=>c.id===id);
export function activePlayers(team) {
  const limit=clamp(team.matchLimit??11,1,11);
  const available = team.roster.filter(p=>p.injury===0 && p.ban===0);
  const selected = team.lineup.map(id=>available.find(p=>p.id===id)).filter(Boolean);
  const keeper = selected.find(p=>p.position==='POR') ?? available.filter(p=>p.position==='POR').sort((a,b)=>overall(b)-overall(a))[0];
  const field = selected.filter(p=>p.position!=='POR').slice(0,limit-(keeper?1:0));
  for (const p of available.filter(p=>p.position!=='POR').sort((a,b)=>overall(b)-overall(a))) if(field.length<limit-(keeper?1:0)&&!field.includes(p)) field.push(p);
  // Emergency players retain their actual position, no duplication or magical recovery.
  if (!keeper && available.length) return available.slice(0,limit);
  return [keeper,...field].filter(Boolean).sort((a,b)=>({POR:0,DEF:1,MED:2,DEL:3}[a.position]-({POR:0,DEF:1,MED:2,DEL:3}[b.position]))||team.lineup.indexOf(a.id)-team.lineup.indexOf(b.id));
}
export function teamRating(team) {
  const ps = activePlayers(team);
  return ps.length ? Math.round(ps.reduce((s,p)=>s+overall(p)*(.72+.28*p.fitness/100),0)/ps.length) : 25;
}
export function badgeSVG(team, size = 48) {
  const colors=team.colors??['#356d9c','#f1e5bd'],key=parseInt(hash(team.id),16)%6;
  const motif=[
    '<path d="M14 13H50V21H14ZM14 29H50V37H14ZM14 45H50V53H14Z"/>',
    '<path d="M12 48L43 12 53 19 22 55Z"/><circle cx="33" cy="34" r="7" fill="#101335" stroke="currentColor" stroke-width="3"/>',
    '<path d="M14 17L25 12 32 19 39 12 50 17V48L32 59 14 48Z"/><path d="M18 29H46V37H18Z" fill="#101335"/>',
    '<path d="M17 13H24V53H17ZM29 13H36V53H29ZM41 13H48V53H41Z"/>',
    '<path d="M16 18L32 9 48 18V47L32 57 16 47Z"/><path d="M32 16L36 27 48 28 39 36 42 48 32 42 22 48 25 36 16 28 28 27Z" fill="#101335"/>',
    '<path d="M13 19Q32 31 51 19V27Q32 39 13 27ZM13 39Q32 51 51 39V47Q32 59 13 47Z"/>'
  ][key];
  return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 64 72" aria-hidden="true"><path d="M5 5L32 1 59 5V36Q58 56 32 69 6 56 5 36Z" fill="${colors[0]}" stroke="${colors[1]}" stroke-width="3"/><g fill="${colors[1]}" opacity=".9">${motif}</g><path d="M22 55L32 48 42 55 39 62H25Z" fill="#101335" opacity=".88"/><text x="32" y="43" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="900" fill="#fff">${team.code??'SS'}</text></svg>`;
}
export function competitionBadgeSVG(comp,size=48) {
  const palettes=[['#f2c653','#34447c'],['#5fe0d7','#263d83'],['#f38468','#513a93'],['#b8e66b','#28559c'],['#cda5ff','#293d78'],['#f2e8ce','#3e7d91']];
  const key=parseInt(hash(comp.id),16)%palettes.length,[gold,ink]=palettes[key],mark=parseInt(hash(`${comp.id}-mark`),16)%4;
  const symbol=['<path d="M25 20H39V34Q39 42 32 45 25 42 25 34ZM20 22H25V31Q25 36 30 37M39 22H44V31Q44 36 34 37M28 44V49H36V44M24 50H40V54H24Z"/>','<path d="M32 14L36 25 48 26 39 34 42 46 32 40 22 46 25 34 16 26 28 25Z"/>','<circle cx="32" cy="32" r="17"/><path d="M32 17L40 25 37 38 27 44 20 34 23 23Z" fill="none" stroke="currentColor" stroke-width="3"/>','<path d="M18 43Q18 26 32 18 46 26 46 43L32 53Z"/><path d="M24 38L31 31 36 36 42 28" fill="none" stroke="#101335" stroke-width="3"/>'][mark];
  const code=(comp.short??comp.name?.split(/\s+/).map(x=>x[0]).join('').slice(0,3)??'SS').toUpperCase();
  return `<svg class="competition-crest" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3L56 13V32Q54 51 32 61 10 51 8 32V13Z" fill="${ink}" stroke="${gold}" stroke-width="3"/><g fill="${gold}" stroke="${gold}" color="${gold}">${symbol}</g><text x="32" y="57" text-anchor="middle" font-size="7" font-family="sans-serif" font-weight="900" fill="#fff">${code}</text></svg>`;
}
export function kitSVG(team,side='home',size=58) {
  const kit=team.kits?.[side]??teamKits(team.id,team.colors)[side],p=kit.primary,s=kit.secondary,a=kit.accent??s,pattern=kit.pattern??'solid';
  let detail='';
  if(pattern==='halves')detail=`<path d="M32 12H49V44H32Z" fill="${s}"/>`;
  if(pattern==='stripes')detail=`<path d="M17 13H23V44H17ZM30 13H36V44H30ZM43 13H49V44H43Z" fill="${s}"/>`;
  if(pattern==='sash')detail=`<path d="M18 35L41 12 49 18 25 43Z" fill="${s}"/>`;
  if(pattern==='hoops')detail=`<path d="M16 23H50V29H16ZM17 35H49V40H17Z" fill="${s}"/>`;
  if(pattern==='diamonds')detail=`<path d="M23 19L28 24 23 29 18 24ZM40 28L45 33 40 38 35 33Z" fill="${s}"/>`;
  return `<svg class="kit-icon" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${side==='home'?'Primera':'Segunda'} equipación de ${team.name}"><path d="M18 8L25 5Q32 11 39 5L46 8 59 18 51 29 45 25V56H19V25L13 29 5 18Z" fill="${p}"/><path d="M18 8L25 5Q32 11 39 5L46 8 59 18 51 29 45 25V56H19V25L13 29 5 18Z" fill="none" stroke="${a}" stroke-width="2"/>${detail}<path d="M25 6Q32 14 39 6" fill="none" stroke="${a}" stroke-width="3"/><text x="32" y="39" text-anchor="middle" font-size="8" font-weight="900" font-family="Arial" fill="${a}">${team.code??'SS'}</text></svg>`;
}
