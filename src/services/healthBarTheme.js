export function healthPercent(current,max){return Math.max(0,Math.min(100,(Number(current)||0)/Math.max(1,Number(max)||1)*100));}
export function healthColors(percent){
 return percent>50?{start:'#64e16a',end:'#2cb55b'}:percent>20?{start:'#f4d35e',end:'#e6a13b'}:{start:'#ff6e6e',end:'#d14444'};
}
export function healthFill(current,max){const c=healthColors(healthPercent(current,max));return `linear-gradient(90deg, ${c.start}, ${c.end})`;}
