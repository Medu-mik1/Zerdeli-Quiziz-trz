const BOYS=['👦','🧑‍🎓','🦸‍♂️','🧙‍♂️'],GIRLS=['👧','👩‍🎓','🦸‍♀️','🧚‍♀️'];
const DEF=[
['Қазақстанның астанасы қай қала?',['Астана','Алматы','Шымкент','Қарағанды'],0],
['Күн жүйесіндегі ең үлкен планета қайсы?',['Марс','Юпитер','Сатурн','Жер'],1],
['7 × 8 нешеге тең?',['54','56','58','64'],1],
['«Қара сөздер» кімнің туындысы?',['Абай','Шоқан Уәлиханов','Жамбыл','Мағжан'],0],
['Су неше градуста қайнайды?',['50°C','90°C','100°C','120°C'],2],
['Қазақ хандығы қай ғасырда құрылды?',['XIII','XV','XVII','XIX'],1],
['Ең үлкен мұхит қайсы?',['Атлант','Үнді','Тынық','Солтүстік Мұзды'],2],
['Қазақстан туында қай құс бейнеленген?',['Қарға','Бүркіт','Көгершін','Үйрек'],1]];
const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const view=h=>{app.innerHTML=h};
let S={role:'',name:'',av:'',pin:'',mode:'classic',ph:'',tr:null,players:{},qs:DEF.map(x=>({q:x[0],a:x[1].slice(),c:x[2]}))};
let G=null,joinedOK=false,timers=[];

function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2800)}

/* ---------- Байланыс (room немесе BroadcastChannel) ---------- */
async function connect(p){
  let tr=null;
  try{
    if(window.claude&&claude.use){
      const r=await claude.use('room');
      if(r){const nr=await r.join('zph-'+p);
        tr={send:d=>nr.emit('g',d).catch(()=>{}),on:f=>nr.on('g',m=>{if(!m.sameTab)f(m.data)})};}
    }
  }catch(e){}
  if(!tr){const bc=new BroadcastChannel('zph-'+p);
    tr={send:d=>bc.postMessage(d),on:f=>{bc.onmessage=e=>f(e.data)}};}
  tr.on(m=>{if(m&&typeof m==='object'){S.role==='t'?tHandle(m):sHandle(m)}});
  S.tr=tr;
}

/* ---------- Басты бет ---------- */
function home(){
  timers.forEach(clearInterval);G=null;S.ph='';S.players={};S.role='';
  view(`<div class="wrap center"><div class="logo">🎮</div><h1>Zerdeli PlayHub</h1>
  <p class="sub">Білімді ойынмен бекіт! Рөліңді таңда:</p>
  <div class="row"><button class="btn big" onclick="stuReg()">🎒 Оқушы</button>
  <button class="btn big alt" onclick="teaSetup()">👩‍🏫 Оқытушы</button></div></div>`);
}

