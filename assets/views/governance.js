/* ============================================================
   Screens — Approvals & Tasks, Reports Library, Settings
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, deptColor, deptName, money, lakh, num, pct, fmtDate, timeAgo,
        registerView, sectionHead, panel, tableHTML, miniStat, tag, progressBar, statusPill } = P;

const AP_COLOR={'Pending':'#f59e0b','Approved':'#16a34a','Rejected':'#ef4444'};

/* ---------------- Approvals & Tasks ---------------- */
registerView('approvals', ['Approvals & Tasks','Everything waiting on a decision or an action'], ()=>{
  const pending=APPROVALS.filter(a=>a.status==='Pending');
  const value=pending.reduce((s,a)=>s+a.amount,0);
  const myTasks=state.projects.filter(p=>p.statusKey!=='completed' &&
    (P.cu().dept==='admin' || deptOfStatus(p.statusKey)===P.cu().dept))
    .sort((a,b)=>({HIGH:0,MED:1,LOW:2}[a.priority]-{HIGH:0,MED:1,LOW:2}[b.priority]));

  return `
    <div class="grid cols-4">
      ${miniStat('Pending approvals', pending.length, 'awaiting sign-off', '#f59e0b')}
      ${miniStat('Value under approval', money(value), 'financial exposure', '#3a4fb0')}
      ${miniStat('Approved this month', APPROVALS.filter(a=>a.status==='Approved').length, 'cleared decisions', '#16a34a')}
      ${miniStat('Your open tasks', myTasks.length, deptName(P.cu().dept)+' queue', deptColor(P.cu().dept))}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Approvals by type','What the leadership signs off most',
        C.hBars([...new Set(APPROVALS.map(a=>a.type))].map(t=>({label:t,
          value:APPROVALS.filter(a=>a.type===t).length})),{fmt:v=>P.plural(v,'item')}))}
      ${panel('Decision status','Across all raised requests',
        C.donut(['Pending','Approved','Rejected'].map(s=>({label:s,
          value:APPROVALS.filter(a=>a.status===s).length, color:AP_COLOR[s]})),
          {size:160, center:String(APPROVALS.length), centerSub:'requests'}))}
    </div>

    ${sectionHead('Approval inbox','Routed by value and category')}
    <div class="card pad">${tableHTML(
      [{label:'ID'},{label:'Type'},{label:'Subject'},{label:'Raised by'},{label:'Approver'},{label:'Value',align:'right'},{label:'Age'},{label:'Status'},{label:'',align:'right'}],
      APPROVALS.map(a=>({cells:[
        `<span class="plotno">${esc(a.id)}</span>`, `<span class="chip">${esc(a.type)}</span>`, `<b>${esc(a.subject)}</b>`,
        `<div class="flex">${av(a.raisedBy,24)}<span class="small">${esc(USERS[a.raisedBy].name)}</span></div>`,
        tag(a.level, a.level==='MD'?'#64748b':'#10b981'),
        a.amount?money(a.amount):'<span class="muted">—</span>', `<span class="muted small">${a.age}d</span>`,
        tag(a.status, AP_COLOR[a.status]),
        a.status==='Pending'
          ? `<div class="flex" style="gap:6px;justify-content:flex-end">
               <button class="btn secondary sm" data-demo="Request sent back with your remarks.">Reject</button>
               <button class="btn sm" data-demo="Approved and logged in the audit trail.">Approve</button></div>`
          : `<span class="muted small">closed</span>`]})))}</div>

    ${sectionHead('Your working queue','Plots your department owns right now')}
    <div class="card pad">${tableHTML(
      [{label:'Plot'},{label:'Customer'},{label:'Current step'},{label:'Priority'},{label:'Owner'},{label:'Idle'},{label:'',align:'right'}],
      myTasks.slice(0,12).map(p=>({ attr:`data-plot="${p.id}" style="cursor:pointer"`, cells:[
        `<span class="plotno">${esc(p.plot)}</span>`, `<b>${esc(p.customer)}</b>`, statusPill(p.statusKey),
        `<span class="prio ${p.priority}">${p.priority}</span>`,
        `<div class="flex">${av(p.assigned,24)}<span class="small">${esc(USERS[p.assigned].name)}</span></div>`,
        `<span class="muted small">${timeAgo(p.updatedAt)}</span>`,
        window.PZApp && PZApp.canAct(p)?`<button class="btn sm" data-advance="${p.id}">Mark Complete</button>`:'<span class="muted small">locked</span>']})))}</div>`;
});

