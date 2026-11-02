'use strict';
/* Chuo Moja server. No npm packages: needs Node 22.5 or newer. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const ENV=process.env;
const PORT=+ENV.PORT||3000,HOST=ENV.HOST||'0.0.0.0',DATA=path.resolve(ENV.DATA_DIR||path.join(__dirname,'data')),PUB=path.join(__dirname,'public');
const PUBLIC_URL=(ENV.PUBLIC_URL||'').replace(/\/$/,''),SECURE=PUBLIC_URL.startsWith('https://')||ENV.COOKIE_SECURE==='1';
const SITE=ENV.SITE_NAME||'Chuo Moja';
fs.mkdirSync(DATA,{recursive:true});
let SECRET=ENV.SECRET;const SF=path.join(DATA,'secret');
if(!SECRET){try{SECRET=fs.readFileSync(SF,'utf8').trim()}catch(e){SECRET=crypto.randomBytes(32).toString('hex');fs.writeFileSync(SF,SECRET,{mode:0o600})}}
const ADMINS=(ENV.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const ALLOWED=(ENV.ALLOWED_DOMAINS||'ac.ke,strathmore.edu,aku.edu,cuea.edu').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
let DOMAINS={};try{DOMAINS=JSON.parse(fs.readFileSync(ENV.DOMAINS_FILE||path.join(__dirname,'domains.json'),'utf8'))}catch(e){}
const domainOk=d=>ALLOWED.some(a=>d===a||d.endsWith('.'+a));
const uniFor=d=>{const k=Object.keys(DOMAINS).find(k=>k[0]!=='_'&&(d===k||d.endsWith('.'+k)));return k?DOMAINS[k]:null};
const isStudentDomain=d=>/^(students?|stud|std|stu|learners?)\./.test(d);
const MAIL=(ENV.MAIL_PROVIDER||'console').toLowerCase();

/* ---------- database ---------- */
const db=new DatabaseSync(path.join(DATA,'chuomoja.sqlite'));
db.exec(`PRAGMA journal_mode=WAL;PRAGMA synchronous=NORMAL;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,uni TEXT,admin INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS codes(email TEXT PRIMARY KEY,hash TEXT NOT NULL,exp INTEGER NOT NULL,tries INTEGER NOT NULL DEFAULT 0,sent INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(th TEXT PRIMARY KEY,uid TEXT NOT NULL,exp INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS docs(col TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,ts REAL NOT NULL DEFAULT 0,by TEXT,PRIMARY KEY(col,id));
CREATE INDEX IF NOT EXISTS docs_ts ON docs(col,ts DESC);CREATE INDEX IF NOT EXISTS docs_by ON docs(by);`);
const q={
 userById:db.prepare('SELECT * FROM users WHERE id=?'),userByEmail:db.prepare('SELECT * FROM users WHERE email=?'),
 insUser:db.prepare('INSERT INTO users(id,email,name,uni,admin,created) VALUES(?,?,?,?,?,?)'),setAdmin:db.prepare('UPDATE users SET admin=? WHERE id=?'),
 countUsers:db.prepare('SELECT COUNT(*) n FROM users'),
 getCode:db.prepare('SELECT * FROM codes WHERE email=?'),putCode:db.prepare('INSERT OR REPLACE INTO codes(email,hash,exp,tries,sent) VALUES(?,?,?,0,?)'),
 tryCode:db.prepare('UPDATE codes SET tries=tries+1 WHERE email=?'),delCode:db.prepare('DELETE FROM codes WHERE email=?'),
 putSess:db.prepare('INSERT INTO sessions(th,uid,exp) VALUES(?,?,?)'),getSess:db.prepare('SELECT * FROM sessions WHERE th=?'),delSess:db.prepare('DELETE FROM sessions WHERE th=?'),
 delSessUser:db.prepare('DELETE FROM sessions WHERE uid=?'),purgeSess:db.prepare('DELETE FROM sessions WHERE exp<?'),purgeCodes:db.prepare('DELETE FROM codes WHERE exp<?'),
 listDocs:db.prepare('SELECT id,data FROM docs WHERE col=? ORDER BY ts DESC LIMIT ?'),getDoc:db.prepare('SELECT id,data,by FROM docs WHERE col=? AND id=?'),
 putDoc:db.prepare('INSERT OR REPLACE INTO docs(col,id,data,ts,by) VALUES(?,?,?,?,?)'),delDoc:db.prepare('DELETE FROM docs WHERE col=? AND id=?'),
 byUser:db.prepare('SELECT col,id,data FROM docs WHERE by=?'),delByUser:db.prepare('DELETE FROM docs WHERE by=?'),
 delVerifiedFor:db.prepare("DELETE FROM docs WHERE col='verified' AND id=?"),delClaimFor:db.prepare("DELETE FROM docs WHERE col='claims' AND id=?"),
 names:null
};
const sha=s=>crypto.createHash('sha256').update(SECRET+'|'+s).digest('hex');
const rid=(n=16)=>crypto.randomBytes(n).toString('hex');
const uid=()=>'u_'+crypto.randomBytes(11).toString('base64url');
const now=()=>Date.now();

