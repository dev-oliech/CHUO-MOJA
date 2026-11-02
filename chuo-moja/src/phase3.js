/* =====================================================================
   PHASE 3: moderator-confirmed roles, Staff Guild Hub, Project Lab, full campus map
   ===================================================================== */
['verified','claims','qa','mentor','projects'].forEach(n=>{DB[n]=[]});
Object.assign(S,{guildTab:'help',guildSel:'',qaOpen:{},labQ:'',mapQ:'',feedUni:''});
let VER={},MYCLAIM=null,isAdmin=false;
const vBadge=by=>{const v=by&&VER[by];return v?`<span class="badge badge--ver" title="Confirmed by a moderator">✓ Verified ${esc(roleName(v.role).toLowerCase())}</span>`:''};
const myVer=()=>(meInfo.id&&VER[meInfo.id])||null;
const myClaim=()=>isAdmin?(DB.claims.find(c=>c.id===meInfo.id)||null):MYCLAIM;
const GUILD_NAMES=GUILDS.map(g=>g.name);
const wrapSheet=(title,body)=>`<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet__h"><h2>${esc(title)}</h2><button class="x" data-act="sheet-x" aria-label="Close">×</button></div>${body}</div></div>`;
const NEWK=['qa','answer','mentor','project'];

/* ---------- names: also resolve the people being verified ---------- */
async function resolveNames(){
  if(!userNs)return;
  const ids=new Set();
  Object.values(DB).forEach(arr=>arr.forEach(d=>{if(d.by)ids.add(d.by)}));
  DB.claims.forEach(c=>ids.add(c.id));DB.verified.forEach(v=>ids.add(v.id));
  roomPeers.forEach(p=>{if(p.by)ids.add(p.by)});
  const need=[...ids].filter(i=>!(i in NAMES));
  if(!need.length)return;
  try{const ps=await userNs.profiles(need);need.forEach(i=>{NAMES[i]=(ps[i]&&ps[i].name)||''})}catch(e){}
}
function onDb(n){
  if(n==='posts'){dbPosts=DB.posts;refreshFeed();refreshOpps();return}
  if(n==='verified'){VER={};DB.verified.forEach(v=>{VER[v.id]=v})}
  softRender();
}

