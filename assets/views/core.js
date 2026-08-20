/* ============================================================
   Screens — Command Centre, Bookings, department desks,
   audit log and the department map.
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, deptColor, deptName, cu, tint, statusPill, deptTag,
        timeAgo, fmtDateTime, fmtDate, lakh, money, num, pct, totalValue, paidValue, dueValue,
        registerView, sectionHead, panel, kpiCard, tableHTML, miniStat, progressBar } = P;

const PRIO_DOT={HIGH:'#ef4444',MED:'#fbbf24',LOW:'#cbd5e1'};
const prioRank = p => ({HIGH:0,MED:1,LOW:2}[p.priority]);

/* ---------------- Command Centre ---------------- */
registerView('dashboard', ['Command Centre','Live overview of every plot, department and handoff'], ()=>{
  const A=state.projects, active=A.filter(p=>p.statusKey!=='completed');
  const awaitingLegal=active.filter(p=>deptOfStatus(p.statusKey)==='legal').length;
  const awaitingFinance=active.filter(p=>deptOfStatus(p.statusKey)==='finance').length;
  const completed=A.filter(p=>p.statusKey==='completed').length;
  const portfolio=A.reduce((s,p)=>s+totalValue(p),0);
  const collected=A.reduce((s,p)=>s+paidValue(p),0);

  const kpis=[
    {ic:'map',   c:'#1b2769', val:active.length, lab:'Active Plots', tr:'+3 this month', trc:'up',
     spark:C.spark(EXT.series('bookings'),'#1b2769')},
    {ic:'scale', c:deptColor('legal'), val:awaitingLegal, lab:'Awaiting Legal', tr:'avg 4.2 days', trc:'flat',
     spark:C.spark(EXT.series('registrations'),deptColor('legal'))},
    {ic:'coins', c:deptColor('finance'), val:awaitingFinance, lab:'Awaiting Finance', tr:'2 escalations', trc:'down',
     spark:C.spark(EXT.series('siteVisits').slice(4),deptColor('finance'))},
    {ic:'check', c:'#16a34a', val:completed, lab:'Registered & Filed', tr:'+2 this month', trc:'up',
     spark:C.spark(EXT.series('registrations'),'#16a34a')},
    {ic:'wallet',c:'#b8862b', val:money(portfolio), lab:'Portfolio Value', tr:A.length+' plots', trc:'flat',
     spark:C.spark(EXT.series('revenue'),'#b8862b')},
    {ic:'receipt',c:'#0891b2', val:money(collected), lab:'Amount Collected', tr:pct(collected,portfolio)+'% of book', trc:'up',
     spark:C.spark(EXT.series('collections'),'#0891b2')},
  ];

  const stageCount=[0,0,0];
  A.forEach(p=>{ stageCount[STATUS[p.statusKey].stage-1]++; });
  const loan=A.filter(p=>p.payment==='Loan').length, cash=A.length-loan;

  const myDept=cu().dept;
  const mine = active.filter(p=> myDept==='admin' ? p.priority==='HIGH' : deptOfStatus(p.statusKey)===myDept).sort((a,b)=>prioRank(a)-prioRank(b));

  const deptLoad = ['sales','legal','finance','operations'].map(d=>({
    label:deptName(d), value:active.filter(p=>deptOfStatus(p.statusKey)===d).length, color:deptColor(d) }));

  return `
    <div class="attn">
      <div style="font-size:22px">💡</div>
      <div class="txt"><b>Try the live handoff:</b> switch to the <b>Legal</b> role, open plot <b>D-22 · Nazeer Ahmed</b> and mark <b>Loan Eligibility</b> complete — the <b>Finance</b> team is notified instantly, and every change is logged with a timestamp.</div>
    </div>

    <div class="grid kpis">${kpis.map(kpiCard).join('')}</div>

    <div class="grid cols-2 mt">
      ${panel('Revenue vs Collections','Rolling 12 months (₹ lakh)',
        C.lineChart(EXT.months,[
          {name:'Booked revenue', values:EXT.series('revenue').map(v=>v/100000), color:'#3a4fb0'},
          {name:'Collections',    values:EXT.series('collections').map(v=>v/100000), color:'#10b981'},
        ],{yFmt:v=>'₹'+Math.round(v)+'L'}))}
      ${panel('Workload by department','Plots currently owned',
        C.donut(deptLoad,{size:170, center:String(active.length), centerSub:'in progress'}))}
    </div>

    <div class="grid cols-2 mt" id="dashAttention">
      <div class="card pad">
        <div class="row-between"><h2 style="margin:0;font-size:15px">Needs your attention</h2>
          <span class="chip" style="color:${deptColor(myDept)};background:${tint(deptColor(myDept))}">${esc(deptName(myDept))} view</span></div>
        <div class="mt-s">${mine.length? mine.slice(0,6).map(attnRow).join('') : `<div class="empty">Nothing pending for your team right now 🎉</div>`}</div>
      </div>
      <div class="card pad">
        <div class="row-between"><h2 style="margin:0;font-size:15px">Live Activity</h2><span class="live"><span class="blink"></span>Live</span></div>
        <div class="feed mt-s">${state.activity.slice(0,8).map(feedItem).join('')}</div>
      </div>
    </div>

    <div class="grid cols-3 mt">
      ${panel('Pipeline by stage','Where every plot sits today',
        STAGES.map((s,i)=>`<div style="margin-bottom:14px">
          <div class="row-between small"><span class="b">Stage ${s.n} · ${esc(s.name)}</span><span class="muted">${stageCount[i]} plots</span></div>
          <div class="bar mt-s"><i style="width:${Math.round(stageCount[i]/Math.max(...stageCount,1)*100)}%;background:linear-gradient(90deg,${['#22c55e','#3b82f6','#8b5cf6'][i]},${['#15803d','#1d4ed8','#6d28d9'][i]})"></i></div>
        </div>`).join(''))}
      ${panel('Payment route split','Loan cases need Legal → Finance coordination',
        C.donut([{label:'Loan',value:loan,color:'#6d28d9'},{label:'Cash',value:cash,color:'#16a34a'}],
          {size:150, center:String(A.length), centerSub:'plots'}))}
      ${panel('Process SLA health','Average turnaround against target',
        `<div class="gauge-row">
          ${C.gauge(4.2,7,{size:118,color:deptColor('legal'),label:'Legal scrutiny',sub:'4.2 / 7d'})}
          ${C.gauge(11,14,{size:118,color:deptColor('finance'),label:'Loan sanction',sub:'11 / 14d'})}
          ${C.gauge(2.4,3,{size:118,color:deptColor('operations'),label:'Handover',sub:'2.4 / 3d'})}
        </div>`)}
    </div>

    ${sectionHead('High-value plots in progress','Sorted by agreement value')}
    <div class="card pad">${tableHTML(
      [{label:'Plot'},{label:'Customer'},{label:'Project'},{label:'Stage'},{label:'Owner'},{label:'Value',align:'right'},{label:'Collected',align:'right'}],
      active.slice().sort((a,b)=>totalValue(b)-totalValue(a)).slice(0,8).map(p=>({
        attr:`data-plot="${p.id}" style="cursor:pointer"`,
        cells:[`<span class="plotno">${esc(p.plot)}</span>`, esc(p.customer), `<span class="muted small">${esc(p.location)}</span>`,
          statusPill(p.statusKey), `<div class="flex">${av(p.assigned,24)}<span class="small">${esc(USERS[p.assigned].name)}</span></div>`,
          `<b>${lakh(totalValue(p))}</b>`, `<span class="muted">${lakh(paidValue(p))}</span>`]
      })))}</div>`;
});