/* ---------- small helpers ---------- */
const buckets=new Map();
function limited(key,max,windowMs){const t=now(),b=(buckets.get(key)||[]).filter(x=>t-x<windowMs);if(b.length>=max){buckets.set(key,b);return true}b.push(t);buckets.set(key,b);return false}
setInterval(()=>{const t=now();for(const[k,v]of buckets){const f=v.filter(x=>t-x<3600000);f.length?buckets.set(k,f):buckets.delete(k)}q.purgeSess.run(t);q.purgeCodes.run(t)},600000).unref();
const send=(res,code,obj,headers={})=>{const b=JSON.stringify(obj);res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(b)};
const fail=(res,code,error)=>send(res,code,{error});
async function body(req,max=60000){return new Promise((ok,no)=>{let n=0,big=false;const c=[];req.on('data',d=>{n+=d.length;if(n>max*10){req.destroy();return}if(n>max)big=true;else c.push(d)});req.on('end',()=>{if(big)return no(new Error('big'));try{ok(c.length?JSON.parse(Buffer.concat(c).toString()):{})}catch(e){no(new Error('json'))}});req.on('error',no)})}
const parseCookies=h=>Object.fromEntries((h||'').split(';').map(s=>s.trim().split('=')).filter(a=>a[0]).map(a=>[a[0],decodeURIComponent(a.slice(1).join('='))]));
const ip=req=>(ENV.TRUST_PROXY==='1'&&(req.headers['x-forwarded-for']||'').split(',')[0].trim())||req.socket.remoteAddress||'?';
function userOf(req){
  const tok=parseCookies(req.headers.cookie).cm_session;if(!tok)return null;
  const s=q.getSess.get(sha(tok));if(!s||s.exp<now())return null;
  return q.userById.get(s.uid)||null;
}
const publicUser=u=>({id:u.id,name:u.name,uni:u.uni||null,admin:!!u.admin});

/* ---------- mail ---------- */
async function sendMail(to,code){
  const subject=`${code} is your ${SITE} sign-in code`,text=`Your ${SITE} sign-in code is ${code}\n\nIt works for 10 minutes. If you did not ask for it, ignore this email.\n\n${SITE}: one digital campus for Kenyan universities.`;
  const from=ENV.MAIL_FROM||`${SITE} <no-reply@localhost>`;
  if(MAIL==='console'){console.log(`[mail:console] code for ${to} is ${code}`);return}
  const key=ENV.MAIL_API_KEY;if(!key)throw new Error('MAIL_API_KEY missing');
  let r;
  if(MAIL==='resend')r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],subject,text})});
  else if(MAIL==='brevo'){const m=/^(.*)<(.+)>$/.exec(from)||[0,SITE,from];r=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':key,'Content-Type':'application/json'},body:JSON.stringify({sender:{name:m[1].trim()||SITE,email:m[2].trim()},to:[{email:to}],subject,textContent:text})})}
  else if(MAIL==='mailgun'){const dom=ENV.MAILGUN_DOMAIN,base=ENV.MAILGUN_BASE||'https://api.mailgun.net';r=await fetch(`${base}/v3/${dom}/messages`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from('api:'+key).toString('base64')},body:new URLSearchParams({from,to,subject,text})})}
  else throw new Error('Unknown MAIL_PROVIDER');
  if(!r.ok)throw new Error('mail provider said '+r.status);
}

