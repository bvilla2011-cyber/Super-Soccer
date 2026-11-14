import test from 'node:test';
import assert from 'node:assert/strict';
import {ballonGalaView} from '../src/ui.js';

test('the awards gala presents its actual winner in the gold-ball ceremony art',()=>{
 const player={id:'winner-1',name:'L. Yamir',club:'Barcelona Azulgrana',goals:24,assists:11,titles:2};
 const team={id:'es-2',name:'Barcelona Azulgrana',short:'Barcelona Azulgrana',code:'BAR',colors:['#a82f4e','#29448b'],roster:[{...player,skin:1,hair:2}]};
 const html=ballonGalaView({season:2026,teams:[team],ballonGala:{season:2026,date:'26 de octubre',player,club:{name:team.name,players:26,played:54,wins:36,titles:2}}});
 assert.match(html,/gala-winner-art/);
 assert.match(html,/L\. Yamir/);
 assert.match(html,/GANADOR · TEMPORADA 2026/);
 assert.match(html,/fill="#f7d86d"/);
 assert.match(html,/fill="#20264f"/);
 assert.match(html,/BALÓN DE ORO/);
});