function attnRow(p){
  return `<div class="feed"><div class="item" data-plot="${p.id}" style="cursor:pointer">
    <div class="ic" style="background:${deptColor(deptOfStatus(p.statusKey))}">${icon('map',16)}</div>
    <div class="txt" style="flex:1">
      <b>${esc(p.customer)}</b> · <span class="plotno">${esc(p.plot)}</span>
      <div class="when"><span>${statusPill(p.statusKey)}</span><span class="prio ${p.priority}">${p.priority}</span></div>
    </div>${icon('chevron')}
  </div></div>`;
}
function feedItem(a){
  const p=state.projects.find(x=>x.id===a.projectId);
  if(a.kind==='doc'){
    const dep=USERS[a.actorKey].dept;
    return `<div class="item" data-plot="${a.projectId}" style="cursor:pointer">
      <div class="ic" style="background:${deptColor(dep)}">${icon('file',16)}</div>
      <div class="txt"><b>${esc(USERS[a.actorKey].name)}</b> uploaded <b>${esc(a.label)}</b>
        <div class="when">Document · ${p?('Plot '+esc(p.plot)+' · '+esc(p.customer)):''} · ${timeAgo(a.ts)}</div></div></div>`;
  }
  const st=STATUS[a.statusKey], c=deptColor(st.dept);
  return `<div class="item" data-plot="${a.projectId}" style="cursor:pointer">
    <div class="ic" style="background:${c}">${icon('bolt',16)}</div>
    <div class="txt"><b>${esc(USERS[a.actorKey].name)}</b> marked <b>${esc(st.label)}</b>
      <div class="when">${deptTag(st.dept)} · ${p?('Plot '+esc(p.plot)+' · '+esc(p.customer)):''} · ${timeAgo(a.ts)}</div></div></div>`;
}