/* ---------- auth ---------- */
const EMAIL_RE=/^[a-z0-9._%+\-]{1,64}@([a-z0-9\-]+\.)+[a-z]{2,}$/;
async function authRequest(req,res){
  const b=await body(req),email=String(b.email||'').trim().toLowerCase();
  if(!EMAIL_RE.test(email)||email.length>120)return fail(res,400,'Enter a valid email address');
  const dom=email.split('@')[1];
  if(!domainOk(dom))return fail(res,400,'Use your university email address (it should end in .ac.ke)');
  if(limited('ip:'+ip(req),20,3600000)||limited('em:'+email,5,3600000))return fail(res,429,'Too many tries. Wait a little and try again.');
  const old=q.getCode.get(email);if(old&&now()-old.sent<45000)return fail(res,429,'A code was just sent. Check your inbox, or wait a moment to ask again.');
  const code=String(crypto.randomInt(100000,1000000));
  q.putCode.run(email,sha(email+'|'+code),now()+600000,now());
  try{await sendMail(email,code)}catch(e){console.error('mail failed:',e.message);q.delCode.run(email);return fail(res,502,'We could not send the email. Try again soon.')}
  send(res,200,{ok:true,uni:uniFor(dom)});
}
function setCookie(res,tok,maxAge){res.setHeader('Set-Cookie',`cm_session=${tok}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${SECURE?'; Secure':''}`)}
async function authVerify(req,res){
  const b=await body(req),email=String(b.email||'').trim().toLowerCase(),code=String(b.code||'').replace(/\D/g,'').slice(0,6);
  if(limited('v:'+ip(req),30,3600000))return fail(res,429,'Too many tries. Wait a little and try again.');
  const c=q.getCode.get(email);
  if(!c||c.exp<now())return fail(res,400,'That code has expired. Ask for a new one.');
  if(c.tries>=5){q.delCode.run(email);return fail(res,400,'Too many wrong codes. Ask for a new one.')}
  const good=sha(email+'|'+code),a=Buffer.from(good),bb=Buffer.from(c.hash);
  if(!(a.length===bb.length&&crypto.timingSafeEqual(a,bb))){q.tryCode.run(email);return fail(res,400,'That code is not right')}
  let u=q.userByEmail.get(email);
  if(!u){
    const name=String(b.name||'').replace(/\s+/g,' ').trim().slice(0,60);
    if(name.length<2)return fail(res,400,'name');
    const dom=email.split('@')[1],first=q.countUsers.get().n===0;
    const id=uid();q.insUser.run(id,email,name,uniFor(dom),(first&&!ADMINS.length)||ADMINS.includes(email)?1:0,now());u=q.userById.get(id);
    if(isStudentDomain(dom)&&u.uni){putDoc('verified',u.id,{role:'student',uni:u.uni,ts:now(),by:u.id,auto:'student-email'},u.id)}
  }else if(ADMINS.includes(email)&&!u.admin){q.setAdmin.run(1,u.id);u=q.userById.get(u.id)}
  q.delCode.run(email);
  const tok=rid(32);q.putSess.run(sha(tok),u.id,now()+30*86400000);setCookie(res,tok,30*86400);
  send(res,200,{ok:true,me:publicUser(u)});
}
function authLogout(req,res){const t=parseCookies(req.headers.cookie).cm_session;if(t)q.delSess.run(sha(t));setCookie(res,'',0);send(res,200,{ok:true})}

