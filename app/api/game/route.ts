import { env } from 'cloudflare:workers';
import { makeBoard } from '../../../lib/questions.mjs';
import { transition, publicState } from '../../../lib/game.mjs';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const token=()=>crypto.randomUUID();
function validateBoard(categories:any){
 if(!Array.isArray(categories)||categories.length!==5)throw Error('Use five categories.');
 for(const c of categories){if(typeof c.name!=='string'||!c.name.trim()||c.name.length>40||!Array.isArray(c.clues)||c.clues.length!==5)throw Error('Each category needs a title and five clues.');for(const q of c.clues)if(!Array.isArray(q)||q.length!==2||q.some((v:any)=>typeof v!=='string'||!v.trim()||v.length>500))throw Error('Every clue needs a question and answer (500 characters maximum).');}
 return makeBoard(categories);
}
export async function POST(req:Request){
 try{
  if(Number(req.headers.get('content-length')||0)>60000)return json({error:'Request too large.'},413);
  const b=await req.json() as any;const db=env.DB!;
  if(b.action==='create'){
   const board=validateBoard(b.categories);const hostToken=token();
   for(let i=0;i<5;i++){
    const bytes=crypto.getRandomValues(new Uint8Array(6));const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from(bytes,x=>chars[x%chars.length]).join('');
    const s={code,hostToken,board,players:[],phase:'lobby',used:[],active:null,open:false,winner:null,revealed:false,attempted:[]};
    const result=await db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,expires) VALUES(?,?,0,?)').bind(code,JSON.stringify(s),Date.now()+86400000).run();
    if(result.meta.changes)return json({token:hostToken,state:publicState(s,hostToken)});
   }throw Error('Could not create a room. Please try again.');
  }
  const code=String(b.code||'').toUpperCase().trim();
  const joinToken=token(),id=token();
  for(let attempt=0;attempt<12;attempt++){
   const row=await db.prepare('SELECT state,version,expires FROM rooms WHERE code=?').bind(code).first<{state:string,version:number,expires:number}>();
   if(!row||row.expires<Date.now())return json({error:'Room not found or expired. Check the code.'},404);
   let s=JSON.parse(row.state);if(b.action==='state')return json({state:publicState(s,b.token)});
   s=transition(s,b.action,b.token,{...b,token:joinToken,id:b.action==='join'?id:b.id});
   const r=await db.prepare('UPDATE rooms SET state=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(s),code,row.version).run();
   if(r.meta.changes){const auth=b.action==='join'?joinToken:b.token;return json({state:publicState(s,auth),...(b.action==='join'?{token:auth}:{})});}
  }
  return json({error:'Room is busy. Try again.'},409);
 }catch(e){return json({error:e instanceof Error?e.message:'Something went wrong.'},400);}
}