/* ---------------- Reports Library ---------------- */
registerView('reports', ['Reports Library','Standard MIS packs available to every department'], ()=>{
  const byDept={};
  REPORTS.forEach(r=>{ byDept[r.dept]=(byDept[r.dept]||0)+1; });

  return `
    <div class="grid cols-4">
      ${miniStat('Standard reports', REPORTS.length, 'ready to run', '#3a4fb0')}
      ${miniStat('Reports generated', num(REPORTS.reduce((s,r)=>s+r.runs,0)), 'since go-live', '#16a34a')}
      ${miniStat('Scheduled packs', REPORTS.filter(r=>r.period!=='Quarterly').length, 'auto-emailed', '#6366f1')}
      ${miniStat('Departments covered', Object.keys(byDept).length, 'full coverage', '#b8862b')}
    </div>

    ${panel('Report usage','Times each pack has been generated',
      C.hBars(REPORTS.slice().sort((a,b)=>b.runs-a.runs).map(r=>({label:r.name, value:r.runs, color:deptColor(r.dept)})),
        {fmt:v=>P.plural(v,'run')}), 'mt')}

    ${sectionHead('Available reports','Run on demand or receive on schedule')}
    <div class="grid cols-3">
      ${REPORTS.map(r=>`<div class="card report-card">
        <div class="rc-head">
          <div class="rc-ic" style="background:${P.tint(deptColor(r.dept),'1f')};color:${deptColor(r.dept)}">${icon('bars',20)}</div>
          <div><b>${esc(r.name)}</b><div class="muted small">${esc(deptName(r.dept))}</div></div>
        </div>
        <div class="rc-meta">
          <span class="chip">${esc(r.period)}</span>
          <span class="chip">${esc(r.format)}</span>
          <span class="chip">${r.runs} runs</span>
        </div>
        <div class="rc-foot">
          <div class="flex">${av(r.owner,24)}<span class="small muted">${esc(USERS[r.owner].name)}</span></div>
          <button class="btn sm" data-demo="Generates the ${esc(r.name)} pack.">${icon('download',14)} Run</button>
        </div>
      </div>`).join('')}
    </div>`;
});

/* ---------------- Settings & Masters ---------------- */
registerView('settings', ['Settings & Masters','Configuration behind the whole system'], ()=>{
  const stagesByDept={};
  Object.keys(STATUS).forEach(k=>{ stagesByDept[STATUS[k].dept]=(stagesByDept[STATUS[k].dept]||0)+1; });

  return `
    <div class="grid cols-4">
      ${miniStat('Master tables', MASTERS.length, 'configurable without code', '#3a4fb0')}
      ${miniStat('Workflow steps', Object.keys(STATUS).length, 'across 3 stages', '#6366f1')}
      ${miniStat('User accounts', Object.keys(USERS).length, 'with role-based access', '#10b981')}
      ${miniStat('Notification rules', 16, 'department handoff alerts', '#b8862b')}
    </div>

    ${sectionHead('Configuration masters','Everything an administrator can maintain')}
    <div class="grid cols-3">
      ${MASTERS.map(m=>`<div class="card master-card" data-demo="Opens the ${esc(m.name)} master.">
        <div class="mc-ic">${icon(m.icon,20)}</div>
        <div class="mc-body"><b>${esc(m.name)}</b><p>${esc(m.desc)}</p></div>
        <div class="mc-count">${m.count}</div>
      </div>`).join('')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Workflow ownership','How the 20 steps split across departments',
        C.donut(Object.keys(stagesByDept).map(d=>({label:deptName(d), value:stagesByDept[d], color:deptColor(d)})),
          {size:170, center:String(Object.keys(STATUS).length), centerSub:'steps'}))}
      ${panel('Access matrix','Which department can act at which stage',
        `<div class="access-list">${Object.keys(DEPARTMENTS).map(d=>{
          const steps=Object.keys(STATUS).filter(k=>STATUS[k].dept===d);
          return `<div class="acc-row">
            <div class="acc-dept">${P.deptTag(d)}</div>
            <div class="acc-steps">${steps.length? steps.map(s=>`<span class="chip">${esc(STATUS[s].label)}</span>`).join('') : '<span class="muted small">Oversight only</span>'}</div>
          </div>`;
        }).join('')}</div>`)}
    </div>

    ${sectionHead('System information')}
    <div class="card pad">${tableHTML(
      [{label:'Setting'},{label:'Value'},{label:'Scope'}],
      [
        ['Organisation','Pazheri Properties Pvt Ltd','Global'],
        ['Financial year','April 2024 – March 2025','Global'],
        ['Currency & format','INR · Indian numbering (lakh / crore)','Global'],
        ['Area unit','Cents (1 cent = 435.6 sq ft)','Inventory'],
        ['Stamp duty rate','8% of agreement value','Legal'],
        ['Registration fee','2% of agreement value','Legal'],
        ['Token percentage','2% of plot value','Sales'],
        ['Legal scrutiny SLA','7 days','Legal'],
        ['Loan sanction SLA','14 days','Finance'],
        ['Data retention','7 years of audit history','Compliance'],
      ].map(r=>({cells:[`<b>${esc(r[0])}</b>`, esc(r[1]), `<span class="chip">${esc(r[2])}</span>`]})))}</div>`;
});
})();
