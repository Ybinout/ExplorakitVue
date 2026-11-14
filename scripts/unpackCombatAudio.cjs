// Verified build-time extraction. No ZIP, decoder or catalogue download in game.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),{createHash}=require('node:crypto');
const sha=b=>createHash('sha256').update(b).digest('hex');
function unpack(data,expected,write){
 const tar=zlib.gunzipSync(data,{maxOutputLength:3*1024*1024}),seen=new Set();
 for(let offset=0;offset+512<=tar.length;){
  const header=tar.subarray(offset,offset+512);if(header.every(b=>!b))break;
  const name=header.subarray(0,100).toString().split('\0')[0],size=parseInt(header.subarray(124,136).toString(),8),checksum=parseInt(header.subarray(148,156).toString(),8);
  if([...header].reduce((n,b,i)=>n+(i>=148&&i<156?32:b),0)!==checksum||!/^(moves|cries)\/\d+\.mp3$/.test(name)||![0,48].includes(header[156])||!Number.isSafeInteger(size)||size<1||size>150000||offset+512+size>tar.length||seen.has(name))throw Error('Invalid audio archive entry');
  const bytes=tar.subarray(offset+512,offset+512+size),entry=expected[name];if(!entry||entry.size!==size||entry.sha256!==sha(bytes))throw Error('Audio checksum mismatch: '+name);seen.add(name);write(name,bytes);offset+=512+Math.ceil(size/512)*512;
 }if(seen.size!==Object.keys(expected).length)throw Error('Incomplete audio pack');
}
function main(){const root=path.resolve(__dirname,'..'),packs=path.join(root,'assets/combat-audio'),m=JSON.parse(fs.readFileSync(path.join(packs,'manifest.json'))),out=path.join(root,'public/audio/combat',m.version);fs.mkdirSync(out,{recursive:true});let restored=0;
 for(const p of m.packs){if(!/^audio-\d{2}\.tar\.gz$/.test(p.file))throw Error('Invalid audio pack name');const data=fs.readFileSync(path.join(packs,p.file));if(sha(data)!==p.sha256)throw Error('Corrupt audio pack');unpack(data,p.files,(name,bytes)=>{const dest=path.join(out,name);if(fs.existsSync(dest)&&sha(fs.readFileSync(dest))===sha(bytes))return;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest+'.tmp',bytes);fs.renameSync(dest+'.tmp',dest);restored++;});}
 if(restored)console.log('Prepared '+restored+' normalized combat audio samples.');
}
if(require.main===module)main();module.exports={unpack};
