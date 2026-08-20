/* ============================================================
   Screens — Leads, Sales Pipeline, Site Visits, Customer 360
   Leads / Pipeline / Customers share one collection renderer
   with three interchangeable layouts: tiles, board and list.
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, deptColor, money, lakh, num, pct, fmtDate, fmtDay, timeAgo,
        totalValue, paidValue, dueValue, registerView, sectionHead, panel, kpiCard,
        tableHTML, miniStat, tag, progressBar, statusPill, modeSwitch } = P;

const stageMeta = k => LEAD_STAGES.find(s=>s.key===k) || LEAD_STAGES[0];
const tempOf    = s => s>=75 ? {label:'Hot', color:'#ef4444'} : s>=45 ? {label:'Warm', color:'#f59e0b'} : {label:'Cold', color:'#64748b'};
const scoreTag  = s => { const t=tempOf(s); return tag(t.label, t.color); };
const stageValue = key => LEADS.filter(l=>l.stage===key).reduce((a,l)=>a+l.budget,0);

/* ---------- Lead tile: the full card used by tile mode ---------- */
function leadTile(l){
  const sm=stageMeta(l.stage), t=tempOf(l.score);
  return `<div class="card lead-tile">
    <div class="lt-band" style="background:linear-gradient(135deg,${sm.color},${sm.color}bb)">
      <span class="lt-stage">${esc(sm.label)}</span>
      <span class="lt-temp"><i style="background:${t.color}"></i>${esc(t.label)}</span>
    </div>
    <div class="lt-body">
      <div class="lt-name">${esc(l.name)}</div>
      <div class="lt-sub">${icon('phone',12)} ${esc(l.phone)}</div>
      <div class="lt-sub">${icon('pin',12)} ${esc(l.project)}</div>

      <div class="lt-score">
        <div class="row-between small"><span class="muted">Lead score</span><b style="color:${t.color}">${l.score}</b></div>
        <div class="bar mt-s"><i style="width:${l.score}%;background:linear-gradient(90deg,${t.color}99,${t.color})"></i></div>
      </div>

      <div class="lt-facts">
        <div><span>Budget</span><b>${lakh(l.budget)}</b></div>
        <div><span>Source</span><b>${esc(l.source)}</b></div>
        <div><span>Age</span><b>${l.ageDays}d</b></div>
      </div>

      <div class="lt-foot">
        <div class="flex">${av(l.owner,26)}<div class="stack"><small>Owner</small><span class="b small">${esc(USERS[l.owner].name)}</span></div></div>
        <span class="lt-next" title="Next action">${icon('bolt',12)} ${esc(l.nextAction)}</span>
      </div>
    </div>
  </div>`;
}

/* ---------- Compact card used inside board columns ---------- */
function leadMiniCard(l){
  return `<div class="kcard">
    <div class="kc-top"><b class="small">${esc(l.name)}</b>${scoreTag(l.score)}</div>
    <div class="muted small" style="margin-top:4px">${esc(l.project)}</div>
    <div class="flex wrap" style="margin-top:9px"><span class="chip">${lakh(l.budget)}</span><span class="chip">${esc(l.source)}</span></div>
    <div class="row-between" style="margin-top:10px">
      <div class="flex">${av(l.owner,24)}<span class="small">${esc(USERS[l.owner].name.split(' ')[0])}</span></div>
      <span class="muted small">${l.ageDays}d</span>
    </div>
  </div>`;
}

