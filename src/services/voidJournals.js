// Small floor props, drawn before actors. Positions come from personal server state.
export function drawVoidJournals(context,map,state){
  if(map!=='void_arena'||!state?.available)return 0;
  let count=0;
  for(const book of state.journals||[]){
    if(!Number.isInteger(book.x)||!Number.isInteger(book.y)||book.x<0||book.x>27||book.y<0||book.y>19)continue;
    context.save();context.translate(book.x*32+5,book.y*32+9);
    const rect=(color,x,y,w,h)=>{context.fillStyle=color;context.fillRect(x,y,w,h);};
    rect('#0c0c16',-1,10,26,9);
    rect('#24232e',0,-1,24,18);rect(book.cover||'#686478',1,0,22,16);
    rect('#c9c2ab',3,2,18,12);rect('#e7dfc7',3,2,8,10);rect('#d8d0b9',13,2,8,10);
    rect('#827c72',11,2,2,13);rect('#a79e89',4,5,5,1);rect('#a79e89',4,8,6,1);
    rect('#aba18d',15,5,5,1);rect('#aba18d',15,8,4,1);rect('#877185',17,12,2,5);
    context.restore();count++;
  }
  return count;
}