/* ---------- documents with access rules ---------- */
const COLS=new Set(['posts','lines','lectures','research','slots','endorse','resp','qa','mentor','projects','verified','claims']);
const ID_RE=/^[A-Za-z0-9_\-.:@+]{1,200}$/;
const canRead=(u,col,id)=>col==='claims'?(u.admin||id===u.id):true;           // claims are private to editors and the claimant
const canWriteCol=(u,col,id)=>col==='verified'?!!u.admin:col==='claims'?(u.admin||id===u.id):true;
function putDoc(col,id,data,by){q.putDoc.run(col,id,JSON.stringify(data),+data.ts||now(),by||data.by||null);broadcast({t:'db',col})}
function cleanDoc(u,col,data,id,existing){
  if(!data||typeof data!=='object'||Array.isArray(data))return null;
  const s=JSON.stringify(data);if(s.length>20000)return null;
  const d=JSON.parse(s);
  if(col==='verified'){d.by=u.id;d.ts=+d.ts||now();return d}   // approver's id
  if(col==='claims'){d.by=id;if(!u.admin){d.by=u.id}d.ts=+d.ts||now();return d}
  if(existing){d.by=existing.by||u.id;d.ts=existing.ts||+d.ts||now()} else {d.by=u.id;d.ts=now()}   // owner and time cannot be forged
  if(u.uni&&!existing)d.uni=u.uni;                                                   // campus comes from the confirmed email
  if(col==='resp'&&!(u.admin||id.endsWith('__'+u.id)))return null;                       // one response per person
  return d;
}
async function dbRoute(req,res,u,parts){
  const col=parts[0],id=parts[1];
  if(!COLS.has(col))return fail(res,404,'not found');
  if(id!==undefined&&!ID_RE.test(id))return fail(res,400,'bad id');
  const url=new URL(req.url,'http://x');
  if(req.method==='GET'&&id===undefined){
    const lim=Math.max(1,Math.min(500,+url.searchParams.get('limit')||100));
    let rows=q.listDocs.all(col,lim).map(r=>({id:r.id,data:JSON.parse(r.data)}));
    if(col==='claims'&&!u.admin)rows=rows.filter(r=>r.id===u.id);
    return send(res,200,{docs:rows});
  }
  if(req.method==='GET'){
    if(!canRead(u,col,id))return fail(res,404,'not found');
    const r=q.getDoc.get(col,id);return r?send(res,200,{doc:{id:r.id,data:JSON.parse(r.data)}}):fail(res,404,'not found');
  }
  if(limited('w:'+u.id,90,60000))return fail(res,429,'Slow down a little');
  let b;try{b=await body(req,30000)}catch(e){return fail(res,400,'bad body')}
  const data=b.data;
  if(req.method==='POST'&&id===undefined){
    const nid=rid(10),d=cleanDoc(u,col,data,nid,null);
    if(!d||!canWriteCol(u,col,nid))return fail(res,403,'not allowed');
    putDoc(col,nid,d);return send(res,200,{id:nid});
  }
  if(id===undefined)return fail(res,405,'method');
  if(!canWriteCol(u,col,id))return fail(res,403,'not allowed');
  const ex=q.getDoc.get(col,id),exData=ex?JSON.parse(ex.data):null;
  if(req.method==='DELETE'){
    if(!ex)return send(res,200,{ok:true});
    if(!(u.admin||ex.by===u.id||(col==='claims'&&id===u.id)))return fail(res,403,'not allowed');
    q.delDoc.run(col,id);broadcast({t:'db',col});return send(res,200,{ok:true});
  }
  if(req.method==='PUT'||req.method==='PATCH'){
    if(ex&&!(u.admin||ex.by===u.id||col==='claims'))return fail(res,403,'not allowed');
    if(req.method==='PATCH'&&!ex)return fail(res,404,'not found');
    const merged=req.method==='PATCH'?{...exData,...data}:data;
    const d=cleanDoc(u,col,merged,id,ex&&col!=='claims'&&col!=='verified'?{by:ex.by,ts:exData.ts}:null);
    if(!d)return fail(res,403,'not allowed');
    putDoc(col,id,d);return send(res,200,{ok:true});
  }
  fail(res,405,'method');
}

