/* ============================================================
   Screens — CFO Console, Receivables, Bank & Loan tracker,
   Expenses & Payables, Commissions
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, deptColor, deptName, money, lakh, crore, num, pct, fmtINR,
        totalValue, paidValue, dueValue, registerView, sectionHead, panel, kpiCard,
        tableHTML, miniStat, fmtDate, timeAgo, statusPill, tag, progressBar } = P;

const agingBucket = p => {
  const d = p.ageDays;
  return d<15 ? '0–15 days' : d<30 ? '16–30 days' : d<45 ? '31–45 days' : '45+ days';
};
const AGING = ['0–15 days','16–30 days','31–45 days','45+ days'];
const AGING_COLOR = ['#16a34a','#84cc16','#f59e0b','#ef4444'];

/* ---------------- CFO Console ---------------- */
registerView('cfo', ['CFO Console','Cash position, margins, receivables and cost control'], ()=>{
  const A=state.projects;
  const book=A.reduce((s,p)=>s+totalValue(p),0);
  const collected=A.reduce((s,p)=>s+paidValue(p),0);
  const outstanding=A.reduce((s,p)=>s+dueValue(p),0);
  const spend=EXPENSE_HEADS.reduce((s,e)=>s+e.amount,0);
  const budget=EXPENSE_HEADS.reduce((s,e)=>s+e.budget,0);
  const payables=VENDORS.reduce((s,v)=>s+v.outstanding,0);
  const revYTD=EXT.ytd('revenue'), expYTD=EXT.ytd('expenses');
  const cash = EXT.ytd('collections') - expYTD;

  const kpis=[
    {ic:'bank',   c:'#0f5132', val:crore(cash), lab:'Net cash position', tr:'after all outflows', trc:'up', spark:C.spark(EXT.series('collections'),'#0f5132')},
    {ic:'receipt',c:'#3a4fb0', val:crore(EXT.ytd('collections')), lab:'Collections YTD', tr:EXT.growth('collections')+'% MoM', trc:EXT.growth('collections')>=0?'up':'down'},
    {ic:'alert',  c:'#ef4444', val:money(outstanding), lab:'Receivables open', tr:pct(outstanding,book)+'% of book value', trc:'down'},
    {ic:'card',   c:'#b45309', val:money(payables), lab:'Vendor payables', tr:VENDORS.filter(v=>v.outstanding>0).length+' vendors', trc:'flat'},
    {ic:'percent',c:'#10b981', val:pct(revYTD-expYTD,revYTD)+'%', lab:'Gross margin', tr:'target 42%', trc:'up'},
    {ic:'wallet', c:'#6366f1', val:pct(spend,budget)+'%', lab:'Budget utilised', tr:money(budget-spend)+' left', trc:spend<=budget?'up':'down'},
  ];

  const agingData = AGING.map((b,i)=>({
    label:b, color:AGING_COLOR[i],
    value: A.filter(p=>dueValue(p)>0 && agingBucket(p)===b).reduce((s,p)=>s+dueValue(p),0) }));

  return `
    <div class="attn finance">
      <div style="font-size:20px">📊</div>
      <div class="txt" style="flex:1"><b>Month-end close is 6 days away.</b>
        <div class="muted small">${APPROVALS.filter(a=>a.level==='CFO'&&a.status==='Pending').length} approvals pending with Finance · ${COMPLIANCE.filter(c=>c.status==='Overdue').length} statutory items overdue.</div></div>
      <button class="btn finance sm" data-demo="Runs the month-end close checklist.">Start close ${icon('chevron',14)}</button>
    </div>

    <div class="grid kpis mt">${kpis.map(kpiCard).join('')}</div>

    <div class="grid cols-2 mt">
      ${panel('Cash flow — in vs out','Rolling 12 months (₹ lakh)',
        C.lineChart(EXT.months,[
          {name:'Cash in',  values:EXT.series('collections').map(v=>v/100000), color:'#10b981'},
          {name:'Cash out', values:EXT.series('expenses').map(v=>v/100000),    color:'#ef4444'},
        ],{yFmt:v=>'₹'+Math.round(v)+'L'}))}
      ${panel('Receivables ageing','Outstanding by bucket',
        C.donut(agingData.map(a=>({...a, display:money(a.value)})),{size:160,
          center:money(agingData.reduce((s,a)=>s+a.value,0)), centerSub:'open'}))}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Spend vs budget by head','Financial year to date',
        C.bullet(EXPENSE_HEADS.map(e=>({label:e.head, value:e.amount, target:e.budget, color:e.color})),{fmt:money, invert:true}))}
      ${panel('Loan book by bank','Sanctioned vs pending cases',
        C.barChart(BANKS.map(b=>b.name.split(' ')[0]),[
          {name:'Sanctioned', values:BANKS.map(b=>b.sanctioned), color:'#16a34a'},
          {name:'Pending',    values:BANKS.map(b=>b.pending),    color:'#f59e0b'},
          {name:'Rejected',   values:BANKS.map(b=>b.rejected),   color:'#ef4444'},
        ],{stacked:true}))}
    </div>

    ${sectionHead('Finance approvals queue','Routed to the CFO for sign-off')}
    <div class="card pad">${tableHTML(
      [{label:'ID'},{label:'Type'},{label:'Subject'},{label:'Raised by'},{label:'Amount',align:'right'},{label:'Age'},{label:'',align:'right'}],
      APPROVALS.filter(a=>a.level==='CFO').map(a=>({cells:[
        `<span class="plotno">${esc(a.id)}</span>`, `<span class="chip">${esc(a.type)}</span>`, esc(a.subject),
        `<div class="flex">${av(a.raisedBy,24)}<span class="small">${esc(USERS[a.raisedBy].name)}</span></div>`,
        a.amount?`<b>${lakh(a.amount)}</b>`:'<span class="muted">—</span>', `<span class="muted small">${a.age}d</span>`,
        a.status==='Pending' ? `<button class="btn finance sm" data-demo="Approval recorded.">Approve</button>` : tag(a.status, a.status==='Approved'?'#16a34a':'#ef4444')]})))}</div>`;
});