/* ---------------- Bookings & Plots ---------------- */
registerView('plots', ['Bookings & Plots','Every customer mapped to their plot and current status'], ()=>{
  const f=state.filter;
  const list=state.projects.filter(p=>{
    if(f.payment!=='all' && p.payment!==f.payment) return false;
    if(f.stage!=='all' && String(STATUS[p.statusKey].stage)!==f.stage) return false;
    if(f.q){ const q=f.q.toLowerCase();
      if(!(p.customer.toLowerCase().includes(q)||p.plot.toLowerCase().includes(q)||p.location.toLowerCase().includes(q))) return false; }
    return true;
  });
  const value=list.reduce((s,p)=>s+totalValue(p),0);
  return `
    <div class="toolbar">
      <div class="seg" data-seg="payment">
        <button data-val="all" class="${f.payment==='all'?'on':''}">All</button>
        <button data-val="Loan" class="${f.payment==='Loan'?'on':''}">Loan</button>
        <button data-val="Cash" class="${f.payment==='Cash'?'on':''}">Cash</button>
      </div>
      <select class="selectlike" data-filter="stage">
        <option value="all" ${f.stage==='all'?'selected':''}>All stages</option>
        ${STAGES.map(s=>`<option value="${s.n}" ${f.stage===String(s.n)?'selected':''}>Stage ${s.n} · ${esc(s.name)}</option>`).join('')}
      </select>
      <span class="chip">${list.length} of ${state.projects.length} plots</span>
      <span class="chip">${money(value)} book value</span>
      <div style="flex:1"></div>
      <button class="btn secondary sm" data-demo="Export runs as XLSX in production.">${icon('download',15)} Export</button>
      <button class="btn sm" data-demo="The new booking wizard opens here.">${icon('plus',15)} New Booking</button>
    </div>
    <div class="grid plot-grid">${list.map(plotCard).join('') || '<div class="empty card pad">No plots match your filter.</div>'}</div>`;
});
function plotCard(p){
  const dept=deptOfStatus(p.statusKey), c=deptColor(dept);
  return `<div class="card plot" data-plot="${p.id}">
    <div class="plot-head" style="background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(0,0,0,.20)),${c}">
      <div class="ph-top">
        <span class="plotno-h">PLOT ${esc(p.plot)}</span>
        <span class="prio-h"><i style="background:${PRIO_DOT[p.priority]}"></i>${p.priority}</span>
      </div>
      <div class="cust-h">${esc(p.customer)}</div>
      <div class="loc-h">${icon('pin',14)}${esc(p.location)}</div>
    </div>
    <div class="plot-body">
      <div class="meta">
        <span class="pay ${p.payment}">${p.payment==='Loan'?icon('bank',13):icon('cash',13)}${p.payment}</span>
        <span class="chip">${p.area} cents</span>
        <span class="chip">${lakh(totalValue(p))}</span>
      </div>
      <div style="margin-top:12px">${statusPill(p.statusKey)}</div>
      <div class="bar" style="margin-top:10px"><i style="width:${progressPct(p)}%"></i></div>
      <div class="statusrow">
        <div class="assignee">${av(p.assigned,28)}<div class="stack"><small>Assigned to</small><span class="b small">${esc(USERS[p.assigned].name)}</span></div></div>
        <span class="muted small">${progressPct(p)}% · ${timeAgo(p.updatedAt)}</span>
      </div>
    </div>
  </div>`;
}