/* ---------- The three layouts ---------- */
function leadsTiles(list){
  if(!list.length) return `<div class="empty card pad">No enquiries match your filter.</div>`;
  return `<div class="grid lead-grid">${list.map(leadTile).join('')}</div>`;
}
function leadsBoard(list){
  /* Only render columns that the current filter can still populate */
  const cols = LEAD_STAGES.filter(s=> list.some(l=>l.stage===s.key) || list.length===LEADS.length);
  if(!cols.length) return `<div class="empty card pad">No enquiries match your filter.</div>`;
  return `<div class="kan">${cols.map(s=>{
    const items=list.filter(l=>l.stage===s.key);
    return `<div class="kcol">
      <h4><span style="width:9px;height:9px;border-radius:50%;background:${s.color}"></span>${esc(s.label)}<span class="count">${items.length}</span></h4>
      <div class="kcol-sub">${money(items.reduce((a,l)=>a+l.budget,0))}</div>
      ${items.map(leadMiniCard).join('') || `<div class="kempty">No leads here</div>`}
    </div>`;
  }).join('')}</div>`;
}
function leadsList(list){
  return `<div class="card pad">${tableHTML(
    [{label:'Lead'},{label:'Source'},{label:'Interested in'},{label:'Budget',align:'right'},{label:'Score'},
     {label:'Stage'},{label:'Owner'},{label:'Next action'},{label:'Age'}],
    list.map(l=>{ const sm=stageMeta(l.stage); return { cells:[
      `<b>${esc(l.name)}</b><div class="muted small">${esc(l.phone)}</div>`,
      `<span class="chip">${esc(l.source)}</span>`, `<span class="muted small">${esc(l.project)}</span>`,
      lakh(l.budget),
      `<div class="flex" style="gap:6px"><b>${l.score}</b>${scoreTag(l.score)}</div>`,
      tag(sm.label, sm.color),
      `<div class="flex">${av(l.owner,24)}<span class="small">${esc(USERS[l.owner].name.split(' ')[0])}</span></div>`,
      `<span class="muted small">${esc(l.nextAction)}</span>`,
      `<span class="muted small">${l.ageDays}d</span>` ]}; }))}</div>`;
}
const LAYOUTS = { tiles:leadsTiles, board:leadsBoard, list:leadsList };
const renderLeads = (list, modeKey) => (LAYOUTS[state[modeKey]] || leadsTiles)(list);

/* ---------------- Leads & Enquiries ---------------- */
registerView('leads', ['Leads & Enquiries','Every enquiry from first touch to booking'], ()=>{
  const f=state.filter;
  const list = LEADS.filter(l=> !f.leadStage || f.leadStage==='all' || l.stage===f.leadStage);
  const hot = LEADS.filter(l=>l.score>=75 && l.stage!=='booked' && l.stage!=='lost');
  const won = LEADS.filter(l=>l.stage==='booked').length;

  return `
    <div class="grid cols-4">
      ${miniStat('Open enquiries', LEADS.filter(l=>l.stage!=='booked'&&l.stage!=='lost').length, 'across all projects', '#ec4899')}
      ${miniStat('Hot leads', hot.length, 'score 75+ · call today', '#ef4444')}
      ${miniStat('Booked this cycle', won, pct(won,LEADS.length)+'% conversion', '#16a34a')}
      ${miniStat('Pipeline value', money(LEADS.filter(l=>l.stage!=='lost').reduce((s,l)=>s+l.budget,0)), 'stated customer budgets', '#b8862b')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Leads by stage','Current distribution',
        C.hBars(EXT.leadsByStage().map(s=>({label:s.label,value:s.count,color:s.color})),{fmt:v=>P.plural(v,'lead')}))}
      ${panel('Where enquiries come from','Channel volume this year',
        C.donut(EXT.leadsBySource().filter(s=>s.count).map(s=>({label:s.source,value:s.count})),
          {size:165, center:num(LEADS.length), centerSub:'enquiries'}))}
    </div>

    <div class="toolbar mt">
      ${modeSwitch('leadsView',['tiles','board','list'])}
      <select class="selectlike" data-filter="leadStage">
        <option value="all">All stages</option>
        ${LEAD_STAGES.map(s=>`<option value="${s.key}" ${f.leadStage===s.key?'selected':''}>${esc(s.label)}</option>`).join('')}
      </select>
      <span class="chip">${list.length} ${list.length===1?'enquiry':'enquiries'}</span>
      <div style="flex:1"></div>
      <button class="btn secondary sm" data-demo="Bulk assigns leads to executives.">${icon('users',15)} Assign</button>
      <button class="btn sm" data-demo="Opens the enquiry capture form.">${icon('plus',15)} New Enquiry</button>
    </div>
    ${renderLeads(list,'leadsView')}`;
});

