/* ---------- state ---------- */
const LSK='chuomoja.v1';
const PERSIST=['role','lang','uni','dept','joined','rsvp','saved','helpful','team','interest','shareTT','local','slots','banner','threads','loc'];
const S={tab:'home',role:'student',lang:'en',uni:'University of Nairobi',dept:'',joined:[],rsvp:[],saved:[],helpful:[],team:[],interest:[],
  feedFilter:'all',spacesTab:'unit',q:'',hub:null,hubTab:'notes',oppFilter:'All',mapSel:null,overlay:false,shareTT:false,calDay:0,
  draft:'',local:[],slots:[],sheet:null,match:{state:'idle'},banner:true,threads:[],loc:{lines:[],lectures:[],research:[],slots:[],endorse:[]},room:null,page:null,deskTab:'lectures',recQ:''};
try{const o=JSON.parse(localStorage.getItem(LSK)||'{}');PERSIST.forEach(k=>{if(o[k]!==undefined)S[k]=o[k]})}catch(e){}
const save=()=>{try{const o={};PERSIST.forEach(k=>o[k]=S[k]);localStorage.setItem(LSK,JSON.stringify(o))}catch(e){}};

const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=k=>(I18N[S.lang]&&I18N[S.lang][k])||I18N.en[k]||k;
const has=(arr,id)=>arr.includes(id);
const toggle=(arr,id)=>{const i=arr.indexOf(id);i<0?arr.push(id):arr.splice(i,1);save()};
const hash=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
const COLORS=['#0A6B47','#1D5FBF','#8A3FA0','#B24A00','#0F7B8C','#9B2C4B'];
const av=(name,url)=>url?`<img class="av" src="${esc(url)}" alt="">`:`<div class="av" style="background:${COLORS[hash(name)%COLORS.length]}" aria-hidden="true">${esc((name||'?').trim()[0].toUpperCase())}</div>`;
const roleName=r=>t(r);
const roleBadge=r=>`<span class="badge badge--${r}">${esc(roleName(r))}</span>`;
const ago=ms=>{const m=Math.max(1,Math.round((Date.now()-ms)/60000));if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<24)return h+' h ago';return Math.round(h/24)+' d ago'};
const myShort=()=>uniShort(S.uni);

let dbc=null,meInfo={id:null,name:'',avatarUrl:''},userNs=null,canWrite=false,dbPosts=[],NAMES={};

