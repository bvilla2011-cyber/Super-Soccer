// Original, local SVG art. Every navigation icon and portrait shares the same ink outline.
const paths={
 mail:'<rect x="6" y="13" width="52" height="39" rx="5"/><path d="m8 17 24 19 24-19M8 48l17-15m31 15L39 33"/>',
 ball:'<circle cx="32" cy="32" r="23"/><path d="m32 20 11 8-4 13H25l-4-13zm0-11v11M10 25l11 3m-5 22 9-9m23 9-9-9m15-16-11 3"/>',
 home:'<path d="M8 29 32 8l24 21-5 5-5-4v24H18V30l-5 4z"/><path d="M27 54V38h11v16M28 24h9"/>',
 squad:'<path d="m18 13 10-5h8l10 5 12 14-11 8-5-5v26H22V30l-5 5-11-8z"/><path d="M26 10q6 12 12 0M28 26h9l-7 17"/>',
 market:'<path d="M9 23h40l-10-10m16 28H15l10 10"/><path d="m48 13 10 10-10 10M16 51 6 41l10-10"/>',
 competitions:'<path d="M21 9h22v18q0 13-11 16-11-3-11-16zm0 6H10v11q0 9 13 9m20-20h11v11q0 9-13 9M32 43v10M22 55h20"/><path d="m32 17 3 5 5 1-4 4 1 5-5-3-5 3 1-5-4-4 5-1z"/>',
 honours:'<path d="m32 5 8 17 19 2-14 13 4 19-17-10-17 10 4-19L5 24l19-2z"/><path d="M26 25h12l-8 13"/>',
 calendar:'<rect x="9" y="14" width="46" height="42" rx="5"/><path d="M20 8v13M44 8v13M9 28h46M19 37h7m12 0h7m-26 9h7m12 0h7"/>',
 club:'<path d="M8 25q24-16 48 0v25q-24 13-48 0z"/><path d="M8 25q24 15 48 0M17 31v17m30-17v17M26 36h12v16H26zM16 19V8m32 11V8M11 8h10m22 0h10"/>',
 saves:'<path d="M10 9h38l8 8v38H10z"/><path d="M20 9v17h24V9M20 55V36h25v19M35 13v9"/>',
 settings:'<path d="m27 7-2 8-7 4-8-1-5 9 6 6v8l-3 6 9 6 7-4 8 1 6 5 10-5-1-8 5-7 7-3-1-11-8-2-5-6 1-8-10-4-6 6z"/><circle cx="32" cy="31" r="10"/>',
 coin:'<ellipse cx="32" cy="34" rx="22" ry="24"/><ellipse cx="32" cy="30" rx="22" ry="24"/><path d="M37 18H27v10h10v12H25M32 14v31"/>',
 play:'<path d="M21 10v44l33-22z"/>',
 pause:'<path d="M18 12h10v40H18zm20 0h10v40H38z"/>',
 arrow:'<path d="M8 32h45M36 14l18 18-18 18"/>',
 back:'<path d="M55 32H10m17-18L9 32l18 18"/>',
 sound:'<path d="M8 24h11l15-12v40L19 40H8zM43 22q13 10 0 20m7-29q25 19 0 38"/>',
 full:'<path d="M23 9H9v14m32-14h14v14M9 41v14h14m32-14v14H41"/>',
 bolt:'<path d="m37 4-24 32h16l-4 24 26-35H35z"/>',
 heart:'<path d="M32 54 9 32C-6 10 22-3 32 18 42-3 70 10 55 32z"/>',
 boot:'<path d="M11 10h21v22l18 8 8 1v13H7V34zm5 45v5m14-5v5m15-5v5m-8-27-5 8m12-3-5 7M12 24h20"/>',
 whistle:'<path d="m48 15 12 8-16 14a20 20 0 1 1-17-22z"/><circle cx="25" cy="35" r="9"/><path d="m14 16-5-9M8 27H1M36 7l3-6"/>',
 academy:'<path d="m32 8 27 13-27 14L5 21zM15 28v15q17 15 34 0V28M57 23v23"/><path d="m26 42 6 5 8-7"/>',
 training:'<path d="M7 22h9v24H7zm9-8h9v40h-9zm23 0h9v40h-9zm9 8h9v24h-9zM25 34h14"/>',
 cup:'<path d="M21 9h22v18q0 13-11 16-11-3-11-16zm0 6H10v11q0 9 13 9m20-20h11v11q0 9-13 9M32 43v10M22 55h20"/>',
 lock:'<rect x="14" y="27" width="36" height="29" rx="4"/><path d="M22 27V16a10 10 0 0 1 20 0v11m-10 10v9"/>',
 help:'<circle cx="32" cy="32" r="25"/><path d="M24 23q2-10 12-7c12 4 4 15-3 18v6m0 8h.1"/>'
};
export function icon(name,cls='') {return `<svg class="game-icon ${cls}" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${paths[name]??paths.ball}</svg>`;}
export function portrait(p,team=null){
 const skins=['#ffcd9a','#e7a76d','#b97545','#8b512f','#603726'],hairs=['#292130','#63412c','#d3a63e','#141c34','#9a4931','#b9c5ce'];
 const skin=skins[(p.skin??0)%5],hair=hairs[(p.hair??0)%6],shirt=team?.colors?.[0]??'#7252f5',trim=team?.colors?.[1]??'#8fffea';
 const style=(p.hair??0)%3;
 return `<svg class="player-portrait" viewBox="0 0 200 220" aria-hidden="true"><path d="m20 220 9-58q4-23 45-29h52q41 6 45 29l9 58" fill="${shirt}" stroke="#171837" stroke-width="5"/><path d="m75 131-2 16 27 24 28-24-4-16" fill="${skin}" stroke="#171837" stroke-width="5"/><path d="m47 152-10 68h22l8-76m87 8 10 68h-22l-9-76" fill="${trim}" opacity=".8"/><path d="m75 139 25 20 26-20 8 10-34 26-34-26z" fill="${trim}" stroke="#171837" stroke-width="4"/><path d="M58 81q-15-13-14 7 1 18 15 15m83-22q15-13 14 7-1 18-15 15" fill="${skin}" stroke="#171837" stroke-width="4"/><path d="M56 62q0-41 44-42 44 1 44 42l-6 46q-5 24-38 33-33-9-38-33z" fill="${skin}" stroke="#171837" stroke-width="5"/><path d="m105 40 26 14 4 45-15 26-20 9 23-5 15-21 6-46-6-23z" fill="#4c2532" opacity=".18"/><path d="${style===0?'M54 78 47 53 57 28 86 15 117 18 145 40 147 77 134 62 126 39 81 51 67 43 65 72Z':style===1?'M53 72 48 46 62 21 96 13 125 20 146 43 146 75 132 56 131 42 72 42 66 65Z':'M55 76 44 48 61 27 87 19 111 10 132 25 149 48 142 79 130 58 126 39 111 42 98 32 80 45 68 42 65 69Z'}" fill="${hair}" stroke="#171837" stroke-width="5"/><path d="m69 77 15-3m31 0 15 3" stroke="#322138" stroke-width="5" stroke-linecap="round"/><ellipse cx="79" cy="85" rx="3" ry="4" fill="#171837"/><ellipse cx="121" cy="85" rx="3" ry="4" fill="#171837"/><path d="m100 84-4 16 8 1m-17 13q13 9 26 0" fill="none" stroke="#743d36" stroke-width="3.5" stroke-linecap="round"/>${p.age>29?'<path d="m65 108 14 11 21 9 21-9 14-11-7 21-28 14-28-14Z" fill="'+hair+'" opacity=".6"/>':''}<path d="m33 170 16-8m103 0 15 8" stroke="#fff" stroke-width="4" opacity=".35"/><text x="100" y="210" text-anchor="middle" font-family="Arial" font-weight="900" font-size="32" fill="${trim}" stroke="#171837" stroke-width="1">${p.number??''}</text></svg>`;
}
export function stadiumArt(){return `<svg class="stadium-emblem" viewBox="0 0 300 220" aria-hidden="true"><path d="m14 120 133-76 140 79v43l-139 53L14 163z" fill="#242447" stroke="#0b1331" stroke-width="7"/><path d="m14 120 133-76 140 79-139 73z" fill="#8765d5" stroke="#141534" stroke-width="6"/><path d="m39 120 108-60 115 64-114 59z" fill="#1c2854" stroke="#b594f2" stroke-width="5"/><path d="m66 121 82-44 88 48-88 44z" fill="#25a790" stroke="#94ff9d" stroke-width="3"/><path d="m108 98 83 47m-41-32 24 13-24 12-23-13z" fill="none" stroke="#b5ffb2" stroke-width="2"/><path d="M32 116V43m228 80V50M115 184V104" stroke="#526dba" stroke-width="6"/><path d="m17 43 31-15v15L17 58zm228 6 31-15v15l-31 15zm-145 54 31-15v15l-31 15z" fill="#f9ec8b" stroke="#192344" stroke-width="3"/><path d="m18 148 131 71 134-62" fill="none" stroke="#fa9b6e" stroke-width="6"/></svg>`;}