/* ---------- verification ---------- */
function verifyCard(){
  const v=myVer(),c=myClaim();let body;
  const eu=meInfo.emailUni?`<div class="note note--info"><span><b>Your university email is confirmed:</b> ${esc(meInfo.emailUni)}. Your posts show this campus automatically.</span></div>`:'';
  if(v){body=`<div class="note note--info"><span><b>You are verified as a ${esc(roleName(v.role).toLowerCase())} at ${esc(v.uni)}.</b> A moderator confirmed this, so your badge shows beside your name on posts, lectures, endorsements and in rooms.</span></div>${S.role!==v.role?`<p class="muted" style="font-size:13px">You are browsing as ${esc(roleName(S.role).toLowerCase())}. Your badge always shows your verified role.</p>`:''}`}
  else if(c){body=`<div class="note"><span><b>Waiting for a moderator.</b> You asked to be confirmed as a ${esc(roleName(c.role).toLowerCase())} at ${esc(c.uni)}. This can take a day or two.</span></div><div>${btnAct('claim-withdraw','Withdraw my claim','btn--sm btn--ghost')}</div>`}
  else{body=`<p class="muted" style="font-size:14px">Anyone can pick a role in this prototype. A <span class="badge badge--ver">✓ Verified</span> badge means a human moderator checked it. Ask for one if you are a lecturer or staff member (so others can trust endorsements and offers) or a student leading a project.</p>
    ${dbReady()?`<div>${btnAct('claim-open','Ask a moderator to confirm my role','btn--sm')}</div>`:`<div class="note"><span>Claims are saved on the shared page, so you need to be signed in with contributor access. Ask the page owner to share it with you.</span></div>`}`}
  return `<section class="card stack"><div class="sec-h" style="margin:0"><h2>Verification</h2></div>${eu}${body}</section>${modCard()}`;
}
function modCard(){
  if(!isAdmin)return '';
  const q=DB.claims,vs=DB.verified;
  return `<section class="card stack" id="mod-card"><div class="sec-h" style="margin:0"><h2>Moderator queue</h2><span>${q.length} waiting</span></div>
   <p class="muted" style="font-size:13px">You see this because you hold editor access to this page. Check each claim before approving: phone the department, look at the staff directory, or ask the class rep.</p>
   <div>${q.length?q.map(c=>`<div class="mod-row"><div class="grow"><b>${esc(NAMES[c.id]||'Unnamed person')}</b> ${roleBadge(c.role)}<div class="meta"><span>${esc(c.uni)}</span>${c.dept?`<span>${esc(c.dept)}</span>`:''}</div><p style="font-size:14px;margin-top:4px">${esc(c.proof)}</p></div><div class="row"><button class="btn btn--sm" data-act="vapprove:${esc(c.id)}">Approve</button><button class="btn btn--sm btn--ghost" data-act="vreject:${esc(c.id)}">Reject</button></div></div>`).join(''):'<div class="empty">No claims waiting.</div>'}</div>
   ${vs.length?`<details><summary style="cursor:pointer;font-weight:700">Verified people (${vs.length})</summary><div>${vs.map(v=>`<div class="mod-row"><div class="grow"><b>${esc(NAMES[v.id]||'Unnamed person')}</b> ${vBadge(v.id)}<div class="meta"><span>${esc(v.uni)}</span></div></div><button class="btn btn--sm btn--ghost" data-act="vrevoke:${esc(v.id)}">Revoke</button></div>`).join('')}</div></details>`:''}</section>`;
}
function accountCard(){
  if(!window.__SELFHOST)return '';
  return `<section class="card stack"><div class="sec-h" style="margin:0"><h2>Your account</h2></div>
   <p class="muted" style="font-size:14px">You are signed in with your university email. It is never shown to other people.</p>
   <div class="row row--wrap">${btnAct('acct-logout','Sign out','btn--sm btn--ghost')}<a class="btn btn--sm btn--ghost" href="/api/account/export" download>Download my data</a></div>
   ${S.delAsk?`<div class="note"><span><b>Delete your account and everything you posted?</b> This cannot be undone.</span></div><div class="row row--wrap">${btnAct('acct-delete','Yes, delete everything','btn--sm')}${btnAct('acct-delete-no','Keep my account','btn--sm btn--ghost')}</div>`:`<div>${btnAct('acct-delete-ask','Delete my account and data','btn--sm btn--ghost')}</div>`}</section>`;
}
function meView(){
  let h=meViewBase();
  if(meInfo.emailUni)h=h.replace('<select data-bind="uni" id="uni-sel">','<select data-bind="uni" id="uni-sel" disabled title="Set by your university email">');
  const i=h.indexOf('</section>')+10;
  return h.slice(0,i)+verifyCard()+accountCard()+h.slice(i);
}
function claimBody(){
  return `<p class="muted" style="font-size:14px">A moderator reads this and, if it checks out, switches on a Verified badge beside your name. No email or ID number is needed.</p>
   <label class="field">I am a<select id="cl-role">${['student','lecturer','staff'].map(r=>`<option value="${r}" ${r===S.role?'selected':''}>${esc(roleName(r))}</option>`).join('')}</select></label>
   <label class="field">University<select id="cl-uni">${UNIS.map(u=>`<option ${u.name===S.uni?'selected':''}>${esc(u.name)}</option>`).join('')}</select></label>
   <label class="field">Department or office<input id="cl-dept" maxlength="80" placeholder="e.g. School of Nursing, or Registry" value="${esc(S.dept)}"></label>
   <label class="field">How can a moderator check this?<textarea id="cl-proof" maxlength="400" placeholder="e.g. Year 3 BSc Nursing; my class rep can confirm. Or: Lecturer, listed on my department's staff web page."></textarea></label>
   <div id="cm-err" style="color:var(--live);font-size:13.5px" role="alert"></div>
   <div class="row row--wrap">${btnAct('claim-go','Send to a moderator')}${btnAct('sheet-x','Cancel','btn--ghost')}</div>
   <p class="muted" style="font-size:12.5px">Editors of this page can read your claim. Do not write ID numbers, phone numbers or passwords.</p>`;
}
async function submitClaim(){
  const V=id=>{const e=$('#'+id);return e?e.value.trim():''},err=m=>{const e=$('#cm-err');if(e)e.textContent=m};
  if(!V('cl-proof')){err('Tell the moderator how they can check this');return}
  if(!dbReady()){err('You need to be signed in with contributor access to send a claim');return}
  const doc={by:meInfo.id,role:V('cl-role'),uni:uniShort(V('cl-uni')),dept:V('cl-dept'),proof:V('cl-proof'),ts:Date.now()};
  try{await dbc.collection('claims').doc(meInfo.id).set(doc);MYCLAIM={id:meInfo.id,...doc};S.sheet=null;renderSheet();toast('Sent. A moderator will look at it.');render(true)}
  catch(e){err('Could not send right now. Try again in a moment.')}
}
async function approveClaim(uid){
  const c=DB.claims.find(x=>x.id===uid);if(!c)return;
  try{await dbc.collection('verified').doc(uid).set({role:c.role,uni:c.uni,ts:Date.now(),by:meInfo.id});await dbc.collection('claims').doc(uid).delete();toast('Verified')}
  catch(e){toast('Could not approve. Only editors of this page can.')}
}
async function dropDoc(col,uid,msg){try{await dbc.collection(col).doc(uid).delete();toast(msg)}catch(e){toast('Could not do that right now')}}

