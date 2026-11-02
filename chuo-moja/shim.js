/* Chuo Moja browser shim: gives the app the same db / user / room calls it used on the prototype page,
   backed by this server, and shows the email-code sign-in screen. */
(function(){
  'use strict';
  window.__SELFHOST=true;
  const HDR={'X-Requested-With':'chuo','Content-Type':'application/json'};
  let ME=null,readyRes;const ready=new Promise(r=>readyRes=r);
  const PEER=Math.random().toString(36).slice(2,12)+Math.random().toString(36).slice(2,6);
  const ERR=(r,j)=>{const e=new Error(j&&j.error||('HTTP '+r.status));e.status=r.status;e.code=r.status===401?'unauthenticated':(r.status===403||r.status===404)?'invalid_argument':'unavailable';return e};
  async function api(method,url,body){
    const r=await fetch(url,{method,headers:HDR,credentials:'same-origin',body:body===undefined?undefined:JSON.stringify(body)});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok){if(r.status===401&&ME){ME=null;showLogin()}throw ERR(r,j)}
    return j;
  }

  /* ---------- sign-in screen ---------- */
  const css=`#login[hidden]{display:none}#login{position:fixed;inset:0;z-index:100;background:var(--bg,#F2F5F0);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:max(24px,env(safe-area-inset-top)) 16px 24px}
  #login .box{width:100%;max-width:440px;background:var(--surface,#fff);border:1px solid var(--line,#D2DCD2);border-radius:20px;padding:24px;margin-top:6vh;color:var(--ink,#0E1B14)}
  #login h1{font-family:var(--f-display,inherit);font-size:28px;margin:12px 0 6px;line-height:1.15}#login p{color:var(--ink2,#425448);font-size:14.5px;margin:0 0 14px}
  #login label{display:block;font-weight:700;font-size:13.5px;margin:12px 0 4px}#login input{width:100%;border:1px solid var(--line,#D2DCD2);background:var(--surface,#fff);color:var(--ink,#0E1B14);border-radius:12px;padding:12px;font:inherit;font-size:16px}
  #login input.code{letter-spacing:.35em;font-family:var(--f-mono,monospace);font-size:22px;text-align:center}
  #login .btn{margin-top:16px;width:100%}#login .err{color:var(--live,#D9263F);font-size:13.5px;min-height:20px;margin-top:10px}#login .fine{font-size:12.5px;color:var(--ink2,#425448);margin-top:14px}
  #login .lnk{background:none;border:0;color:var(--accent,#0A6B47);font:inherit;font-weight:700;cursor:pointer;padding:6px 0;margin-top:6px}`;
  let loginEl=null,stepEmail='';
  function showLogin(){
    if(!loginEl){const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);loginEl=document.createElement('div');loginEl.id='login';loginEl.setAttribute('role','dialog');loginEl.setAttribute('aria-modal','true');loginEl.setAttribute('aria-label','Sign in');document.body.appendChild(loginEl)}
    loginEl.hidden=false;stepOne();
  }
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function box(inner){loginEl.innerHTML=`<div class="box"><svg width="40" height="40" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#0F2A1E"/><path d="M6 15Q17 3 28 15" fill="none" stroke="#EAF6EE" stroke-width="2.4" stroke-linecap="round"/><circle cx="10" cy="23" r="3" fill="#3DCB8E"/><circle cx="17" cy="23" r="3" fill="#F2B84B"/><circle cx="24" cy="23" r="3" fill="#7FB0FF"/></svg>${inner}</div>`}
  function stepOne(msg){
    box(`<h1>Welcome to Chuo Moja</h1><p>One campus across Kenya. Sign in with your university email and we send you a 6-digit code. No password to remember.</p>
    <form id="lf1"><label for="le">University email</label><input id="le" type="email" inputmode="email" autocomplete="email" required placeholder="you@students.uonbi.ac.ke" value="${esc(stepEmail)}">
    <button class="btn" type="submit">Send me a code</button><div class="err" role="alert" id="lerr">${esc(msg||'')}</div></form>
    <p class="fine">Your email is only used to confirm you study or work at a Kenyan university. Other people never see it. <a href="/privacy.html" target="_blank" rel="noopener">How we handle your data</a>.</p>`);
    const f=loginEl.querySelector('#lf1'),i=loginEl.querySelector('#le');i.focus();
    f.onsubmit=async e=>{e.preventDefault();stepEmail=i.value.trim().toLowerCase();const b=f.querySelector('button');b.disabled=true;b.textContent='Sending…';
      try{await api('POST','/api/auth/request',{email:stepEmail});stepTwo()}catch(x){b.disabled=false;b.textContent='Send me a code';loginEl.querySelector('#lerr').textContent=x.message}};
  }
  function stepTwo(msg){
    box(`<h1>Check your inbox</h1><p>We sent a 6-digit code to <b>${esc(stepEmail)}</b>. It works for 10 minutes. Check spam if you do not see it.</p>
    <form id="lf2"><label for="lc">6-digit code</label><input id="lc" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required>
    <label for="ln">Your name (shown to others, needed the first time)</label><input id="ln" autocomplete="name" maxlength="60" placeholder="e.g. Wanjiru Kamau">
    <button class="btn" type="submit">Sign in</button><div class="err" role="alert" id="lerr">${esc(msg||'')}</div></form>
    <button class="lnk" id="lback" type="button">Use a different email</button>`);
    const f=loginEl.querySelector('#lf2');loginEl.querySelector('#lc').focus();
    loginEl.querySelector('#lback').onclick=()=>stepOne();
    f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button');b.disabled=true;
      try{const j=await api('POST','/api/auth/verify',{email:stepEmail,code:loginEl.querySelector('#lc').value,name:loginEl.querySelector('#ln').value});signedIn(j.me)}
      catch(x){b.disabled=false;loginEl.querySelector('#lerr').textContent=x.message==='name'?'Please add your name (at least 2 letters)':x.message}};
  }
  function signedIn(me){ME=me;if(loginEl)loginEl.hidden=true;startStream();readyRes()}

  /* ---------- live stream ---------- */
  let es=null,connected=false,streamOk;const streamReady=new Promise(r=>streamOk=r);
  const subs={},rooms={},connH=new Set();
  function startStream(){
    if(es)es.close();
    es=new EventSource('/api/stream?peer='+PEER);
    es.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
      if(m.t==='hello'){connected=true;streamOk();connH.forEach(h=>h(true));Object.values(rooms).forEach(r=>r._rejoin());Object.keys(subs).forEach(c=>refetch(c))}
      else if(m.t==='db')refetch(m.col);
      else if(m.t==='peers'&&rooms[m.room])rooms[m.room]._peers(m);
      else if(m.t==='evt'&&rooms[m.room])rooms[m.room]._evt(m)};
    es.onerror=()=>{connected=false;connH.forEach(h=>h(false))};
  }
  const timers={};
  function refetch(col){
    const cols=col==='*'?Object.keys(subs):[col];
    cols.forEach(c=>{clearTimeout(timers[c]);timers[c]=setTimeout(()=>(subs[c]||[]).forEach(s=>s.fetch()),120)});
  }

  /* ---------- db ---------- */
  const snap=docs=>{const d=docs.map(x=>({id:x.id,data:()=>x.data}));return{docs:d,size:d.length}};
  const dbNs={collection(col){
    let lim=100;
    const c={orderBy(){return c},limit(n){lim=n;return c},
      onSnapshot(next,err){const s={fetch:async()=>{try{const j=await api('GET',`/api/db/${col}?limit=${lim}`);next(snap(j.docs))}catch(e){if(err)err(e)}}};(subs[col]=subs[col]||new Set()).add(s);s.fetch();return()=>{subs[col]&&subs[col].delete(s)}},
      async add(data){const j=await api('POST',`/api/db/${col}`,{data});return{id:j.id}},
      doc(id){const u=`/api/db/${col}/${encodeURIComponent(id)}`;
        return{async set(data){await api('PUT',u,{data})},async update(p){await api('PATCH',u,{data:p})},async delete(){await api('DELETE',u)},
          async get(){try{const j=await api('GET',u);return{id,exists:true,data:()=>j.doc.data}}catch(e){return{id,exists:false,data:()=>undefined}}},
          onSnapshot(next,err){const s={fetch:async()=>{try{const j=await api('GET',u);next({id,exists:true,data:()=>j.doc.data})}catch(e){if(e.status===404||e.status===403)next({id,exists:false,data:()=>undefined});else if(err)err(e)}}};(subs[col]=subs[col]||new Set()).add(s);s.fetch();return()=>{subs[col]&&subs[col].delete(s)}}}}};
    return c}};

  /* ---------- user ---------- */
  const userNs={async me(){return{id:ME.id,name:ME.name,avatarUrl:'',uniShort:ME.uni||''}},async id(){return ME.id},async can(){return true},async canEdit(){return !!ME.admin},async isOwner(){return !!ME.admin},
    async profiles(ids){const j=await api('GET','/api/profiles?ids='+encodeURIComponent(ids.join(',')));return j.profiles||{}}};

  /* ---------- rooms ---------- */
  function makeRoom(name){
    let mine={},others=[],skew=0;const hs={},ph=new Set(),dead={v:false};
    const room={name,_dead:false,
      peers(){return[{peer:PEER,by:ME.id,isMe:true,sameTab:true,kind:'viewer',guest:false,presence:{...mine},updatedAt:Date.now()},...others]},
      _notify(){const p=room.peers();ph.forEach(h=>{try{h({peers:p,joined:[],left:[],updated:[]})}catch(e){}})},
      _peers(m){skew=Date.now()-m.serverNow;others=m.peers.filter(p=>p.peer!==PEER).map(p=>({peer:p.peer,by:p.by,isMe:false,sameTab:false,kind:'viewer',guest:false,presence:p.presence||{},updatedAt:p.updatedAt+skew}));room._notify()},
      _evt(m){(hs[m.topic]||[]).forEach(h=>{try{h({topic:m.topic,data:m.data,peer:m.peer,by:m.by,isMe:m.peer===PEER,sameTab:m.peer===PEER,kind:'viewer',guest:false})}catch(e){}})},
      async _rejoin(){if(room._dead)return;try{await api('POST','/api/room/join',{peer:PEER,room:name});if(Object.keys(mine).length)await api('POST','/api/room/presence',{peer:PEER,room:name,presence:mine})}catch(e){}},
      async emit(topic,data){try{await api('POST','/api/room/emit',{peer:PEER,room:name,topic,data})}catch(e){const x=new Error(e.message);x.code=e.status===403||e.status===400?'not_permitted':'unavailable';throw x}},
      on(topic,h,errH){(hs[topic]=hs[topic]||[]).push(h);return()=>{hs[topic]=(hs[topic]||[]).filter(x=>x!==h)}},
      async presence(p){Object.entries(p).forEach(([k,v])=>{if(v===null)delete mine[k];else mine[k]=v});room._notify();
        try{await api('POST','/api/room/presence',{peer:PEER,room:name,presence:mine})}catch(e){if(e.status===409){await room._rejoin()}else throw e}},
      onPeers(h,errH){ph.add(h);setTimeout(()=>{try{h({peers:room.peers(),joined:room.peers(),left:[],updated:[]})}catch(e){}},0);return()=>ph.delete(h)},
      connected:()=>connected,onConnection(h){connH.add(h);setTimeout(()=>h(connected),0);return()=>connH.delete(h)},
      async leave(){room._dead=true;if(rooms[name]!==room)return;delete rooms[name];try{await api('POST','/api/room/leave',{peer:PEER,room:name})}catch(e){}}};
    return room;
  }
  async function joinRoom(name){
    if(rooms[name])rooms[name]._dead=true;
    const r=makeRoom(name);rooms[name]=r;
    await api('POST','/api/room/join',{peer:PEER,room:name});return r;
  }
  let lobbyP=null;
  const roomNs=async()=>{if(!lobbyP)lobbyP=joinRoom('lobby').then(l=>{l.join=joinRoom;return l});return lobbyP};

  /* ---------- account ---------- */
  window.chuoAccount={
    async logout(){try{await api('POST','/api/auth/logout',{})}catch(e){}location.reload()},
    async remove(){await api('DELETE','/api/account');location.reload()},
    exportUrl:'/api/account/export'};

  window.claude={use:async name=>{await ready;await streamReady;
    if(name==='user')return userNs;if(name==='db')return dbNs;if(name==='room')return roomNs();return null}};

  /* ---------- boot ---------- */
  (async()=>{
    try{const j=await api('GET','/api/me');if(j.me){signedIn(j.me);return}}catch(e){}
    const go=()=>showLogin();document.body?go():document.addEventListener('DOMContentLoaded',go);
  })();
})();