/* ---------------- Sales Pipeline ---------------- */
registerView('pipeline', ['Sales Pipeline','Enquiry to booking, as a working board'], ()=>{
  const cols = LEAD_STAGES.filter(s=>s.key!=='lost');
  const open = LEADS.filter(l=>l.stage!=='lost');

  return `
    <div class="grid cols-4">
      ${miniStat('Weighted pipeline', money(LEADS.filter(l=>l.stage!=='lost'&&l.stage!=='booked').reduce((s,l)=>s+l.budget*(l.score/100),0)), 'budget × lead score', '#3a4fb0')}
      ${miniStat('In negotiation', LEADS.filter(l=>l.stage==='negotiation').length, money(stageValue('negotiation'))+' at stake', '#ec4899')}
      ${miniStat('Lost this cycle', LEADS.filter(l=>l.stage==='lost').length, 'price & location the top reasons', '#ef4444')}
      ${miniStat('Avg lead age', Math.round(LEADS.reduce((s,l)=>s+l.ageDays,0)/LEADS.length)+' days', 'first touch to today', '#6366f1')}
    </div>

    ${panel('Conversion funnel','Drop-off at each step',
      C.funnel(cols.map(s=>({label:s.label, value:LEADS.filter(l=>l.stage===s.key).length, color:s.color, unit:'leads'}))), 'mt')}

    ${sectionHead('Pipeline board','Every enquiry grouped by the stage it is sitting at',
      modeSwitch('pipelineView',['board','tiles','list']))}
    ${renderLeads(open,'pipelineView')}`;
});

/* ---------------- Site Visits ---------------- */
registerView('visits', ['Site Visits','Scheduled visits, hosts and outcomes'], ()=>{
  const upcoming=SITE_VISITS.filter(v=>v.status==='Scheduled').sort((a,b)=>a.date-b.date);
  const past=SITE_VISITS.filter(v=>v.status!=='Scheduled').sort((a,b)=>b.date-a.date);
  const noShow=past.filter(v=>v.status==='No-show').length;

  return `
    <div class="grid cols-4">
      ${miniStat('Scheduled', upcoming.length, 'next 10 days', '#f59e0b')}
      ${miniStat('Completed', past.filter(v=>v.status==='Completed').length, 'this fortnight', '#16a34a')}
      ${miniStat('No-shows', noShow, pct(noShow,past.length)+'% of visits', noShow?'#ef4444':'#16a34a')}
      ${miniStat('Visit → booking', pct(EXT.ytd('bookings'),EXT.ytd('siteVisits'))+'%', 'conversion rate', '#3a4fb0')}
    </div>

    ${panel('Site visit volume','Monthly, against bookings closed',
      C.lineChart(EXT.months,[
        {name:'Site visits', values:EXT.series('siteVisits'), color:'#f59e0b'},
        {name:'Bookings',    values:EXT.series('bookings'),   color:'#16a34a'},
      ],{w:1000}), 'mt')}

    ${sectionHead('Upcoming visits','Confirm transport and host the day before',
      `<button class="btn sm" data-demo="Opens the visit scheduler.">${icon('plus',15)} Schedule visit</button>`)}
    <div class="grid cols-3">
      ${upcoming.map(v=>`<div class="card visit-card">
        <div class="vc-date"><b>${fmtDay(v.date)}</b><span>${esc(v.slot)}</span></div>
        <div class="vc-body">
          <div class="nm">${esc(v.lead)}</div>
          <div class="muted small">${icon('pin',12)} ${esc(v.project)}</div>
          <div class="flex wrap" style="margin-top:10px"><span class="chip">${esc(v.vehicle)}</span></div>
          <div class="row-between" style="margin-top:12px">
            <div class="flex">${av(v.host,26)}<span class="small b">${esc(USERS[v.host].name)}</span></div>
            ${tag('Scheduled','#f59e0b')}
          </div>
        </div>
      </div>`).join('') || `<div class="empty card pad">No visits scheduled.</div>`}
    </div>

    ${sectionHead('Visit history')}
    <div class="card pad">${tableHTML(
      [{label:'Date'},{label:'Visitor'},{label:'Project'},{label:'Host'},{label:'Transport'},{label:'Outcome'}],
      past.map(v=>({cells:[
        `${fmtDate(v.date)}<div class="muted small">${esc(v.slot)}</div>`, `<b>${esc(v.lead)}</b>`,
        `<span class="muted small">${esc(v.project)}</span>`,
        `<div class="flex">${av(v.host,24)}<span class="small">${esc(USERS[v.host].name)}</span></div>`,
        `<span class="chip">${esc(v.vehicle)}</span>`,
        tag(v.status, v.status==='Completed'?'#16a34a':'#ef4444')]})))}</div>`;
});

