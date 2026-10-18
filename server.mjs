import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,renameSync,existsSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomInt} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {makeBoard} from './lib/questions.mjs';
import {transition,publicState} from './lib/game.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
export function createGameServer({dataDir=resolve(root,'data'),staticDir=resolve(root,'dist')}={}){
 mkdirSync(dataDir,{recursive:true});
 const file=resolve(dataDir,'rooms.json');
 let rooms={};
 if(existsSync(file))rooms=JSON.parse(readFileSync(file,'utf8'));
 function save(){const next=file+'.tmp';writeFileSync(next,JSON.stringify(rooms),{mode:0o600});renameSync(next,file);}
 function board(categories){
  if(!Array.isArray(categories)||categories.length!==5)throw Error('Use five categories.');
  for(const c of categories){if(typeof c.name!=='string'||!c.name.trim()||c.name.length>40||!Array.isArray(c.clues)||c.clues.length!==5)throw Error('Each category needs a title and five clues.');for(const q of c.clues)if(!Array.isArray(q)||q.length!==2||q.some(v=>typeof v!=='string'||!v.trim()||v.length>500))throw Error('Every clue needs a question and answer (500 characters maximum).');}
  return makeBoard(categories);
 }
 function api(b){
  if(b.action==='create'){
   const questions=board(b.categories);const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code;
   do{code=Array.from({length:6},()=>chars[randomInt(chars.length)]).join('');}while(rooms[code]);
   for(const [key,room] of Object.entries(rooms))if(room.expires<Date.now())delete rooms[key];
   const s={code,hostToken:randomUUID(),board:questions,players:[],phase:'lobby',used:[],active:null,open:false,winner:null,revealed:false,attempted:[],expires:Date.now()+86400000};
   rooms[code]=s;save();return {token:s.hostToken,state:publicState(s,s.hostToken)};
  }
  const code=String(b.code||'').trim().toUpperCase();const current=rooms[code];
  if(!current||current.expires<Date.now())throw Error('Room not found or expired. Check the code.');
  if(b.action==='state')return {state:publicState(current,b.token)};
  const joinToken=randomUUID();const s=transition(structuredClone(current),b.action,b.token,{...b,token:joinToken,id:b.action==='join'?randomUUID():b.id});
  // All state transitions and persistence run synchronously in one Node process.
  // No other request can claim this buzzer between reading and saving the room.
  rooms[code]=s;try{save();}catch(e){rooms[code]=current;throw e;}
  const auth=b.action==='join'?joinToken:b.token;
  return {state:publicState(s,auth),...(b.action==='join'?{token:auth}:{})};
 }
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png'};
 return http.createServer(async(req,res)=>{
  const respond=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/game'){
   if(req.method!=='POST')return respond(405,{error:'Use POST.'});
   if(!String(req.headers['content-type']||'').startsWith('application/json'))return respond(415,{error:'Use JSON.'});
   if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return respond(403,{error:'Use this game from the same server address.'});}catch{return respond(403,{error:'Invalid origin.'});}}
   try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>60000)return respond(413,{error:'Request too large.'});chunks.push(chunk);}const b=JSON.parse(Buffer.concat(chunks).toString());if(!b||typeof b!=='object')throw Error('Invalid request.');return respond(200,api(b));}catch(e){return respond(400,{error:e.message||'Request failed.'});}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return respond(405,{error:'Method not allowed.'});
  try{
   const pathname=decodeURIComponent(url.pathname);const path=resolve(staticDir,'.'+(pathname==='/'?'/index.html':pathname));
   if(!path.startsWith(resolve(staticDir)+sep))return respond(403,{error:'Forbidden.'});
   const contents=readFileSync(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:contents);
  }catch{return respond(404,{error:'File not found. Run npm install and npm run build first.'});}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||3000);const host=process.env.HOST||'0.0.0.0';
 createGameServer().listen(port,host,()=>{
  console.log(`AWEP is running: http://localhost:${port}`);
  for(const list of Object.values(networkInterfaces()))for(const info of list||[])if(info.family==='IPv4'&&!info.internal)console.log(`Phones on the same Wi-Fi: http://${info.address}:${port}`);
 });
}