/* ---------- Staff Guild Hub ---------- */
const EX_QA=[
 {id:'qx1',q:'How do you reconcile HELB remittances against student fee statements?',desc:'Our finance office loses days each semester matching them by hand.',guild:'Finance & Bursaries',who:'Ms. Wafula J.',uni:'KU',status:'open',example:true},
 {id:'qx2',q:'Campus Wi-Fi portal keeps dropping at peak hours. What worked for you?',desc:'About 6,000 devices on a captive portal, and the authentication server times out around 8pm.',guild:'ICT Officers',who:'Mr. Mutua D.',uni:'Machakos Uni',status:'open',example:true},
 {id:'qx3',q:'Does anyone have a graduation clearance checklist template?',desc:'We want one clear list so students stop walking between six offices.',guild:'Registry & Admissions',who:'Mrs. Njoroge E.',uni:'Egerton',status:'open',example:true}];
const EX_MENT=[
 {id:'mx1',type:'offer',guild:'ICT Officers',title:'Happy to mentor new ICT officers on campus network design',desc:'Twelve years in university ICT. I can do a monthly 30-minute call.',who:'Mr. Kiprop L.',uni:'Moi',example:true},
 {id:'mx2',type:'seek',guild:'Registry & Admissions',title:'Looking for a mentor on moving into registry management',desc:'I am a records clerk, two years in, and want to understand the path.',who:'Ms. Atieno P.',uni:'Maseno',example:true},
 {id:'mx3',type:'offer',guild:'Librarians',title:'Setting up an open-access repository',desc:'I can walk a small team through an institutional repository from scratch.',who:'Mrs. Chebet R.',uni:'Egerton',example:true}];