/* ---------- Оқушы: тіркелу ---------- */
function stuReg(){
  view(`<div class="wrap"><button class="back" onclick="home()">←</button><h2>Оқушы ретінде кіру</h2>
  <label>Атың</label><input id="nm" maxlength="12" placeholder="Мысалы: Айдар" autocomplete="off">
  <label>Аватар таңда: ұлдар</label><div class="avs">${BOYS.map(a=>`<button class="av" onclick="pickAv(this)">${a}</button>`).join('')}</div>
  <label>Қыздар</label><div class="avs">${GIRLS.map(a=>`<button class="av" onclick="pickAv(this)">${a}</button>`).join('')}</div>
  <label>ПИН-код</label><input id="pin" inputmode="numeric" maxlength="4" placeholder="4819">
  <div id="err" class="err"></div><button class="btn big" onclick="stuJoin()">Қосылу</button></div>`);
  S.av='';
}
function pickAv(b){document.querySelectorAll('.av').forEach(x=>x.classList.remove('on'));b.classList.add('on');S.av=b.textContent}
async function stuJoin(){
  const n=$('#nm').value.trim(),p=$('#pin').value.trim(),e=$('#err');
  if(!n)return e.textContent='Атыңды жаз';
  if(!S.av)return e.textContent='Аватарыңды таңда';
  if(!/^\d{4}$/.test(p))return e.textContent='ПИН-код 4 саннан тұруы керек';
  S.name=n;S.pin=p;S.role='s';S.ph='join';e.textContent='Қосылуда...';
  await connect(p);joinedOK=false;
  for(let i=0;i<5&&!joinedOK;i++){S.tr.send({t:'join',n,a:S.av});await new Promise(r=>setTimeout(r,700))}
  if(!joinedOK){S.role='';e.textContent='Бұл ПИН-мен ойын табылмады. Қайта тексер.'}
}
function fill(el){
  Object.keys(S.players).forEach(n=>{
    if(el.querySelector('[data-n="'+CSS.escape(n)+'"]'))return;
    const d=document.createElement('div');d.className='pl';d.dataset.n=n;
    d.innerHTML=`<span>${esc(S.players[n].a)}</span>${esc(n)}`;el.appendChild(d);
  });
  const c=$('#cnt');if(c)c.textContent=Object.keys(S.players).length;
}
function lobbyS(){
  S.ph='lobby';
  view(`<div class="wrap center" style="padding-top:4vh"><h2>Күту залы</h2><div class="sub">ПИН-код</div><div class="pin" style="font-size:40px">${esc(S.pin)}</div>
  <div class="logo">${esc(S.av)}</div><h2>${esc(S.name)}</h2>
  <p class="sub">Мұғалім ойынды бастауын күтіп тұрмыз…<br>Қосылғандар: <b id="cnt">0</b></p><div class="pls" id="pls"></div></div>`);
  fill($('#pls'));
}
function sHandle(m){
  if(m.t==='board'&&m.p&&typeof m.p==='object'){
    S.players=m.p;
    if(S.players[S.name]){joinedOK=true;
      if(S.ph==='join')lobbyS();else if(S.ph==='lobby')fill($('#pls'));else if(S.ph==='end')results();}
  }else if(m.t==='start'&&Array.isArray(m.qs)&&S.ph==='lobby'){startGame(m)}
  else if(m.t==='steal'&&m.to===S.name&&G){const a=Math.min(G.c,Math.abs(+m.amt)||0);G.c-=a;toast(`🏴‍☠️ ${String(m.by).slice(0,12)} сенен ${a} монета ұрлады!`);hud();sync()}
  else if(m.t==='end'&&G&&S.ph==='game'){finish()}
}

/* ---------- Мұғалім: квиз құру ---------- */
function teaSetup(){
  S.role='t';S.ph='setup';
  view(`<div class="wrap"><button class="back" onclick="home()">←</button><h2>Жаңа квиз құру</h2>
  <label>Ойын режимі</label><div class="modes">
  <button class="mode" id="m-classic" onclick="setMode('classic')"><b>📝 Классикалық</b><br><small>Сұрақ-жауап, ұпай, қате болса 3 сек штраф</small></button>
  <button class="mode" id="m-crypto" onclick="setMode('crypto')"><b>🪙 Crypto Hack</b><br><small>Сейф таңдап, монета ұрла немесе вирус жұқтыр</small></button></div>
  <label>Сұрақтар (<span id="qn"></span>)</label><div class="card" id="ql"></div>
  <label>Жаңа сұрақ қосу</label><input id="nq" placeholder="Сұрақ мәтіні" maxlength="90">
  <div class="ans" style="margin-top:8px">${[0,1,2,3].map(i=>`<input id="o${i}" placeholder="Жауап ${i+1}" maxlength="30">`).join('')}</div>
  <label>Дұрыс жауап</label><select id="cc"><option value="0">1-жауап</option><option value="1">2-жауап</option><option value="2">3-жауап</option><option value="3">4-жауап</option></select>
  <div class="row" style="margin-top:14px"><button class="btn alt" onclick="addQ()">➕ Сұрақ қосу</button></div>
  <div id="err" class="err"></div><button class="btn big" style="width:100%" onclick="createGame()">🚀 Ойын құру (ПИН алу)</button></div>`);
  setMode(S.mode);renderQs();
}
function setMode(m){S.mode=m;['classic','crypto'].forEach(k=>$('#m-'+k).classList.toggle('on',k===m))}
function renderQs(){
  $('#qn').textContent=S.qs.length;
  $('#ql').innerHTML=S.qs.map((q,i)=>`<div class="qi"><span>${i+1}. ${esc(q.q)}</span><button class="btn sm alt" onclick="delQ(${i})">✕</button></div>`).join('')||'<small>Сұрақ жоқ</small>';
}
function delQ(i){S.qs.splice(i,1);renderQs()}
function addQ(){
  const q=$('#nq').value.trim(),a=[0,1,2,3].map(i=>$('#o'+i).value.trim());
  if(!q||a.some(x=>!x))return $('#err').textContent='Сұрақты және 4 жауапты да толтыр';
  S.qs.push({q,a,c:+$('#cc').value});$('#err').textContent='';
  ['nq','o0','o1','o2','o3'].forEach(id=>$('#'+id).value='');renderQs();
}
const pack=()=>({t:'start',mode:S.mode,qs:S.qs.map(q=>[q.q,q.a,q.c])});
async function createGame(){
  if(S.qs.length<1)return $('#err').textContent='Кемінде 1 сұрақ қажет';
  if(new TextEncoder().encode(JSON.stringify(pack())).length>3900)return $('#err').textContent='Сұрақтар тым көп/ұзын. Біразын өшір.';
  S.pin=String(1000+Math.floor(Math.random()*9000));S.players={};
  await connect(S.pin);S.ph='lobby';lobbyT();
}

