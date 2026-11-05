// Small, reproducible binary packs keep thousands of lossless sprites portable.
// Only build-time work: browsers still request individual, cacheable images.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),packs=path.join(root,'assets/pokemon'),target=path.join(root,'public/img/pokemon');
const sha=data=>createHash('sha256').update(data).digest('hex');
function unpack(buffer,expected,write){
 const tar=zlib.gunzipSync(buffer,{maxOutputLength:32*1024*1024}),seen=new Set();
 for(let offset=0;offset+512<=tar.length;){
  const header=tar.subarray(offset,offset+512);if(header.every(b=>b===0))break;
  const name=header.subarray(0,100).toString().split('\0')[0],kind=header[156],size=parseInt(header.subarray(124,136).toString().replace(/\0/g,'').trim(),8);
  const sum=parseInt(header.subarray(148,156).toString().replace(/\0/g,'').trim(),8);
  if([...header].reduce((n,b,i)=>n+(i>=148&&i<156?32:b),0)!==sum)throw Error('Invalid sprite archive header');
  if(!/^(?:animated\/)?(?:shiny\/)?(?:front|back)\/(?:\d+)(?:-[mf])?\.(?:png|webp)$/.test(name)||![0,48].includes(kind)||!Number.isSafeInteger(size)||size<1||size>4*1024*1024||offset+512+size>tar.length||seen.has(name))throw Error('Invalid sprite archive entry');
  const data=tar.subarray(offset+512,offset+512+size),entry=expected[name];if(!entry||entry.size!==size||entry.sha256!==sha(data))throw Error('Sprite checksum mismatch: '+name);
  seen.add(name);write(name,data);offset+=512+Math.ceil(size/512)*512;
 }
 if(seen.size!==Object.keys(expected).length)throw Error('Incomplete sprite archive');
}
function main(){
 const manifest=JSON.parse(fs.readFileSync(path.join(packs,'manifest.json'),'utf8'));let restored=0;
 fs.mkdirSync(target,{recursive:true});
 for(const pack of manifest.packs){
  if(!/^sprites-\d{3}\.tar\.gz$/.test(pack.file))throw Error('Invalid sprite pack path');
  const marker=path.join(target,'.'+pack.file+'.sha256');
  if(fs.existsSync(marker)&&fs.readFileSync(marker,'utf8')===pack.sha256&&Object.keys(pack.files).every(name=>fs.existsSync(path.join(target,name))))continue;
  const data=fs.readFileSync(path.join(packs,pack.file));if(sha(data)!==pack.sha256)throw Error('Sprite pack checksum mismatch: '+pack.file);
  unpack(data,pack.files,(name,content)=>{const output=path.join(target,name);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output+'.tmp',content);fs.renameSync(output+'.tmp',output);restored++;});
  fs.writeFileSync(marker,pack.sha256);
 }
 if(restored)console.log('Prepared '+restored+' Pokémon sprite files.');
}
if(require.main===module)main();module.exports={unpack};