/* ---------------- Receivables ---------------- */
registerView('receivables', ['Receivables & Collections','Every rupee outstanding, by customer and age'], ()=>{
  const open=state.projects.filter(p=>dueValue(p)>0).sort((a,b)=>dueValue(b)-dueValue(a));
  const total=open.reduce((s,p)=>s+dueValue(p),0);
  const overdue=open.filter(p=>p.ageDays>=30);
  const buckets=AGING.map((b,i)=>({label:b,color:AGING_COLOR[i],
    value:open.filter(p=>agingBucket(p)===b).reduce((s,p)=>s+dueValue(p),0),
    count:open.filter(p=>agingBucket(p)===b).length}));

  return `
    <div class="grid cols-4">
      ${miniStat('Total outstanding', money(total), open.length+' live accounts', '#ef4444')}
      ${miniStat('Overdue > 30 days', money(overdue.reduce((s,p)=>s+dueValue(p),0)), overdue.length+' accounts', '#b45309')}
      ${miniStat('Collected this month', money(EXT.lastMonth('collections')), EXT.growth('collections')+'% vs prior', '#16a34a')}
      ${miniStat('Avg days to collect', '27 days', 'target 21 days', '#6366f1')}
    </div>

    <div class="card pad mt">
      <div class="row-between" style="margin-bottom:12px"><h2 style="margin:0;font-size:15px">Ageing composition</h2>
        <span class="muted small">${money(total)} across ${open.length} accounts</span></div>
      ${C.meter(buckets.map(b=>({...b, display:money(b.value)})),{height:16})}
    </div>

    ${sectionHead('Outstanding by customer','Click a row to open the plot file',
      `<button class="btn secondary sm" data-demo="Sends reminder SMS + email to selected customers.">${icon('mail',15)} Send reminders</button>`)}
    <div class="card pad">${tableHTML(
      [{label:'Plot'},{label:'Customer'},{label:'Route'},{label:'Stage'},{label:'Agreement',align:'right'},{label:'Received',align:'right'},{label:'Outstanding',align:'right'},{label:'Ageing'}],
      open.map(p=>({ attr:`data-plot="${p.id}" style="cursor:pointer"`, cells:[
        `<span class="plotno">${esc(p.plot)}</span>`, `<b>${esc(p.customer)}</b><div class="muted small">${esc(p.phone)}</div>`,
        `<span class="pay ${p.payment}">${p.payment}</span>`, statusPill(p.statusKey),
        lakh(totalValue(p)), `<span class="muted">${lakh(paidValue(p))}</span>`, `<b style="color:#b91c1c">${lakh(dueValue(p))}</b>`,
        tag(agingBucket(p), AGING_COLOR[AGING.indexOf(agingBucket(p))])]})))}</div>`;
});