/* ---------------- Department desks (kanban) ---------------- */
function deskKanbanHTML(dept){
  const owned = Object.keys(STATUS).filter(k=>STATUS[k].dept===dept);
  const cols = owned.map(k=>({key:k, items:state.projects.filter(p=>p.statusKey===k)})).filter(c=>c.items.length);
  if(!cols.length) return `<div class="empty card pad">No plots are currently with the ${esc(deptName(dept))} team.</div>`;
  return `<div class="kan">${cols.map(c=>{
    const cc=deptColor(dept);
    return `<div class="kcol">
      <h4><span style="width:9px;height:9px;border-radius:50%;background:${cc}"></span>${esc(STATUS[c.key].label)}<span class="count">${c.items.length}</span></h4>
      ${c.items.map(p=>`
        <div class="kcard" data-plot="${p.id}">
          <div class="kc-top"><span class="plotno">${esc(p.plot)}</span><span class="prio ${p.priority}">${p.priority}</span></div>
          <div class="kc-cust">${esc(p.customer)}</div>
          <div class="muted small">${esc(p.location)}</div>
          <div class="flex wrap" style="margin-top:10px"><span class="pay ${p.payment}">${p.payment}</span><span class="chip">${lakh(totalValue(p))}</span></div>
          <div class="row-between" style="margin-top:12px">
            <div class="flex">${av(p.assigned,26)}<span class="small b">${esc(USERS[p.assigned].name)}</span></div>
            ${window.PZApp && PZApp.canAct(p)?`<button class="btn sm ${dept==='finance'?'finance':''}" data-advance="${p.id}">Mark Complete</button>`:''}
          </div>
        </div>`).join('')}
    </div>`;
  }).join('')}</div>`;
}
function deskStats(dept){
  const owned=state.projects.filter(p=>deptOfStatus(p.statusKey)===dept && p.statusKey!=='completed');
  const value=owned.reduce((s,p)=>s+totalValue(p),0);
  const high=owned.filter(p=>p.priority==='HIGH').length;
  const stale=owned.filter(p=>(Date.now()-p.updatedAt)/86400000 > 3).length;
  return `<div class="grid cols-4">
    ${miniStat('Plots in queue', owned.length, 'owned by '+deptName(dept), deptColor(dept))}
    ${miniStat('Value in queue', money(value), 'agreement value')}
    ${miniStat('High priority', high, 'needs same-day action', high?'#ef4444':'#16a34a')}
    ${miniStat('Idle > 3 days', stale, 'no movement logged', stale?'#b45309':'#16a34a')}
  </div>`;
}
function deskView(dept, extraTop){
  return `${extraTop||''}
    ${deskStats(dept)}
    ${sectionHead(deptName(dept)+' workload','Click any card to open · use “Mark Complete” to advance the flow')}
    ${deskKanbanHTML(dept)}`;
}
registerView('legal', ['Legal Desk','Scrutiny, eligibility, evaluation & deed — owned by Legal'], ()=>deskView('legal'));
registerView('operations',['Operations Desk','Registrar follow-up, land tax, possession & handover'], ()=>deskView('operations'));
registerView('finance', ['Finance Desk','Loan processing, bank verification, sanction & transfer'], ()=>{
  const banners = state.notifications.filter(n=>n.dept==='finance' && !n.read).map(n=>`
    <div class="attn finance" data-plot="${n.projectId}" style="cursor:pointer">
      <div style="font-size:20px">🔔</div>
      <div class="txt" style="flex:1"><b>${esc(n.title)}</b><div class="muted small">${esc(n.body)} · ${timeAgo(n.ts)}</div></div>
      <button class="btn finance sm">Open ${icon('chevron',14)}</button>
    </div>`).join('');
  return deskView('finance', banners);
});