/* ---------- icons ---------- */
const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON={home:ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
 spaces:ic('<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 19c.5-3.5 3-5 5.5-5s5 1.5 5.5 5"/><path d="M15 14.2c2.8-.4 5.2.9 6 4.3"/>'),
 calls:ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>'),
 opps:ic('<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>'),
 me:ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c.6-4.5 4-6.5 8-6.5s7.4 2 8 6.5"/>')};
const LOGO=`<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#0F2A1E"/><path d="M6 15Q17 3 28 15" fill="none" stroke="#EAF6EE" stroke-width="2.4" stroke-linecap="round"/><circle cx="10" cy="23" r="3" fill="#3DCB8E"/><circle cx="17" cy="23" r="3" fill="#F2B84B"/><circle cx="24" cy="23" r="3" fill="#7FB0FF"/></svg>`;

/* ---------- time helpers ---------- */
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const addDays=(n,h=0,m=0)=>{const d=new Date();d.setHours(h,m,0,0);d.setDate(d.getDate()+n);return d};
const hhmm=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
const dayWord=d=>{const diff=Math.round((new Date(d).setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/864e5);return diff===0?'Today':diff===1?'Tomorrow':DAYS[d.getDay()]};
const lineTimes=l=>{let s=addDays(l.day,l.h,l.m),e=new Date(s.getTime()+l.dur*60000);if(e<new Date()){s=addDays(l.day+1,l.h,l.m);e=new Date(s.getTime()+l.dur*60000)}return{s,e}};
const lineList=()=>allLines();
const isLive=l=>{const n=new Date();return l.s<=n&&n<=l.e};

/* ---------- small view pieces ---------- */
const btnAct=(act,label,cls='')=>`<button class="btn ${cls}" data-act="${esc(act)}">${label}</button>`;
function lineRow(l){
  const going=has(S.rsvp,l.id);
  return `<div class="line"><div class="when"><b>${l.s.getDate()}</b><span>${MONS[l.s.getMonth()]}</span></div>
   <div class="grow"><div class="row row--wrap" style="gap:6px">${isLive(l)?`<span class="badge badge--live">${esc(t('live'))}</span>`:''}<span class="meta">${esc(dayWord(l.s))}, ${hhmm(l.s)} · ${l.dur} min</span></div>
   <h3 style="font-size:16px;margin:2px 0 4px">${esc(l.title)}</h3>
   <div class="meta">${roleBadge(l.role)}<span>${esc(l.host)}, ${esc(l.uni)}</span><span>${esc(l.lang)}</span><span>${l.going+(going?1:0)} ${esc(t('going').toLowerCase())}</span></div></div>
   <button class="btn btn--sm ${going?'on':'btn--ghost'}" data-act="rsvp:${l.id}" aria-pressed="${going}">${esc(going?t('going'):t('rsvp'))}</button></div>`;
}
function composer(){
  return `<div class="card composer"><div class="row">${av(meInfo.name||roleName(S.role),meInfo.avatarUrl)}<div class="grow muted" style="font-size:14px">${esc(t('share'))}</div></div>
  <textarea id="draft" maxlength="600" aria-label="${esc(t('share'))}" placeholder="${esc(t('share'))}">${esc(S.draft)}</textarea>
  <div class="row row--wrap"><span class="meta grow">${roleBadge(S.role)} ${esc(myShort())}</span>${btnAct('post-now',esc(t('post')),'btn--sm')}</div></div>`;
}
function feedItems(){
  const mine=[...dbPosts.filter(p=>p.kind==='post'||p.kind==='lecture'),...S.local.filter(p=>p.kind!=='opp')].sort((a,b)=>b.ts-a.ts)
    .map(p=>({id:p.id,role:p.role,name:NAMES[p.by]||(p.local?(meInfo.name||'You'):roleName(p.role)),uni:p.uni,space:p.space||(p.kind==='lecture'?'Guest Lecture Exchange':''),min:(Date.now()-p.ts)/60000,text:p.text,real:true,local:!!p.local,by:p.by}));
  let all=[...mine,...FEED.map(f=>({...f}))];
  if(S.feedFilter==='mine')all=all.filter(f=>f.uni===myShort());
  if(S.feedFilter==='uni')all=all.filter(f=>f.uni===S.feedUni);
  if(S.feedFilter==='units'){const names=HUBS.filter(h=>has(S.joined,h.id)).map(h=>h.name);all=all.filter(f=>names.includes(f.space))}
  return all;
}
function feedList(){
  const items=feedItems();
  if(!items.length)return `<div class="empty">${S.feedFilter==='units'?'Join a Unit Hub in Spaces and its posts will show up here.':'No posts from there yet. Be the first.'}</div>`;
  return items.map(f=>`<article class="card post"><div class="row">${av(f.name)}<div class="grow"><b>${esc(f.name)}</b><div class="meta">${roleBadge(f.role)}${vBadge(f.by)}<span>${esc(f.uni)}</span><span>${f.real?esc(ago(Date.now()-f.min*60000)):Math.round(f.min)<60?Math.round(f.min)+' min ago':Math.round(f.min/60)+' h ago'}</span></div></div>
   ${f.real?(f.local?'<span class="tag">this device</span>':''):`<span class="tag">${esc(t('example'))}</span>`}</div>
   <p class="post__txt">${esc(f.text)}</p>
   <div class="post__foot">${f.space?`<span class="badge">${esc(f.space)}</span>`:''}<span class="grow"></span>
   <button class="btn btn--sm ${has(S.helpful,f.id)?'on':'btn--ghost'}" data-act="helpful:${esc(f.id)}" aria-pressed="${has(S.helpful,f.id)}">${esc(t('helpful'))}${has(S.helpful,f.id)?' ✓':''}</button></div></article>`).join('');
}
const refreshFeed=()=>{const el=$('#feed-list');if(el)el.innerHTML=feedList()};

/* ---------- Home ---------- */
const HERO={
 student:{en:['Your campus is bigger than your campus.','Study with students from every university, find teammates and chase opportunities together.'],sw:['Chuo chako ni kikubwa kuliko unavyofikiria.','Soma pamoja na wanafunzi wa vyuo vyote, pata wenzako wa miradi na fursa kwa pamoja.'],
  acts:[['meet',{en:'Meet someone new',sw:'Kutana na mtu mpya'}],['goto:spaces:unit',{en:'Find a unit hub',sw:'Tafuta kituo cha masomo'}],['compose:project',{en:'Start a project',sw:'Anzisha mradi'}]]},
 lecturer:{en:['Your classroom can reach every campus.','Offer guest lectures, share timetables and find co-authors across universities.'],sw:['Darasa lako linaweza kufika vyuo vyote.','Toa mihadhara ya wageni, shiriki ratiba na tafuta waandishi-wenza kote nchini.'],
  acts:[['compose:lecture',{en:'Offer a guest lecture',sw:'Toa mhadhara wa kutembelea'}],['compose:slot',{en:'Share a free slot',sw:'Shiriki muda wazi'}],['goto:spaces:guild',{en:'Find a co-author',sw:'Tafuta mwandishi-mwenza'}]]},
 staff:{en:['The people who keep campuses running, together.','Librarians, ICT, registry, finance, hostels and security: share fixes, swap jobs, learn from each other.'],sw:['Wanaoendesha vyuo vyetu, pamoja.','Maktaba, TEHAMA, usajili, fedha, hosteli na usalama: shirikini suluhisho na mjifunze kwa pamoja.'],
  acts:[['page-open:guild',{en:'Open the Guild Hub',sw:'Fungua kituo cha vyama'}],['compose:opp',{en:'Post a job swap',sw:'Tangaza kubadilishana kazi'}],['compose:qa',{en:'Ask for help',sw:'Omba msaada'}]]}
};
function mapSvg(){
  const X=lon=>((lon-33.5)*60).toFixed(1),Y=lat=>((5.1-lat)*60).toFixed(1);
  const path='M'+KENYA.map(p=>X(p[0])+' '+Y(p[1])).join('L')+'Z';
  const pins=TOWNS.map(tw=>{const sel=S.mapSel===tw.k;const r=8+tw.u.length*1.4;
    return `<g class="pin" role="button" tabindex="0" aria-label="${esc(tw.n)}: ${tw.u.length} universities" aria-pressed="${sel}" data-act="pin:${tw.k}"><circle class="halo" cx="${X(tw.lon)}" cy="${Y(tw.lat)}" r="${r}"/><circle class="core" cx="${X(tw.lon)}" cy="${Y(tw.lat)}" r="6"/></g>`}).join('');
  const s=TOWNS.find(x=>x.k===S.mapSel);
  const lab=s?`<text text-anchor="middle" x="${Math.max(80,Math.min(+X(s.lon),430))}" y="${+Y(s.lat)-20}">${esc(s.n)}</text>`:'';
  return `<svg viewBox="0 0 520 600" role="group" aria-label="Schematic map of Kenya with university towns"><path class="land" d="${path}"/><ellipse class="lake" cx="${X(36.1)}" cy="${Y(3.5)}" rx="9" ry="42"/>${pins}${lab}</svg>`;
}
function mapPanel(){
  const s=TOWNS.find(x=>x.k===S.mapSel);
  if(!s)return `<p class="muted" style="font-size:13.5px">Tap a town to see the universities there. Bigger circles mean more universities.</p>`;
  const full=s.u.map(sn=>UNIS.find(u=>u.s===sn)).filter(Boolean);
  return `<div><h3 style="font-size:17px">${esc(s.n)}</h3><div class="row row--wrap" style="gap:6px;margin-top:8px">${full.map(u=>`<span class="badge">${esc(u.name)}</span>`).join('')}</div></div>`;
}
function homeView(){
  const h=HERO[S.role],nm=(meInfo.name||'').split(' ')[0]||roleName(S.role);
  const lines=lineList().slice(0,3);
  return `${S.banner?`<div class="note note--info" style="margin-bottom:14px"><span>${esc(t('banner'))}</span><button data-act="banner-x" aria-label="Close">×</button></div>`:''}
  <section class="hero"><div class="shuka"></div><div class="hero__in"><span class="eyebrow">${esc(t('hi'))}, ${esc(nm)} · ${esc(myShort())}</span>
   <h1>${esc(h[S.lang][0])}</h1><p>${esc(h[S.lang][1])}</p>
   <div class="hero__act">${h.acts.map((a,i)=>btnAct(a[0],esc(a[1][S.lang]),i?'btn--ghost':'')).join('')}</div></div></section>
  <div class="cols"><aside class="cols__side">
   <section class="card map"><div class="sec-h" style="margin-top:0"><h2>${esc(t('today'))}</h2><span>${TOWNS.length} towns</span></div>
    <div class="statrow"><div class="stat"><b>67</b><span>chartered universities</span></div><div class="stat"><b>${ALL_SPACES.length}</b><span>spaces to join</span></div><div class="stat"><b>${LINES.length}</b><span>Open Lines this week</span></div></div>
    <div style="margin:12px 0">${mapSvg()}</div><div id="map-panel">${mapPanel()}</div></section>
   <section class="card"><div class="sec-h" style="margin-top:0"><h2>${esc(t('upnext'))}</h2><button class="back" data-act="tab:calls">${esc(t('calls'))} →</button></div>${lines.map(lineRow).join('')}</section>
  </aside><div class="cols__main">${roleBlock()}
   <section><div class="sec-h"><h2>${esc(t('home'))}</h2></div>${composer()}
    <div class="chips" style="margin-top:12px" role="group" aria-label="Feed filter">${[['all',t('all')],['mine',t('mine')],['units',t('mymu')],...(S.feedFilter==='uni'?[['uni',S.feedUni+' ✕']]:[])].map(c=>`<button class="chip" data-act="ff:${c[0]}" aria-pressed="${S.feedFilter===c[0]}">${esc(c[1])}</button>`).join('')}</div>
    <div class="list" id="feed-list" style="margin-top:6px">${feedList()}</div></section></div></div>`;
}
function roleBlockBase(){
  if(S.role==='student'){
    const mine=HUBS.filter(h=>has(S.joined,h.id)),show=mine.length?mine:HUBS.slice(0,4);
    return `<section><div class="sec-h"><h2>${esc(mine.length?t('yourhubs'):t('units'))}</h2><button class="back" data-act="goto:spaces:unit">${esc(t('spaces'))} →</button></div>
     <div class="grid2">${show.slice(0,4).map(h=>`<button class="card card--flat" style="text-align:left" data-act="hub:${h.id}"><b style="font-family:var(--f-display);font-size:17px">${esc(h.name)}</b><div class="meta" style="margin-top:4px"><span>${h.unis} universities</span><span class="mono">${h.members.toLocaleString('en-KE')} members</span></div><p class="muted" style="font-size:13.5px;margin-top:6px">${esc(h.hot)}</p></button>`).join('')}</div>
     <div class="sec-h" style="margin-top:20px"><h2>${esc(t('lab'))}</h2></div><div class="list">${PROJECTS.map(p=>`<div class="card card--flat row"><div class="grow"><b>${esc(p.title)}</b><div class="meta">${esc(p.need)} · ${esc(p.uni)} <span class="tag">${esc(t('example'))}</span></div></div><button class="btn btn--sm ${has(S.team,p.id)?'on':'btn--ghost'}" data-act="team:${p.id}" aria-pressed="${has(S.team,p.id)}">${has(S.team,p.id)?'Requested ✓':'Join team'}</button></div>`).join('')}</div></section>`;
  }
  if(S.role==='lecturer'){
    const mineL=[...dbPosts.filter(p=>p.kind==='lecture'),...S.local.filter(p=>p.kind==='lecture')].map(p=>({id:p.id,type:'Offer',who:NAMES[p.by]||(p.local?(meInfo.name||'You'):'A lecturer'),uni:p.uni,text:p.text,real:true}));
    const all=[...mineL,...LECTURES];
    return `<section><div class="sec-h"><h2>${esc(t('guest'))}</h2>${btnAct('compose:lecture','Offer one','btn--sm')}</div><div class="list">${all.map(x=>`<div class="card card--flat row"><div class="grow"><div class="meta"><span class="badge ${x.type==='Offer'?'badge--lecturer':''}">${x.type}</span><b>${esc(x.who)}</b><span>${esc(x.uni)}</span>${x.real?'':`<span class="tag">${esc(t('example'))}</span>`}</div><p style="margin-top:4px">${esc(x.text)}</p></div>
      <button class="btn btn--sm ${has(S.interest,x.id)?'on':'btn--ghost'}" data-act="interest:${esc(x.id)}" aria-pressed="${has(S.interest,x.id)}">${has(S.interest,x.id)?'Sent ✓':(x.type==='Offer'?'Request it':'Offer to host')}</button></div>`).join('')}</div></section>`;
  }
  const g=GUILDS.filter(x=>x.who==='staff').slice(0,4);
  return `<section><div class="sec-h"><h2>${esc(t('guild'))}</h2><button class="back" data-act="goto:spaces:guild">${esc(t('spaces'))} →</button></div><div class="grid2">${g.map(x=>`<button class="card card--flat" style="text-align:left" data-act="goto:spaces:guild"><b style="font-family:var(--f-display);font-size:17px">${esc(x.name)}</b><div class="meta" style="margin-top:4px"><span>${x.unis} universities</span><span class="mono">${x.members} members</span></div><p class="muted" style="font-size:13.5px;margin-top:6px">${esc(x.desc)}</p></button>`).join('')}</div></section>`;
}

/* ---------- Spaces ---------- */
function spaceCards(){
  const q=S.q.trim().toLowerCase();
  let list=ALL_SPACES.filter(x=>x.type===S.spacesTab);
  if(q)list=list.filter(x=>(x.name+' '+(x.desc||'')+' '+(x.fac||'')).toLowerCase().includes(q));
  if(S.spacesTab==='guild'){const w=S.role;list=[...list].sort((a,b)=>(b.who===w)-(a.who===w))}
  if(!list.length)return `<div class="empty">Nothing matches "${esc(S.q)}". Try a shorter word.</div>`;
  return `<div class="grid2">`+list.map(x=>{const j=has(S.joined,x.id);
   return `<div class="card card--flat stack" style="gap:10px"><div class="grow"><h3 style="font-size:17px">${x.type==='unit'?`<button class="back" style="font:inherit;color:inherit;text-align:left;padding:0" data-act="hub:${x.id}">${esc(x.name)}</button>`:esc(x.name)}</h3>
   <p class="muted" style="font-size:14px;margin-top:4px">${esc(x.desc)}</p><div class="meta" style="margin-top:8px"><span class="mono">${x.members.toLocaleString('en-KE')} members</span><span>${x.unis} universities</span>${x.who?`<span class="badge badge--${x.who}">For ${x.who==='staff'?'support staff':'lecturers'}</span>`:''}</div></div>
   <div class="row">${x.type==='unit'?`<button class="btn btn--sm btn--ghost" data-act="hub:${x.id}">Open</button>`:''}<button class="btn btn--sm ${j?'on':''}" data-act="join:${x.id}" aria-pressed="${j}">${esc(j?t('joined')+' ✓':t('join'))}</button></div></div>`}).join('')+`</div>`;
}
const refreshSpaces=()=>{const el=$('#space-list');if(el)el.innerHTML=spaceCards()};
function hubView(h){
  const a=hash(h.id),P=i=>PEOPLE[(a+i)%PEOPLE.length];
  const notes=[[`${h.name}: Weeks 1 to 4 summary notes`,P(0)],[`${h.name}: past paper walkthrough in CAT style`,P(1)],[`${h.name}: key definitions and formula sheet`,P(2)],[`${h.name}: revision checklist before the main exam`,P(3)]];
  const qa=[[`Which textbook do lecturers at your university recommend for ${h.name}?`,3+a%5,P(4)],[`How is the CAT weighted at your university? Ours is 30% CAT and 70% exam.`,5+a%7,P(5)],[`Has anyone sat the supplementary exam for ${h.name}? What changed?`,2+a%4,P(6)]];
  const groups=[['Sunday 7pm revision circle',P(7)],['Pre-CAT crash session, Wednesday 9pm',P(0)],['Early birds, weekdays 6am',P(2)]];
  const j=has(S.joined,h.id),tab=S.hubTab;
  const body=tab==='notes'?notes.map(n=>`<div class="line"><div class="when"><b style="font-size:15px">PDF</b></div><div class="grow"><b>${esc(n[0])}</b><div class="meta">Shared by ${esc(n[1].n)}, ${esc(n[1].u)} <span class="tag">${esc(t('example'))}</span></div></div></div>`).join('')
   :tab==='qa'?qa.map(q=>`<div class="line"><div class="when"><b>${q[1]}</b><span>replies</span></div><div class="grow"><b>${esc(q[0])}</b><div class="meta">Asked by ${esc(q[2].n)}, ${esc(q[2].u)} <span class="tag">${esc(t('example'))}</span></div></div></div>`).join('')
   :groups.map((g,i)=>{const id=h.id+'-g'+i,on=has(S.rsvp,id);return `<div class="line"><div class="grow"><b>${esc(g[0])}</b><div class="meta">Led by ${esc(g[1].n)}, ${esc(g[1].u)} <span class="tag">${esc(t('example'))}</span></div></div><button class="btn btn--sm ${on?'on':'btn--ghost'}" data-act="rsvp:${id}" aria-pressed="${on}">${esc(on?t('going'):t('rsvp'))}</button></div>`}).join('');
  return `<button class="back" data-act="hub-close">← ${esc(t('back'))}</button>
  <section class="card stack" style="margin-top:8px"><div><span class="eyebrow">${esc(h.fac)}</span><h1 style="font-size:30px;margin-top:4px">${esc(h.name)}</h1></div>
   <div class="meta"><span class="mono">${h.members.toLocaleString('en-KE')} members</span><span>${h.unis} universities</span></div>
   <p class="muted" style="font-size:14px">Every university uses its own code for this unit. A hub groups them, so a student in Eldoret and one in Mombasa find the same notes.</p>
   <div class="row"><button class="btn ${j?'on':''}" data-act="join:${h.id}" aria-pressed="${j}">${esc(j?t('joined')+' ✓':t('join'))}</button></div></section>
  <div class="chips" style="margin-top:14px" role="group">${[['notes',t('notes')],['qa',t('qa')],['groups',t('groups')]].map(c=>`<button class="chip" data-act="ht:${c[0]}" aria-pressed="${tab===c[0]}">${esc(c[1])}</button>`).join('')}</div>
  <section class="card">${body}</section>`;
}
function spacesViewBase(){
  if(S.hub){const h=HUBS.find(x=>x.id===S.hub);if(h)return hubView(h)}
  return `<div class="sec-h" style="margin-top:0"><h1 style="font-size:28px">${esc(t('spaces'))}</h1></div>
  <div class="chips" role="group" aria-label="Space type">${[['unit',t('units')],['interest',t('interests')],['guild',t('guilds')],['county',t('counties')]].map(c=>`<button class="chip" data-act="st:${c[0]}" aria-pressed="${S.spacesTab===c[0]}">${esc(c[1])}</button>`).join('')}</div>
  <label class="search" style="margin:6px 0 14px"><span aria-hidden="true">⌕</span><input id="space-q" type="search" placeholder="${esc(t('search'))}…" value="${esc(S.q)}" aria-label="${esc(t('search'))}"></label>
  <div id="space-list">${spaceCards()}</div>`;
}

/* ---------- Calls ---------- */
function matchCard(){
  const m=S.match;
  if(m.state==='searching')return `<div class="match"><div class="row"><div class="pulse"></div><div><h3 style="font-size:20px">Finding someone from another university…</h3><p class="muted">Matching on interests, not on campus.</p></div></div></div>`;
  if(m.state==='found'){const p=m.person;
   return `<div class="match"><span class="eyebrow" style="color:var(--night-dim)">Your match · ${esc(S.lang==='sw'?'dakika 15':'15 minutes')}, audio first</span>
    <div class="row">${av(p.n)}<div><h3 style="font-size:22px">${esc(p.n)}</h3><div class="muted">${esc(p.c)}, ${esc(p.u)}</div></div></div>
    <p>Both of you like <b>${esc(p.i)}</b>. A way to start: <i>${esc(m.ice)}</i></p>
    <div class="row row--wrap">${btnAct('meet-hi','Say hi')}${btnAct('meet','Try another','btn--ghost')}</div>
    <p class="muted" style="font-size:13px">Live audio opens in Phase 2. For now, "Say hi" sends a message you can find in Me.</p></div>`}
  return `<div class="match"><h2 style="font-size:24px">${esc(t('meet'))}</h2><p class="muted">One tap pairs you with a student from a different university for a 15-minute chat. Leave any time.</p><div>${btnAct('meet',esc(t('meet')))}</div></div>`;
}
function callsView(){
  const ls=lineList();
  return `<div class="sec-h" style="margin-top:0"><h1 style="font-size:28px">${esc(t('openlines'))}</h1></div>${matchCard()}
  <div class="note note--info" style="margin:14px 0"><span>Live audio and video rooms arrive in Phase 2. RSVP now and your plans show in your calendar.</span></div>
  <section class="card">${ls.map(lineRow).join('')}</section>`;
}

/* ---------- Opportunities ---------- */
function oppCards(pred){
  const real=[...dbPosts.filter(p=>p.kind==='opp'),...S.local.filter(p=>p.kind==='opp')].sort((a,b)=>b.ts-a.ts).map(p=>({id:p.id,type:p.type||'Job',title:p.text,poster:`Posted by ${NAMES[p.by]||(p.local?(meInfo.name||'you'):roleName(p.role))}, ${p.uni}`,place:p.place||'Anywhere',dl:null,roles:[p.role],blurb:'',real:true,local:p.local}));
  let list=[...real,...OPPS].filter(o=>pred?pred(o):(S.oppFilter==='All'||(S.oppFilter==='For me'?o.roles.includes(S.role):o.type===S.oppFilter)));
  if(!list.length)return `<div class="empty">No listings in this category yet. Post one for other campuses.</div>`;
  list.sort((a,b)=>(b.roles.includes(S.role)-a.roles.includes(S.role)));
  return list.map(o=>{const d=o.dl!=null?addDays(o.dl):null,sv=has(S.saved,o.id);
   return `<article class="card stack" style="gap:10px"><div class="row row--wrap" style="gap:6px"><span class="badge">${esc(o.type)}</span>${o.roles.includes(S.role)?`<span class="badge badge--${S.role}">For you</span>`:''}${o.real?(o.local?'<span class="tag">this device</span>':''):`<span class="tag">${esc(t('example'))}</span>`}</div>
   <h3 style="font-size:18px">${esc(o.title)}</h3>${o.blurb?`<p class="muted" style="font-size:14.5px">${esc(o.blurb)}</p>`:''}
   <div class="meta"><span>${esc(o.poster)}</span><span>${esc(o.place)}</span>${d?`<span><b>${esc(t('deadline'))}:</b> ${d.getDate()} ${MONS[d.getMonth()]} (in ${o.dl} days)</span>`:''}</div>
   <div class="row"><button class="btn btn--sm" data-act="apply:${esc(o.id)}">${esc(t('apply'))}</button><button class="btn btn--sm ${sv?'on':'btn--ghost'}" data-act="save:${esc(o.id)}" aria-pressed="${sv}">${esc(sv?t('saved')+' ✓':t('save'))}</button></div></article>`}).join('');
}
const refreshOpps=()=>{const el=$('#opp-list');if(el)el.innerHTML=oppCards(el.dataset.swap?(o=>o.type==='Job swap'):undefined)};
function oppsView(){
  const f=['All','For me',...OPP_TYPES];
  return `<div class="sec-h" style="margin-top:0"><h1 style="font-size:28px">${esc(t('opps'))}</h1>${btnAct('compose:opp','Post one','btn--sm')}</div>
  <div class="chips" role="group" aria-label="Filter">${f.map(c=>`<button class="chip" data-act="of:${esc(c)}" aria-pressed="${S.oppFilter===c}">${esc(c)}</button>`).join('')}</div>
  <div class="note" style="margin:6px 0 14px"><span><b>Never pay to apply.</b> Real attachments, bursaries and jobs do not ask for fees or mobile money. Report any listing that does.</span></div>
  <div class="grid2" id="opp-list">${oppCards()}</div>`;
}

/* ---------- Me ---------- */
function weekEvents(offset){
  const d=addDays(offset),w=d.getDay(),ev=[];
  const T={student:{1:[['08:00','Calculus I lecture']],2:[['10:00','Intro to Programming lab']],3:[['08:00','Calculus I lecture'],['14:00','Entrepreneurship']],4:[['10:00','Intro to Programming lab'],['16:00','CAT revision']],5:[['09:00','Communication Skills']]},
   lecturer:{1:[['10:00','Lecture: Microeconomics']],2:[['15:00','Office hours']],3:[['10:00','Lecture: Microeconomics']],4:[['14:00','Department meeting']],5:[['11:00','Marking time']]},
   staff:{1:[['08:00','Front desk shift']],2:[['08:00','Front desk shift']],3:[['08:00','Front desk shift'],['12:30','Guild call']],4:[['08:00','Front desk shift']],5:[['08:00','Front desk shift']]}}[S.role];
  (T[w]||[]).forEach(e=>ev.push({time:e[0],text:e[1],kind:'class'}));
  lineList().forEach(l=>{if(l.s.toDateString()===d.toDateString()){if(has(S.rsvp,l.id))ev.push({time:hhmm(l.s),text:l.title,kind:'rsvp'});else if(S.overlay)ev.push({time:hhmm(l.s),text:l.title+' ('+l.uni+')',kind:'national'})}});
  S.slots.forEach(s=>{if(s.day===offset)ev.push({time:s.time,text:s.text,kind:'slot'})});
  return ev.sort((a,b)=>a.time.localeCompare(b.time));
}
function meViewBase(){
  const me=meInfo,nm=me.name||'Guest';
  const week=[...Array(7)].map((_,i)=>{const d=addDays(i);return `<button data-act="cd:${i}" aria-pressed="${S.calDay===i}" aria-label="${DAYS[d.getDay()]} ${d.getDate()}"><span>${DAYS[d.getDay()]}</span><b>${d.getDate()}</b>${weekEvents(i).length?'<i></i>':''}</button>`}).join('');
  const evs=weekEvents(S.calDay),KL={class:'Class',rsvp:'RSVP',slot:'Free slot',national:'National'};
  const savedList=[...OPPS,...S.local.filter(p=>p.kind==='opp').map(p=>({id:p.id,title:p.text})),...dbPosts.filter(p=>p.kind==='opp').map(p=>({id:p.id,title:p.text}))].filter(o=>has(S.saved,o.id));
  return `<div class="stack">
  <section class="card stack"><div class="row">${av(nm,me.avatarUrl)}<div class="grow"><h1 style="font-size:24px">${esc(nm)}</h1><div class="meta">${roleBadge(S.role)}<span>${esc(S.uni)}</span></div></div></div>
   <div><div class="eyebrow" style="margin-bottom:6px">${esc(t('roleq'))}</div><div class="seg" role="group">${['student','lecturer','staff'].map(r=>`<button data-act="role:${r}" aria-pressed="${S.role===r}">${esc(roleName(r))}<small>${r==='student'?'learn, build':r==='lecturer'?'teach, research':'support, connect'}</small></button>`).join('')}</div></div>
   <label class="field">${esc(t('university'))}<select data-bind="uni" id="uni-sel"><optgroup label="Public chartered">${UNIS.filter(u=>u.kind==='pub').map(u=>`<option ${u.name===S.uni?'selected':''}>${esc(u.name)}</option>`).join('')}</optgroup><optgroup label="Private chartered">${UNIS.filter(u=>u.kind==='pri').map(u=>`<option ${u.name===S.uni?'selected':''}>${esc(u.name)}</option>`).join('')}</optgroup></select></label>
   <label class="field">${esc(t('dept'))}<input id="dept" data-bind="dept" value="${esc(S.dept)}" placeholder="e.g. School of Business"></label>
   <div class="switch"><button role="switch" aria-checked="${S.lang==='sw'}" data-act="lang-toggle" aria-label="Kiswahili"></button><span>${S.lang==='sw'?'Kiswahili':'English'}: ${esc(t('lang'))}</span></div></section>
  <section class="card stack"><div class="sec-h" style="margin:0"><h2>${esc(t('week'))}</h2><span>sample timetable</span></div><div class="week">${week}</div>
   <div>${evs.length?evs.map(e=>`<div class="line"><div class="when" style="width:58px"><b style="font-size:15px">${e.time}</b></div><div class="grow"><b>${esc(e.text)}</b></div><span class="badge ${e.kind==='national'?'':e.kind==='class'?'':'badge--'+S.role}">${KL[e.kind]}</span></div>`).join(''):'<div class="empty">Nothing planned. Share a free slot or RSVP to an Open Line.</div>'}</div>
   <div class="switch"><button role="switch" aria-checked="${S.overlay}" data-act="overlay" aria-label="${esc(t('overlay'))}"></button><span>${esc(t('overlay'))}</span></div>
   ${S.role!=='student'?`<div class="switch"><button role="switch" aria-checked="${S.shareTT}" data-act="sharett" aria-label="Share timetable"></button><span>Share my timetable with other universities</span></div>`:''}
   <div>${btnAct('compose:slot','Share a free slot','btn--sm btn--ghost')}</div></section>
  <section class="card"><div class="sec-h" style="margin-top:0"><h2>${esc(t('messages'))}</h2></div>
   <div class="note note--info" style="margin-bottom:8px"><span>Messages stay on the platform. Student and lecturer chats can be reported to moderators drawn from several universities.</span></div>
   ${[...S.threads,...THREADS].map(m=>`<details class="thread"><summary>${av(m.who)}<div class="grow"><b>${esc(m.who)}</b> <span class="meta">${esc(m.uni)} · ${esc(m.when)}</span></div></summary><p>${esc(m.pre)}</p></details>`).join('')}</section>
  <section class="card"><div class="sec-h" style="margin-top:0"><h2>${esc(t('saves'))}</h2></div>${savedList.length?savedList.map(o=>`<div class="line"><div class="grow"><b>${esc(o.title)}</b></div></div>`).join(''):'<p class="muted">Save a listing in Opportunities and it appears here.</p>'}</section>
  <section class="card"><h2 style="font-size:20px">${esc(t('rules'))}</h2><ol class="rules"><li><b>No tribalism, racism or hate.</b> We are one campus.</li><li><b>No harassment or bullying.</b> Report it; moderators from several universities review reports.</li><li><b>No exam cheating.</b> Share notes and teaching, never answers to live exams or paid essay work.</li><li><b>No fake or paid opportunities.</b> Real ones never ask applicants for money.</li></ol></section>
  <section class="card"><h2 style="font-size:20px">${esc(t('route'))}</h2><div class="list" style="margin-top:10px">${[['Phase 1','Profiles, Unit Hubs, Opportunity Board, national calendar','Done'],['Phase 2','Live Open Line rooms and the Lecturer Desk','Done'],['Phase 3','Moderator-confirmed roles, Staff Guild Hub, Project Lab, full campus map','In this prototype'],['Phase 4','Own hosting with email-code sign-up so any student can join','Next']].map((p,i)=>`<div class="row"><span class="badge ${i<3?'badge--'+S.role:''}">${p[0]}</span><div class="grow">${esc(p[1])}</div><span class="meta">${p[2]}</span></div>`).join('')}</div></section></div>`;
}

/* ---------- sheets ---------- */
function sheetHtml(){
  const sh=S.sheet;if(!sh)return '';
  let title='',body='';
  if(sh.type==='role'){title=t('roleq');body=`<div class="seg" role="group" style="grid-template-columns:1fr">${['student','lecturer','staff'].map(r=>`<button data-act="role:${r}" aria-pressed="${S.role===r}" style="flex-direction:row;justify-content:space-between;padding:14px"><span>${esc(roleName(r))}</span><small>${r==='student'?'Unit Hubs, Open Lines, projects':r==='lecturer'?'Guest lectures, calendars, research':'Guilds, job swaps, mentorship'}</small></button>`).join('')}</div>`}
  if(sh.type==='apply'){title='Before you apply';body=`<p>This listing is an example, so there is no real application behind it. When real listings arrive, check these first:</p><ul class="rules"><li>Confirm it on the organisation's official website or office.</li><li>Never send money, including "processing" or "registration" fees.</li><li>Share your documents only with a verified contact.</li></ul><div>${btnAct('sheet-x','Got it')}</div>`}
  if(sh.type==='compose'){const k=sh.kind;
    title=k==='lecture'?'Offer a guest lecture':k==='slot'?'Share a free slot':k==='opp'?'Post an opportunity':'Share with every campus';
    const fields=k==='post'?`<label class="field">Space<select id="cm-space">${['General','Idea & Project Lab',...HUBS.map(h=>h.name),...INTERESTS.map(i=>i.name),...GUILDS.map(g=>g.name)].map(n=>`<option ${n===sh.space?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`
     :k==='lecture'?`<label class="field">Topic<input id="cm-title" maxlength="80" placeholder="e.g. Devolution case law"></label><label class="field">Format<select id="cm-mode"><option>Virtual live</option><option>Recorded</option></select></label>`
     :k==='slot'?`<label class="field">Day<select id="cm-day">${[...Array(7)].map((_,i)=>{const d=addDays(i);return `<option value="${i}">${dayWord(d)}, ${d.getDate()} ${MONS[d.getMonth()]}</option>`}).join('')}</select></label><label class="field">Time<input id="cm-time" type="time" value="15:00"></label>`
     :`<label class="field">Type<select id="cm-type">${OPP_TYPES.map(o=>`<option ${o===(S.role==='staff'?'Job swap':'')?'selected':''}>${o}</option>`).join('')}</select></label><label class="field">Where<input id="cm-place" maxlength="60" placeholder="e.g. Nairobi or Online"></label>`;
    body=`${fields}<label class="field">${k==='slot'?'Note':k==='opp'?'Title and details':'Details'}<textarea id="cm-text" maxlength="600" placeholder="${k==='slot'?'e.g. Open for a guest session':'Write it clearly and kindly'}"></textarea></label>
     <div class="row row--wrap">${btnAct('compose-go','Publish')}${btnAct('sheet-x','Cancel','btn--ghost')}</div><p class="muted" style="font-size:12.5px">${k==='slot'?'Slots stay on this device for now.':'Posts are shared with other viewers of this page. Be kind; moderators can remove content.'}</p>`}
  return `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet__h"><h2>${esc(title)}</h2><button class="x" data-act="sheet-x" aria-label="Close">×</button></div>${body}</div></div>`;
}
function renderSheet(){const el=$('#sheet');el.innerHTML=sheetHtml();const f=el.querySelector('input,textarea,select');if(f&&S.sheet&&S.sheet.type==='compose')f.focus()}
let toastT;function toast(m){const el=$('#toast');el.textContent=m;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,3200)}

/* ---------- shell ---------- */
const TABS=['home','spaces','calls','opps','me'];
function render(keepScroll){
  if(S.room&&S.tab!=='calls')leaveRoomQuiet();
  const r=document.documentElement;r.dataset.role=S.role;r.lang=S.lang==='sw'?'sw':'en';
  $('#role-btn').innerHTML=`<span class="dot"></span>${esc(roleName(S.role))}`;
  document.querySelectorAll('.lang button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.l===S.lang)));
  $('#nav').innerHTML=TABS.map(k=>`<button data-act="tab:${k}" ${S.tab===k?'aria-current="page"':''}>${ICON[k==='opps'?'opps':k]}<span>${esc(t(k))}</span></button>`).join('');
  const v=pageView();
  $('#view').innerHTML=v+`<p class="foot">Chuo Moja · one university across Kenya · prototype</p>`;
  if(!keepScroll)window.scrollTo(0,0);
}
function go(tab){leaveRoomQuiet();S.page=null;S.tab=tab;if(tab!=='spaces')S.hub=null;render()}

/* ---------- posting ---------- */
async function createPost(doc){
  doc.ts=Date.now();doc.role=S.role;doc.uni=myShort();
  if(dbc&&meInfo.id&&canWrite){
    try{doc.by=meInfo.id;await dbc.collection('posts').add(doc);toast('Posted. Other viewers will see it.');return true}catch(e){}
  }
  S.local.unshift({...doc,id:'l'+doc.ts,local:true,by:null});S.local=S.local.slice(0,20);save();
  toast('Saved on this device. Sign in with edit access to share with others.');return true;
}
async function submitCompose(){
  const k=S.sheet.kind,txt=($('#cm-text')||{value:''}).value.trim();
  if(!txt){toast('Write something first');return}
  if(k==='slot'){S.slots.push({day:+$('#cm-day').value,time:$('#cm-time').value||'15:00',text:txt});save();S.sheet=null;renderSheet();toast('Slot added to your calendar');render(true);return}
  let doc;
  if(k==='post')doc={kind:'post',text:txt,space:$('#cm-space').value==='General'?'':$('#cm-space').value};
  else if(k==='lecture')doc={kind:'lecture',text:`${($('#cm-title').value||'Guest lecture').trim()} (${$('#cm-mode').value}). ${txt}`,space:'Guest Lecture Exchange'};
  else doc={kind:'opp',type:$('#cm-type').value,place:($('#cm-place').value||'Anywhere').trim(),text:txt};
  S.sheet=null;renderSheet();await createPost(doc);
  if(S.tab==='home')refreshFeed();if(S.tab==='opps')refreshOpps();if(S.tab==='home'&&S.role==='lecturer')render(true);
}

/* ---------- events ---------- */
function act(a,r,el,ev){
  switch(a){
   case 'tab':go(r);break;
   case 'lang-toggle':S.lang=S.lang==='sw'?'en':'sw';save();render(true);break;
   case 'role-open':S.sheet={type:'role'};renderSheet();break;
   case 'role':S.role=r;save();S.sheet=null;renderSheet();render(true);toast(roleName(r));break;
   case 'sheet-x':S.sheet=null;renderSheet();break;
   case 'sheet-bg':if(ev&&el===ev.target){S.sheet=null;renderSheet()}break;
   case 'banner-x':S.banner=false;save();render(true);break;
   case 'goto':{const[tab,sub]=r.split(':');S.tab=tab;S.hub=null;if(sub)S.spacesTab=sub;S.q='';render();break}
   case 'compose':{const kind=r;S.sheet={type:'compose',kind,space:kind==='post'&&S.role==='student'?'Idea & Project Lab':'General'};renderSheet();break}
   case 'compose-go':submitCompose();break;
   case 'post-now':{const v=($('#draft')||{value:''}).value.trim();if(!v){toast('Write something first');return}S.draft='';const d=$('#draft');if(d)d.value='';createPost({kind:'post',text:v,space:''}).then(refreshFeed);break}
   case 'ff':S.feedFilter=r;render(true);break;
   case 'helpful':toggle(S.helpful,r);refreshFeed();break;
   case 'pin':S.mapSel=S.mapSel===r?null:r;render(true);break;
   case 'rsvp':toggle(S.rsvp,r);render(true);toast(has(S.rsvp,r)?'You are going. Added to your calendar.':'RSVP removed');break;
   case 'st':S.spacesTab=r;S.q='';render(true);break;
   case 'join':toggle(S.joined,r);render(true);toast(has(S.joined,r)?'Joined':'Left');break;
   case 'hub':S.tab='spaces';S.hub=r;S.hubTab='notes';render();break;
   case 'hub-close':S.hub=null;render();break;
   case 'ht':S.hubTab=r;render(true);break;
   case 'team':toggle(S.team,r);render(true);toast(has(S.team,r)?'Request sent to the project lead':'Request withdrawn');break;
   case 'interest':toggle(S.interest,r);render(true);toast(has(S.interest,r)?'Message sent through the platform':'Withdrawn');break;
   case 'meet':{S.match={state:'searching'};render(true);setTimeout(()=>{const pool=PEOPLE.filter(p=>p.u!==myShort());S.match={state:'found',person:pool[Math.floor(Math.random()*pool.length)],ice:ICEBREAKERS[Math.floor(Math.random()*ICEBREAKERS.length)]};if(S.tab==='calls')render(true)},1300);if(S.tab!=='calls')go('calls');break}
   case 'meet-hi':{const p=S.match.person;S.threads.unshift({who:p.n,uni:p.u,when:'Just now',pre:'You said hi. They will see it when live chat opens in Phase 2.'});S.threads=S.threads.slice(0,5);save();S.match={state:'idle'};render(true);toast('Hello sent. Find it in Me, Messages.');break}
   case 'of':S.oppFilter=r;render(true);break;
   case 'save':toggle(S.saved,r);refreshOpps();toast(has(S.saved,r)?'Saved to Me':'Removed');break;
   case 'apply':S.sheet={type:'apply'};renderSheet();break;
   case 'cd':S.calDay=+r;render(true);break;
   case 'overlay':S.overlay=!S.overlay;render(true);break;
   case 'sharett':S.shareTT=!S.shareTT;save();render(true);toast(S.shareTT?'Timetable shared (preview only)':'Timetable private');break;
  }
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const _a=el.dataset.act.split(':')[0],_r=el.dataset.act.split(':').slice(1).join(':');if(act3(_a,_r,el,e)||act2(_a,_r,el,e))return;act(_a,_r,el,e)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.pin')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}if(e.key==='Escape'&&S.sheet){S.sheet=null;renderSheet()}});
document.addEventListener('input',e=>{
  if(e.target.id==='space-q'){S.q=e.target.value;refreshSpaces()}
  if(e.target.id==='draft')S.draft=e.target.value;
  if(e.target.id==='dept'){S.dept=e.target.value;save()}
});
document.addEventListener('change',e=>{if(e.target.id==='uni-sel'){S.uni=e.target.value;save();render(true);toast(uniShort(S.uni))}});
document.querySelectorAll('.lang button').forEach(b=>b.addEventListener('click',()=>{S.lang=b.dataset.l;save();render(true)}));
$('#role-btn').addEventListener('click',()=>act('role-open'));

/* ---------- capabilities (shared posts), all optional ---------- */
async function initCaps(){
  try{
    if(!(window.claude&&claude.use))return;
    userNs=await claude.use('user');
    if(userNs){const m=await userNs.me();meInfo={id:m.id,name:m.name||'',avatarUrl:m.avatarUrl||''};try{canWrite=(await userNs.can('data.write'))!==false}catch(e){canWrite=true}render(true)}
    dbc=await claude.use('db');
    if(dbc)dbc.collection('posts').orderBy('ts','desc').limit(60).onSnapshot(async snap=>{
      dbPosts=snap.docs.map(d=>({id:d.id,...d.data()}));
      const ids=[...new Set(dbPosts.map(p=>p.by).filter(Boolean))];
      if(userNs&&ids.length){try{const ps=await userNs.profiles(ids);ids.forEach(i=>{if(ps[i]&&ps[i].name)NAMES[i]=ps[i].name})}catch(e){}}
      refreshFeed();refreshOpps();if(S.tab==='home'&&S.role==='lecturer')render(true);
    },()=>{});
  }catch(e){}
}
