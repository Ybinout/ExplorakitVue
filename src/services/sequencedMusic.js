// Both sources are scheduled on the audio clock before playback. No ended
// handler, timer or network request at the intro -> loop boundary.
export function musicSequenceBounds(buffers) {
  if(buffers.bounds)return buffers.bounds;
  // MP3 padding differs between Chromium and WebKit. Inspect only the first
  // and last 100 ms once, never trim a quiet passage inside the actual music.
  const quietEdge=(buffer,backwards=false)=>{
    if(!buffer.getChannelData)return 0;
    const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
    const block=Math.max(1,Math.round(buffer.sampleRate*.002)),limit=Math.min(Math.floor(buffer.sampleRate*.1),Math.floor(buffer.length/4));
    let edge=0;
    for(let at=0;at+block<=limit;at+=block){let energy=0;
      for(const channel of channels)for(let i=0;i<block;i++){const sample=channel[backwards?buffer.length-1-at-i:at+i];energy+=sample*sample;}
      if(Math.sqrt(energy/(block*channels.length))>.001)break;
      edge=at+block;
    }
    return edge/buffer.sampleRate;
  };
  return {introEnd:buffers.intro.duration-Math.max(.02,quietEdge(buffers.intro,true)),loopStart:Math.max(.02,quietEdge(buffers.loop)),loopEnd:buffers.loop.duration-quietEdge(buffers.loop,true)};
}
export function scheduleMusicSequence(context, output, buffers, position, when) {
  const {intro, loop} = buffers;
  const {introEnd,loopStart,loopEnd}=musicSequenceBounds(buffers);
  const overlap = .008, loopAt = introEnd - overlap;
  const nodes = [];
  const voice = (buffer, start, offset, duration, envelope) => {
    const source=context.createBufferSource(), gain=context.createGain();
    source.buffer=buffer; source.connect(gain); gain.connect(output);
    envelope(gain.gain, start);
    if (duration == null) {
      source.loop=true; source.loopStart=loopStart; source.loopEnd=loopEnd;
      source.start(start,offset);
    } else source.start(start,offset,duration);
    nodes.push({source,gain});
  };
  if (position < introEnd) {
    voice(intro,when,position,introEnd-position,(gain,start)=>{
      gain.setValueAtTime(position<loopAt?1:(introEnd-position)/overlap,start);
      if(position<loopAt)gain.setValueAtTime(1,start+loopAt-position);
      gain.linearRampToValueAtTime(0,start+introEnd-position);
    });
  }
  const loopElapsed=Math.max(0,position-loopAt), start=when+Math.max(0,loopAt-position);
  voice(loop,start,loopStart+loopElapsed%(loopEnd-loopStart),null,(gain,time)=>{
    const fadeRemaining=Math.max(0,introEnd-position);
    gain.setValueAtTime(position<introEnd?Math.max(0,1-fadeRemaining/overlap):1,time);
    if(position<introEnd)gain.linearRampToValueAtTime(1,when+introEnd-position);
  });
  return nodes;
}

export class SequencedMusic {
  constructor(sources, {
    createContext=()=>new (window.AudioContext || window.webkitAudioContext)(),
    fetchAudio=(url,options)=>fetch(url,options)
  }={}) {
    this.sources=sources; this.createContext=createContext; this.fetchAudio=fetchAudio;
    this.context=null; this.output=null; this.buffers=null; this.loading=null;
    this.nodes=[]; this.paused=true; this.disposed=false; this.position=0;
    this.startedAt=0; this.version=0; this._volume=0; this.loop=true;
    this.src=sources.intro;
  }
  ensureContext() {
    if(this.disposed)throw new Error('Music disposed');
    if(!this.context){this.context=this.createContext();this.output=this.context.createGain();this.output.gain.value=this._volume;this.output.connect(this.context.destination);}
    return this.context;
  }
  prepare() {
    if(this.buffers)return Promise.resolve(this.buffers);
    if(this.loading)return this.loading;
    this.abort=new AbortController();
    try {
      const context=this.ensureContext();
      this.loading=Promise.all(['intro','loop'].map(async key=>{
        const response=await this.fetchAudio(this.sources[key],{signal:this.abort.signal});
        if(!response.ok)throw new Error('Music download failed');
        return context.decodeAudioData(await response.arrayBuffer());
      })).then(([intro,loop])=>{
        if(this.disposed)throw new Error('Music disposed');
        if(intro.duration<=.04||loop.duration<=.04)throw new Error('Music too short');
        this.buffers={intro,loop};this.buffers.bounds=musicSequenceBounds(this.buffers);return this.buffers;
      }).finally(()=>{this.loading=null;});
      return this.loading;
    } catch(error){return Promise.reject(error);}
  }
  unlock() {
    try {const context=this.ensureContext();return context.state==='running'?Promise.resolve():context.resume();}
    catch(error){return Promise.reject(error);}
  }
  get readyState(){return this.buffers?4:0;}
  get duration(){if(!this.buffers)return NaN;const {introEnd,loopStart,loopEnd}=musicSequenceBounds(this.buffers);return introEnd+loopEnd-loopStart-.008;}
  get volume(){return this._volume;}
  set volume(value){this._volume=Math.max(0,Math.min(1,Number(value)||0));if(this.output)this.output.gain.setValueAtTime(this._volume,this.context.currentTime);}
  get currentTime(){return this.position+(this.nodes.length?Math.max(0,this.context.currentTime-this.startedAt):0);}
  set currentTime(value){const playing=!this.paused;this.pause();this.position=Math.max(0,Number(value)||0);if(playing)this.play().catch(()=>{});}
  play() {
    if(this.disposed)return Promise.reject(new Error('Music disposed'));
    if(!this.paused)return this.playing || Promise.resolve();
    this.paused=false;const version=++this.version;
    // Resume synchronously during the gesture, before the asynchronous decode.
    this.playing=Promise.all([this.unlock(),this.prepare()]).then(()=>{
      if(this.disposed||this.paused||version!==this.version)return;
      if(this.context.state!=='running')throw new Error('Music needs a user gesture');
      this.startedAt=this.context.currentTime+.01;
      this.nodes=scheduleMusicSequence(this.context,this.output,this.buffers,this.position,this.startedAt);
    }).catch(error=>{if(version===this.version)this.pause();throw error;});
    return this.playing;
  }
  pause() {
    this.position=this.currentTime;this.paused=true;this.version++;
    for(const {source,gain} of this.nodes){try{source.stop();}catch(_){/* Already stopped. */}source.disconnect();gain.disconnect();}
    this.nodes=[];
  }
  dispose() {
    if(this.disposed)return;
    this.pause();this.disposed=true;this.abort?.abort();this.buffers=null;
    this.output?.disconnect();this.context?.close().catch(()=>{});
  }
}
