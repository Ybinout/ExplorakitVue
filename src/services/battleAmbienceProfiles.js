// Coordinates refer to the unmodified source artwork, before object-fit cropping.
const light=(x,y,color='#ffd79a',r=.06)=>({x,y,color,r});
const zone=(x,y,w,h,kind='cloth',amp=1.5)=>({x,y,w,h,kind,amp});
const windows=[[.176,.085,.075,.15],[.747,.085,.075,.15],[.325,.06,.020,.16],[.656,.06,.020,.16]];
export const BATTLE_AMBIENCES=Object.freeze({
 grass:{family:'meadow',particles:'leaf',area:[0,.16,1,.67],zones:[zone(.02,.21,.16,.11,'foliage'),zone(.82,.22,.16,.11,'foliage')],mobileWallScale:.67},
 lake:{family:'water',ripples:[[0,.25,1,.72]],particles:'mist-spark',area:[0,.24,1,.35]},
 'lake-gym':{family:'storm-hall',ripples:[[.03,.47,.20,.36],[.78,.47,.20,.36]],lights:[light(.02,.37,'#8ccbee'),light(.98,.37,'#8ccbee')],particles:'spray',area:[0,.12,1,.25],mobileWallScale:.57},
 'raph-gym':{family:'crimson-hall',lights:[.025,.20,.40,.60,.80,.975].map(x=>light(x,.12)),zones:[.11,.31,.67,.87].map(x=>zone(x,.02,.045,.24)),particles:'dust',area:[0,.20,1,.38],mobileWallScale:.53},
 'hoze-gym':{family:'fractured-hall',lights:[light(.12,.22),light(.88,.22)],particles:'grit',area:[0,.31,1,.35],zones:[zone(.34,.01,.035,.26),zone(.64,.01,.035,.26)],mobileWallScale:.52},
 'ana-gym':{family:'rose-conservatory',particles:'petal',area:[0,.12,1,.64],birds:true,windows:[[.08,.03,.16,.28],[.27,.03,.15,.27],[.58,.03,.15,.27],[.76,.03,.16,.28]],zones:[zone(.005,0,.085,.33,'foliage'),zone(.91,0,.085,.33,'foliage')],mobileWallScale:.55},
 'wanda-gym':{family:'violet-hall',lights:[light(.23,.25,'#edc18a'),light(.43,.25,'#d8b2ed'),light(.57,.25,'#d8b2ed'),light(.77,.25,'#edc18a')],particles:'violet-dust',area:[0,.13,1,.39],zones:[zone(.035,.02,.045,.27),zone(.92,.02,.045,.27)],mobileWallScale:.5},
 '7p-gym':{family:'winter-sanctuary',particles:'snow-window',windows,windowsMobile:[[.200,.07,.092,.085],[.704,.07,.096,.085],[.151,.06,.018,.09],[.832,.06,.019,.09]],zones:[zone(.050,0,.038,.18),zone(.378,0,.036,.22),zone(.586,0,.036,.22),zone(.910,0,.036,.18)],zonesMobile:[zone(.060,0,.045,.118),zone(.371,0,.045,.132),zone(.583,0,.045,.132),zone(.899,0,.045,.118)],lights:[light(.5,.24,'#b6dcff',.10)],mobileWallScale:.55},
 'whitepeak-club':{family:'honour-hall',lights:[.10,.30,.50,.70,.90].map(x=>light(x,.25)),zones:[zone(.34,.01,.05,.20),zone(.63,.01,.05,.20)],particles:'dust',area:[0,.21,1,.40]},
 'double-hall':{family:'snow-gallery',particles:'snow-window',windows:[166,225,286,625,697,774,846,918,1003,1340,1410,1483].map(x=>[x/1672,.026,.025,.12]),lights:[.045,.339,.662,.956].map(x=>light(x,.078)),zones:[zone(.222,0,.063,.18),zone(.713,0,.060,.18)]},
 'super-tournament':{family:'ocean-gallery',lights:[.05,.34,.65,.95].map(x=>light(x,.13,'#fff4c9',.035)),particles:'none'},
 'draft-house':{family:'draft-salon',lights:[light(.08,.12),light(.42,.12),light(.60,.12),light(.96,.12)],zones:[zone(.47,0,.06,.23)],particles:'window-glint',windows:[[.16,.07,.20,.21],[.69,.07,.22,.21]],mobileWallScale:.8},
 colosseum:{family:'sunlit-stadium',particles:'sand',area:[0,.42,1,.48],zones:[zone(.17,.07,.025,.14),zone(.45,.07,.025,.14),zone(.72,.07,.025,.14)],mobileWallScale:.75},
 cave:{family:'crystal-cave',lights:[light(.03,.30,'#a0c9ff'),light(.18,.37,'#a0c9ff'),light(.88,.38,'#a0c9ff'),light(.97,.29,'#a0c9ff')],drips:[.17,.40,.71,.89],particles:'crystal-dust',area:[0,.20,1,.48],mobileWallScale:.65},
 snow:{family:'snowfield',particles:'snow',area:[0,.20,1,.65]},
 'professor-lab':{family:'science-lab',lights:[light(.18,.20,'#8cf6dc',.04),light(.82,.20,'#8cf6dc',.04),light(.035,.17,'#bc8cf8'),light(.965,.17,'#bc8cf8')],screens:[[.11,.17,.12,.06],[.76,.17,.12,.06]],particles:'dust',area:[0,.22,1,.38],mobileWallScale:.48},
 'lucie-house':{family:'abandoned-bedroom',lights:[light(.055,.22,'#f1bb7a',.04)],particles:'dust-shaft',area:[.40,.10,.22,.56],mobileWallScale:.5},
 'gwenn-house':{family:'quiet-bedroom',lights:[light(.91,.25,'#ffce94',.05)],zones:[zone(.46,.04,.04,.24),zone(.64,.04,.04,.24)],particles:'dust',area:[.38,.12,.36,.42],mobileWallScale:.48},
 'void-arena':{family:'ruined-sanctuary',particles:'grit',area:[0,.22,1,.44],lights:[light(.50,.18,'#9b8bb9',.075)],mobileWallScale:.60},
 // The existing purple mist is untouched. Only localized foliage moves here.
 'dark-jungle':{family:'ancient-jungle',particles:'leaf',area:[0,.17,1,.45],zones:[zone(.01,.01,.14,.33,'foliage',2),zone(.83,.01,.16,.32,'foliage',2),zone(.01,.79,.18,.20,'foliage'),zone(.82,.78,.17,.21,'foliage')]},
 'dark-continent2':{family:'lost-continent',particles:'grit',area:[0,.23,1,.40],zones:[zone(.01,.02,.16,.22,'foliage',1.8),zone(.83,.02,.16,.22,'foliage',1.8)],lights:[light(.48,.40,'#bca1cd',.04)]},
 'dark-pyramid':{family:'rift-pyramid',particles:'none',zones:[zone(.01,.01,.16,.20,'foliage',1.8),zone(.83,.01,.16,.20,'foliage',1.8)],lights:[light(.55,.18,'#d49bff',.085),light(.56,.39,'#c590f1',.06)]}
});
export function ambienceProfile(environment,format='wide'){
 const p=BATTLE_AMBIENCES[environment]||BATTLE_AMBIENCES.grass,sy=format==='mobile'?(p.mobileWallScale||1):1;
 return{...p,lights:(p.lights||[]).map(l=>({...l,y:l.y*sy})),zones:format==='mobile'&&p.zonesMobile?p.zonesMobile:(p.zones||[]).map(z=>({...z,y:z.y*sy,h:z.h*sy})),windows:format==='mobile'&&p.windowsMobile?p.windowsMobile:(p.windows||[]).map(([x,y,w,h])=>[x,y*sy,w,h*sy]),screens:(p.screens||[]).map(([x,y,w,h])=>[x,y*sy,w,h*sy])};
}