/* ---------- Мұғалім: лобби ---------- */
function lobbyT(){
  view(`<div class="wrap center" style="padding-top:4vh"><div class="sub">Ойынға қосылу үшін ПИН-кодты енгіз</div>
  <div class="pin">${S.pin}</div><div class="sub">Режим: ${S.mode==='crypto'?'🪙 Crypto Hack':'📝 Классикалық'} · Сұрақ: ${S.qs.length}</div>
  <h2>Қосылған оқушылар: <span id="cnt">0</span></h2><div class="pls" id="pls"></div>
  <button class="btn big" id="go" onclick="startT()" disabled>▶ Ойынды бастау</button></div>`);
}
function tHandle(m){
  if(m.t==='join'){
    const n=String(m.n||'').slice(0,12),a=String(m.a||'👦').slice(0,8);
    if(!n)return;
    if(!S.players[n])S.players[n]={a,s:0,c:0,d:0};
    S.tr.send({t:'board',p:S.players});refreshT();
  }else if(m.t==='score'){
    const p=S.players[String(m.n)];
    if(p){p.s=+m.s||0;p.c=+m.c||0;p.d=m.d?1:0;S.tr.send({t:'board',p:S.players});refreshT()}
  }
}
function refreshT(){
  if(S.ph==='lobby'){const el=$('#pls');if(el)fill(el);const g=$('#go');if(g)g.disabled=!Object.keys(S.players).length}
  else{const el=$('#lb');if(el)el.innerHTML=boardHTML()}
}
function startT(){
  S.ph='live';S.tr.send(pack());
  view(`<div class="wrap"><h2>📊 Тікелей рейтинг</h2><div class="sub">ПИН: ${S.pin} · ${S.mode==='crypto'?'🪙 монета бойынша':'⭐ ұпай бойынша'}</div>
  <div id="lb"></div><button class="btn big" style="width:100%;margin-top:16px" onclick="endT()">⏹ Ойынды аяқтау</button></div>`);
  refreshT();
}
function endT(){
  S.tr.send({t:'end'});S.ph='tend';
  setTimeout(()=>{S.tr.send({t:'board',p:S.players});
    view(`<div class="wrap"><h2>🏆 Қорытынды</h2><div id="lb">${boardHTML()}</div><button class="btn big" style="width:100%;margin-top:16px" onclick="home()">Жаңа ойын</button></div>`)},1200);
}
function boardHTML(){
  const k=S.mode==='crypto'?'c':'s',ic=S.mode==='crypto'?'🪙':'⭐';
  const L=Object.entries(S.players).sort((x,y)=>y[1][k]-x[1][k]);
  return L.map(([n,p],i)=>`<div class="lb ${n===S.name&&S.role==='s'?'me':''}">${['🥇','🥈','🥉'][i]||i+1+'.'} <span style="font-size:24px">${esc(p.a)}</span> ${esc(n)}${p.d?' ✅':''}<b>${ic} ${+p[k]||0}</b></div>`).join('')||'<small>Әзірге ойыншы жоқ</small>';
}

