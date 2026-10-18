import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createGameServer} from '../server.mjs';import {defaultCategories} from '../lib/questions.mjs';
test('real HTTP room flow, concurrent buzzes, authorization and restart recovery',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'awep-'));let server=createGameServer({dataDir});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let base=`http://127.0.0.1:${server.address().port}`;
 const req=async body=>{const r=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,...await r.json()};};
 try{
  const h=await req({action:'create',categories:defaultCategories});assert.equal(h.status,200);const code=h.state.code;
  const a=await req({action:'join',code,name:'A'}),b=await req({action:'join',code,name:'B'});
  const host=(action,extra={})=>req({action,code,token:h.token,...extra});
  assert.equal((await req({action:'start',code,token:a.token})).status,400);
  await host('start');assert.equal((await req({action:'join',code,name:'Late'})).status,400);
  await host('select',{id:'0-0'});await host('open');
  const buzzes=await Promise.all([a,b].map(p=>req({action:'buzz',code,token:p.token})));assert.equal(buzzes.filter(r=>r.status===200).length,1);
  const state=(await host('state')).state;assert.ok(state.winner);assert.equal(state.board[0].clues[0].answer,undefined);assert.equal(state.players[0].token,undefined);
  await host('judge',{correct:true});await host('next');assert.equal((await host('state')).state.players.reduce((n,p)=>n+p.score,0),100);
  await new Promise(r=>server.close(r));server=createGameServer({dataDir});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
  assert.deepEqual((await host('state')).state.used,['0-0']);await host('finish');assert.equal((await host('state')).state.phase,'finished');
  const cross=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:'{}'});assert.equal(cross.status,403);
 }finally{await new Promise(r=>server.close(r));rmSync(dataDir,{recursive:true,force:true});}
});