/* ---------------- Activity & audit ---------------- */
registerView('activity', ['Activity & Audit Log','Who did what, and when — full history'], ()=>{
  const rows=state.activity.slice(0,80);
  return `${sectionHead('Full audit trail', state.activity.length+' events · every status change is stamped with the person, department & time',
      `<span class="live"><span class="blink"></span>Live</span>`)}
    <div class="grid cols-4">
      ${miniStat('Events logged', num(state.activity.length), 'since first booking')}
      ${miniStat('Today', num(state.activity.filter(a=>(Date.now()-a.ts)<86400000).length), 'status changes')}
      ${miniStat('Contributors', num(new Set(state.activity.map(a=>a.actorKey)).size), 'staff members')}
      ${miniStat('Documents', num(state.projects.reduce((s,p)=>s+p.files.length,0)), 'files on record')}
    </div>
    <div class="card pad mt">${tableHTML(
      [{label:'When'},{label:'Person'},{label:'Department'},{label:'Plot / Customer'},{label:'Action'}],
      rows.map(a=>{
        const p=state.projects.find(x=>x.id===a.projectId);
        const dep = a.kind==='doc' ? USERS[a.actorKey].dept : STATUS[a.statusKey].dept;
        const action = a.kind==='doc'
          ? `<span class="pill" style="color:var(--brand-2);background:#eef0fb"><i class="dt"></i>📎 ${esc(a.label)}</span>`
          : statusPill(a.statusKey);
        return { attr:`data-plot="${a.projectId}" style="cursor:pointer"`, cells:[
          `<span class="muted small">${fmtDateTime(a.ts)}<div>${timeAgo(a.ts)}</div></span>`,
          `<div class="flex">${av(a.actorKey,26)}<span class="b">${esc(USERS[a.actorKey].name)}</span></div>`,
          deptTag(dep),
          `<span class="plotno">${p?esc(p.plot):''}</span> · ${p?esc(p.customer):''}`,
          action ]};
      }))}</div>`;
});

/* ---------------- Departments map ---------------- */
registerView('departments', ['Departments','How the seven departments of Pazheri Properties connect'], ()=>{
  const order=['sales','legal','finance','operations','purchase','hr'];
  return `<div class="grid cols-3">
      ${order.map(d=>{
        const dep=DEPARTMENTS[d], c=dep.color;
        const load=state.projects.filter(p=>deptOfStatus(p.statusKey)===d && p.statusKey!=='completed').length;
        const done=state.activity.filter(a=>a.statusKey&&STATUS[a.statusKey].dept===d).length;
        return `<div class="card dept-card">
          <div class="head"><div class="em" style="background:${c}">${dep.emoji}</div>
            <div><h3>${esc(dep.name)}</h3><div class="muted small">${dep.members.length} members</div></div></div>
          <div class="desc">${esc(dep.desc)}</div>
          <div class="flex wrap">${dep.members.map(m=>av(m,26)).join('')}</div>
          <div class="stat">
            <div><b style="color:${c}">${load}</b><span>Active plots</span></div>
            <div><b>${dep.members.length}</b><span>Team members</span></div>
            <div><b>${done}</b><span>Actions logged</span></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    ${sectionHead('The end-to-end handoff chain')}
    <div class="card pad">
      <div class="flow-chain">
        ${['sales','legal','finance','legal','operations'].map((d,i,arr)=>`
          <span class="pill" style="color:${deptColor(d)};background:${tint(deptColor(d))}"><i class="dt"></i>${esc(deptName(d))}</span>
          ${i<arr.length-1?`<span class="muted">${icon('arrow',16)}</span>`:''}`).join('')}
      </div>
      <p class="muted small mt">Sales books the plot &amp; collects the token → Legal verifies documents, prepares the scrutiny report, evaluation &amp; confirms loan eligibility → Finance handles bank verification, allocation, sanction &amp; transfer → Legal prepares &amp; registers the deed → Operations files land tax/possession and hands over documents. Purchase feeds new plots into inventory; HR supports the whole team.</p>
    </div>`;
});

window.PZCore = { deskKanbanHTML, plotCard, feedItem, attnRow };
})();
