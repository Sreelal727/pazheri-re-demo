/* ============================================================
   Screens — Executive Cockpit (MD/CEO) and Analytics & Insights
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, deptColor, deptName, money, lakh, crore, num, pct,
        totalValue, paidValue, dueValue, registerView, sectionHead, panel, kpiCard,
        tableHTML, miniStat, fmtDate, timeAgo, statusPill, tag } = P;

/* ---------------- Executive Cockpit ---------------- */
registerView('exec', ['Executive Cockpit','Board-level view of revenue, inventory, velocity and risk'], ()=>{
  const A=state.projects;
  const book = A.reduce((s,p)=>s+totalValue(p),0);
  const collected = A.reduce((s,p)=>s+paidValue(p),0);
  const outstanding = A.reduce((s,p)=>s+dueValue(p),0);
  const inv = EXT.inventoryTotals();
  const revYTD = EXT.ytd('revenue'), expYTD = EXT.ytd('expenses');
  const margin = pct(revYTD-expYTD, revYTD);

  const kpis=[
    {ic:'trend',  c:'#1b2769', val:crore(revYTD), lab:'Revenue YTD', tr:EXT.growth('revenue')+'% vs last month', trc:EXT.growth('revenue')>=0?'up':'down', spark:C.spark(EXT.series('revenue'),'#1b2769')},
    {ic:'receipt',c:'#10b981', val:crore(EXT.ytd('collections')), lab:'Collections YTD', tr:EXT.growth('collections')+'% MoM', trc:EXT.growth('collections')>=0?'up':'down', spark:C.spark(EXT.series('collections'),'#10b981')},
    {ic:'percent',c:'#b8862b', val:margin+'%', lab:'Gross Margin', tr:'target 42%', trc:margin>=42?'up':'down', spark:C.spark(EXT.series('revenue').map((v,i)=>v-EXT.series('expenses')[i]),'#b8862b')},
    {ic:'layers', c:'#6366f1', val:num(inv.available), lab:'Unsold Plots', tr:inv.acres.toFixed(1)+' acres held', trc:'flat', spark:C.spark(EXT.series('bookings').map(v=>20-v),'#6366f1')},
    {ic:'wallet', c:'#ef4444', val:money(outstanding), lab:'Receivables Open', tr:pct(outstanding,book)+'% of book', trc:'down', spark:C.spark(EXT.series('revenue').map((v,i)=>v-EXT.series('collections')[i]),'#ef4444')},
    {ic:'handshake',c:'#ec4899', val:num(LEADS.filter(l=>l.stage!=='lost').length), lab:'Live Enquiries', tr:EXT.lastMonth('leads')+' added last month', trc:'up', spark:C.spark(EXT.series('leads'),'#ec4899')},
  ];

  const projectPerf = LAND_BANK.map(p=>({
    label:p.name, value:p.sold*p.rate*6, color:C.PALETTE[LAND_BANK.indexOf(p)%C.PALETTE.length] }))
    .sort((a,b)=>b.value-a.value);

  const riskRows = [
    { risk:'TDS remittance 194IA overdue',        area:'Statutory',  owner:'rahul',  impact:'HIGH', note:'1 day past due date' },
    { risk:'Encumbrance certificate refresh',     area:'Legal',      owner:'vivek',  impact:'HIGH', note:'3 days overdue — blocks 2 deeds' },
    { risk:'Marketing spend 13% over budget',     area:'Finance',    owner:'arjun',  impact:'MED',  note:'₹3.8 L over allocation' },
    { risk:'Coastal Enclave approval pending',    area:'Inventory',  owner:'faisal', impact:'MED',  note:'18 plots cannot be booked' },
    { risk:'Bank TAT slipping at LIC Housing',    area:'Finance',    owner:'priya',  impact:'LOW',  note:'18 days average sanction' },
  ];

  return `
    <div class="exec-hero">
      <div class="eh-left">
        <span class="eh-badge">${icon('crown',14)} Managing Director view</span>
        <h2>Good business health across ${LAND_BANK.length} projects</h2>
        <p>${num(inv.sold)} of ${num(inv.total)} plots sold · ${crore(revYTD)} booked this financial year · ${num(A.filter(p=>p.statusKey!=='completed').length)} files moving through the pipeline right now.</p>
        <div class="eh-stats">
          <div><b>${crore(inv.stockValue)}</b><span>Unsold stock value</span></div>
          <div><b>${pct(inv.sold,inv.total)}%</b><span>Inventory absorbed</span></div>
          <div><b>${num(APPROVALS.filter(a=>a.status==='Pending'&&a.level==='MD').length)}</b><span>Approvals waiting on you</span></div>
        </div>
      </div>
      <div class="eh-right">${C.gauge(revYTD, 60000000, {size:168,color:'#ecca6f',label:'Annual target ₹6 Cr',sub:crore(revYTD)})}</div>
    </div>

    <div class="grid kpis mt">${kpis.map(kpiCard).join('')}</div>

    <div class="grid cols-2 mt">
      ${panel('Revenue, collections & cost','Rolling 12 months (₹ lakh)',
        C.barChart(EXT.months,[
          {name:'Revenue',    values:EXT.series('revenue').map(v=>v/100000), color:'#3a4fb0'},
          {name:'Collections',values:EXT.series('collections').map(v=>v/100000), color:'#10b981'},
          {name:'Expenses',   values:EXT.series('expenses').map(v=>v/100000), color:'#ef4444'},
        ],{yFmt:v=>'₹'+Math.round(v)+'L'}))}
      ${panel('Revenue by project','Booked value contribution', C.hBars(projectPerf,{fmt:money}))}
    </div>

    <div class="grid cols-3 mt">
      ${panel('Sales funnel','Enquiry → booking conversion',
        C.funnel(EXT.leadsByStage().filter(s=>s.key!=='lost').map(s=>({label:s.label,value:s.count,color:s.color,unit:'leads'}))))}
      ${panel('Inventory position','Across all projects',
        C.donut([
          {label:'Sold', value:inv.sold, color:'#16a34a'},
          {label:'Blocked', value:inv.blocked, color:'#f59e0b'},
          {label:'Available', value:inv.available, color:'#cbd5e1'},
        ],{size:160, center:num(inv.total), centerSub:'total plots'}))}
      ${panel('Departmental velocity','Actions logged in the last 10 days',
        C.hBars(['sales','legal','finance','operations','purchase'].map(d=>({
          label:deptName(d), color:deptColor(d),
          value:state.activity.filter(a=>a.statusKey && STATUS[a.statusKey].dept===d).length })),{fmt:v=>P.plural(v,'action')}))}
    </div>

    ${sectionHead('Board risk register','What needs a decision from the leadership team',
      `<button class="btn secondary sm" data-demo="The board pack exports as a PDF.">${icon('download',15)} Board pack</button>`)}
    <div class="card pad">${tableHTML(
      [{label:'Risk / issue'},{label:'Area'},{label:'Owner'},{label:'Impact'},{label:'Detail'}],
      riskRows.map(r=>({cells:[
        `<b>${esc(r.risk)}</b>`, `<span class="chip">${esc(r.area)}</span>`,
        `<div class="flex">${av(r.owner,24)}<span class="small">${esc(USERS[r.owner].name)}</span></div>`,
        `<span class="prio ${r.impact}">${r.impact}</span>`,
        `<span class="muted small">${esc(r.note)}</span>`]})))}</div>

    ${sectionHead('Awaiting your approval','Items routed to the Managing Director')}
    <div class="card pad">${tableHTML(
      [{label:'ID'},{label:'Type'},{label:'Subject'},{label:'Raised by'},{label:'Value',align:'right'},{label:'Age'},{label:'',align:'right'}],
      APPROVALS.filter(a=>a.level==='MD').map(a=>({cells:[
        `<span class="plotno">${esc(a.id)}</span>`, `<span class="chip">${esc(a.type)}</span>`, esc(a.subject),
        `<div class="flex">${av(a.raisedBy,24)}<span class="small">${esc(USERS[a.raisedBy].name)}</span></div>`,
        a.amount?`<b>${lakh(a.amount)}</b>`:'<span class="muted">—</span>',
        `<span class="muted small">${a.age}d</span>`,
        a.status==='Pending'
          ? `<button class="btn sm" data-demo="Approval recorded and the raiser is notified.">Approve</button>`
          : tag(a.status, a.status==='Approved'?'#16a34a':'#ef4444')]})))}</div>`;
});

