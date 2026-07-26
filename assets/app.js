/* ============================================================
   Pazheri Properties ERP — Demo application logic
   ============================================================ */
(function(){
'use strict';

/* ---------- State ---------- */
const state = {
  currentUserKey: 'sinan',       // start as Legal Officer to showcase the handoff
  view: 'dashboard',
  projects: [],
  activity: [],                  // global audit feed
  notifications: [],
  filter: { q:'', payment:'all', stage:'all' },
  openPlot: null,
  scripted: false,
};

/* ---------- Small helpers ---------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const el = document.createElement.bind(document);
const cu = ()=>USERS[state.currentUserKey];
const tint = (hex,a='22')=> hex + a;
const deptColor = d => (DEPARTMENTS[d]||DEPARTMENTS.admin).color;
const deptName = d => (DEPARTMENTS[d]||DEPARTMENTS.admin).name;
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const fmtINR = n => '₹' + Math.round(n).toLocaleString('en-IN');
const lakh   = n => '₹' + (n/100000).toLocaleString('en-IN',{maximumFractionDigits:2}) + ' L';
function timeAgo(d){
  const s=(Date.now()-d.getTime())/1000;
  if(s<60) return 'just now';
  const m=s/60; if(m<60) return Math.floor(m)+'m ago';
  const h=m/60; if(h<24) return Math.floor(h)+'h ago';
  const dd=h/24; if(dd<7) return Math.floor(dd)+'d ago';
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}
const fmtDateTime = d => d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});

function av(userKey,size=32){
  const u=USERS[userKey]; if(!u) return '';
  return `<span class="avatar" title="${esc(u.name)} · ${esc(u.role)}" style="width:${size}px;height:${size}px;font-size:${size*0.38}px;background:${deptColor(u.dept)}">${u.initials}</span>`;
}
function statusPill(key){
  const st=STATUS[key]; const c=deptColor(st.dept);
  return `<span class="pill" style="color:${c};background:${tint(c)}"><i class="dt"></i>${esc(st.label)}</span>`;
}
function deptTag(dept){
  const c=deptColor(dept);
  return `<span class="dept-tag" style="color:${c}"><span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block"></span>${esc(deptName(dept))}</span>`;
}
const totalValue = p => p.area*p.rate;
const tokenValue = p => Math.round(p.area*p.rate*0.02/1000)*1000;
const paidValue  = p => {
  const i=stepIndex(p), r=routeFor(p);
  if(p.statusKey==='completed') return totalValue(p);
  if(i>=r.indexOf('token')) return tokenValue(p) + (p.payment==='Loan' && i>=r.indexOf('sanction') ? totalValue(p)*0.85 : 0);
  return 0;
};

/* ---------- Init: build timelines + activity + notifications ---------- */
function buildData(){
  const now=Date.now();
  state.projects = SEED_PROJECTS.map(seed=>{
    const p={...seed};
    const route=routeFor(p);
    const ci=route.indexOf(p.statusKey);
    const createdAt = now - p.ageDays*86400000;
    p.createdAt = new Date(createdAt);
    // land the latest event a realistic, varied amount of time ago (1h–4d)
    const idNum = parseInt(p.id.slice(1),10) || 1;
    const recencyMs = (1 + (idNum*17)%95) * 3600000;
    const endTs = now - recencyMs;
    p.timeline=[];
    for(let i=0;i<=ci;i++){
      const key=route[i];
      const dept=STATUS[key].dept;
      const members=DEPARTMENTS[dept].members;
      // current step actor = assigned owner; else deterministic member
      const actor = (i===ci) ? p.assigned : members[i % members.length];
      const t = createdAt + Math.round((endTs-createdAt) * (ci===0?1:i/ci));
      const entry={ ts:new Date(t), actorKey:actor, statusKey:key,
        note: seedNote(key,p) };
      p.timeline.push(entry);
    }
    p.updatedAt = p.timeline.length ? p.timeline[p.timeline.length-1].ts : p.createdAt;
    return p;
  });

  // Global activity from every timeline
  state.activity=[];
  state.projects.forEach(p=>p.timeline.forEach(e=>{
    state.activity.push({ ts:e.ts, actorKey:e.actorKey, projectId:p.id, statusKey:e.statusKey });
  }));
  state.activity.sort((a,b)=>b.ts-a.ts);

  // Seed a couple of live notifications for Finance (handoffs already waiting)
  state.notifications=[
    { id:'n1', ts:new Date(now-3*3600000),  dept:'finance', projectId:'P1', statusKey:'bank_verify',
      title:'Action needed — Bank Verification', body:'Legal cleared eligibility for Plot A-12 · Ramesh Kumar', read:false, actorKey:'sinan' },
    { id:'n2', ts:new Date(now-26*3600000),  dept:'finance', projectId:'P8', statusKey:'loan_allocated',
      title:'Loan processing in progress', body:'Plot C-03 · Anitha Raj — allocate & proceed to bank', read:true, actorKey:'rahul' },
    { id:'n3', ts:new Date(now-5*3600000),   dept:'legal',   projectId:'P4', statusKey:'pre_deed',
      title:'Sanction received — prepare deed', body:'Finance received sanction for Plot C-21 · Abdul Rahman', read:false, actorKey:'rahul' },
  ];
}
function seedNote(key,p){
  if(key==='token') return `Token ${fmtINR(tokenValue(p))} collected · ${p.area} cents @ ${fmtINR(p.rate)}/cent`;
  if(key==='scrutiny') return 'Scrutiny report prepared — title clear, no encumbrance.';
  if(key==='eligibility') return `${p.employment} profile verified — eligible for loan.`;
  if(key==='sanction') return 'Sanction letter received from bank and shared with customer.';
  return '';
}

/* ================= RENDER ================= */
function render(){
  renderSidebar();
  renderTopbar();
  renderView();
}

function renderSidebar(){
  const nav = [
    {v:'dashboard', label:'Dashboard', ic:'grid'},
    {v:'plots',     label:'Plots & Customers', ic:'map'},
    {cat:'Departments'},
    {v:'legal',     label:'Legal Desk', ic:'scale'},
    {v:'finance',   label:'Finance Desk', ic:'coins'},
    {cat:'Records'},
    {v:'activity',  label:'Activity & Audit Log', ic:'history'},
    {v:'departments',label:'Departments', ic:'building'},
  ];
  const myDept=cu().dept;
  const legalCount = state.projects.filter(p=>deptOfStatus(p.statusKey)==='legal' && p.statusKey!=='completed').length;
  const finCount   = unreadFor('finance');
  $('#nav').innerHTML = nav.map(n=>{
    if(n.cat) return `<div class="cat">${n.cat}</div>`;
    let badge='';
    if(n.v==='finance' && finCount) badge=`<span class="badge">${finCount}</span>`;
    if(n.v==='legal' && legalCount) badge=`<span class="badge" style="background:${deptColor('legal')}">${legalCount}</span>`;
    return `<a data-view="${n.v}" class="${state.view===n.v?'active':''}">${icon(n.ic)}<span>${n.label}</span>${badge}</a>`;
  }).join('');
}

const PAGE_META={
  dashboard:['Dashboard','Live overview of every plot, department & handoff'],
  plots:['Plots & Customers','Every customer mapped to their plot and current status'],
  legal:['Legal Desk','Scrutiny, eligibility, evaluation & deed — owned by Legal'],
  finance:['Finance Desk','Loan processing, bank verification, sanction & transfer'],
  activity:['Activity & Audit Log','Who did what, and when — full history'],
  departments:['Departments','The six departments of Pazheri Properties'],
};
function renderTopbar(){
  const m=PAGE_META[state.view];
  $('#pageTitle').textContent=m[0];
  $('#pageSub').textContent=m[1];
  const u=cu();
  $('#roleBtn').innerHTML = `${av(state.currentUserKey,32)}<div class="who"><b>${esc(u.name)}</b><span>${esc(u.role)}</span></div>${icon('chevron')}`;
  const unread = unreadFor(u.dept);
  $('#bellDot').innerHTML = unread ? `<span class="dot">${unread}</span>` : '';
  renderRoleMenu(); renderNotifPanel();
}

function unreadFor(dept){
  if(dept==='admin') return state.notifications.filter(n=>!n.read).length;
  return state.notifications.filter(n=>!n.read && n.dept===dept).length;
}

function renderView(){
  $$('.view').forEach(v=>v.classList.toggle('active', v.id==='view-'+state.view));
  ({dashboard:renderDashboard,plots:renderPlots,legal:renderLegal,
    finance:renderFinance,activity:renderActivity,departments:renderDepartments}[state.view])();
}

/* ---------------- Dashboard ---------------- */
function renderDashboard(){
  const P=state.projects;
  const active=P.filter(p=>p.statusKey!=='completed');
  const awaitingLegal=active.filter(p=>deptOfStatus(p.statusKey)==='legal').length;
  const awaitingFinance=active.filter(p=>deptOfStatus(p.statusKey)==='finance').length;
  const completed=P.filter(p=>p.statusKey==='completed').length;
  const portfolio=P.reduce((s,p)=>s+totalValue(p),0);

  const kpis=[
    {ic:'map',   c:'#0f5132', val:active.length, lab:'Active Plots', tr:'+3 this month', trc:'up'},
    {ic:'scale', c:deptColor('legal'), val:awaitingLegal, lab:'Awaiting Legal Action', tr:'live', trc:'flat'},
    {ic:'coins', c:deptColor('finance'), val:awaitingFinance, lab:'Awaiting Finance Action', tr:'needs attention', trc:'down'},
    {ic:'check', c:'#16a34a', val:completed, lab:'Completed & Filed', tr:'+2 this month', trc:'up'},
    {ic:'wallet',c:'#7c3aed', val:lakh(portfolio), lab:'Portfolio Value', tr:P.length+' plots', trc:'flat'},
  ];

  // stage distribution
  const stageCount=[0,0,0];
  P.forEach(p=>{ stageCount[STATUS[p.statusKey].stage-1]++; });
  const maxStage=Math.max(...stageCount,1);

  // payment split
  const loan=P.filter(p=>p.payment==='Loan').length, cash=P.length-loan;
  const loanPct=Math.round(loan/P.length*100);

  const myDept=cu().dept;
  const mine = active.filter(p=> myDept==='admin' ? p.priority==='HIGH' : deptOfStatus(p.statusKey)===myDept)
                     .sort((a,b)=>({HIGH:0,MED:1,LOW:2}[a.priority]-{HIGH:0,MED:1,LOW:2}[b.priority]));

  $('#view-dashboard').innerHTML = `
    <div class="attn">
      <div style="font-size:22px">💡</div>
      <div class="txt"><b>Try the live handoff:</b> switch to the <b>Legal</b> role, open plot <b>D-22 · Nazeer Ahmed</b> and mark <b>Loan Eligibility</b> complete — the <b>Finance</b> team is notified instantly, and every change is logged with a timestamp.</div>
    </div>

    <div class="grid kpis">
      ${kpis.map(k=>`
        <div class="card kpi" style="color:${k.c}">
          <div class="k-ic" style="background:${tint(k.c,'1f')};color:${k.c}">${icon(k.ic)}</div>
          <div class="k-val" style="color:var(--ink)">${k.val}</div>
          <div class="k-lab">${k.lab}</div>
          <div class="k-tr ${k.trc}">${k.trc==='up'?'▲':k.trc==='down'?'●':'•'} ${k.tr}</div>
        </div>`).join('')}
    </div>

    <div class="grid cols-2 mt">
      <div class="card pad">
        <div class="row-between"><h2 style="margin:0;font-size:15px">Needs your attention</h2>
          <span class="chip" style="color:${deptColor(myDept)};background:${tint(deptColor(myDept))}">${deptName(myDept)} view</span></div>
        <div class="mt-s">
          ${mine.length? mine.slice(0,5).map(p=>attnRow(p)).join('') : `<div class="empty">Nothing pending for your team right now 🎉</div>`}
        </div>
      </div>

      <div class="card pad">
        <div class="row-between"><h2 style="margin:0;font-size:15px">Live Activity</h2><span class="live"><span class="blink"></span>Live</span></div>
        <div class="feed mt-s" id="dashFeed">${state.activity.slice(0,7).map(feedItem).join('')}</div>
      </div>
    </div>

    <div class="grid cols-2 mt">
      <div class="card pad">
        <h2 style="margin:0 0 14px;font-size:15px">Pipeline by Stage</h2>
        ${STAGES.map((s,i)=>`
          <div style="margin-bottom:14px">
            <div class="row-between small"><span class="b">Stage ${s.n} · ${s.name}</span><span class="muted">${stageCount[i]} plots</span></div>
            <div class="bar mt-s"><i style="width:${Math.round(stageCount[i]/maxStage*100)}%;background:linear-gradient(90deg,${['#22c55e','#3b82f6','#8b5cf6'][i]},${['#15803d','#1d4ed8','#6d28d9'][i]})"></i></div>
          </div>`).join('')}
      </div>

      <div class="card pad">
        <h2 style="margin:0 0 14px;font-size:15px">Payment Route Split</h2>
        <div style="display:flex;align-items:center;gap:24px">
          <div style="width:130px;height:130px;border-radius:50%;background:conic-gradient(#6d28d9 0 ${loanPct}%, #16a34a ${loanPct}% 100%);display:grid;place-items:center">
            <div style="width:86px;height:86px;border-radius:50%;background:#fff;display:grid;place-items:center;text-align:center">
              <div><b style="font-size:20px">${P.length}</b><div class="muted small">plots</div></div>
            </div>
          </div>
          <div class="stack" style="gap:14px">
            <div class="flex"><span style="width:12px;height:12px;border-radius:4px;background:#6d28d9"></span><div><b>${loan}</b> Loan cases <span class="muted small">(${loanPct}%)</span></div></div>
            <div class="flex"><span style="width:12px;height:12px;border-radius:4px;background:#16a34a"></span><div><b>${cash}</b> Cash cases <span class="muted small">(${100-loanPct}%)</span></div></div>
            <div class="muted small">Loan cases require Legal → Finance coordination.</div>
          </div>
        </div>
      </div>
    </div>`;
}
function attnRow(p){
  return `<div class="feed"><div class="item" data-plot="${p.id}" style="cursor:pointer">
    <div class="ic" style="background:${deptColor(deptOfStatus(p.statusKey))}">${icon('map')}</div>
    <div class="txt" style="flex:1">
      <b>${esc(p.customer)}</b> · <span class="plotno" style="font-family:ui-monospace,monospace;color:var(--brand)">${p.plot}</span>
      <div class="when"><span>${statusPill(p.statusKey)}</span><span class="prio ${p.priority}">${p.priority}</span></div>
    </div>
    ${icon('chevron')}
  </div></div>`;
}
function feedItem(a){
  const st=STATUS[a.statusKey]; const c=deptColor(st.dept);
  const p=state.projects.find(x=>x.id===a.projectId);
  return `<div class="item" data-plot="${a.projectId}" style="cursor:pointer">
    <div class="ic" style="background:${c}">${icon('bolt')}</div>
    <div class="txt">
      <b>${esc(USERS[a.actorKey].name)}</b> marked <b>${esc(st.label)}</b>
      <div class="when">${deptTag(st.dept)} · ${p?('Plot '+p.plot+' · '+esc(p.customer)):''} · ${timeAgo(a.ts)}</div>
    </div>
  </div>`;
}

/* ---------------- Plots & Customers ---------------- */
function renderPlots(){
  const f=state.filter;
  let list=state.projects.filter(p=>{
    if(f.payment!=='all' && p.payment!==f.payment) return false;
    if(f.stage!=='all' && String(STATUS[p.statusKey].stage)!==f.stage) return false;
    if(f.q){ const q=f.q.toLowerCase();
      if(!(p.customer.toLowerCase().includes(q)||p.plot.toLowerCase().includes(q)||p.location.toLowerCase().includes(q))) return false; }
    return true;
  });
  $('#view-plots').innerHTML = `
    <div class="toolbar">
      <div class="seg" data-seg="payment">
        <button data-val="all" class="${f.payment==='all'?'on':''}">All</button>
        <button data-val="Loan" class="${f.payment==='Loan'?'on':''}">Loan</button>
        <button data-val="Cash" class="${f.payment==='Cash'?'on':''}">Cash</button>
      </div>
      <select class="selectlike" id="stageSel">
        <option value="all" ${f.stage==='all'?'selected':''}>All stages</option>
        ${STAGES.map(s=>`<option value="${s.n}" ${f.stage===String(s.n)?'selected':''}>Stage ${s.n} · ${s.name}</option>`).join('')}
      </select>
      <span class="muted small">${list.length} of ${state.projects.length} plots</span>
      <div style="flex:1"></div>
      <button class="btn sm" id="addPlot">${icon('plus')} New Booking</button>
    </div>
    <div class="grid plot-grid">
      ${list.map(plotCard).join('') || '<div class="empty card pad">No plots match your filter.</div>'}
    </div>`;
}
function plotCard(p){
  const dept=deptOfStatus(p.statusKey); const c=deptColor(dept);
  return `<div class="card plot" data-plot="${p.id}">
    <div class="stripe" style="background:${c}"></div>
    <div class="top">
      <div style="flex:1">
        <span class="plotno">PLOT ${p.plot}</span>
        <div class="cust">${esc(p.customer)}</div>
        <div class="loc">${icon('pin')}${esc(p.location)}</div>
      </div>
      <span class="prio ${p.priority}">${p.priority}</span>
    </div>
    <div class="meta">
      <span class="pay ${p.payment}">${p.payment==='Loan'?icon('bank'):icon('cash')}${p.payment}</span>
      <span class="chip">${p.area} cents</span>
      <span class="chip">${lakh(totalValue(p))}</span>
    </div>
    <div style="margin-top:12px">${statusPill(p.statusKey)}</div>
    <div class="bar" style="margin-top:10px"><i style="width:${progressPct(p)}%"></i></div>
    <div class="statusrow">
      <div class="assignee">${av(p.assigned,28)}<div class="stack"><small>Assigned to</small><span class="b small">${esc(USERS[p.assigned].name)}</span></div></div>
      <span class="muted small">${progressPct(p)}% · ${timeAgo(p.updatedAt)}</span>
    </div>
  </div>`;
}

/* ---------------- Legal Desk ---------------- */
function renderLegal(){ renderDeskKanban('legal','view-legal'); }
function renderFinance(){
  // Finance desk with attention banners for pending handoffs
  const pending=state.projects.filter(p=>deptOfStatus(p.statusKey)==='finance' && p.statusKey!=='completed');
  const banners = state.notifications.filter(n=>n.dept==='finance' && !n.read)
    .map(n=>{ const p=state.projects.find(x=>x.id===n.projectId); return `
      <div class="attn finance" data-plot="${n.projectId}" style="cursor:pointer">
        <div style="font-size:20px">🔔</div>
        <div class="txt" style="flex:1"><b>${esc(n.title)}</b><div class="muted small">${esc(n.body)} · ${timeAgo(n.ts)}</div></div>
        <button class="btn finance sm">Open ${icon('chevron')}</button>
      </div>`; }).join('');
  $('#view-finance').innerHTML = `
    ${banners || ''}
    <div class="section-head"><h2>Finance workload</h2><span class="hint">Plots currently owned by the Finance team</span></div>
    ${deskKanbanHTML('finance')}`;
  bindDesk();
}
function renderDeskKanban(dept,viewId){
  $('#'+viewId).innerHTML = `
    <div class="section-head"><h2>${deptName(dept)} workload</h2>
      <span class="hint">Drag-free demo — click any card to open, use “Mark Complete” to advance the flow</span></div>
    ${deskKanbanHTML(dept)}`;
  bindDesk();
}
function deskKanbanHTML(dept){
  // group dept-owned statuses that currently hold plots
  const owned = Object.keys(STATUS).filter(k=>STATUS[k].dept===dept);
  const cols = owned.map(k=>({key:k, items:state.projects.filter(p=>p.statusKey===k)}))
                    .filter(c=>c.items.length);
  if(!cols.length) return `<div class="empty card pad">No plots are currently with the ${deptName(dept)} team.</div>`;
  return `<div class="kan">${cols.map(c=>{
    const cc=deptColor(dept);
    return `<div class="kcol">
      <h4><span style="width:9px;height:9px;border-radius:50%;background:${cc}"></span>${esc(STATUS[c.key].label)}<span class="count">${c.items.length}</span></h4>
      ${c.items.map(p=>`
        <div class="kcard" data-plot="${p.id}">
          <div class="kc-top"><span class="plotno" style="font-family:ui-monospace,monospace;color:var(--brand);font-weight:800;font-size:12px">${p.plot}</span><span class="prio ${p.priority}">${p.priority}</span></div>
          <div class="kc-cust">${esc(p.customer)}</div>
          <div class="muted small">${esc(p.location)}</div>
          <div class="flex wrap" style="margin-top:10px"><span class="pay ${p.payment}">${p.payment}</span><span class="chip">${lakh(totalValue(p))}</span></div>
          <div class="row-between" style="margin-top:12px">
            <div class="flex">${av(p.assigned,26)}<span class="small b">${esc(USERS[p.assigned].name)}</span></div>
            ${canAct(p)?`<button class="btn sm ${dept==='finance'?'finance':''}" data-advance="${p.id}">Mark Complete</button>`:''}
          </div>
        </div>`).join('')}
    </div>`;
  }).join('')}</div>`;
}
function bindDesk(){/* handled by global delegation */}

/* ---------------- Activity / Audit ---------------- */
function renderActivity(){
  const rows=state.activity.slice(0,60);
  $('#view-activity').innerHTML = `
    <div class="section-head"><h2>Full audit trail</h2><span class="hint">${state.activity.length} events · every status change is stamped with the person, department & time</span>
      <div class="spacer"></div><span class="live"><span class="blink"></span>Live</span></div>
    <div class="card pad">
      <table class="tbl">
        <thead><tr><th>When</th><th>Person</th><th>Department</th><th>Plot / Customer</th><th>Status set</th></tr></thead>
        <tbody>
        ${rows.map(a=>{ const p=state.projects.find(x=>x.id===a.projectId); const st=STATUS[a.statusKey];
          return `<tr data-plot="${a.projectId}" style="cursor:pointer">
            <td class="muted small">${fmtDateTime(a.ts)}<div>${timeAgo(a.ts)}</div></td>
            <td><div class="flex">${av(a.actorKey,26)}<span class="b">${esc(USERS[a.actorKey].name)}</span></div></td>
            <td>${deptTag(st.dept)}</td>
            <td><span class="plotno">${p?p.plot:''}</span> · ${p?esc(p.customer):''}</td>
            <td>${statusPill(a.statusKey)}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---------------- Departments ---------------- */
function renderDepartments(){
  const order=['sales','legal','finance','operations','purchase','hr'];
  $('#view-departments').innerHTML = `
    <div class="grid cols-3">
      ${order.map(d=>{
        const dep=DEPARTMENTS[d]; const c=dep.color;
        const load=state.projects.filter(p=>deptOfStatus(p.statusKey)===d && p.statusKey!=='completed').length;
        return `<div class="card dept-card">
          <div class="head"><div class="em" style="background:${c}">${dep.emoji}</div>
            <div><h3>${esc(dep.name)}</h3><div class="muted small">${dep.members.length} member${dep.members.length>1?'s':''}</div></div></div>
          <div class="desc">${esc(dep.desc)}</div>
          <div class="flex wrap">${dep.members.map(m=>`<span class="flex">${av(m,26)}</span>`).join('')}</div>
          <div class="stat">
            <div><b style="color:${c}">${load}</b><span>Active plots</span></div>
            <div><b>${dep.members.length}</b><span>Team members</span></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="section-head"><h2>How the six departments connect</h2></div>
    <div class="card pad">
      <div class="flex wrap" style="gap:10px;font-size:13px">
        ${['sales','legal','finance','legal','operations'].map((d,i,arr)=>`
          <span class="pill" style="color:${deptColor(d)};background:${tint(deptColor(d))}"><i class="dt"></i>${deptName(d)}</span>
          ${i<arr.length-1?`<span class="muted">${icon('arrow')}</span>`:''}`).join('')}
      </div>
      <p class="muted small mt">Sales books the plot & collects the token → Legal verifies documents, prepares the scrutiny report, evaluation & confirms loan eligibility → Finance handles bank verification, allocation, sanction & transfer → Legal prepares & registers the deed → Operations files land tax/possession and hands over documents. Purchase feeds new plots into inventory; HR supports the whole team.</p>
    </div>`;
}

/* ================= PLOT DRAWER ================= */
function openPlot(id){
  const p=state.projects.find(x=>x.id===id); if(!p) return;
  state.openPlot=id;
  const route=routeFor(p), ci=stepIndex(p);
  const next = route[ci+1];
  const acts = canAct(p);

  // pipeline grouped by stage
  let pipe=''; let lastStage=0;
  route.forEach((k,i)=>{
    const st=STATUS[k];
    if(st.stage!==lastStage){ lastStage=st.stage;
      pipe+=`<div class="pt">Stage ${st.stage} · ${STAGES[st.stage-1].name}</div>`; }
    const cls = i<ci?'done':(i===ci?'current':'upcoming');
    const tlEntry = p.timeline.find(e=>e.statusKey===k);
    let sub='';
    if(i<ci && tlEntry) sub=`${av(tlEntry.actorKey,18)} ${esc(USERS[tlEntry.actorKey].name)} · ${timeAgo(tlEntry.ts)}`;
    else if(i===ci) sub=`<span class="b" style="color:${deptColor(st.dept)}">In progress</span> · ${av(p.assigned,18)} ${esc(USERS[p.assigned].name)}`;
    else sub=`<span class="muted">${deptName(st.dept)}</span>`;
    const isLast=i===route.length-1;
    pipe+=`<div class="pstep ${cls}">
      <div class="rail"><div class="node">${i<ci?icon('tick'):(i+1)}</div>${!isLast?'<div class="line"></div>':''}</div>
      <div class="body"><div class="nm">${esc(st.label)}</div><div class="sub">${sub}</div></div>
    </div>`;
  });

  // audit newest first
  const audit=[...p.timeline].reverse();
  // docs
  const docs = docState(p);

  $('#drawerHead').innerHTML=`
    <button class="close" data-close-drawer>${icon('x')}</button>
    <span class="d-plotno">PLOT ${p.plot}</span>
    <span class="pay ${p.payment}" style="margin-left:8px">${p.payment}${p.employment?' · '+p.employment:''}</span>
    <div class="d-cust">${esc(p.customer)}</div>
    <div class="d-loc">${icon('pin')} ${esc(p.location)} · 📞 ${esc(p.phone)}</div>
    <div class="d-facts">
      <div><span>Area</span><b>${p.area} cents</b></div>
      <div><span>Rate</span><b>${fmtINR(p.rate)}/cent</b></div>
      <div><span>Total Value</span><b>${lakh(totalValue(p))}</b></div>
      <div><span>Progress</span><b>${progressPct(p)}%</b></div>
    </div>`;

  $('#drawerBody').innerHTML=`
    <div class="card pad">
      <div class="row-between">
        <div><div class="muted small">Current status</div><div style="margin-top:6px">${statusPill(p.statusKey)}</div></div>
        <div style="text-align:right"><div class="muted small">Owned by</div><div style="margin-top:6px">${deptTag(deptOfStatus(p.statusKey))}</div></div>
      </div>
      <div class="bar mt"><i style="width:${progressPct(p)}%"></i></div>
      <div class="row-between mt">
        <div class="flex">${av(p.assigned,30)}<div class="stack"><span class="muted small">Assigned to</span><b>${esc(USERS[p.assigned].name)}</b></div></div>
        ${ acts && next ? `<button class="btn ${deptOfStatus(p.statusKey)==='finance'?'finance':''}" data-update="${p.id}">${icon('check')} Mark Complete</button>`
          : (!next ? `<span class="pill" style="color:#16a34a;background:#dcfce7"><i class="dt"></i>Completed & Filed</span>`
          : `<span class="chip">🔒 Owned by ${deptName(deptOfStatus(p.statusKey))} — switch role to act</span>`)}
      </div>
    </div>

    <div class="section-head"><h2>Process pipeline</h2><span class="hint">${p.payment} route</span></div>
    <div class="card pad"><div class="pipe">${pipe}</div></div>

    <div class="section-head"><h2>Documents</h2></div>
    <div class="card pad"><div class="docs">${docs.map(d=>`
      <div class="doc ${d.on?'on':'off'}"><span class="tick">${d.on?icon('tick'):''}</span>${esc(d.name)}</div>`).join('')}</div></div>

    <div class="section-head"><h2>History & audit trail</h2><span class="hint">${p.timeline.length} events</span></div>
    <div class="card pad"><div class="tl">
      ${audit.map(e=>`<div class="row">
        <div class="av">${av(e.actorKey,32)}</div>
        <div class="c"><div><b>${esc(USERS[e.actorKey].name)}</b> <span class="muted">(${esc(USERS[e.actorKey].role)})</span> set <b>${esc(STATUS[e.statusKey].label)}</b></div>
          <div class="m">${deptName(STATUS[e.statusKey].dept)} · ${fmtDateTime(e.ts)} · ${timeAgo(e.ts)}</div>
          ${e.note?`<div class="note">“${esc(e.note)}”</div>`:''}
        </div></div>`).join('')}
    </div></div>`;

  $('#scrim').classList.add('open');
  $('#drawer').classList.add('open');
}
function closeDrawer(){ state.openPlot=null; $('#scrim').classList.remove('open'); $('#drawer').classList.remove('open'); }
function docState(p){
  const i=stepIndex(p), r=routeFor(p);
  const at = k => i>=r.indexOf(k) && r.indexOf(k)>=0;
  return [
    {name:'Booking Form', on:at('token')},
    {name:'Original Deed', on:at('docs_received')},
    {name:'Backdeed', on:at('docs_received')},
    {name:'Land Tax Receipt', on:at('docs_received')},
    {name:'Possession Certificate', on:at('docs_received')},
    {name:'Thandaper', on:at('docs_received')},
    {name:'Aadhar Card', on: p.payment==='Cash'?at('kyc'):at('loan_docs')},
    {name:'PAN Card', on: p.payment==='Cash'?at('kyc'):at('loan_docs')},
  ];
}

/* ---------- Permissions ---------- */
function canAct(p){
  const u=cu();
  if(p.statusKey==='completed') return false;
  return u.dept==='admin' || u.dept===deptOfStatus(p.statusKey);
}

/* ================= ACTIONS ================= */
function openUpdateModal(id){
  const p=state.projects.find(x=>x.id===id); if(!p) return;
  const route=routeFor(p), ci=stepIndex(p), next=route[ci+1];
  if(!next) return;
  const nextDept=STATUS[next].dept, curDept=deptOfStatus(p.statusKey);
  const handoff = nextDept!==curDept;
  $('#modalScrim').innerHTML=`
    <div class="modal">
      <div class="mh"><h3>Update status — Plot ${p.plot}</h3><p>${esc(p.customer)} · ${esc(p.location)}</p></div>
      <div class="mb">
        <div class="field"><label>Completing</label>
          <div class="chip" style="font-size:13px">${esc(STATUS[p.statusKey].label)}</div></div>
        <div class="next-preview">
          <span class="ar">${icon('arrow')}</span>
          <div><b>Next:</b> ${esc(STATUS[next].label)}<div class="muted small">Moves to ${deptName(nextDept)} team</div></div>
        </div>
        ${handoff?`<div class="attn ${nextDept==='finance'?'finance':''}" style="margin:14px 0 0">
          <div style="font-size:18px">🔔</div><div class="txt small">This will <b>instantly notify the ${deptName(nextDept)} team</b> to begin their task, and log the handoff with a timestamp.</div></div>`:''}
        <div class="field mt"><label>Add a note (optional)</label>
          <textarea id="updNote" rows="2" placeholder="e.g. Scrutiny report clear, no encumbrance found"></textarea></div>
      </div>
      <div class="mf">
        <button class="btn secondary" data-close-modal>Cancel</button>
        <button class="btn ${nextDept==='finance'?'finance':''}" data-confirm-update="${p.id}">${handoff?'Update & Notify '+deptName(nextDept):'Update Status'}</button>
      </div>
    </div>`;
  $('#modalScrim').classList.add('open');
}
function closeModal(){ $('#modalScrim').classList.remove('open'); $('#modalScrim').innerHTML=''; }

function advanceStatus(id, note, actorKey){
  const p=state.projects.find(x=>x.id===id); if(!p) return;
  const route=routeFor(p), ci=stepIndex(p), next=route[ci+1];
  if(!next) return;
  const actor = actorKey || (canAct(p)? (cu().dept==='admin'? p.assigned : state.currentUserKey) : p.assigned);
  const oldDept=deptOfStatus(p.statusKey), newDept=STATUS[next].dept;
  const ts=new Date();

  p.statusKey=next; p.updatedAt=ts;
  // reassign to a member of the new owning dept
  const newOwner = DEPARTMENTS[newDept].members[0];
  p.assigned=newOwner;

  const entry={ ts, actorKey:actor, statusKey:next, note:(note||'').trim() };
  p.timeline.push(entry);
  state.activity.unshift({ ts, actorKey:actor, projectId:p.id, statusKey:next });

  // handoff notification to the new department
  if(newDept!==oldDept){
    const n={ id:'n'+Date.now(), ts, dept:newDept, projectId:p.id, statusKey:next, actorKey:actor,
      title:`Action needed — ${STATUS[next].label}`,
      body:`${USERS[actor].name} (${deptName(oldDept)}) completed ${STATUS[route[ci]].label} · Plot ${p.plot} · ${p.customer}`,
      read:false };
    state.notifications.unshift(n);
    toast('handoff', `${deptName(newDept)} team notified`, `${STATUS[next].label} · Plot ${p.plot}`, deptColor(newDept));
  } else {
    toast('ok', 'Status updated', `${STATUS[next].label} · Plot ${p.plot}`, deptColor(newDept));
  }

  render();
  if(state.openPlot===id) openPlot(id);
}

/* ---------- Notifications panel ---------- */
function renderNotifPanel(){
  const u=cu();
  const list=state.notifications.filter(n=> u.dept==='admin' || n.dept===u.dept);
  $('#notifPanel').innerHTML=`
    <div class="nh"><b>Notifications</b>${list.some(n=>!n.read)?`<button class="btn ghost sm" data-mark-all>Mark all read</button>`:''}</div>
    <div class="notif-list">
      ${list.length? list.map(n=>{ const c=deptColor(n.dept); const p=state.projects.find(x=>x.id===n.projectId);
        return `<div class="notif ${n.read?'':'unread'}" data-notif="${n.id}" data-plot="${n.projectId}">
          <div class="ni" style="background:${c}">${icon('bell')}</div>
          <div class="nt"><b>${esc(n.title)}</b><div class="muted">${esc(n.body)}</div><div class="nw">${deptName(n.dept)} · ${timeAgo(n.ts)}</div></div>
        </div>`; }).join('')
      : `<div class="notif-empty">No notifications for the ${deptName(u.dept)} team.</div>`}
    </div>`;
}
function renderRoleMenu(){
  $('#roleMenu').innerHTML=`
    <div class="rm-h">View the ERP as…</div>
    ${ROLE_OPTIONS.map(k=>{ const u=USERS[k];
      return `<div class="rm-i ${state.currentUserKey===k?'on':''}" data-role="${k}">
        ${av(k,32)}<div class="who"><b>${esc(u.name)}</b><span>${esc(u.role)} · ${deptName(u.dept)}</span></div>
        ${state.currentUserKey===k?`<span class="ck">${icon('tick')}</span>`:''}</div>`;
    }).join('')}`;
}

/* ---------- Toast ---------- */
function toast(kind,title,sub,color){
  const wrap=$('#toastWrap');
  const t=el('div'); t.className='toast';
  t.innerHTML=`<div class="ti" style="background:${color||'#16a34a'}">${icon(kind==='handoff'?'bell':'check')}</div>
    <div class="tc"><b>${esc(title)}</b><span>${esc(sub)}</span></div>`;
  wrap.appendChild(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),300); }, 4200);
}

/* ================= EVENTS ================= */
document.addEventListener('click',e=>{
  const t=e.target;
  // nav
  const nav=t.closest('[data-view]');
  if(nav){ state.view=nav.dataset.view; closeAllMenus(); render(); $('#sidebar').classList.remove('open'); return; }
  // open plot (cards / rows / feed)
  const plotEl=t.closest('[data-plot]');
  if(plotEl && !t.closest('[data-advance]') && !t.closest('[data-update]')){
    // if it's a notification, mark read
    const nEl=t.closest('[data-notif]');
    if(nEl){ const n=state.notifications.find(x=>x.id===nEl.dataset.notif); if(n)n.read=true; closeAllMenus(); }
    openPlot(plotEl.dataset.plot); renderTopbar(); return;
  }
  // quick advance (kanban)
  const adv=t.closest('[data-advance]');
  if(adv){ e.stopPropagation(); openUpdateModal(adv.dataset.advance); return; }
  // update button (drawer)
  const upd=t.closest('[data-update]');
  if(upd){ openUpdateModal(upd.dataset.update); return; }
  // confirm update
  const conf=t.closest('[data-confirm-update]');
  if(conf){ const note=$('#updNote')?$('#updNote').value:''; const id=conf.dataset.confirmUpdate; closeModal(); advanceStatus(id,note); return; }
  // close modal / drawer
  if(t.closest('[data-close-modal]')|| t.id==='modalScrim'){ closeModal(); return; }
  if(t.closest('[data-close-drawer]')|| t.id==='scrim'){ closeDrawer(); return; }
  // role switch
  if(t.closest('#roleBtn')){ e.stopPropagation(); $('#notifPanel').classList.remove('open'); $('#roleMenu').classList.toggle('open'); return; }
  const roleI=t.closest('[data-role]');
  if(roleI){ state.currentUserKey=roleI.dataset.role; closeAllMenus(); render(); if(state.openPlot)openPlot(state.openPlot); return; }
  // bell
  if(t.closest('#bellBtn')){ e.stopPropagation(); $('#roleMenu').classList.remove('open'); $('#notifPanel').classList.toggle('open'); return; }
  if(t.closest('[data-mark-all]')){ state.notifications.forEach(n=>{ if(cu().dept==='admin'||n.dept===cu().dept)n.read=true; }); render(); $('#notifPanel').classList.add('open'); return; }
  // segmented payment filter
  const seg=t.closest('[data-seg] button');
  if(seg){ state.filter.payment=seg.dataset.val; renderPlots(); return; }
  // add plot (demo)
  if(t.closest('#addPlot')){ toast('ok','Demo only','New booking flow would open here','#0f5132'); return; }
  // menu toggle (mobile)
  if(t.closest('#menuBtn')){ $('#sidebar').classList.toggle('open'); return; }
  // close menus when clicking elsewhere
  if(!t.closest('.notif-wrap')&&!t.closest('#roleMenu')&&!t.closest('#roleBtn')) closeAllMenus();
});
document.addEventListener('input',e=>{
  if(e.target.id==='globalSearch'){ state.filter.q=e.target.value; if(state.view!=='plots'){state.view='plots';render();} else renderPlots();
    $('#globalSearch').focus(); }
  if(e.target.id==='stageSel'){ state.filter.stage=e.target.value; renderPlots(); }
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeModal(); closeDrawer(); closeAllMenus(); }});
function closeAllMenus(){ $('#roleMenu').classList.remove('open'); $('#notifPanel').classList.remove('open'); }

/* ---------- Scripted "live" update (demo realism) ---------- */
function scheduleLiveDemo(){
  setTimeout(()=>{
    if(state.scripted) return; state.scripted=true;
    // Finance completes Bank Verification on A-12 → live feed + moves to loan allocation (same dept)
    const p=state.projects.find(x=>x.id==='P1');
    if(p && p.statusKey==='bank_verify'){
      advanceStatus('P1','Bank verification cleared — valuation & legal opinion received.','rahul');
    }
  }, 9000);
}

/* ================= SVG icons ================= */
function icon(n){
  const I={
    grid:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    map:'<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/>',
    scale:'<path d="M12 3v18M6 21h12M6 7l-3 6h6zM18 7l-3 6h6zM6 7l6-2 6 2"/>',
    coins:'<circle cx="8" cy="8" r="5"/><path d="M16 8a5 5 0 1 1 0 8"/>',
    history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    building:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h6v6"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    tick:'<path d="M20 6 9 17l-5-5"/>',
    wallet:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M17 15h.01"/>',
    bolt:'<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>',
    pin:'<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    bank:'<path d="M3 10 12 4l9 6M4 10v9M20 10v9M8 10v9M16 10v9M3 21h18"/>',
    cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    chevron:'<path d="m6 9 6 6 6-6"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  };
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">${I[n]||''}</svg>`;
}

/* ================= boot ================= */
buildData();
render();
scheduleLiveDemo();
window.__pazheri={state}; // debug handle
})();