/* ---------------- Bank & Loan tracker ---------------- */
registerView('loans', ['Bank & Loan Tracker','Sanction pipeline, turnaround and empanelled partners'], ()=>{
  const loans=state.projects.filter(p=>p.payment==='Loan');
  const stages=['loan_docs','eligibility','bank_verify','loan_allocated','bank_visit','sanction'];
  const stageCounts=stages.map(s=>loans.filter(p=>p.statusKey===s).length);
  const sanctioned=loans.filter(p=>routeFor(p).indexOf(p.statusKey)>=ROUTE_LOAN.indexOf('sanction')).length;

  return `
    <div class="grid cols-4">
      ${miniStat('Loan cases', loans.length, pct(loans.length,state.projects.length)+'% of all bookings', '#6d28d9')}
      ${miniStat('Sanctioned', sanctioned, pct(sanctioned,loans.length)+'% success rate', '#16a34a')}
      ${miniStat('In bank process', stageCounts.reduce((a,b)=>a+b,0), 'awaiting bank action', '#f59e0b')}
      ${miniStat('Avg sanction TAT', Math.round(BANKS.reduce((s,b)=>s+b.avgTat,0)/BANKS.length)+' days', 'target 14 days', '#3a4fb0')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Loan pipeline by step','Where every loan file is sitting',
        C.hBars(stages.map((s,i)=>({label:STATUS[s].label, value:stageCounts[i], color:deptColor(STATUS[s].dept)})),{fmt:v=>P.plural(v,'file')}))}
      ${panel('Bank turnaround (days)','Lower is better',
        C.hBars(BANKS.slice().sort((a,b)=>a.avgTat-b.avgTat).map(b=>({label:b.name,value:b.avgTat,color:b.color})),{fmt:v=>v+'d'}))}
    </div>

    ${sectionHead('Empanelled banking partners')}
    <div class="card pad">${tableHTML(
      [{label:'Bank'},{label:'Cases'},{label:'Sanctioned'},{label:'Pending'},{label:'Rejected'},{label:'Success'},{label:'Avg TAT'},{label:'Rate',align:'right'}],
      BANKS.map(b=>({cells:[
        `<div class="flex"><span class="sq" style="background:${b.color}"></span><b>${esc(b.name)}</b></div>`,
        num(b.cases), `<span style="color:#16a34a;font-weight:700">${b.sanctioned}</span>`,
        `<span style="color:#b45309;font-weight:700">${b.pending}</span>`,
        `<span style="color:#b91c1c;font-weight:700">${b.rejected}</span>`,
        `<div style="min-width:110px">${progressBar(b.sanctioned,b.cases,b.color)}<span class="muted small">${pct(b.sanctioned,b.cases)}%</span></div>`,
        b.avgTat+' days', `<b>${b.rate}%</b>`]})))}</div>

    ${sectionHead('Active loan files')}
    <div class="card pad">${tableHTML(
      [{label:'Plot'},{label:'Customer'},{label:'Profile'},{label:'Current step'},{label:'Loan value',align:'right'},{label:'Owner'},{label:'Updated'}],
      loans.filter(p=>p.statusKey!=='completed').map(p=>({ attr:`data-plot="${p.id}" style="cursor:pointer"`, cells:[
        `<span class="plotno">${esc(p.plot)}</span>`, `<b>${esc(p.customer)}</b>`,
        `<span class="chip">${esc(p.employment||'—')}</span>`, statusPill(p.statusKey),
        lakh(totalValue(p)*0.85), `<div class="flex">${av(p.assigned,24)}<span class="small">${esc(USERS[p.assigned].name)}</span></div>`,
        `<span class="muted small">${timeAgo(p.updatedAt)}</span>`]})))}</div>`;
});