/* ---------------- Analytics & Insights ---------------- */
registerView('analytics', ['Analytics & Insights','Conversion, velocity, source ROI and cohort performance'], ()=>{
  const A=state.projects;
  const bySource = EXT.leadsBySource().sort((a,b)=>b.count-a.count);
  const cities = [...new Set(LAND_BANK.map(p=>p.city))];
  const heatRows = ['Sales','Legal','Finance','Operations'];
  const heatCols = EXT.months.slice(-6);
  const heatMatrix = heatRows.map((_,ri)=>heatCols.map((_,ci)=> PZ.between(PZ.seeded(ri*31+ci*7), 4, 28)));

  const conv = pct(LEADS.filter(l=>l.stage==='booked').length, LEADS.length);
  const avgTicket = Math.round(A.reduce((s,p)=>s+totalValue(p),0)/A.length);
  const cycle = Math.round(A.reduce((s,p)=>s+p.ageDays,0)/A.length);

  return `
    <div class="grid kpis">
      ${[
        {ic:'percent',c:'#3a4fb0', val:conv+'%', lab:'Lead → Booking conversion', tr:'industry avg 6%', trc:'up'},
        {ic:'wallet', c:'#b8862b', val:lakh(avgTicket), lab:'Average ticket size', tr:'+8% YoY', trc:'up'},
        {ic:'clock',  c:'#6366f1', val:cycle+' days', lab:'Avg booking → registration', tr:'target 45 days', trc:cycle<=45?'up':'down'},
        {ic:'target', c:'#10b981', val:num(EXT.ytd('siteVisits')), lab:'Site visits YTD', tr:pct(EXT.ytd('bookings'),EXT.ytd('siteVisits'))+'% converted', trc:'flat'},
        {ic:'megaphone',c:'#ec4899', val:num(EXT.ytd('leads')), lab:'Enquiries YTD', tr:EXT.growth('leads')+'% MoM', trc:EXT.growth('leads')>=0?'up':'down'},
      ].map(kpiCard).join('')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Enquiry, visit & booking funnel over time','Monthly volume',
        C.lineChart(EXT.months,[
          {name:'Enquiries',  values:EXT.series('leads'),      color:'#ec4899'},
          {name:'Site visits',values:EXT.series('siteVisits'), color:'#f59e0b'},
          {name:'Bookings',   values:EXT.series('bookings'),   color:'#16a34a'},
        ],{area:false}))}
      ${panel('Lead source performance','Volume and won deals by channel',
        C.barChart(bySource.map(s=>s.source.split(' ')[0]),[
          {name:'Leads', values:bySource.map(s=>s.count), color:'#3a4fb0'},
          {name:'Won',   values:bySource.map(s=>s.won),   color:'#16a34a'},
        ]))}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Departmental throughput heatmap','Actions completed per month',
        C.heatmap(heatRows, heatCols, heatMatrix, {color:'#3a4fb0'}))}
      ${panel('Absorption by project','Sold vs held inventory',
        C.barChart(LAND_BANK.map(p=>p.code),[
          {name:'Sold',      values:LAND_BANK.map(p=>p.sold), color:'#16a34a'},
          {name:'Blocked',   values:LAND_BANK.map(p=>p.blocked), color:'#f59e0b'},
          {name:'Available', values:LAND_BANK.map(p=>p.totalPlots-p.sold-p.blocked), color:'#cbd5e1'},
        ],{stacked:true}))}
    </div>

    ${sectionHead('Market spread','Performance by city')}
    <div class="card pad">${tableHTML(
      [{label:'City'},{label:'Projects'},{label:'Plots'},{label:'Sold'},{label:'Absorption'},{label:'Avg rate / cent',align:'right'},{label:'Held value',align:'right'}],
      cities.map(city=>{
        const set=LAND_BANK.filter(p=>p.city===city);
        const total=set.reduce((s,p)=>s+p.totalPlots,0), sold=set.reduce((s,p)=>s+p.sold,0);
        const rate=Math.round(set.reduce((s,p)=>s+p.rate,0)/set.length);
        const held=set.reduce((s,p)=>s+(p.totalPlots-p.sold)*p.rate*6,0);
        return { cells:[ `<b>${esc(city)}</b>`, num(set.length), num(total), num(sold),
          `<div style="min-width:120px">${P.progressBar(sold,total)}<span class="muted small">${pct(sold,total)}%</span></div>`,
          P.fmtINR(rate), `<b>${money(held)}</b>` ]};
      }))}</div>

    ${sectionHead('Cohort view','Bookings grouped by the month they entered the pipeline')}
    <div class="card pad">${C.barChart(EXT.months,[
      {name:'Registered', values:EXT.series('registrations'), color:'#16a34a'},
      {name:'Still in pipeline', values:EXT.series('bookings').map((v,i)=>Math.max(0,v-EXT.series('registrations')[i])), color:'#f59e0b'},
    ],{stacked:true, w:1000})}</div>`;
});
})();