const byGuild=d=>!S.guildSel||d.guild===S.guildSel;
function qaList(){return [...all('qa').map(d=>({...d,real:true,who:ownerName(d)})),...EX_QA].filter(byGuild)}
function mentorList(){
  const mine=all('mentor').filter(isMine);
  const real=all('mentor').map(d=>({...d,real:true,who:ownerName(d)}));
  const rows=[...real,...EX_MENT].filter(byGuild);
  rows.forEach(d=>{d.match=!isMine(d)&&mine.some(m=>m.guild===d.guild&&m.type!==d.type)});
  return rows.sort((a,b)=>(b.match===true)-(a.match===true));
}
function answersFor(id){return [...DB.resp.filter(r=>r.type==='answer'&&r.target===id),...((S.loc.answers)||[]).filter(r=>r.target===id)].sort((a,b)=>a.ts-b.ts)}
function qaCard(d){
  const mine=!d.example&&isMine(d),ans=answersFor(d.id),open=!!S.qaOpen[d.id];
  return `<article class="card stack" style="gap:10px"><div class="row row--wrap" style="gap:6px">${d.guild?`<span class="badge badge--staff">${esc(d.guild)}</span>`:''}${d.status==='solved'?'<span class="badge badge--student">Solved</span>':''}${d.example?`<span class="tag">${esc(t('example'))}</span>`:d.local?'<span class="tag">this device</span>':''}</div>
   <h3 style="font-size:18px">${esc(d.q)}</h3>${d.desc?`<p class="muted" style="font-size:14.5px">${esc(d.desc)}</p>`:''}
   <div class="meta"><b>${esc(d.who)}</b>${vBadge(d.by)}<span>${esc(d.uni)}</span><span>${ans.length} answer${ans.length===1?'':'s'}</span></div>
   ${open?`<div>${ans.length?ans.map(a=>`<div class="q-ans"><div class="meta"><b>${esc(NAMES[a.by]||(a.local?(meInfo.name||'You'):roleName(a.role)))}</b>${vBadge(a.by)}<span>${esc(a.uni||'')}</span></div><p style="font-size:14.5px">${esc(a.text)}</p></div>`).join(''):'<p class="muted" style="font-size:13.5px">No answers yet. Be the first to help.</p>'}</div>`:''}
   <div class="row row--wrap"><button class="btn btn--sm btn--ghost" data-act="qa-toggle:${esc(d.id)}" aria-expanded="${open}">${open?'Hide answers':'Show answers'}</button><button class="btn btn--sm" data-act="answer:${esc(d.id)}">Answer</button>${mine&&d.status!=='solved'?`<button class="btn btn--sm btn--ghost" data-act="solve:${esc(d.id)}">Mark solved</button>`:''}${mine?`<button class="btn btn--sm btn--ghost" data-act="del:qa:${esc(d.id)}">Remove</button>`:''}</div></article>`;
}
function mentorCard(d){
  const mine=!d.example&&isMine(d),on=isOn('mentor',d.id),rs=mine?responders('mentor',d.id):[];
  return `<article class="card stack" style="gap:10px"><div class="row row--wrap" style="gap:6px"><span class="badge ${d.type==='offer'?'badge--staff':''}">${d.type==='offer'?'Offering mentorship':'Looking for a mentor'}</span>${d.guild?`<span class="badge">${esc(d.guild)}</span>`:''}${d.match?'<span class="badge badge--student">Matches your post</span>':''}${d.example?`<span class="tag">${esc(t('example'))}</span>`:d.local?'<span class="tag">this device</span>':''}</div>
   <h3 style="font-size:18px">${esc(d.title)}</h3>${d.desc?`<p class="muted" style="font-size:14.5px">${esc(d.desc)}</p>`:''}
   <div class="meta"><b>${esc(d.who)}</b>${vBadge(d.by)}<span>${esc(d.uni)}</span>${d.real?`<span>${responders('mentor',d.id).length} replied</span>`:''}</div>
   ${mine?`${rs.length?`<div class="pill-row">${rs.map(r=>`<span class="badge">${esc(NAMES[r.by]||roleName(r.role))}, ${esc(r.uni)} ${vBadge(r.by)}</span>`).join('')}</div>`:'<p class="muted" style="font-size:13.5px">No replies yet.</p>'}<div><button class="btn btn--sm btn--ghost" data-act="del:mentor:${esc(d.id)}">Remove</button></div>`
   :`<div><button class="btn btn--sm ${on?'on':''}" data-act="resp:mentor:${esc(d.id)}" aria-pressed="${on}">${on?'Sent ✓':(d.type==='offer'?'Ask for mentoring':'Offer to mentor')}</button></div>`}</article>`;
}
const isSwap=o=>o.type==='Job swap';
function guildBody(tab){
  if(tab==='help'){const l=qaList();return `<div class="sec-h"><h2>Help desk</h2>${btnAct('compose:qa','Ask','btn--sm')}</div><p class="muted" style="margin:0 0 10px;font-size:14px">Ask a practical question and people from other campuses answer. Answers show a Verified badge when a moderator has confirmed the person.</p><div class="grid2">${l.length?l.map(qaCard).join(''):'<div class="empty">No questions in this guild yet. Ask the first one.</div>'}</div>`}
  if(tab==='mentor'){const l=mentorList();return `<div class="sec-h"><h2>Mentorship</h2>${btnAct('compose:mentor','Post','btn--sm')}</div><p class="muted" style="margin:0 0 10px;font-size:14px">Offer to mentor, or ask for a mentor. Posts in the same guild that fit yours are shown first.</p><div class="grid2">${l.length?l.map(mentorCard).join(''):'<div class="empty">Nothing here yet.</div>'}</div>`}
  return `<div class="sec-h"><h2>Job swaps</h2>${btnAct('swap-new','Post a swap','btn--sm')}</div><p class="muted" style="margin:0 0 10px;font-size:14px">Swap posts between campuses, for example Nairobi for Mombasa at the same grade. Check any swap with your HR office before agreeing.</p><div class="grid2" id="opp-list" data-swap="1">${oppCards(isSwap)}</div>`;
}
function guildView(){
  const tab=S.guildTab||'help';
  return `<button class="back" data-act="page-close">← ${esc(t('back'))}</button><div class="sec-h" style="margin-top:6px"><h1 style="font-size:28px">Staff Guild Hub</h1></div>
   <p class="muted" style="margin:0 0 12px">Help desk, mentorship and job swaps for the people who keep Kenya's campuses running.</p>
   <label class="field" style="max-width:360px;margin-bottom:10px">Guild<select id="guild-sel"><option value="">All guilds</option>${GUILD_NAMES.map(n=>`<option ${n===S.guildSel?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
   <div class="chips" role="group" aria-label="Guild hub">${[['help','Help desk'],['mentor','Mentorship'],['swap','Job swaps']].map(c=>`<button class="chip" data-act="gt:${c[0]}" aria-pressed="${tab===c[0]}">${esc(c[1])}</button>`).join('')}</div>
   <div>${guildBody(tab)}</div>`;
}
function guildEntry(){
  const q=qaList().filter(d=>d.status!=='solved').length,m=mentorList().length,s=[...dbPosts.filter(p=>p.kind==='opp'&&p.type==='Job swap'),...S.local.filter(p=>p.kind==='opp'&&p.type==='Job swap'),...OPPS.filter(isSwap)].length;
  return `<section><button class="card card--flat entry" data-act="page-open:guild"><div class="grow"><b>Staff Guild Hub</b><small>${q} open questions · ${m} mentorship posts · ${s} job swaps</small></div><span aria-hidden="true">→</span></button></section>`;
}

/* ---------- Project Lab ---------- */
const EX_PROJ=PROJECTS.map(p=>({id:p.id,title:p.title,tags:p.need.replace(/^Needs:\s*/,'').split(/,\s*/),desc:'',who:'A student lead',uni:p.uni,example:true}));
function projList(){
  const q=S.labQ.trim().toLowerCase();
  return [...all('projects').map(d=>({...d,real:true,who:ownerName(d)})),...EX_PROJ]
    .filter(d=>!q||(d.title+' '+(d.tags||[]).join(' ')+' '+(d.desc||'')).toLowerCase().includes(q));
}
function projCard(d){
  const mine=!d.example&&isMine(d),on=isOn('team',d.id),rs=mine?responders('team',d.id):[],n=responders('team',d.id).length;
  return `<article class="card stack" style="gap:10px"><div class="row row--wrap" style="gap:6px"><span class="badge badge--student">Project</span>${d.example?`<span class="tag">${esc(t('example'))}</span>`:d.local?'<span class="tag">this device</span>':''}</div>
   <h3 style="font-size:18px">${esc(d.title)}</h3>${d.desc?`<p class="muted" style="font-size:14.5px">${esc(d.desc)}</p>`:''}
   ${(d.tags||[]).length?`<div class="pill-row">${d.tags.map(x=>`<span class="badge">Needs: ${esc(x)}</span>`).join('')}</div>`:''}
   <div class="meta"><b>${esc(d.who)}</b>${vBadge(d.by)}<span>${esc(d.uni)}</span>${d.real?`<span>${n} want${n===1?'s':''} to join</span>`:''}</div>
   ${mine?`${rs.length?`<div class="pill-row">${rs.map(r=>`<span class="badge">${esc(NAMES[r.by]||roleName(r.role))}, ${esc(r.uni)} ${vBadge(r.by)}</span>`).join('')}</div>`:'<p class="muted" style="font-size:13.5px">Nobody has asked to join yet.</p>'}<div><button class="btn btn--sm btn--ghost" data-act="del:projects:${esc(d.id)}">Remove</button></div>`
   :`<div><button class="btn btn--sm ${on?'on':''}" data-act="resp:team:${esc(d.id)}" aria-pressed="${on}">${on?'Request sent ✓':'Join team'}</button></div>`}</article>`;
}
const refreshLab=()=>{const el=$('#lab-list');if(el){const l=projList();el.innerHTML=l.length?l.map(projCard).join(''):'<div class="empty">No projects match. Start one.</div>'}};
function labView(){
  return `<button class="back" data-act="page-close">← ${esc(t('back'))}</button><div class="sec-h" style="margin-top:6px"><h1 style="font-size:28px">Project Lab</h1>${btnAct('compose:project','Start a project','btn--sm')}</div>
   <p class="muted" style="margin:0 0 12px">Post an idea, say who you need, and students from other campuses ask to join. Teams are strongest when they mix universities and skills.</p>
   <label class="search" style="margin-bottom:12px"><span aria-hidden="true">⌕</span><input id="lab-q" type="search" placeholder="Search by idea or skill needed…" value="${esc(S.labQ)}" aria-label="Search projects"></label>
   <div class="grid2" id="lab-list">${projList().map(projCard).join('')||'<div class="empty">No projects match. Start one.</div>'}</div>`;
}
function studentBlock(){
  const mine=HUBS.filter(h=>has(S.joined,h.id)),show=mine.length?mine:HUBS.slice(0,4);
  return `<section><div class="sec-h"><h2>${esc(mine.length?t('yourhubs'):t('units'))}</h2><button class="back" data-act="goto:spaces:unit">${esc(t('spaces'))} →</button></div>
   <div class="grid2">${show.slice(0,4).map(h=>`<button class="card card--flat" style="text-align:left" data-act="hub:${h.id}"><b style="font-family:var(--f-display);font-size:17px">${esc(h.name)}</b><div class="meta" style="margin-top:4px"><span>${h.unis} universities</span><span class="mono">${h.members.toLocaleString('en-KE')} members</span></div><p class="muted" style="font-size:13.5px;margin-top:6px">${esc(h.hot)}</p></button>`).join('')}</div></section>
   <section><div class="sec-h"><h2>${esc(t('lab'))}</h2><button class="back" data-act="page-open:lab">Open Project Lab →</button></div><div class="grid2">${projList().slice(0,2).map(projCard).join('')}</div></section>`;
}
function roleBlock(){
  if(S.role==='lecturer')return lecturerBlock();
  if(S.role==='student')return studentBlock();
  return guildEntry()+roleBlockBase();
}

/* ---------- campus map ---------- */
const ACT_KEYS=['lines','lectures','research','slots','qa','mentor','projects'];
function actByUni(){const m={};[...DB.posts,...ACT_KEYS.flatMap(k=>DB[k])].forEach(d=>{if(d.uni)m[d.uni]=(m[d.uni]||0)+1});return m}
const townOf=s=>TOWNS.find(tw=>tw.u.includes(s));
const townAct=(tw,A)=>tw.u.reduce((n,s)=>n+(A[s]||0),0);
function mapSvg(){
  const X=lon=>((lon-33.5)*60).toFixed(1),Y=lat=>((5.1-lat)*60).toFixed(1),A=actByUni();
  const path='M'+KENYA.map(p=>X(p[0])+' '+Y(p[1])).join('L')+'Z';
  const pins=TOWNS.map(tw=>{const sel=S.mapSel===tw.k,n=townAct(tw,A),r=8+tw.u.length*1.4+Math.min(n,8);
    return `<g class="pin${n?' act':''}" role="button" tabindex="0" aria-label="${esc(tw.n)}: ${tw.u.length} universities, ${n} shared items" aria-pressed="${sel}" data-act="pin:${tw.k}"><circle class="halo" cx="${X(tw.lon)}" cy="${Y(tw.lat)}" r="${r}"/><circle class="core" cx="${X(tw.lon)}" cy="${Y(tw.lat)}" r="6"/></g>`}).join('');
  const s=TOWNS.find(x=>x.k===S.mapSel);
  const lab=s?`<text text-anchor="middle" x="${Math.max(80,Math.min(+X(s.lon),430))}" y="${+Y(s.lat)-20}">${esc(s.n)}</text>`:'';
  return `<svg viewBox="0 0 520 600" role="group" aria-label="Schematic map of Kenya with university towns. Red pins have shared activity."><path class="land" d="${path}"/><ellipse class="lake" cx="${X(36.1)}" cy="${Y(3.5)}" rx="9" ry="42"/>${pins}${lab}</svg>`;
}
function uniRow(u,A){
  const tw=townOf(u.s),n=A[u.s]||0;
  return `<div class="line" style="align-items:flex-start"><div class="grow"><b>${esc(u.name)}</b><div class="meta"><span class="badge">${esc(u.s)}</span><span>${tw?esc(tw.n):'Not on the map yet'}</span><span>${n} shared item${n===1?'':'s'}</span></div></div><div class="row row--wrap">${tw?`<button class="btn btn--sm btn--ghost" data-act="mapshow:${tw.k}">On map</button>`:''}<button class="btn btn--sm" data-act="uni-feed:${esc(u.s)}">See posts</button></div></div>`;
}
function mapResults(){
  const A=actByUni(),q=S.mapQ.trim().toLowerCase();
  if(q){const l=UNIS.filter(u=>(u.name+' '+u.s).toLowerCase().includes(q)).slice(0,15);return l.length?l.map(u=>uniRow(u,A)).join(''):`<div class="empty">No university matches "${esc(S.mapQ)}".</div>`}
  const tw=TOWNS.find(x=>x.k===S.mapSel);
  if(tw)return `<div class="sec-h" style="margin:0 0 6px"><h3 style="font-size:17px">${esc(tw.n)}</h3><button class="back" data-act="mapshow:">Clear</button></div>`+tw.u.map(s=>UNIS.find(u=>u.s===s)).filter(Boolean).map(u=>uniRow(u,A)).join('');
  const top=UNIS.filter(u=>A[u.s]).sort((a,b)=>A[b.s]-A[a.s]).slice(0,8);
  return top.length?`<div class="sec-h" style="margin:0 0 6px"><h3 style="font-size:17px">Most active campuses</h3></div>`+top.map(u=>uniRow(u,A)).join(''):`<p class="muted" style="font-size:14px">Nothing has been shared yet, so no campus is lit up. Search for a university, or tap a town on the map. Pins turn red when people there post, host an Open Line or start a project.</p>`;
}
const refreshMapRes=()=>{const el=$('#map-res');if(el)el.innerHTML=mapResults()};
function mapPanel(){
  const s=TOWNS.find(x=>x.k===S.mapSel),A=actByUni();
  const btn=`<div style="margin-top:12px"><button class="btn btn--sm btn--ghost" data-act="page-open:map">Open the full campus map →</button></div>`;
  if(!s)return `<p class="muted" style="font-size:13.5px">Tap a town to see the universities there. Bigger circles mean more universities. Red means people there have shared something.</p>${btn}`;
  const full=s.u.map(sn=>UNIS.find(u=>u.s===sn)).filter(Boolean);
  return `<div><h3 style="font-size:17px">${esc(s.n)}</h3><div class="row row--wrap" style="gap:6px;margin-top:8px">${full.map(u=>`<span class="badge">${esc(u.name)}${A[u.s]?` · ${A[u.s]}`:''}</span>`).join('')}</div></div>${btn}`;
}
function mapPageView(){
  const A=actByUni(),placed=new Set(TOWNS.flatMap(x=>x.u)),unplaced=UNIS.filter(u=>!placed.has(u.s)),total=Object.values(A).reduce((a,b)=>a+b,0);
  return `<button class="back" data-act="page-close">← ${esc(t('back'))}</button><div class="sec-h" style="margin-top:6px"><h1 style="font-size:28px">Campus map</h1></div>
   <div class="statrow" style="margin-bottom:14px"><div class="stat"><b>${UNIS.length}</b><span>chartered universities</span></div><div class="stat"><b>${placed.size}</b><span>placed on the map</span></div><div class="stat"><b>${total}</b><span>shared items from campuses</span></div></div>
   <div class="cols"><aside class="cols__side"><section class="card map map--full">${mapSvg()}</section></aside>
   <div class="cols__main"><section class="card stack"><label class="search"><span aria-hidden="true">⌕</span><input id="map-q" type="search" placeholder="Find a university…" value="${esc(S.mapQ)}" aria-label="Find a university"></label><div id="map-res">${mapResults()}</div></section>
   ${unplaced.length?`<section class="card stack"><h3 style="font-size:17px">Not on the map yet (${unplaced.length})</h3><p class="muted" style="font-size:13.5px">These campuses are in the list and in search, but their town has no pin yet.</p><div class="pill-row">${unplaced.map(u=>`<button class="badge" style="border:0;cursor:pointer" data-act="uni-feed:${esc(u.s)}">${esc(u.name)}</button>`).join('')}</div></section>`:''}</div></div>`;
}

/* ---------- Spaces: entry cards ---------- */
function spacesView(){
  const h=spacesViewBase();if(S.hub)return h;
  const e=(a,ttl,sub)=>`<button class="card card--flat entry" data-act="${a}"><div class="grow"><b>${ttl}</b><small>${sub}</small></div><span aria-hidden="true">→</span></button>`;
  const i=h.indexOf('</div>')+6;
  return h.slice(0,i)+`<div class="grid2" style="margin-bottom:14px">${e('page-open:guild','Staff Guild Hub','Help desk, mentorship and job swaps')}${e('page-open:lab','Project Lab','Find teammates from other campuses')}</div>`+h.slice(i);
}
function pageView(){
  if(S.room&&S.tab==='calls')return roomView();
  if(S.tab==='home'&&S.page==='desk')return deskView();
  if(S.page==='guild')return guildView();
  if(S.page==='lab')return labView();
  if(S.page==='map')return mapPageView();
  return {home:homeView,spaces:spacesView,calls:callsView,opps:oppsView,me:meView}[S.tab]();
}

/* ---------- compose sheets ---------- */
const NEW_T={qa:'Ask the guild',answer:'Write an answer',mentor:'Post about mentorship',project:'Start a project'};
function guildSelHtml(id){return `<label class="field">Guild<select id="${id}">${GUILD_NAMES.map(n=>`<option ${n===(S.guildSel||'')?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`}
function sheetHtml(){
  const sh=S.sheet;if(!sh)return '';
  if(sh.type==='claim')return wrapSheet('Ask a moderator to confirm your role',claimBody());
  if(sh.type==='compose'&&NEWK.includes(sh.kind)){
    const k=sh.kind;
    const f={qa:`${guildSelHtml('cm-guild')}<label class="field">Your question<input id="cm-title" maxlength="140" placeholder="e.g. How do you handle supplementary exam timetables?"></label>`,
      answer:'',
      mentor:`<label class="field">I want to<select id="cm-type"><option value="offer">Offer mentorship</option><option value="seek">Find a mentor</option></select></label>${guildSelHtml('cm-guild')}<label class="field">Topic<input id="cm-title" maxlength="120" placeholder="e.g. Moving from clerk to registry officer"></label>`,
      project:`<label class="field">Project name<input id="cm-title" maxlength="100" placeholder="e.g. Offline revision app"></label><label class="field">Who do you need? Separate with commas<input id="cm-tags" maxlength="100" placeholder="Designer, Android dev"></label>`}[k];
    const lab={qa:'More detail (optional)',answer:'Your answer',mentor:'More detail',project:'What are you building and why?'}[k];
    const body=`${f}<label class="field">${lab}<textarea id="cm-text" maxlength="600" placeholder="Write it clearly and kindly"></textarea></label><div id="cm-err" style="color:var(--live);font-size:13.5px" role="alert"></div><div class="row row--wrap">${btnAct('compose-go','Publish')}${btnAct('sheet-x','Cancel','btn--ghost')}</div><p class="muted" style="font-size:12.5px">Shared with other viewers of this page. Be kind; moderators can remove content.</p>`;
    return wrapSheet(NEW_T[k],body);
  }
  let h=sheetHtmlBase();
  if(sh.type==='compose'&&sh.pre)h=h.replace(`<option >${sh.pre}</option>`,`<option selected>${sh.pre}</option>`);
  return h;
}
async function submitCompose(){
  const k=S.sheet&&S.sheet.kind;
  if(!NEWK.includes(k))return submitComposeBase();
  const V=id=>{const e=$('#'+id);return e?e.value.trim():''},err=m=>{const e=$('#cm-err');if(e)e.textContent=m};
  const txt=V('cm-text'),tags=V('cm-tags').split(',').map(s=>s.trim()).filter(Boolean).slice(0,5);
  if(k==='answer'){
    if(!txt){err('Write your answer first');return}
    const target=S.sheet.target;S.sheet=null;renderSheet();
    const doc={type:'answer',target,text:txt,role:S.role,uni:myShort(),ts:Date.now()};
    if(dbReady()){try{doc.by=meInfo.id;await dbc.collection('resp').doc(`answer__${target}__${meInfo.id}`).set(doc);S.qaOpen[target]=true;toast('Answer shared');softRender();return}catch(e){}}
    S.loc.answers=S.loc.answers||[];S.loc.answers=S.loc.answers.filter(a=>a.target!==target);S.loc.answers.push({...doc,id:'la'+doc.ts,local:true});save();S.qaOpen[target]=true;
    toast('Saved on this device. Sign in with edit access to share with others.');render(true);return;
  }
  let name,doc,after;
  if(k==='qa'){if(!V('cm-title')){err('Write your question');return}name='qa';doc={q:V('cm-title'),desc:txt,guild:V('cm-guild'),status:'open'};after=()=>{S.page='guild';S.guildTab='help';render(true)}}
  else if(k==='mentor'){if(!V('cm-title')){err('Add a topic');return}name='mentor';doc={type:V('cm-type'),title:V('cm-title'),guild:V('cm-guild'),desc:txt};after=()=>{S.page='guild';S.guildTab='mentor';render(true)}}
  else{if(!V('cm-title')){err('Give the project a name');return}name='projects';doc={title:V('cm-title'),tags,desc:txt};after=()=>{S.page='lab';S.tab='spaces';render(true)}}
  S.sheet=null;renderSheet();await createDoc(name,doc);after();
}

/* ---------- actions ---------- */
function act3(a,r,el,ev){
  switch(a){
   case 'goto':S.page=null;return false;
   case 'ff':if(r==='uni'){S.feedFilter='all';render(true);return true}return false;
   case 'page-open':{S.page=r;S.hub=null;S.tab=r==='map'?'home':'spaces';if(r==='guild'&&!S.guildTab)S.guildTab='help';render();return true}
   case 'page-close':S.page=null;render();return true;
   case 'gt':S.guildTab=r;render(true);return true;
   case 'swap-new':S.sheet={type:'compose',kind:'opp',pre:'Job swap'};renderSheet();return true;
   case 'compose':if(NEWK.includes(r)){S.sheet={type:'compose',kind:r};renderSheet();return true}return false;
   case 'answer':S.sheet={type:'compose',kind:'answer',target:r};renderSheet();return true;
   case 'qa-toggle':S.qaOpen[r]=!S.qaOpen[r];render(true);return true;
   case 'solve':patchDoc('qa',r,{status:'solved'}).then(()=>{toast('Marked solved');softRender()});return true;
   case 'acct-logout':window.chuoAccount&&window.chuoAccount.logout();return true;
   case 'acct-delete-ask':S.delAsk=true;render(true);return true;
   case 'acct-delete-no':S.delAsk=false;render(true);return true;
   case 'acct-delete':window.chuoAccount&&window.chuoAccount.remove();return true;
   case 'claim-open':S.sheet={type:'claim'};renderSheet();return true;
   case 'claim-go':submitClaim();return true;
   case 'claim-withdraw':dropDoc('claims',meInfo.id,'Claim withdrawn').then(()=>{MYCLAIM=null;softRender()});return true;
   case 'vapprove':approveClaim(r);return true;
   case 'vreject':dropDoc('claims',r,'Claim rejected');return true;
   case 'vrevoke':dropDoc('verified',r,'Badge removed');return true;
   case 'mapshow':S.mapSel=r||null;S.mapQ='';render(true);return true;
   case 'uni-feed':S.feedFilter='uni';S.feedUni=r;S.page=null;S.tab='home';render();return true;
  }
  return false;
}
document.addEventListener('input',e=>{
  if(e.target.id==='lab-q'){S.labQ=e.target.value;refreshLab()}
  if(e.target.id==='map-q'){S.mapQ=e.target.value;refreshMapRes()}
});
document.addEventListener('change',e=>{if(e.target.id==='guild-sel'){S.guildSel=e.target.value;render(true)}});

/* ---------- capabilities ---------- */
async function initCaps(){
  try{
    if(!(window.claude&&claude.use))return;
    userNs=await claude.use('user');
    if(userNs){const m=await userNs.me();meInfo={id:m.id,name:m.name||'',avatarUrl:m.avatarUrl||'',emailUni:m.uniShort||''};if(meInfo.emailUni){const uu=UNIS.find(x=>x.s===meInfo.emailUni);if(uu&&S.uni!==uu.name){S.uni=uu.name;save()}}try{canWrite=(await userNs.can('data.write'))!==false}catch(e){canWrite=true}try{isAdmin=!!(await userNs.canEdit())}catch(e){isAdmin=false}render(true)}
    dbc=await claude.use('db');
    if(dbc){
      ['posts','lines','lectures','research','slots','endorse','qa','mentor','projects'].forEach(n=>watch(n,150));watch('resp',500);watch('verified',500);
      if(isAdmin)watch('claims',200);
      else if(meInfo.id){try{dbc.collection('claims').doc(meInfo.id).onSnapshot(s=>{MYCLAIM=s&&s.exists?{id:s.id,...s.data()}:null;softRender()},()=>{})}catch(e){}}
    }
  }catch(e){}
  try{roomNs=window.claude&&claude.use?await claude.use('room'):null}catch(e){roomNs=null}
}