/* ---------- live stream: db changes + rooms ---------- */
const streams=new Map();                 // peer -> {res,uid}
const rooms=new Map();                   // room -> Map(peer -> {by,presence,updatedAt})
function emitTo(peer,obj){const s=streams.get(peer);if(s)try{s.res.write(`data: ${JSON.stringify(obj)}\n\n`)}catch(e){}}
function broadcast(obj){const line=`data: ${JSON.stringify(obj)}\n\n`;for(const s of streams.values())try{s.res.write(line)}catch(e){}}
function roomPeers(name){const m=rooms.get(name);return m?[...m].map(([peer,v])=>({peer,by:v.by,presence:v.presence,updatedAt:v.updatedAt})):[]}
function pushPeers(name){const peers=roomPeers(name),msg={t:'peers',room:name,peers,serverNow:now()};for(const p of peers)emitTo(p.peer,msg)}
function dropPeer(peer){for(const[name,m]of rooms)if(m.delete(peer)){if(!m.size)rooms.delete(name);else pushPeers(name)}}
const ROOM_RE=/^[a-z0-9_.\-]{1,48}$/;
function streamRoute(req,res,u){
  const peer=new URL(req.url,'http://x').searchParams.get('peer')||'';
  if(!/^[a-z0-9]{6,24}$/.test(peer))return fail(res,400,'bad peer');
  if([...streams.values()].filter(s=>s.uid===u.id).length>=8)return fail(res,429,'Too many open tabs');
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});
  res.write(`data: ${JSON.stringify({t:'hello'})}\n\n`);
  const old=streams.get(peer);if(old&&old.uid!==u.id){res.end();return}
  streams.set(peer,{res,uid:u.id});
  const hb=setInterval(()=>{try{res.write(': ping\n\n')}catch(e){}},20000);
  req.on('close',()=>{clearInterval(hb);if(streams.get(peer)&&streams.get(peer).res===res){streams.delete(peer);dropPeer(peer)}});
}
async function roomRoute(req,res,u,op){
  let b;try{b=await body(req,4000)}catch(e){return fail(res,400,'bad body')}
  const peer=String(b.peer||''),name=String(b.room||'');
  const s=streams.get(peer);if(!s||s.uid!==u.id)return fail(res,409,'no stream');
  if(!ROOM_RE.test(name))return fail(res,400,'bad room');
  if(limited('r:'+peer,120,60000))return fail(res,429,'Slow down a little');
  if(op==='join'){
    let m=rooms.get(name);if(!m){if(rooms.size>2000)return fail(res,503,'busy');m=new Map();rooms.set(name,m)}
    if(!m.has(peer)){if(m.size>=400&&name!=='lobby')return fail(res,403,'This room is full');m.set(peer,{by:u.id,presence:{},updatedAt:now()})}
    pushPeers(name);return send(res,200,{ok:true});
  }
  const m=rooms.get(name),me=m&&m.get(peer);if(!me)return fail(res,409,'not in room');
  if(op==='leave'){m.delete(peer);if(!m.size)rooms.delete(name);else pushPeers(name);return send(res,200,{ok:true})}
  if(op==='presence'){
    const p=b.presence;if(!p||typeof p!=='object'||JSON.stringify(p).length>600)return fail(res,400,'bad presence');
    me.presence=p;me.updatedAt=now();pushPeers(name);return send(res,200,{ok:true});
  }
  if(op==='emit'){
    const topic=String(b.topic||'');if(topic!=='chat')return fail(res,400,'bad topic');
    if(limited('e:'+peer,30,10000))return fail(res,429,'Slow down a little');
    const data=b.data;if(!data||typeof data!=='object'||JSON.stringify(data).length>800)return fail(res,400,'bad message');
    const msg={t:'evt',room:name,topic,data,by:u.id,peer};for(const p of m.keys())emitTo(p,msg);return send(res,200,{ok:true});
  }
  fail(res,404,'not found');
}