/* ---------------- Customer 360 ---------------- */
function customerTile(p){
  const docsDone=p.files.length, docsTotal=PZDocs.catalog(p).length;
  return `<div class="card cust-card" data-plot="${p.id}">
    <div class="cc-head">
      <div class="cc-ava" style="background:${deptColor(deptOfStatus(p.statusKey))}">${esc(p.customer.split(' ').map(w=>w[0]).join('').slice(0,2))}</div>
      <div class="cc-id"><b>${esc(p.customer)}</b><span class="muted small">${esc(p.phone)}</span></div>
      <span class="pay ${p.payment}">${p.payment}</span>
    </div>
    <div class="cc-grid">
      <div><span>Plot</span><b>${esc(p.plot)}</b></div>
      <div><span>Project</span><b class="small">${esc(p.location.split(',')[0])}</b></div>
      <div><span>Value</span><b>${lakh(totalValue(p))}</b></div>
      <div><span>Balance</span><b style="color:${dueValue(p)?'#b91c1c':'#16a34a'}">${dueValue(p)?lakh(dueValue(p)):'Nil'}</b></div>
    </div>
    <div class="cc-foot">
      <div style="flex:1">
        <div class="row-between small"><span class="muted">Documents</span><span class="b">${docsDone}/${docsTotal}</span></div>
        ${progressBar(docsDone,docsTotal,'#3a4fb0')}
      </div>
      <div style="flex:1">
        <div class="row-between small"><span class="muted">Process</span><span class="b">${progressPct(p)}%</span></div>
        ${progressBar(progressPct(p),100,'#16a34a')}
      </div>
    </div>
  </div>`;
}
registerView('customers', ['Customer 360','Every buyer with their plot, money and document position'], ()=>{
  const A=state.projects, f=state.filter;
  const list=A.filter(p=> !f.q || p.customer.toLowerCase().includes(f.q.toLowerCase()));

  const body = state.customersView==='list'
    ? `<div class="card pad">${tableHTML(
        [{label:'Customer'},{label:'Plot'},{label:'Project'},{label:'Route'},{label:'Stage'},
         {label:'Value',align:'right'},{label:'Balance',align:'right'},{label:'Documents'},{label:'Process'}],
        list.map(p=>({ attr:`data-plot="${p.id}" style="cursor:pointer"`, cells:[
          `<b>${esc(p.customer)}</b><div class="muted small">${esc(p.phone)}</div>`,
          `<span class="plotno">${esc(p.plot)}</span>`, `<span class="muted small">${esc(p.location)}</span>`,
          `<span class="pay ${p.payment}">${p.payment}</span>`, statusPill(p.statusKey),
          lakh(totalValue(p)),
          dueValue(p)?`<b style="color:#b91c1c">${lakh(dueValue(p))}</b>`:`<span style="color:#16a34a;font-weight:700">Nil</span>`,
          `<span class="muted small">${p.files.length}/${PZDocs.catalog(p).length}</span>`,
          `<div style="min-width:110px">${progressBar(progressPct(p),100,'#16a34a')}<span class="muted small">${progressPct(p)}%</span></div>`]})))}</div>`
    : `<div class="grid cols-3">${list.map(customerTile).join('') || '<div class="empty card pad">No customers match your search.</div>'}</div>`;

  return `
    <div class="grid cols-4">
      ${miniStat('Total customers', A.length, 'across '+new Set(A.map(p=>p.location)).size+' projects', '#3a4fb0')}
      ${miniStat('Loan customers', A.filter(p=>p.payment==='Loan').length, pct(A.filter(p=>p.payment==='Loan').length,A.length)+'% of book', '#6d28d9')}
      ${miniStat('Fully paid', A.filter(p=>dueValue(p)===0).length, 'no balance outstanding', '#16a34a')}
      ${miniStat('Avg holding', Math.round(A.reduce((s,p)=>s+p.area,0)/A.length)+' cents', 'per customer', '#b8862b')}
    </div>

    ${sectionHead('Customer register', list.length+' customers · click to open the full file',
      `<div class="flex">${modeSwitch('customersView',['tiles','list'])}
        <button class="btn secondary sm" data-demo="Exports the customer master.">${icon('download',15)} Export</button></div>`)}
    ${body}`;
});
})();