/* ---------------- Expenses & payables ---------------- */
registerView('expenses', ['Expenses & Payables','Cost heads, budget utilisation and vendor dues'], ()=>{
  const spend=EXPENSE_HEADS.reduce((s,e)=>s+e.amount,0);
  const budget=EXPENSE_HEADS.reduce((s,e)=>s+e.budget,0);
  const over=EXPENSE_HEADS.filter(e=>e.amount>e.budget);
  const payables=VENDORS.reduce((s,v)=>s+v.outstanding,0);

  return `
    <div class="grid cols-4">
      ${miniStat('Spend YTD', crore(spend), pct(spend,budget)+'% of budget', '#3a4fb0')}
      ${miniStat('Budget remaining', money(Math.max(0,budget-spend)), 'across '+EXPENSE_HEADS.length+' heads', '#16a34a')}
      ${miniStat('Heads over budget', over.length, over.map(o=>o.head).join(', ')||'none', over.length?'#ef4444':'#16a34a')}
      ${miniStat('Vendor payables', money(payables), VENDORS.filter(v=>v.outstanding>0).length+' open vendors', '#b45309')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Cost head distribution','Share of total spend',
        C.donut(EXPENSE_HEADS.map(e=>({label:e.head, value:e.amount, color:e.color, display:money(e.amount)})),
          {size:170, center:crore(spend), centerSub:'YTD spend'}))}
      ${panel('Budget utilisation','Actual against allocation',
        C.bullet(EXPENSE_HEADS.map(e=>({label:e.head,value:e.amount,target:e.budget,color:e.color})),{fmt:money, invert:true}))}
    </div>

    ${sectionHead('Vendor ledger','Outstanding balances and payment terms',
      `<button class="btn sm" data-demo="Opens the payment run screen.">${icon('card',15)} Payment run</button>`)}
    <div class="card pad">${tableHTML(
      [{label:'Vendor'},{label:'Category'},{label:'Terms'},{label:'Last paid'},{label:'Outstanding',align:'right'},{label:'',align:'right'}],
      VENDORS.map(v=>({cells:[
        `<b>${esc(v.name)}</b>`, `<span class="chip">${esc(v.category)}</span>`, esc(v.terms),
        `<span class="muted small">${fmtDate(v.lastPaid)}</span>`,
        v.outstanding?`<b style="color:#b91c1c">${money(v.outstanding)}</b>`:`<span style="color:#16a34a;font-weight:700">Settled</span>`,
        v.outstanding?`<button class="btn secondary sm" data-demo="Schedules this vendor payment.">Schedule</button>`:'']})))}</div>`;
});

/* ---------------- Commissions ---------------- */
registerView('commission', ['Commissions & Payouts','Sales incentive calculation per executive'], ()=>{
  const rows=TARGETS.map(t=>{
    const rate = t.achieved>=t.target ? 1.5 : 1.0;
    return {...t, payout: Math.round(t.achieved*rate/100), attainment: pct(t.achieved,t.target), rate};
  });
  const totalPayout=rows.reduce((s,r)=>s+r.payout,0);
  return `
    <div class="grid cols-4">
      ${miniStat('Payout this quarter', money(totalPayout), rows.length+' executives', '#b8862b')}
      ${miniStat('Target achieved', money(rows.reduce((s,r)=>s+r.achieved,0)), 'against '+money(rows.reduce((s,r)=>s+r.target,0)), '#16a34a')}
      ${miniStat('Above target', rows.filter(r=>r.attainment>=100).length, 'earning the 1.5% slab', '#10b981')}
      ${miniStat('Below target', rows.filter(r=>r.attainment<100).length, 'on the 1.0% base slab', '#b45309')}
    </div>

    ${panel('Attainment against target','Bar marker shows the monthly target',
      C.bullet(rows.map(r=>({label:USERS[r.key].name, value:r.achieved, target:r.target, color:deptColor('sales')})),{fmt:money}), 'mt')}

    ${sectionHead('Incentive computation','1.0% base slab · 1.5% on hitting target')}
    <div class="card pad">${tableHTML(
      [{label:'Executive'},{label:'Target',align:'right'},{label:'Achieved',align:'right'},{label:'Attainment'},{label:'Slab'},{label:'Payout',align:'right'},{label:'Status'}],
      rows.map(r=>({cells:[
        `<div class="flex">${av(r.key,28)}<div class="stack"><b>${esc(USERS[r.key].name)}</b><span class="muted small">${esc(USERS[r.key].role)}</span></div></div>`,
        money(r.target), `<b>${money(r.achieved)}</b>`,
        `<div style="min-width:120px">${progressBar(r.achieved,r.target, r.attainment>=100?'#16a34a':'#f59e0b')}<span class="muted small">${r.attainment}%</span></div>`,
        `<span class="chip">${r.rate.toFixed(1)}%</span>`, `<b>${money(r.payout)}</b>`,
        tag(r.attainment>=100?'Qualified':'Base slab', r.attainment>=100?'#16a34a':'#b45309')]})))}</div>`;
});
})();