/* ---------- Ойын (оқушы) ---------- */
function startGame(m){
  S.ph='game';S.mode=m.mode==='crypto'?'crypto':'classic';
  S.qs=m.qs.map(x=>({q:String(x[0]),a:x[1].map(String),c:+x[2]}));
  G={i:0,s:0,c:0,ok:0,lock:0,o:shuffle(S.qs.map((_,i)=>i))};
  showQ();
}
function hud(){const h=$('#hud');if(h&&G)h.innerHTML=`<span>${esc(S.av)} ${esc(S.name)}</span><span>⭐ ${G.s}</span>${S.mode==='crypto'?`<span>🪙 ${G.c}</span>`:''}`}
function sync(){if(S.tr)S.tr.send({t:'score',n:S.name,s:G.s,c:G.c,d:G.i>=S.qs.length?1:0})}
function showQ(){
  if(G.i>=S.qs.length)return finish();
  const q=S.qs[G.o[G.i]];
  view(`<div class="wrap"><div class="hud" id="hud"></div><div class="prog"><i style="width:${G.i/S.qs.length*100}%"></i></div>
  <div class="qc">${esc(q.q)}</div><div class="ans">${q.a.map((t,i)=>`<button class="a a${i}" onclick="answer(${i})">${esc(t)}</button>`).join('')}</div><div id="fl"></div></div>`);
  hud();
}
function answer(i){
  if(!G||G.lock||S.ph!=='game')return;G.lock=1;
  const q=S.qs[G.o[G.i]],b=document.querySelectorAll('.a');
  b.forEach((x,k)=>{x.disabled=true;if(k===q.c)x.classList.add('good')});
  if(i===q.c){
    G.s+=100;G.ok++;hud();sync();
    setTimeout(S.mode==='crypto'?safes:next,800);
  }else{b[i].classList.add('bad');penalty(3)}
}
function penalty(t){
  const f=$('#fl');f.innerHTML=`<div class="pen">❌ Қате! Штраф: <span id="pt">${t}</span> сек</div>`;
  const iv=setInterval(()=>{t--;if(t<=0){clearInterval(iv);next()}else{const e=$('#pt');if(e)e.textContent=t}},1000);
  timers.push(iv);
}
function next(){if(S.ph!=='game')return;G.i++;G.lock=0;showQ()}
function safes(){
  if(S.ph!=='game')return;
  G.o2=shuffle(['gain','steal','virus']);G.l2=0;
  view(`<div class="wrap center" style="padding-top:2vh"><div class="hud" id="hud"></div><h2>🔐 Crypto Hack</h2><p class="sub">Дұрыс! Енді бір сейфті таңда:</p>
  <div class="safes">${[0,1,2].map(i=>`<button class="safe" id="s${i}" onclick="openSafe(${i})">🔒</button>`).join('')}</div><div id="fl"></div></div>`);
  hud();
}
function openSafe(i){
  if(G.l2)return;G.l2=1;const t=G.o2[i];let ic,msg;
  if(t==='gain'){const v=20+Math.floor(Math.random()*41);G.c+=v;ic='💰';msg=`+${v} криптомонета тауып алдың!`}
  else if(t==='steal'){
    const vs=Object.keys(S.players).filter(n=>n!==S.name&&(+S.players[n].c||0)>0);
    if(vs.length){const n=vs[Math.floor(Math.random()*vs.length)],v=Math.min(+S.players[n].c,10+Math.floor(Math.random()*26));
      G.c+=v;S.tr.send({t:'steal',to:n,by:S.name,amt:v});ic='🏴‍☠️';msg=`${n} ойыншыдан ${v} монета ұрладың!`}
    else{G.c+=25;ic='🏴‍☠️';msg='Ұрлайтын ешкім жоқ, банктен +25 монета!'}
  }else{const v=Math.min(G.c,15+Math.floor(Math.random()*26));G.c-=v;ic='🦠';msg=v?`Вирус жұқты! −${v} монета`:'Вирус! Бірақ монетаң жоқ еді 😅'}
  const b=$('#s'+i);b.textContent=ic;b.classList.add('open');
  G.o2.forEach((x,k)=>{if(k!==i){const o=$('#s'+k);o.textContent={gain:'💰',steal:'🏴‍☠️',virus:'🦠'}[x];o.style.opacity=.4}});
  $('#fl').innerHTML=`<div class="pen" style="background:var(--g)">${esc(msg)}</div>`;
  hud();sync();setTimeout(next,2000);
}
function finish(){
  if(S.ph==='end')return;
  timers.forEach(clearInterval);G.i=S.qs.length;S.ph='end';sync();results();
}
function results(){
  view(`<div class="wrap center" style="padding-top:4vh"><div class="logo">🏁</div><h2>Ойын аяқталды!</h2>
  <div class="big-n">${S.mode==='crypto'?'🪙 '+G.c:'⭐ '+G.s}</div>
  <p class="sub">Дұрыс жауап: ${G.ok} / ${S.qs.length} · Ұпай: ${G.s}${S.mode==='crypto'?' · Монета: '+G.c:''}</p>
  <div style="text-align:left" id="lb">${boardHTML()}</div><button class="btn big" style="margin-top:16px" onclick="home()">Басты бетке</button></div>`);
}
home();