/* ---------- account ---------- */
function accountDelete(u,res){
  q.delByUser.run(u.id);q.delVerifiedFor.run(u.id);q.delClaimFor.run(u.id);q.delSessUser.run(u.id);
  db.prepare('DELETE FROM users WHERE id=?').run(u.id);
  for(const[p,s]of streams)if(s.uid===u.id){try{s.res.end()}catch(e){}streams.delete(p);dropPeer(p)}
  broadcast({t:'db',col:'*'});setCookie(res,'',0);send(res,200,{ok:true});
}
function accountExport(u,res){
  const docs=q.byUser.all(u.id).map(r=>({collection:r.col,id:r.id,data:JSON.parse(r.data)}));
  const full=q.userById.get(u.id);
  send(res,200,{account:{id:full.id,email:full.email,name:full.name,university:full.uni,created:new Date(full.created).toISOString()},items:docs},{'Content-Disposition':'attachment; filename="chuo-moja-my-data.json"'});
}

/* ---------- static files ---------- */
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const CSP="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
function serveStatic(req,res){
  let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p==='/')p='/index.html';
  const f=path.join(PUB,path.normalize(p));
  if(!f.startsWith(PUB+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found')}
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Cache-Control':p==='/index.html'?'no-cache':'public, max-age=3600',...(SECURE?{'Strict-Transport-Security':'max-age=31536000'}:{})});
  fs.createReadStream(f).pipe(res);
}

/* ---------- router ---------- */
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://x'),p=url.pathname;
    if(!p.startsWith('/api/'))return serveStatic(req,res);
    if(p==='/api/health')return send(res,200,{ok:true});
    if(req.method!=='GET'&&req.headers['x-requested-with']!=='chuo')return fail(res,403,'bad request');
    if(p==='/api/config')return send(res,200,{site:SITE,allowed:ALLOWED});
    if(p==='/api/auth/request'&&req.method==='POST')return await authRequest(req,res);
    if(p==='/api/auth/verify'&&req.method==='POST')return await authVerify(req,res);
    if(p==='/api/auth/logout'&&req.method==='POST')return authLogout(req,res);
    const u=userOf(req);
    if(p==='/api/me')return send(res,200,{me:u?publicUser(u):null});
    if(!u)return fail(res,401,'sign in');
    if(p==='/api/stream')return streamRoute(req,res,u);
    if(p==='/api/profiles'){
      const ids=(url.searchParams.get('ids')||'').split(',').filter(x=>/^u_[A-Za-z0-9_\-]{6,40}$/.test(x)).slice(0,64),out={};
      for(const id of ids){const r=q.userById.get(id);if(r)out[id]={id,name:r.name}}return send(res,200,{profiles:out});
    }
    if(p.startsWith('/api/db/'))return await dbRoute(req,res,u,p.slice(8).split('/').filter(Boolean).map(decodeURIComponent));
    if(p.startsWith('/api/room/')&&req.method==='POST')return await roomRoute(req,res,u,p.slice(10));
    if(p==='/api/account/export')return accountExport(u,res);
    if(p==='/api/account'&&req.method==='DELETE')return accountDelete(u,res);
    fail(res,404,'not found');
  }catch(e){console.error(e);if(!res.headersSent)fail(res,500,'server error');else try{res.end()}catch(_){}}
});
server.requestTimeout=0;server.headersTimeout=15000;
if(require.main===module)server.listen(PORT,HOST,()=>console.log(`${SITE} running on http://${HOST}:${PORT}  (mail: ${MAIL}, data: ${DATA})`));
module.exports={server};
