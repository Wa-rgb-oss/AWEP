export function transition(s, action, actor, body={}) {
 const host=actor===s.hostToken; const player=s.players.find(p=>p.token===actor);
 if(action==='join'){
  if(s.phase!=='lobby')throw Error('This game has already started.');
  const name=String(body.name||'').trim().slice(0,24);
  if(!name)throw Error('Enter your name.');
  if(s.players.length>=40)throw Error('This room is full (40 players).');
  if(s.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('That name is taken. Try another.');
  s.players.push({id:body.id,token:body.token,name,score:0});return s;
 }
 if(!host&&!player)throw Error('Rejoin this room to continue.');
 if(action==='buzz'){
  if(!player||s.phase!=='clue'||!s.open||s.winner||s.attempted.includes(player.id))throw Error('The buzzer is closed.');
  s.winner=player.id;s.open=false;return s;
 }
 if(!host)throw Error('Only the host can do that.');
 switch(action){
 case 'start':if(s.phase!=='lobby'||!s.players.length)throw Error('At least one player must join.');s.phase='board';break;
 case 'select':{
  if(s.phase!=='board')throw Error('Return to the board first.');
  const clue=s.board.flatMap(c=>c.clues).find(c=>c.id===body.id);
  if(!clue||s.used.includes(clue.id))throw Error('Choose an available clue.');
  s.active=clue.id;s.phase='clue';s.open=false;s.winner=null;s.revealed=false;s.attempted=[];break;}
 case 'open':if(s.phase!=='clue'||s.revealed||s.winner)throw Error('Cannot open buzzers now.');s.open=true;break;
 case 'judge':{
  if(s.phase!=='clue'||!s.winner||s.revealed)throw Error('No answer to judge.');
  const p=s.players.find(p=>p.id===s.winner);const clue=s.board.flatMap(c=>c.clues).find(c=>c.id===s.active);
  p.score+=body.correct?clue.value:-clue.value;s.attempted.push(p.id);s.winner=null;
  if(body.correct){s.revealed=true;s.open=false;}else{s.open=s.players.some(p=>!s.attempted.includes(p.id));}break;}
 case 'reveal':if(s.phase!=='clue')throw Error('Choose a clue first.');s.revealed=true;s.open=false;s.winner=null;break;
 case 'next':if(s.phase!=='clue')throw Error('No clue selected.');s.used.push(s.active);s.active=null;s.open=false;s.winner=null;s.phase=s.used.length===s.board.flatMap(c=>c.clues).length?'finished':'board';break;
 case 'finish':s.phase='finished';s.open=false;break;
 case 'kick':if(s.phase!=='lobby')throw Error('Players can only be removed in the lobby.');s.players=s.players.filter(p=>p.id!==body.id);break;
 default:throw Error('Unknown action.');
 }return s;
}
export function publicState(s,token){
 const host=token===s.hostToken;const me=s.players.find(p=>p.token===token);
 if(!host&&!me)throw Error('Rejoin this room to continue.');
 return {code:s.code,phase:s.phase,players:s.players.map(({token,...p})=>p),used:s.used,active:s.active,open:s.open,winner:s.winner,revealed:s.revealed,attempted:s.attempted,me:me?.id,host,board:s.board.map(c=>({...c,clues:c.clues.map(q=>({id:q.id,value:q.value,...(q.id===s.active?{question:q.question,...(s.revealed?{answer:q.answer}:{})}:{})}))}))};
}
