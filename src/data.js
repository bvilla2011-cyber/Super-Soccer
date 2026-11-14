import { clamp, random, hash } from './utils.js';

// Un universo ficticio. Los nombres, escudos, camisetas y valoraciones son propios.
const seed = (name, rating, color, accent = '#f3f0df', stars = []) => ({ name, rating, colors: [color, accent], stars });
export const COUNTRIES = [
  { id: 'es', name: 'España', flag: 'ES', league: 'Liga del Sol', cup: 'Copa de la Corona', second: 'Liga del Sol · Ascenso',
    clubs: [
      seed('Madrid Blanco',89,'#ece9de','#d2ac54',[['K. Mbapé','DEL',91,94],['V. Junius','DEL',90,94],['J. Belingam','MED',90,95]]),
      seed('Barcelona Azulgrana',88,'#a82f4e','#29448b',[['L. Yamir','DEL',88,97],['P. Pedrián','MED',88,94],['R. Levandos','DEL',87,87]]),
      seed('Atlético Capital',85,'#dc3349','#eee8da',[['J. Álvarez','DEL',86,92],['A. Grizán','DEL',85,85]]),
      seed('Bilbao Leones',81,'#cb3143'),seed('Villarreal Amarillo',80,'#e7ce34','#173864'),seed('Betis del Sur',80,'#268e67'),seed('San Sebastián Real',80,'#2872ad'),seed('Sevilla Nervión',77,'#dfded6','#b23749'),seed('Valencia Turia',77,'#ece7db','#26272a'),seed('Vigo Celeste',77,'#74c4df'),seed('Girona Roig',77,'#e14650'),seed('Osasuna Navarra',76,'#bd3347','#223859'),seed('Mallorca Isla',75,'#ca3042'),seed('Getafe Azul',75,'#2a63b3'),seed('Espanyol Cornellà',75,'#3484bd'),seed('Rayo Valle',75,'#f0e9dc','#c73344'),seed('Alavés Vitoria',74,'#3c65bc'),seed('Levante Mar',73,'#862f4c','#31568e'),seed('Elche Palmeras',73,'#e7e9dc','#35925f'),seed('Oviedo Azul',73,'#2469b6')
    ], reserves: ['Zaragoza Ebro','Santander Racing','Málaga Costa','Cádiz Bahía','Granada Nazarí','Almería Desierto','Deportivo Atlántico','Sporting Asturias'] },
  { id: 'en', name: 'Inglaterra', flag: 'EN', league: 'Crown Premier', cup: 'Copa de las Islas', second: 'Crown Championship',
    clubs: [seed('Manchester Celeste',89,'#75bce0','#eef0dc',[['E. Haland','DEL',93,96],['P. Fodené','MED',87,92]]),seed('Liverpool Mersey',88,'#d73548','#f1e7d2',[['M. Salá','DEL',90,90],['F. Virtz','MED',88,94]]),seed('Arsenal North',88,'#d73549','#e9e4d8',[['B. Sakán','DEL',88,94],['M. Odegard','MED',88,92]]),seed('Chelsea Bridge',85,'#3158be','#f0e9d9',[['C. Palmier','MED',87,93]]),seed('Newcastle Tyne',83,'#252e36','#dcdeda'),seed('Manchester Rojo',83,'#d63d45','#e9dacc',[['B. Fernán','MED',86,86]]),seed('Tottenham Lily',83,'#e9eadf','#22334f'),seed('Aston Birmingham',82,'#743d55','#7dbad0'),seed('Brighton Gulls',80,'#3265b4'),seed('Nottingham Forestal',79,'#c83442'),seed('Bournemouth Coast',78,'#b93145','#263039'),seed('Crystal South',78,'#3456a8','#c93f4d'),seed('Brentford Bees',78,'#ca3c47'),seed('Everton Dock',77,'#3152aa'),seed('Fulham River',77,'#e2e5d9','#263039'),seed('West Ham Irons',78,'#75334e','#84bad1'),seed('Wolverhampton Gold',77,'#e6aa38','#222c35'),seed('Leeds White',76,'#e5e9df','#e1c646'),seed('Burnley Clarets',75,'#823852','#79bbd5'),seed('Sunderland Wear',75,'#d74850')], reserves:['Leicester Foxes','Southampton Saints','Ipswich Blue','Coventry Sky','Middlesbrough Red','Norwich Canaries','Watford Hornets','Sheffield Steel'] },
  { id: 'de', name: 'Alemania', flag: 'DE', league: 'Meister Liga', cup: 'Copa de los Estados', second: 'Meister 2',
    clubs:[seed('Bayern Múnich Rojo',89,'#d53d49','#e6e9e4',[['H. Kain','DEL',92,92],['J. Musial','MED',89,96]]),seed('Leverkusen Fábrica',85,'#d83646','#252b32',[['A. Grimado','DEF',84,88]]),seed('Dortmund Abejas',85,'#e6cf34','#293138'),seed('Leipzig Toros',83,'#e9e7db','#d3424b'),seed('Frankfurt Águilas',82,'#202c35','#d4404a'),seed('Stuttgart Neckar',81,'#f0e5da','#c43443'),seed('Freiburg Bosque',79,'#c83144'),seed('Mainz Rin',78,'#c93549'),seed('Bremen Verdes',78,'#378d68'),seed('Gladbach Potros',78,'#e6e9de','#3c8b68'),seed('Wolfsburg Lobos',78,'#7fbf4b'),seed('Hoffenheim Azul',77,'#4278bc'),seed('Augsburg Fugger',76,'#e9e3d8','#c53346'),seed('Union Berlín Este',77,'#ce3742'),seed('Hamburgo Puerto',75,'#e9e7df','#2c66a5'),seed('Colonia Cabras',75,'#d84150'),seed('St. Pauli Barrio',74,'#785a48'),seed('Heidenheim Colina',74,'#3755a2','#c23a46')], reserves:['Schalke Mineros','Hannover Norte','Hertha Capital','Düsseldorf Fortuna','Karlsruhe Baden','Kaiserslautern Diablos','Núremberg Burgo','Darmstadt Lirios'] },
  { id:'it',name:'Italia',flag:'IT',league:'Calcio Elite',cup:'Coppa delle Città',second:'Calcio Ascenso',
    clubs:[seed('Milano Nerazzurro',88,'#2859a6','#263139',[['L. Martino','DEL',89,92],['N. Barel','MED',87,90]]),seed('Napoli Vesuvio',85,'#57b5d1'),seed('Torino Juventa',85,'#e1e4db','#273039',[['K. Yildan','MED',83,93]]),seed('Milano Rossonero',84,'#c43643','#26313a',[['R. Leaoz','DEL',86,91]]),seed('Bergamo Dea',83,'#365ca2','#252d33'),seed('Roma Capitolio',82,'#873a3e','#d8ae4c',[['P. Dybalo','MED',85,85]]),seed('Lazio Aquila',81,'#8ac3dc'),seed('Fiorentina Viola',81,'#7552ac'),seed('Bologna Portici',80,'#ae3348','#314f7e'),seed('Como Lago',78,'#3164b0'),seed('Torino Granata',78,'#803848'),seed('Udine Friuli',77,'#e8e8dc','#252e34'),seed('Génova Grifón',77,'#b93444','#294b7c'),seed('Sassuolo Verde',76,'#36965e','#23313a'),seed('Parma Ducale',76,'#ecd45a','#385daf'),seed('Cagliari Isla',75,'#a82f43','#34557f'),seed('Verona Scala',75,'#365da4','#e1be43'),seed('Lecce Salento',74,'#e0be42','#c73543'),seed('Pisa Torre',74,'#3361a2','#26323a'),seed('Cremona Violín',73,'#bb3b49','#bcc4c6')], reserves:['Palermo Rosa','Samp Génova','Venecia Laguna','Empoli Toscana','Monza Corona','Bari Gallo','Spezia Golfo','Frosinone León'] },
  { id:'fr',name:'Francia',flag:'FR',league:'Ligue Lumière',cup:'Coupe du Lys',second:'Lumière 2',
    clubs:[seed('Paris Saint-Lumière',89,'#294477','#ca3b4c',[['O. Dembéléo','DEL',90,91],['D. Dué','MED',84,95],['A. Hakim','DEF',88,91]]),seed('Marsella Vieux Port',83,'#6ebbd6'),seed('Mónaco Principado',82,'#e5e5d9','#ce3c45'),seed('Lille Dogues',81,'#bb3246'),seed('Lyon Ródano',81,'#e9e4d7','#3d69a9'),seed('Niza Riviera',80,'#c13646','#27313b'),seed('Estrasburgo Alsace',79,'#3674b7'),seed('Lens Sang et Or',79,'#d9b43c','#b93448'),seed('Rennes Bretaña',78,'#c93648','#29333b'),seed('Toulouse Violeta',77,'#8466b5'),seed('Brest Armor',77,'#c73747'),seed('Auxerre Borgoña',76,'#e4e7dd','#3f67a8'),seed('Nantes Canarios',76,'#d6c545','#3e9568'),seed('Le Havre Océano',74,'#5d9ac7','#2e4570'),seed('Angers Anjou',74,'#e7e6db','#2a353c'),seed('Metz Lorena',74,'#873c51'),seed('Lorient Merlus',74,'#dd853d'),seed('Paris Rive',75,'#304978')], reserves:['Saint-Étienne Verde','Reims Champaña','Montpellier Hérault','Caen Normandía','Bastia Córcega','Troyes Aube','Grenoble Alpes','Nancy Cardos'] },
  { id:'pt',name:'Portugal',flag:'PT',league:'Liga Atlântica',cup:'Taça dos Navegantes',second:'Atlântica 2',
    clubs:[seed('Lisboa Leones',85,'#409b6b','#e6e9dc',[['P. Gonçal','MED',84,89]]),seed('Benfica Águilas',85,'#cb3541','#e5e4d8'),seed('Porto Dragones',84,'#3472b7','#e3e8e1'),seed('Braga Minho',80,'#c8374c'),seed('Guimarães Castillo',77,'#eee8da','#2c3338'),seed('Famalicão Ave',75,'#396bb1'),seed('Santa Clara Azores',74,'#cc3e4c'),seed('Moreira Cónegos',73,'#4a9865'),seed('Estoril Costa',73,'#e3c948','#4174ab'),seed('Rio Ave Vila',74,'#3f956c'),seed('Arouca Montaña',73,'#dbbb47','#315881'),seed('Gil Barcelos',73,'#bb354b'),seed('Nacional Madeira',72,'#e7e5d9','#2c353d'),seed('Casa Lisboa',72,'#e7e8de','#2b343d'),seed('Estrela Amadora',72,'#b63d4f','#4b925e'),seed('Alverca Ribatejo',71,'#b33b4c','#395c85'),seed('Tondela Beira',71,'#cbbf45','#3c8d6d'),seed('AVS Norte',71,'#c33b49')], reserves:['Boavista Ajedrez','Farense Algarve','Vizela Azul','Chaves Termas','Marítimo Isla','Académica Coimbra','Leixões Mar','Paços Castores'] },
  { id:'nl',name:'Países Bajos',flag:'NL',league:'Ere Liga',cup:'Beker de Oranje',second:'Ere Ascenso',
    clubs:[seed('Eindhoven Philips',85,'#d3474e','#eee7dc'),seed('Ámsterdam Ajaxia',83,'#d23f4b','#eee9df'),seed('Róterdam Feyen',83,'#e7e6db','#ca3a46'),seed('Alkmaar AZeta',79,'#c6384b'),seed('Twente Enschede',79,'#ca3848'),seed('Utrecht Catedral',77,'#cb3b4c'),seed('Go Ahead Deventer',75,'#d9b33b','#c43745'),seed('Heerenveen Frisia',74,'#4c7fba'),seed('Groningen Norte',74,'#3b9a71'),seed('Nijmegen NECa',74,'#bb3d4d','#399264'),seed('Sparta Róterdam',74,'#ce3d49'),seed('Fortuna Sittard',73,'#d7bc44','#478e65'),seed('Zwolle Azul',73,'#3879b8'),seed('Heracles Almelo',73,'#e3e7df','#2b333a'),seed('Excelsior Puerto',72,'#24323b','#bd384c'),seed('Volendam Naranja',71,'#d8873c'),seed('Breda NACa',72,'#e0c13b','#27343a'),seed('Telstar Blanco',71,'#e5e9df','#436fa4')], reserves:['Willem Tilburg','RKC Waalwijk','Almere Ciudad','Den Haag Dunas','Cambuur Leeuwarden','Roda Kerkrade','Emmen Drenthe','Vitesse Arnhem'] }
];

