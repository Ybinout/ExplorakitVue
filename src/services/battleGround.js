export function portraitGround(node,stage,metricsFor=()=>null){
 const image=node?.querySelector('img:not(.sprite-tint-layer)'),r=stage?.getBoundingClientRect();if(!image||!r)return null;
 const b=image.getBoundingClientRect(),metrics=metricsFor(image.currentSrc||image.src);
 const [l,t,rr,bb]=metrics?.bounds||[0,0,image.naturalWidth||1,image.naturalHeight||1],[w,h]=metrics?.size||[image.naturalWidth||1,image.naturalHeight||1];
 return{centerX:b.left-r.left+(l+rr)/w*b.width/2,centerY:b.top-r.top+(t+bb)/h*b.height/2,bottomY:b.top-r.top+bb/h*b.height,width:(rr-l)/w*b.width,height:(bb-t)/h*b.height};
}
export function groundStyle(g){
 if(!g||![g.centerX,g.bottomY,g.width].every(Number.isFinite))return {display:'none'};
 return{left:g.centerX+'px',top:(g.bottomY+3)+'px',width:Math.max(130,Math.min(500,g.width*1.7))+'px',height:Math.max(30,Math.min(85,g.width*.32))+'px'};
}
export function groundMaterial(environment){
 if(['dark-jungle','grass'].includes(environment))return 'grass';
 if(['snow','7p-gym'].includes(environment))return 'snow';
 if(['lake','lake-gym'].includes(environment))return 'water';
 if(['cave','dark-continent2','dark-pyramid','void-arena'].includes(environment))return 'stone';
 if(['lucie-house','gwenn-house'].includes(environment))return 'wood';
 if(environment==='colosseum'||environment==='hoze-gym')return 'sand';
 return 'hall';
}
