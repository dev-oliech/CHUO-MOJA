/* =====================================================================
   PHASE 2: live Open Line rooms, live pairing, Lecturer Desk
   Later function declarations here replace the Phase 1 versions above.
   ===================================================================== */
const DB={posts:[],lines:[],lectures:[],research:[],slots:[],endorse:[],resp:[]};
let roomNs=null,ROOM=null,roomUn=[],roomPeers=[],roomMsgs=[],myHand=false,meetTimer=null,meetUn=null;
const all=n=>[...(DB[n]||[]),...((S.loc&&S.loc[n])||[])].sort((a,b)=>b.ts-a.ts);
const isMine=d=>!!d.local||(!!d.by&&d.by===meInfo.id);
const ownerName=d=>NAMES[d.by]||(d.local?(meInfo.name||'You'):roleName(d.role));
const respKey=(type,id)=>type==='rsvp'?id:type+':'+id;
const isOn=(type,id)=>has(S.rsvp,respKey(type,id));
const respCount=(type,id)=>DB.resp.filter(r=>r.type===type&&r.target===id&&r.by!==meInfo.id).length+(isOn(type,id)?1:0);
const respId=(type,id)=>`${type}__${id}__${meInfo.id}`;
const dbReady=()=>!!(dbc&&meInfo.id&&canWrite);
const dayOpts=(n,sel)=>[...Array(n)].map((_,i)=>{const d=addDays(i);return `<option value="${i}" ${i===sel?'selected':''}>${dayWord(d)}, ${d.getDate()} ${MONS[d.getMonth()]}</option>`}).join('');
const fmtWhen=d=>`${dayWord(d)}, ${d.getDate()} ${MONS[d.getMonth()]}, ${hhmm(d)}`;
const safeLink=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:''}catch(e){return ''}};
function softRender(){const a=document.activeElement;if(S.room)return;if(a&&a.closest&&a.closest('#view')&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;render(true)}

/* ---------- generic doc helpers ---------- */
async function createDoc(name,doc,okMsg){
  doc.ts=Date.now();doc.role=S.role;doc.uni=myShort();
  if(dbReady()){try{doc.by=meInfo.id;await dbc.collection(name).add(doc);toast(okMsg||'Published. Other viewers will see it.');return true}catch(e){}}
  S.loc[name]=S.loc[name]||[];S.loc[name].unshift({...doc,id:'l'+doc.ts,local:true,by:null});S.loc[name]=S.loc[name].slice(0,20);save();
  toast('Saved on this device. Sign in with edit access to share with others.');return false;
}
async function patchDoc(name,id,patch){
  const loc=(S.loc[name]||[]).find(d=>d.id===id);
  if(loc){Object.assign(loc,patch);save();return}
  if(dbReady()){try{await dbc.collection(name).doc(id).update(patch)}catch(e){toast('Could not update that right now')}}
}
async function removeDoc(name,id){
  const i=(S.loc[name]||[]).findIndex(d=>d.id===id);
  if(i>=0){S.loc[name].splice(i,1);save();return}
  if(dbReady()){try{await dbc.collection(name).doc(id).delete()}catch(e){toast('Could not remove that right now')}}
}
async function toggleResp(type,id){
  const key=respKey(type,id),on=has(S.rsvp,key);
  on?S.rsvp=S.rsvp.filter(x=>x!==key):S.rsvp.push(key);save();render(true);
  if(dbReady()){try{const ref=dbc.collection('resp').doc(respId(type,id));on?await ref.delete():await ref.set({type,target:id,by:meInfo.id,role:S.role,uni:myShort(),ts:Date.now()})}catch(e){}}
}
const isGoing=id=>has(S.rsvp,id);

/* ---------- Open Lines ---------- */
function allLines(){
  const real=all('lines').map(d=>({id:d.id,title:d.title,host:ownerName(d),role:d.role,uni:d.uni,lang:d.lang||'English',tags:d.tags||[],going:0,dur:d.dur||45,
    s:new Date(d.start),e:new Date(d.start+(d.dur||45)*60000),link:d.link||'',real:true,local:!!d.local}))
    .filter(l=>l.e.getTime()>Date.now()-3600000);
  const sample=LINES.map(l=>({...l,...lineTimes(l)}));
  return [...real,...sample].sort((a,b)=>a.s-b.s);
}
function lineRow(l){
  const g=isGoing(l.id),live=isLive(l),n=(l.going||0)+respCount('rsvp',l.id);
  return `<div class="line" style="align-items:flex-start"><div class="when"><b>${l.s.getDate()}</b><span>${MONS[l.s.getMonth()]}</span></div>
   <div class="grow"><div class="row row--wrap" style="gap:6px">${live?`<span class="badge badge--live">${esc(t('live'))}</span>`:''}<span class="meta">${esc(dayWord(l.s))}, ${hhmm(l.s)} · ${l.dur} min</span></div>
   <h3 style="font-size:16px;margin:2px 0 4px">${esc(l.title)}</h3>
   <div class="meta">${roleBadge(l.role)}<span>${esc(l.host)}, ${esc(l.uni)}</span><span>${esc(l.lang)}</span><span>${n} ${esc(t('going').toLowerCase())}</span>${l.real?(l.local?'<span class="tag">this device</span>':''):`<span class="tag">${esc(t('example'))}</span>`}</div>
   <div class="row row--wrap" style="margin-top:10px"><button class="btn btn--sm ${g?'on':'btn--ghost'}" data-act="rsvp:${esc(l.id)}" aria-pressed="${g}">${esc(g?t('going')+' ✓':t('rsvp'))}</button>
   <button class="btn btn--sm ${live?'':'btn--ghost'}" data-act="room:${esc(l.id)}">Enter room</button>${l.link?'<span class="tag">call link</span>':''}</div></div></div>`;
}
function callsView(){
  const ls=lineList();
  return `<div class="sec-h" style="margin-top:0"><h1 style="font-size:28px">${esc(t('openlines'))}</h1>${btnAct('compose:line','Host one','btn--sm')}</div>${matchCard()}
  <div class="note note--info" style="margin:14px 0"><span>Every Open Line has a live room: who is here, chat and raised hands. Voice and video run on the host's own call link (Meet, Zoom or WhatsApp), which opens from the room.</span></div>
  <section class="card">${ls.map(lineRow).join('')}</section>`;
}

/* ---------- live rooms ---------- */
const roomSlug=s=>('line-'+String(s).toLowerCase().replace(/[^a-z0-9]/g,'')).slice(0,48);
function peerName(p){
  if(p.isMe)return 'You';
  return NAMES[p.by]||(p.presence&&p.presence.nick)||roleName((p.presence&&p.presence.role)||'student');
}
function roomSys(txt){roomMsgs.push({k:'sys',text:txt,ts:Date.now()});refreshRoom()}
async function openRoom(spec){
  leaveRoomQuiet();
  S.room=spec;S.tab='calls';S.page=null;roomMsgs=[];roomPeers=[];myHand=false;render();
  if(!roomNs){roomSys('The live room needs a signed-in view of this page. You can still RSVP and use the call link.');return}
  try{
    const r=await roomNs.join(spec.name);
    if(S.room!==spec){r.leave().catch(()=>{});return}
    ROOM=r;
    roomUn=[r.on('chat',onChat,()=>roomSys('The room connection dropped.')),r.onPeers(ch=>{roomPeers=ch.peers;resolveNames().then(refreshRoom);refreshRoom()},()=>{})];
    r.presence({role:S.role,uni:myShort(),nick:meInfo.name||'',hand:null});
    roomPeers=r.peers();refreshRoom();
  }catch(e){roomSys('Could not join the room. Go back and try again.')}
}
function leaveRoomQuiet(){
  roomUn.forEach(u=>{try{u()}catch(e){}});roomUn=[];
  if(ROOM){const r=ROOM;ROOM=null;r.leave().catch(()=>{})}
  S.room=null;roomPeers=[];myHand=false;
}
function onChat(msg){
  const d=msg.data||{};const text=String(d.t==null?'':d.t).slice(0,300);if(!text)return;
  roomMsgs.push({k:d.k==='react'?'react':'msg',by:msg.by,me:msg.isMe,text,role:d.role,uni:d.uni,ts:Date.now()});
  roomMsgs=roomMsgs.slice(-120);resolveNames().then(refreshRoom);refreshRoom();
}
function refreshRoom(){
  const pe=$('#room-peers'),ch=$('#room-chat');
  if(pe){
    const ps=roomPeers.filter(p=>p.kind==='viewer');
    pe.innerHTML=ps.length?ps.map(p=>{const pr=p.presence||{};return `<div class="row">${av(peerName(p))}<div class="grow"><b>${esc(peerName(p))}</b><div class="meta">${vBadge(p.by)}${pr.role?roleBadge(pr.role==='lecturer'||pr.role==='staff'?pr.role:'student'):''}<span>${esc(pr.uni||'')}</span></div></div>${pr.hand?'<span class="badge badge--lecturer">Hand up</span>':''}</div>`}).join(''):'<p class="muted">Just you so far. Share the link and invite a friend.</p>';
    const c=$('#room-count');if(c)c.textContent=ps.length;
  }
  if(ch){
    const near=ch.scrollHeight-ch.scrollTop-ch.clientHeight<60;
    ch.innerHTML=roomMsgs.length?roomMsgs.map(m=>m.k==='sys'?`<div class="sys">${esc(m.text)}</div>`:m.k==='react'?`<div class="sys">${esc(m.me?'You':(NAMES[m.by]||roleName(m.role||'student')))} ${esc(m.text)}</div>`:
      `<div class="msg ${m.me?'me':''}"><div class="meta"><b>${esc(m.me?'You':(NAMES[m.by]||roleName(m.role||'student')))}</b>${vBadge(m.by)}${m.uni?`<span>${esc(m.uni)}</span>`:''}</div><div>${esc(m.text)}</div></div>`).join(''):'<div class="sys">No messages yet. Say hello.</div>';
    if(near)ch.scrollTop=ch.scrollHeight;
  }
}
function callBlock(r){
  const link=safeLink(r.link||'');
  if(link){let h='';try{h=new URL(link).hostname}catch(e){}
    return `<div class="note note--info" style="flex-direction:column;gap:8px"><span>The host added a call link. Voice and video happen there; this room stays open beside it for chat and raised hands.</span><div class="row row--wrap"><a class="btn" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Join the call</a><span class="muted" style="font-size:13px">Opens ${esc(h)} in a new tab. Only open links from people you trust.</span></div></div>`}
  return `<div class="note"><span>${r.kind==='pair'?'Want to talk by voice? Agree on a WhatsApp or Meet call in the chat. Only join links from people you trust.':'The host has not added a call link yet. Use the room chat for now.'}</span></div>`;
}
function roomView(){
  const r=S.room;
  return `<button class="back" data-act="room-leave">← ${esc(t('back'))}</button>
  <section class="card stack" style="margin-top:8px"><div><span class="eyebrow">${r.kind==='pair'?'Private chat for two':'Open Line room'}</span><h1 style="font-size:26px;margin-top:4px">${esc(r.title)}</h1>${r.sub?`<div class="meta" style="margin-top:4px">${esc(r.sub)}</div>`:''}</div>${callBlock(r)}</section>
  <div class="room-grid" style="margin-top:14px">
   <section class="card"><div class="sec-h" style="margin:0 0 10px"><h2 style="font-size:18px">Who is here</h2><span><b id="room-count">1</b> in room</span></div><div class="list" id="room-peers"></div>
    <div class="row row--wrap" style="margin-top:14px"><button class="btn btn--sm ${myHand?'on':'btn--ghost'}" data-act="hand" aria-pressed="${myHand}">${myHand?'Lower hand':'Raise hand'}</button><button class="btn btn--sm btn--ghost" data-act="react:clapped">Clap</button><button class="btn btn--sm btn--ghost" data-act="react:said asante">Asante</button></div></section>
   <section class="card stack"><h2 style="font-size:18px">Room chat</h2><div class="chatlog" id="room-chat" role="log" aria-live="polite"></div>
    <form id="room-form" class="row"><input id="room-input" class="chatin" maxlength="300" autocomplete="off" placeholder="Say something kind…" aria-label="Message"><button class="btn btn--sm" type="submit">Send</button></form>
    <p class="muted" style="font-size:12.5px">Chat lasts only while the room is open. Nothing is saved.</p></section></div>`;
}
async function sendChat(){
  const inp=$('#room-input');if(!inp)return;const v=inp.value.trim();if(!v)return;
  if(!ROOM||!ROOM.connected()){toast('Not connected to the room yet');return}
  inp.value='';
  try{await ROOM.emit('chat',{k:'msg',t:v,role:S.role,uni:myShort()})}catch(e){toast(e&&e.code==='not_permitted'?'Your access level cannot send chat here':'Message not sent');inp.value=v}
}

/* ---------- Meet someone new: live pairing with fallback ---------- */
function matchCard(){
  const m=S.match;
  if(m.state==='searching')return `<div class="match"><div class="row"><div class="pulse"></div><div><h3 style="font-size:20px">Looking for someone who is here right now…</h3><p class="muted">Takes a few seconds. If nobody else is looking, you will get an example match.</p></div></div><div>${btnAct('meet-cancel','Cancel','btn--ghost')}</div></div>`;
  if(m.state==='found'){const p=m.person;
   return `<div class="match"><span class="eyebrow" style="color:var(--night-dim)">Example match · no one else was looking</span>
    <div class="row">${av(p.n)}<div><h3 style="font-size:22px">${esc(p.n)}</h3><div class="muted">${esc(p.c)}, ${esc(p.u)}</div></div></div>
    <p>Both of you like <b>${esc(p.i)}</b>. A way to start: <i>${esc(m.ice)}</i></p>
    <div class="row row--wrap">${btnAct('meet','Look again')}${btnAct('meet-cancel','Close','btn--ghost')}</div>
    <p class="muted" style="font-size:13px">Real matches happen when two people press "${esc(t('meet'))}" at the same time. Invite a friend and try it together.</p></div>`}
  return `<div class="match"><h2 style="font-size:24px">${esc(t('meet'))}</h2><p class="muted">One tap pairs you with someone who is on the page right now, for a private chat room. Leave any time.</p><div>${btnAct('meet',esc(t('meet')))}</div></div>`;
}
function stopLooking(){
  clearTimeout(meetTimer);if(meetUn){try{meetUn()}catch(e){}meetUn=null}
  if(roomNs)roomNs.presence({looking:null,luni:null,match:null}).catch(()=>{});
}
function checkPair(){
  if(S.match.state!=='searching'||!roomNs)return;
  const ps=roomNs.peers(),me=ps.find(p=>p.sameTab);if(!me)return;
  const now=Date.now();
  const inbound=ps.find(p=>!p.sameTab&&p.kind==='viewer'&&p.presence&&p.presence.match===me.peer&&now-p.updatedAt<20000);
  if(!inbound){
    const cands=ps.filter(p=>!p.sameTab&&p.kind==='viewer'&&p.presence&&p.presence.looking&&now-p.updatedAt<90000).sort((a,b)=>a.peer<b.peer?-1:1);
    const mm=me.presence&&me.presence.match;
    if(mm&&cands.find(p=>p.peer===mm&&(!p.presence.match||p.presence.match===me.peer)))return;
    const c=cands.find(p=>!p.presence.match||p.presence.match===me.peer);
    if(c&&mm!==c.peer)roomNs.presence({match:c.peer}).catch(()=>{});
    return;
  }
  const p=inbound;
  S.match={state:'idle'};
  clearTimeout(meetTimer);if(meetUn){try{meetUn()}catch(e){}meetUn=null}
  if((me.presence&&me.presence.match)!==p.peer)roomNs.presence({match:p.peer}).catch(()=>{});
  setTimeout(()=>roomNs.presence({looking:null,luni:null,match:null}).catch(()=>{}),4000);
  const nm=NAMES[p.by]||'a student';
  openRoom({kind:'pair',name:('pair-'+[p.peer,me.peer].sort().join('-')).toLowerCase().replace(/[^a-z0-9_.-]/g,'').slice(0,48),title:'Chat with '+nm,sub:(p.presence.luni?p.presence.luni+' · ':'')+'You were matched just now'});
}
function startMeet(){
  stopLooking();S.match={state:'searching'};S.tab='calls';S.page=null;leaveRoomQuiet();render();
  if(roomNs){
    roomNs.presence({looking:Date.now(),luni:myShort()}).catch(()=>{});
    meetUn=roomNs.onPeers(()=>checkPair(),()=>{});setTimeout(checkPair,300);
  }
  meetTimer=setTimeout(()=>{
    stopLooking();if(S.match.state!=='searching')return;
    const pool=PEOPLE.filter(p=>p.u!==myShort());
    S.match={state:'found',person:pool[Math.floor(Math.random()*pool.length)],ice:ICEBREAKERS[Math.floor(Math.random()*ICEBREAKERS.length)]};
    if(S.tab==='calls'&&!S.room)render(true);
  },roomNs?6000:1500);
}

/* ---------- Lecturer Desk ---------- */
const DESK_TABS=[['lectures','Guest lectures'],['slots','Open slots'],['research','Research match'],['recs','Recommendations']];
const EX_SLOTS=[{id:'sx1',start:addDays(1,15,0).getTime(),dur:30,text:'Open for a guest session on supply chains',who:'Prof. Achola',uni:'Maseno'},{id:'sx2',start:addDays(3,10,0).getTime(),dur:45,text:'Can host a co-supervision meeting',who:'Dr. Hawa S.',uni:'TUM'}];
const EX_RESEARCH=[{id:'rx1',type:'Co-author',title:'Public health informatics paper',field:'Public health',who:'Dr. Njeri M.',uni:'JKUAT',desc:'Dataset ready and ethics approval in hand. Looking for a second author.'},{id:'rx2',type:'Consultancy',title:'Dairy value-chain study for a county government',field:'Agribusiness',who:'Dr. Mwangi K.',uni:'Egerton',desc:'Two-week field assignment. Needs an economist and a data analyst.'}];
const EX_RECS=[{id:'ex1',name:'Achieng O.',forUni:'Maseno',skills:['Teaching','Statistics'],text:'Led a study group of 40 students from three universities and explained statistics patiently.',who:'Dr. Mwangi K.',role:'lecturer',uni:'Egerton'},{id:'ex2',name:'Hassan A.',forUni:'Pwani',skills:['Research','Fieldwork'],text:'Careful fieldwork notes and a clear final report on coastal tourism.',who:'Dr. Hawa S.',role:'lecturer',uni:'TUM'}];
function chipRow(){return `<div class="chips" role="group" aria-label="Desk">${DESK_TABS.map(c=>`<button class="chip" data-act="dt:${c[0]}" aria-pressed="${S.deskTab===c[0]}">${esc(c[1])}</button>`).join('')}</div>`}
function responders(type,id){return DB.resp.filter(r=>r.type===type&&r.target===id)}
function lectureList(){
  const real=all('lectures').map(d=>({...d,real:true,who:ownerName(d)}));
  const ex=LECTURES.map(x=>({id:x.id,type:x.type.toLowerCase(),topic:x.text,mode:'',desc:'',uni:x.uni,who:x.who,example:true,status:'open'}));
  return [...real,...ex];
}
function lectureCard(d){
  const mine=!d.example&&isMine(d),on=isOn('lecture',d.id),rs=mine?responders('lecture',d.id):[];
  return `<article class="card stack" style="gap:10px"><div class="row row--wrap" style="gap:6px"><span class="badge ${d.type==='offer'?'badge--lecturer':''}">${d.type==='offer'?'Offer':'Request'}</span>${d.status==='matched'?'<span class="badge badge--student">Matched</span>':''}${d.mode?`<span class="badge">${esc(d.mode)}</span>`:''}${d.example?`<span class="tag">${esc(t('example'))}</span>`:d.local?'<span class="tag">this device</span>':''}</div>
   <h3 style="font-size:18px">${esc(d.topic)}</h3>${d.desc?`<p class="muted" style="font-size:14.5px">${esc(d.desc)}</p>`:''}
   <div class="meta"><b>${esc(d.who)}</b>${vBadge(d.by)}<span>${esc(d.uni)}</span>${d.real?`<span>${responders('lecture',d.id).length} response${responders('lecture',d.id).length===1?'':'s'}</span>`:''}</div>
   ${mine?`${rs.length?`<div class="stack" style="gap:6px">${rs.map(r=>`<div class="row"><div class="grow"><b>${esc(NAMES[r.by]||roleName(r.role))}</b> <span class="meta">${esc(r.uni)}</span></div>${d.status==='open'?`<button class="btn btn--sm" data-act="accept:${esc(d.id)}:${esc(r.by)}">Accept</button>`:(d.matchedBy===r.by?'<span class="badge badge--student">Accepted</span>':'')}</div>`).join('')}</div>`:'<p class="muted" style="font-size:13.5px">No responses yet.</p>'}<div><button class="btn btn--sm btn--ghost" data-act="del:lectures:${esc(d.id)}">Remove</button></div>`
   :d.status==='matched'?'':`<div><button class="btn btn--sm ${on?'on':''}" data-act="resp:lecture:${esc(d.id)}" aria-pressed="${on}">${on?'Interest sent ✓':(d.type==='offer'?'Request this lecture':'Offer to host')}</button></div>`}</article>`;
}
function slotList(){
  const real=all('slots').map(d=>({...d,real:true,who:ownerName(d)})).filter(d=>d.start>Date.now()-3600000);
  return [...real,...EX_SLOTS.map(x=>({...x,example:true}))].sort((a,b)=>a.start-b.start);
}
function slotCard(d){
  const mine=!d.example&&isMine(d),on=isOn('slot',d.id),n=d.real?responders('slot',d.id).length:0,s=new Date(d.start);
  return `<div class="line" style="align-items:flex-start"><div class="when"><b>${s.getDate()}</b><span>${MONS[s.getMonth()]}</span></div><div class="grow"><b>${esc(fmtWhen(s))} · ${d.dur} min</b><p class="muted" style="font-size:14px">${esc(d.text)}</p><div class="meta"><b>${esc(d.who)}</b>${vBadge(d.by)}<span>${esc(d.uni)}</span>${d.example?`<span class="tag">${esc(t('example'))}</span>`:d.local?'<span class="tag">this device</span>':`<span>${n} booked</span>`}</div></div>
   ${mine?`<button class="btn btn--sm btn--ghost" data-act="del:slots:${esc(d.id)}">Remove</button>`:`<button class="btn btn--sm ${on?'on':''}" data-act="resp:slot:${esc(d.id)}" aria-pressed="${on}">${on?'Booked ✓':'Book'}</button>`}</div>`;
}
function researchList(){
  return [...all('research').map(d=>({...d,real:true,who:ownerName(d)})),...EX_RESEARCH.map(x=>({...x,example:true}))];
}
function researchCard(d){
  const mine=!d.example&&isMine(d),on=isOn('research',d.id),rs=mine?responders('research',d.id):[];
  return `<article class="card stack" style="gap:10px"><div class="row row--wrap" style="gap:6px"><span class="badge">${esc(d.type)}</span>${d.field?`<span class="badge">${esc(d.field)}</span>`:''}${d.example?`<span class="tag">${esc(t('example'))}</span>`:d.local?'<span class="tag">this device</span>':''}</div>
   <h3 style="font-size:18px">${esc(d.title)}</h3>${d.desc?`<p class="muted" style="font-size:14.5px">${esc(d.desc)}</p>`:''}
   <div class="meta"><b>${esc(d.who)}</b>${vBadge(d.by)}<span>${esc(d.uni)}</span>${d.real?`<span>${responders('research',d.id).length} interested</span>`:''}</div>
   ${mine?`${rs.length?`<div class="meta">${rs.map(r=>`<span class="badge">${esc(NAMES[r.by]||roleName(r.role))}, ${esc(r.uni)}</span>`).join('')}</div>`:''}<div><button class="btn btn--sm btn--ghost" data-act="del:research:${esc(d.id)}">Remove</button></div>`
   :`<div><button class="btn btn--sm ${on?'on':''}" data-act="resp:research:${esc(d.id)}" aria-pressed="${on}">${on?'Interest sent ✓':"I'm interested"}</button></div>`}</article>`;
}
function recList(){
  const q=S.recQ.trim().toLowerCase();
  const rows=[...all('endorse').map(d=>({...d,real:true,who:ownerName(d)})),...EX_RECS.map(x=>({...x,example:true}))];
  return rows.filter(r=>!q||(r.name+' '+r.forUni+' '+(r.skills||[]).join(' ')).toLowerCase().includes(q));
}
function recCards(){
  const rows=recList();
  if(!rows.length)return `<div class="empty">No endorsements match that name.</div>`;
  return rows.map(r=>{const mine=!r.example&&isMine(r);
    return `<article class="card stack" style="gap:8px"><div class="row">${av(r.name)}<div class="grow"><b style="font-size:16.5px">${esc(r.name)}</b><div class="meta"><span>${esc(r.forUni||'')}</span>${r.example?`<span class="tag">${esc(t('example'))}</span>`:r.local?'<span class="tag">this device</span>':''}</div></div></div>
    <p>${esc(r.text)}</p><div class="meta">${(r.skills||[]).map(s=>`<span class="badge">${esc(s)}</span>`).join('')}</div>
    <div class="meta">Endorsed by <b>${esc(r.who)}</b> ${roleBadge(r.role)}${vBadge(r.by)} <span>${esc(r.uni)}</span></div>${mine?`<div><button class="btn btn--sm btn--ghost" data-act="del:endorse:${esc(r.id)}">Remove</button></div>`:''}</article>`}).join('');
}
const refreshRecs=()=>{const el=$('#rec-list');if(el)el.innerHTML=recCards()};
function deskBody(){
  const tab=S.deskTab,lect=S.role==='lecturer';
  if(tab==='lectures')return `<div class="sec-h"><h2>Guest Lecture Exchange</h2>${btnAct('compose:lecture','Post','btn--sm')}</div><div class="grid2">${lectureList().map(lectureCard).join('')}</div>`;
  if(tab==='slots')return `<div class="sec-h"><h2>Shared open slots</h2>${btnAct('compose:slot','Share a slot','btn--sm')}</div><p class="muted" style="margin:0 0 10px;font-size:14px">Free times other lecturers have published. Book one and it lands on your calendar in Me.</p><section class="card">${slotList().map(slotCard).join('')}</section>`;
  if(tab==='research')return `<div class="sec-h"><h2>Research and consultancy match</h2>${btnAct('compose:research','Post','btn--sm')}</div><div class="grid2">${researchList().map(researchCard).join('')}</div>`;
  return `<div class="sec-h"><h2>Recommendation Hub</h2>${lect?btnAct('compose:endorse','Endorse someone','btn--sm'):''}</div>
   <div class="note" style="margin-bottom:10px"><span>${lect?'':'Only lecturers can write endorsements. '}Roles are self-declared unless you see a Verified badge, which a moderator has confirmed.</span></div>
   <label class="search" style="margin-bottom:12px"><span aria-hidden="true">⌕</span><input id="rec-q" type="search" placeholder="Search by name, university or skill…" value="${esc(S.recQ)}" aria-label="Search endorsements"></label><div class="grid2" id="rec-list">${recCards()}</div>`;
}
function deskView(){
  return `<button class="back" data-act="desk-close">← ${esc(t('home'))}</button><div class="sec-h" style="margin-top:6px"><h1 style="font-size:28px">Lecturer Desk</h1></div>${chipRow()}<div>${deskBody()}</div>`;
}
function lecturerBlock(){
  const ls=lectureList().filter(d=>d.status!=='matched').slice(0,3);
  const nSlots=slotList().length,nRes=researchList().length;
  return `<section><div class="sec-h"><h2>Lecturer Desk</h2><button class="back" data-act="desk-open:lectures">Open →</button></div>
   <div class="grid2" style="margin-bottom:12px">${[['lectures','Guest lectures',lectureList().length],['slots','Open slots',nSlots],['research','Research match',nRes],['recs','Recommendations',recList().length]].map(x=>`<button class="card card--flat" style="text-align:left" data-act="desk-open:${x[0]}"><b style="font-family:var(--f-display);font-size:26px">${x[2]}</b><div class="muted">${x[1]}</div></button>`).join('')}</div>
   <div class="list">${ls.map(lectureCard).join('')}</div></section>`;
}
function roleBlock(){return S.role==='lecturer'?lecturerBlock():roleBlockBase()}
function pageView(){
  if(S.room&&S.tab==='calls')return roomView();
  if(S.tab==='home'&&S.page==='desk')return deskView();
  return {home:homeView,spaces:spacesView,calls:callsView,opps:oppsView,me:meView}[S.tab]();
}

/* ---------- calendar uses shared slots and every Open Line ---------- */
function weekEvents(offset){
  const d=addDays(offset),w=d.getDay(),ev=[];
  const T={student:{1:[['08:00','Calculus I lecture']],2:[['10:00','Intro to Programming lab']],3:[['08:00','Calculus I lecture'],['14:00','Entrepreneurship']],4:[['10:00','Intro to Programming lab'],['16:00','CAT revision']],5:[['09:00','Communication Skills']]},
   lecturer:{1:[['10:00','Lecture: Microeconomics']],2:[['15:00','Office hours']],3:[['10:00','Lecture: Microeconomics']],4:[['14:00','Department meeting']],5:[['11:00','Marking time']]},
   staff:{1:[['08:00','Front desk shift']],2:[['08:00','Front desk shift']],3:[['08:00','Front desk shift'],['12:30','Guild call']],4:[['08:00','Front desk shift']],5:[['08:00','Front desk shift']]}}[S.role];
  (T[w]||[]).forEach(e=>ev.push({time:e[0],text:e[1],kind:'class'}));
  lineList().forEach(l=>{if(l.s.toDateString()===d.toDateString()){if(isGoing(l.id))ev.push({time:hhmm(l.s),text:l.title,kind:'rsvp'});else if(S.overlay)ev.push({time:hhmm(l.s),text:l.title+' ('+l.uni+')',kind:'national'})}});
  slotList().forEach(s=>{const sd=new Date(s.start);if(sd.toDateString()===d.toDateString()){
    if(!s.example&&isMine(s))ev.push({time:hhmm(sd),text:'My open slot: '+s.text,kind:'slot'});
    else if(isOn('slot',s.id))ev.push({time:hhmm(sd),text:'Booked: '+s.text+' ('+s.uni+')',kind:'rsvp'});
    else if(S.overlay)ev.push({time:hhmm(sd),text:s.text+' ('+s.uni+')',kind:'national'})}});
  return ev.sort((a,b)=>a.time.localeCompare(b.time));
}

/* ---------- compose sheets ---------- */
function sheetHtmlBase(){
  const sh=S.sheet;if(!sh)return '';
  let title='',body='';
  if(sh.type==='role'){title=t('roleq');body=`<div class="seg" role="group" style="grid-template-columns:1fr">${['student','lecturer','staff'].map(r=>`<button data-act="role:${r}" aria-pressed="${S.role===r}" style="flex-direction:row;justify-content:space-between;padding:14px"><span>${esc(roleName(r))}</span><small>${r==='student'?'Unit Hubs, Open Lines, projects':r==='lecturer'?'Guest lectures, calendars, research':'Guilds, job swaps, mentorship'}</small></button>`).join('')}</div>`}
  if(sh.type==='apply'){title='Before you apply';body=`<p>This listing is an example, so there is no real application behind it. When real listings arrive, check these first:</p><ul class="rules"><li>Confirm it on the organisation's official website or office.</li><li>Never send money, including "processing" or "registration" fees.</li><li>Share your documents only with a verified contact.</li></ul><div>${btnAct('sheet-x','Got it')}</div>`}
  if(sh.type==='compose'){
    const k=sh.kind;
    const T={post:'Share with every campus',lecture:'Post a guest lecture',slot:'Share a free slot',opp:'Post an opportunity',line:'Host an Open Line',research:'Post a research or consultancy call',endorse:'Endorse someone'};
    title=T[k]||'Post';
    const f={
     post:`<label class="field">Space<select id="cm-space">${['General','Idea & Project Lab',...HUBS.map(h=>h.name),...INTERESTS.map(i=>i.name),...GUILDS.map(g=>g.name)].map(n=>`<option ${n===sh.space?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`,
     lecture:`<label class="field">I want to<select id="cm-type"><option value="offer">Offer a guest lecture</option><option value="request">Request a guest lecture</option></select></label><label class="field">Topic<input id="cm-title" maxlength="90" placeholder="e.g. Devolution case law"></label><label class="field">Format<select id="cm-mode"><option>Virtual live</option><option>Recorded</option><option>In person</option></select></label>`,
     slot:`<label class="field">Day<select id="cm-day">${dayOpts(14)}</select></label><label class="field">Time<input id="cm-time" type="time" value="15:00"></label><label class="field">Length<select id="cm-dur"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>`,
     opp:`<label class="field">Type<select id="cm-type">${OPP_TYPES.map(o=>`<option ${o===(S.role==='staff'?'Job swap':'')?'selected':''}>${o}</option>`).join('')}</select></label><label class="field">Where<input id="cm-place" maxlength="60" placeholder="e.g. Nairobi or Online"></label>`,
     line:`<label class="field">Title<input id="cm-title" maxlength="90" placeholder="e.g. CAT survival: Statistics"></label><div class="row row--wrap"><label class="field grow">Day<select id="cm-day">${dayOpts(14)}</select></label><label class="field grow">Time<input id="cm-time" type="time" value="19:00"></label></div><div class="row row--wrap"><label class="field grow">Length<select id="cm-dur"><option value="30">30 min</option><option value="45" selected>45 min</option><option value="60">60 min</option><option value="90">90 min</option></select></label><label class="field grow">Language<select id="cm-lang"><option>English</option><option>Kiswahili</option><option>English / Sheng</option></select></label></div><label class="field">Call link (optional, https only)<input id="cm-link" type="url" inputmode="url" placeholder="https://meet.google.com/…"></label><label class="field">Topics, separated by commas<input id="cm-tags" maxlength="80" placeholder="Careers, CAT prep"></label>`,
     research:`<label class="field">Type<select id="cm-type"><option>Co-author</option><option>Grant call</option><option>Consultancy</option><option>Partnership</option></select></label><label class="field">Title<input id="cm-title" maxlength="100" placeholder="e.g. Looking for a co-author in soil science"></label><label class="field">Field<input id="cm-field" maxlength="50" placeholder="e.g. Agribusiness"></label>`,
     endorse:`<label class="field">Who are you endorsing?<input id="cm-name" maxlength="60" placeholder="Full name"></label><label class="field">Their university<select id="cm-uni">${UNIS.map(u=>`<option value="${esc(u.s)}">${esc(u.name)}</option>`).join('')}</select></label><label class="field">Skills, separated by commas<input id="cm-tags" maxlength="80" placeholder="Research, Teaching"></label>`
    }[k]||'';
    const lab={slot:'Note',opp:'Title and details',endorse:'What they did well',line:'About this Open Line',lecture:'Details',research:'Details'}[k]||'Details';
    body=`${f}<label class="field">${lab}<textarea id="cm-text" maxlength="600" placeholder="Write it clearly and kindly"></textarea></label><div id="cm-err" class="muted" style="color:var(--live);font-size:13.5px" role="alert"></div>
     <div class="row row--wrap">${btnAct('compose-go','Publish')}${btnAct('sheet-x','Cancel','btn--ghost')}</div><p class="muted" style="font-size:12.5px">Posts are shared with other viewers of this page. Be kind; moderators can remove content.</p>`;
  }
  return `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet__h"><h2>${esc(title)}</h2><button class="x" data-act="sheet-x" aria-label="Close">×</button></div>${body}</div></div>`;
}
async function submitComposeBase(){
  const k=S.sheet.kind,V=id=>{const e=$('#'+id);return e?e.value.trim():''},err=m=>{const e=$('#cm-err');if(e)e.textContent=m};
  const txt=V('cm-text');
  const tags=V('cm-tags').split(',').map(s=>s.trim()).filter(Boolean).slice(0,5);
  const need=(cond,m)=>{if(!cond){err(m);return true}return false};
  let name='posts',doc,after=()=>{};
  if(k==='post'){if(need(txt,'Write something first'))return;doc={kind:'post',text:txt,space:V('cm-space')==='General'?'':V('cm-space')};after=()=>{if(S.tab==='home')refreshFeed()}}
  else if(k==='opp'){if(need(txt,'Add a title and details'))return;doc={kind:'opp',type:V('cm-type'),place:V('cm-place')||'Anywhere',text:txt};after=()=>{if(S.tab==='opps')refreshOpps()}}
  else if(k==='lecture'){if(need(V('cm-title'),'Add a topic'))return;name='lectures';doc={type:V('cm-type'),topic:V('cm-title'),mode:V('cm-mode'),desc:txt,status:'open'};after=()=>{S.deskTab='lectures';if(S.role==='lecturer'){S.tab='home';S.page='desk'}render(true)}}
  else if(k==='slot'){
    const d=addDays(+V('cm-day'),+(V('cm-time')||'15:00').slice(0,2),+(V('cm-time')||'15:00').slice(3,5));
    if(need(d.getTime()>Date.now(),'Pick a time in the future'))return;
    name='slots';doc={start:d.getTime(),dur:+V('cm-dur')||30,text:txt||'Open for a guest session'};after=()=>render(true);
  }
  else if(k==='line'){
    if(need(V('cm-title'),'Add a title'))return;
    const d=addDays(+V('cm-day'),+(V('cm-time')||'19:00').slice(0,2),+(V('cm-time')||'19:00').slice(3,5));
    if(need(d.getTime()>Date.now(),'Pick a time in the future'))return;
    const raw=V('cm-link'),link=raw?safeLink(raw):'';
    if(need(!raw||link,'The call link must start with https://'))return;
    name='lines';doc={title:V('cm-title'),start:d.getTime(),dur:+V('cm-dur')||45,lang:V('cm-lang'),link,tags,desc:txt};after=()=>{if(S.tab==='calls'||S.tab==='home')render(true)};
  }
  else if(k==='research'){if(need(V('cm-title'),'Add a title'))return;name='research';doc={type:V('cm-type'),title:V('cm-title'),field:V('cm-field'),desc:txt};after=()=>{S.deskTab='research';if(S.role==='lecturer'){S.tab='home';S.page='desk'}render(true)}}
  else if(k==='endorse'){if(need(V('cm-name'),'Add the person\'s name'))return;if(need(txt,'Say what they did well'))return;name='endorse';doc={name:V('cm-name'),forUni:V('cm-uni'),skills:tags,text:txt};after=()=>{S.deskTab='recs';render(true)}}
  S.sheet=null;renderSheet();
  await (name==='posts'?createPost(doc):createDoc(name,doc));after();
}

/* ---------- actions ---------- */
function act2(a,r,el,ev){
  switch(a){
   case 'meet':startMeet();return true;
   case 'meet-cancel':stopLooking();S.match={state:'idle'};render(true);return true;
   case 'rsvp':{toggleResp('rsvp',r);toast(isGoing(r)?'You are going. Added to your calendar.':'RSVP removed');return true}
   case 'room':{const l=allLines().find(x=>x.id===r);if(!l)return true;
     openRoom({kind:'line',name:roomSlug(l.id),title:l.title,sub:`${fmtWhen(l.s)} · ${l.dur} min · hosted by ${l.host}, ${l.uni}`,link:l.link,line:l});return true}
   case 'room-leave':leaveRoomQuiet();render();return true;
   case 'hand':myHand=!myHand;if(ROOM)ROOM.presence({hand:myHand?Date.now():null}).catch(()=>{});el.textContent=myHand?'Lower hand':'Raise hand';el.classList.toggle('on',myHand);el.classList.toggle('btn--ghost',!myHand);el.setAttribute('aria-pressed',String(myHand));return true;
   case 'react':if(ROOM&&ROOM.connected())ROOM.emit('chat',{k:'react',t:r,role:S.role,uni:myShort()}).catch(()=>{});else toast('Not connected to the room yet');return true;
   case 'desk-open':S.tab='home';S.page='desk';S.deskTab=r||'lectures';render();return true;
   case 'desk-close':S.page=null;render();return true;
   case 'dt':S.deskTab=r;render(true);return true;
   case 'resp':{const i=r.indexOf(':');const type=r.slice(0,i),id=r.slice(i+1);toggleResp(type,id);toast(isOn(type,id)?'Sent through the platform':'Withdrawn');return true}
   case 'accept':{const[id,by]=r.split(':');patchDoc('lectures',id,{status:'matched',matchedBy:by}).then(()=>{toast('Accepted. Arrange the details in a message or call.');softRender()});return true}
   case 'del':{const i=r.indexOf(':');removeDoc(r.slice(0,i),r.slice(i+1)).then(()=>{toast('Removed');softRender()});return true}
  }
  return false;
}
document.addEventListener('submit',e=>{if(e.target.id==='room-form'){e.preventDefault();sendChat()}});
document.addEventListener('input',e=>{if(e.target.id==='rec-q'){S.recQ=e.target.value;refreshRecs()}});

/* ---------- capabilities: shared collections, names, live room ---------- */
async function resolveNames(){
  if(!userNs)return;
  const ids=new Set();
  Object.values(DB).forEach(arr=>arr.forEach(d=>{if(d.by)ids.add(d.by)}));
  roomPeers.forEach(p=>{if(p.by)ids.add(p.by)});
  const need=[...ids].filter(i=>!(i in NAMES));
  if(!need.length)return;
  try{const ps=await userNs.profiles(need);need.forEach(i=>{NAMES[i]=(ps[i]&&ps[i].name)||''})}catch(e){}
}
function onDb(n){
  if(n==='posts'){dbPosts=DB.posts;refreshFeed();refreshOpps();return}
  softRender();
}
function watch(n,lim){
  dbc.collection(n).orderBy('ts','desc').limit(lim).onSnapshot(async snap=>{
    DB[n]=snap.docs.map(d=>({id:d.id,...d.data()}));await resolveNames();onDb(n);
  },()=>{});
}
async function initCaps(){
  try{
    if(!(window.claude&&claude.use))return;
    userNs=await claude.use('user');
    if(userNs){const m=await userNs.me();meInfo={id:m.id,name:m.name||'',avatarUrl:m.avatarUrl||''};try{canWrite=(await userNs.can('data.write'))!==false}catch(e){canWrite=true}render(true)}
    dbc=await claude.use('db');
    if(dbc)['posts','lines','lectures','research','slots','endorse'].forEach(n=>watch(n,150)),watch('resp',500);
  }catch(e){}
  try{roomNs=window.claude&&claude.use?await claude.use('room'):null}catch(e){roomNs=null}
}