export const POSITIONS = ['POR','DEF','MED','DEL'];
export const FORMATIONS = {
  '2-1-1': { name:'Equilibrado · 2-1-1', bases:[[.06,.5],[.29,.27],[.29,.73],[.52,.5],[.74,.5]], attack:0, defense:0 },
  '1-2-1': { name:'Posesión · 1-2-1', bases:[[.06,.5],[.29,.5],[.52,.25],[.52,.75],[.76,.5]], attack:2, defense:-1 },
  '1-1-2': { name:'Ofensivo · 1-1-2', bases:[[.06,.5],[.28,.5],[.5,.5],[.73,.28],[.73,.72]], attack:5, defense:-4 },
  '4-4-2': { name:'Bloque 4-4-2 · adaptado a 5', bases:[[.06,.5],[.31,.3],[.31,.7],[.6,.28],[.69,.69]], attack:1, defense:1 },
  '3-5-2': { name:'Presión 3-5-2 · adaptado a 5', bases:[[.06,.5],[.27,.5],[.49,.25],[.49,.75],[.76,.5]], attack:3, defense:-2 }
};
// Devuelve una posición de campo por jugador activo. La primera coordenada
// es la del portero; si faltan jugadores, conservamos el orden de la forma.
export function formationCoordinates(team, players = activePlayers(team)) {
  const bases = (FORMATIONS[team.formation] ?? FORMATIONS['2-1-1']).bases;
  return players.map((_, index) => [...(bases[index] ?? bases[bases.length - 1])]);
}
export const DIFFICULTIES = {
  rookie:{name:'Debutante',reaction:.65,accuracy:.78,speed:.92,bonus:5},
  club:{name:'Profesional',reaction:.32,accuracy:.91,speed:1,bonus:0},
  legend:{name:'Leyenda',reaction:.16,accuracy:.98,speed:1.05,bonus:-4}
};
const first = ['Álex','Dani','Leo','Marco','Adri','Nico','Bruno','Hugo','Luca','Thiago','Oliver','Lucas','Noah','Enzo','Sami','Mateo','Tom','Amir','Iker','Joel','Alan','Max','Rui','Milan','Jules','Rayan','Karim','Iván','Jan','Finn','Otto','Elias','Yuri','Óscar','Adam','Sergi','Gael','Luis','Diego','Pablo'];
const last = ['Silva','Ferrán','Costa','Navarro','Moretti','Bauer','Rossi','Martin','Soler','Dubois','Meijer','Santos','Vidal','Torres','Klein','Romano','Walker','Lefèvre','Duarte','Salas','Vega','Neri','Dias','Meyer','Vermeer','Blanco','Brooks','Mendes','Roca','García','Nolan','Lopes','Rivas','King','Almeida','Peeters','Serrano','Laurent','Fontana','Castro'];
export const ATTRIBUTE_NAMES = { pace:'Ritmo',shot:'Disparo',pass:'Pase',defense:'Defensa',control:'Control',stamina:'Resistencia',keeping:'Portería' };
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
const REFERENCE_MODEL_AVERAGES={1:15_000_000,2:1_250_000,3:380_000};
export const ECONOMY_VERSION=4;
export function playerValue(p,team=null,marketAverages=MARKET_REFERENCE_AVERAGES,growth=1.205) {
  const value=overall(p),ageFactor=p.age<23?1.45:p.age>30?.62:1;
  const potentialFactor=1+Math.max(0,p.potential-value)/22;
  const marketAverage=marketAverages[team?.country]?.[team?.division-1];
  const context=marketAverage?Math.sqrt(marketAverage/REFERENCE_MODEL_AVERAGES[team.division]):1;
  const estimate=100_000*(growth**(value-50))*ageFactor*potentialFactor*context;
  return Math.round(clamp(estimate,10_000,220_000_000)/10_000)*10_000;
}
export function teamMarketValue(team,marketAverages=MARKET_REFERENCE_AVERAGES,growth=1.205) {
  return team.roster.reduce((sum,p)=>sum+playerValue(p,team,marketAverages,growth),0);
}
export function initialTransferBudget(team,marketAverages=MARKET_REFERENCE_AVERAGES,growth=1.205) {
  const limits={1:[5_000_000,180_000_000],2:[500_000,35_000_000],3:[100_000,8_000_000]}[team.division]??[100_000,8_000_000];
  return Math.round(clamp(teamMarketValue(team,marketAverages,growth)*.12,...limits)/100_000)*100_000;
}
export const wage = (p,team=null) => Math.round(playerValue(p,team) / 4800 / 100) * 100 + 200;
export const emptyStats = () => ({matches:0,minutes:0,goals:0,assists:0,shots:0,saves:0,yellow:0,red:0,rating:0});
export function makePlayer(rng, id, rating, position, star = null) {
  const age = star ? (/Yamir|Dué|Yildan/.test(star[0]) ? 19 : /Levandos|Salá|Grizán/.test(star[0]) ? 33 : rng.int(23,28)) : rng.int(18,33);
  const attrs = {};
  for (const key of Object.keys(ATTRIBUTE_NAMES)) attrs[key] = clamp(rating + rng.int(-8,8),20,97);
  if (position !== 'POR') attrs.keeping = rng.int(12,34);
  if (position === 'POR') { attrs.shot = rng.int(22,44); attrs.keeping = rating + rng.int(-2,4); }
  if (position === 'DEL') attrs.defense = clamp(rating-26,25,70);
  if (position === 'DEF') attrs.shot = clamp(rating-20,25,75);
  const p = {id,name:star?.[0] ?? `${rng.pick(first)} ${rng.pick(last)}`,position,age,attributes:attrs,potential:0,fitness:100,morale:75,form:7,injury:0,ban:0,yellows:0,contract:rng.int(2,5),number:0,training:0,stats:emptyStats(),career:emptyStats(),skin:rng.int(0,4),hair:rng.int(0,5)};
  p.potential = Math.max(overall(p),star?.[3] ?? clamp(overall(p)+(age<24 ? rng.int(4,19) : rng.int(0,4)),35,97));
  return p;
}
export function createTeams(seedNumber) {
  const rng = random(seedNumber); const teams = [];
  for (const c of COUNTRIES) {
    const extra={es:['Castellón Costa','Burgos Catedral','Huesca Pirineos','Tenerife Volcán'],en:['Bristol Robins','Hull Humber','Stoke Potters','Derby Rams'],de:['Fürth Trébol','Paderborn Oeste','Magdeburgo Azul','Braunschweig León'],it:['Cesena Blanco','Modena Canarios','Perugia Umbra','Salerno Granate'],fr:['Amiens Norte','Dijon Borgoña','Clermont Auvernia','Guingamp Bretaña'],pt:['Penafiel Valle','Feirense Azul','Portimão Mar','Viseu Norte'],nl:['Venlo Frontera','Maastricht Mosa','Dordrecht Verde','Helmond Sur']}[c.id];
    const secondAdditions={es:['Cartagena Puerto','Córdoba Califal','Eibar Armero','Albacete Llanos'],en:['Blackburn Rovers','Portsmouth Harbour','Oxford Scholars','Preston North'],de:['Kiel Förde','Bochum Berg','Dresden Elbe','Ulm Catedral'],it:['Brescia Leonessa','Cittadella Veneto','Pescara Adriatico','Reggiana Granata'],fr:['Dunkerque Mar','Laval Tango','Pau Béarn','Annecy Alpes'],pt:['Leiria Pinhal','Torreense Oeste','Oliveira Azemeis','Covilhã Serra'],nl:['Den Bosch Brabante','Oss Rojos','Doetinchem Graaf','Velsen Costa']}[c.id];
    const reserveNames=[...c.reserves,...extra];
    const third=Array.from({length:8},(_,i)=>`${c.name} Atlético ${['Norte','Sur','Este','Oeste','Unión','Ciudad','Deportivo','Estrella'][i]}`);
    const all=[...c.clubs,...reserveNames.map((name,i)=>seed(name,64+i%5,['#5380b0','#b74a55','#479273','#c8ac48'][i%4])),...third.map((name,i)=>seed(name,58+i%5,['#814bac','#df743e','#4388ba','#379673'][i%4])),...secondAdditions.map((name,i)=>seed(name,64+i%5,['#5380b0','#b74a55','#479273','#c8ac48'][i%4]))];
    all.forEach((t,i)=>{
      const id = `${c.id}-${i+1}`;
      const originalTeams=c.clubs.length+reserveNames.length+third.length;
      const division=i<c.clubs.length?1:i<c.clubs.length+reserveNames.length?2:i<originalTeams?3:2;
      const team = {id,name:t.name,short:t.name.split(' ').slice(0,2).join(' '),code:t.name.replace(/[^a-zA-Z]/g,'').slice(0,3).toUpperCase(),country:c.id,division,colors:t.colors,stadium:`Estadio ${t.name.split(' ')[0]}`,capacity:12000+(t.rating-60)*1800,budget:0,formation:'2-1-1',tactic:'balanced',academy:1,trainingLevel:1,happiness:65,roster:[],academyPlayers:[],lineup:[],honours:[],form:[]};
      const roles = ['POR','DEF','DEF','MED','DEL','POR','DEF','MED','MED','DEL','DEL','DEF'];
      roles.forEach((position,j)=>{
        const star = t.stars.find(s=>s[1]===position && !team.roster.some(p=>p.name===s[0]));
        const p = makePlayer(rng,`${id}-p${j}`,star?.[2] ?? t.rating-rng.int(0,j<5?6:12),position,star);
        p.number = [1,4,5,8,9,13,3,6,10,11,7,2][j]; team.roster.push(p);
      });
      team.lineup = team.roster.slice(0,5).map(p=>p.id);team.budget=initialTransferBudget(team);teams.push(team);
    });
  }
  return { teams, rngState:rng.state() };
}
export const teamById = (world,id) => world.teams.find(t=>t.id===id);
export const countryById = id => COUNTRIES.find(c=>c.id===id);
export function activePlayers(team) {
  const limit=clamp(team.matchLimit??5,1,5);
  const available = team.roster.filter(p=>p.injury===0 && p.ban===0);
  const selected = team.lineup.map(id=>available.find(p=>p.id===id)).filter(Boolean);
  const keeper = selected.find(p=>p.position==='POR') ?? available.filter(p=>p.position==='POR').sort((a,b)=>overall(b)-overall(a))[0];
  const field = selected.filter(p=>p.position!=='POR').slice(0,limit-(keeper?1:0));
  for (const p of available.filter(p=>p.position!=='POR').sort((a,b)=>overall(b)-overall(a))) if(field.length<limit-(keeper?1:0)&&!field.includes(p)) field.push(p);
  // Emergency players retain their actual position, no duplication or magical recovery.
  if (!keeper && available.length) return available.slice(0,limit);
  return [keeper,...field].filter(Boolean);
}
export function teamRating(team) {
  const ps = activePlayers(team);
  const squadRating=ps.length?ps.reduce((s,p)=>s+overall(p)*(.72+.28*p.fitness/100)*(.92+.08*(p.morale??65)/100),0)/5:25;
  const teamMood=1+((team.happiness??65)-65)*.0018;
  return Math.round(squadRating*teamMood);
}
export function badgeSVG(team, size = 48) {
  const key = parseInt(hash(team.id),16)%3;
  return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 64 72" aria-hidden="true"><path d="M5 5L32 1 59 5V36Q58 56 32 69 6 56 5 36Z" fill="${team.colors[0]}" stroke="${team.colors[1]}" stroke-width="3"/><path d="${key===0?'M12 15H52V23H12ZM12 31H52V39H12Z':key===1?'M18 9H27V54L18 46ZM37 9H46V46L37 54Z':'M9 39L48 7 56 19 19 54Z'}" fill="${team.colors[1]}" opacity=".85"/><circle cx="32" cy="30" r="12" fill="#102329"/><text x="32" y="34" text-anchor="middle" font-size="10" font-family="sans-serif" font-weight="900" fill="#fff">${team.code}</text><path d="M25 51L32 46 39 51 36 59H28Z" fill="${team.colors[1]}"/></svg>`;
}


