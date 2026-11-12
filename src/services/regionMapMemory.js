import {clampMapZoom} from './regionMapViewport';
const VERSION=1;
function key(scope){let id='local';try{id=JSON.parse(localStorage.getItem('explorakit.user'))?.id||id;}catch{/* Anonymous or unavailable local preferences. */}return `riftmon.map-view.${id}.${scope}`;}
export function savedMapView(scope='world'){
 try{const v=JSON.parse(localStorage.getItem(key(scope)));if(v?.version!==VERSION||![v.zoom,v.x,v.y].every(Number.isFinite)||v.x<0||v.x>1||v.y<0||v.y>1)return null;return{...v,zoom:clampMapZoom(v.zoom)};}catch{return null;}
}
export function rememberMapView(scope,view){try{localStorage.setItem(key(scope),JSON.stringify({version:VERSION,...view}));}catch{/* Private browsing or a full preference store must not block navigation. */}}
export function regionBounds(atlas,kind){
 const tests={main:id=>!/^(?:safari\d+|jungle\d+|DC2_|ile2_|super_tournament)/.test(id),tower:id=>id.startsWith('super_tournament'),safari:id=>/^safari\d+$/.test(id),island:id=>/^jungle\d+$/.test(id),magic:id=>/^ile2_/.test(id),continent:id=>/^DC2_/.test(id)};
 const nodes=(atlas?.nodes||[]).filter(n=>tests[kind]?.(n.id));if(!nodes.length)return null;const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);return{x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2,w:Math.max(80,Math.max(...xs)-Math.min(...xs)+70),h:Math.max(80,Math.max(...ys)-Math.min(...ys)+70)};
}
