/* ============================================================
   Screens — Title & Scrutiny, Deeds & Registration, Compliance
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, deptColor, money, lakh, num, pct, fmtDate, timeAgo,
        totalValue, registerView, sectionHead, panel, tableHTML, miniStat, tag,
        progressBar, statusPill } = P;

const LEGAL_STEPS=['docs_received','scrutiny','evaluation','legal_clear','eligibility'];
const DEED_STEPS=['pre_deed','deed_final','reg_date','stamp_deed','registration'];

/* ---------------- Title & Scrutiny ---------------- */
registerView('scrutiny', ['Title & Scrutiny','Document verification, title search and valuation queue'], ()=>{
  const inScope=state.projects.filter(p=>LEGAL_STEPS.includes(p.statusKey));
  const cleared=state.projects.filter(p=>routeFor(p).indexOf(p.statusKey) > routeFor(p).indexOf('legal_clear'));
  const checks=['Original deed','Backdeed chain (30 yrs)','Land tax receipt','Possession certificate','Thandaper','Encumbrance certificate','Survey sketch','Location sketch'];

  return `
    <div class="grid cols-4">
      ${miniStat('Files in scrutiny', inScope.length, 'with the Legal team', deptColor('legal'))}
      ${miniStat('Title cleared', cleared.length, pct(cleared.length,state.projects.length)+'% of book', '#16a34a')}
      ${miniStat('Avg scrutiny time', '4.2 days', 'against a 7-day SLA', '#3a4fb0')}
      ${miniStat('Objections raised', 2, 'both resolved this month', '#b45309')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Scrutiny queue by step','Where each file is sitting',
        C.hBars(LEGAL_STEPS.map(s=>({label:STATUS[s].label,
          value:state.projects.filter(p=>p.statusKey===s).length, color:deptColor('legal')})),{fmt:v=>P.plural(v,'file')}))}
      ${panel('Turnaround against SLA','Days taken per step (target in grey)',
        C.bullet([
          {label:'Document collection', value:2.1, target:3},
          {label:'Title search',        value:3.4, target:4},
          {label:'Scrutiny report',     value:4.2, target:7},
          {label:'Valuation',           value:2.8, target:3},
          {label:'Eligibility check',   value:1.6, target:2},
        ],{fmt:v=>v+'d'}))}
    </div>

    ${sectionHead('Verification checklist','Applied to every title before clearance')}
    <div class="card pad"><div class="check-grid">
      ${checks.map((c,i)=>`<div class="check-item ${i<6?'on':'off'}">
        <span class="tick">${icon(i<6?'check':'clock',13)}</span>${esc(c)}</div>`).join('')}
    </div></div>

    ${sectionHead('Files awaiting legal action')}
    <div class="card pad">${tableHTML(
      [{label:'Plot'},{label:'Customer'},{label:'Project'},{label:'Step'},{label:'Officer'},{label:'Value',align:'right'},{label:'Waiting'}],
      inScope.map(p=>({ attr:`data-plot="${p.id}" style="cursor:pointer"`, cells:[
        `<span class="plotno">${esc(p.plot)}</span>`, `<b>${esc(p.customer)}</b>`,
        `<span class="muted small">${esc(p.location)}</span>`, statusPill(p.statusKey),
        `<div class="flex">${av(p.assigned,24)}<span class="small">${esc(USERS[p.assigned].name)}</span></div>`,
        lakh(totalValue(p)), `<span class="muted small">${timeAgo(p.updatedAt)}</span>`]})))}</div>`;
});

/* ---------------- Deeds & Registration ---------------- */
registerView('deeds', ['Deeds & Registration','Deed drafting, stamp paper and sub-registrar completion'], ()=>{
  const inDeed=state.projects.filter(p=>DEED_STEPS.includes(p.statusKey));
  const done=state.projects.filter(p=>routeFor(p).indexOf(p.statusKey)>=routeFor(p).indexOf('registration'));
  const stampDuty=inDeed.reduce((s,p)=>s+totalValue(p)*0.08,0);

  return `
    <div class="grid cols-4">
      ${miniStat('Deeds in preparation', inDeed.length, 'drafting to registration', deptColor('legal'))}
      ${miniStat('Registered', done.length, 'completed at sub-registrar', '#16a34a')}
      ${miniStat('Stamp duty payable', money(stampDuty), '8% of agreement value', '#b45309')}
      ${miniStat('Avg draft → register', '9 days', 'target 10 days', '#3a4fb0')}
    </div>

    ${panel('Deed pipeline','Files at each drafting step',
      C.funnel(DEED_STEPS.map(s=>({label:STATUS[s].label,
        value:state.projects.filter(p=>routeFor(p).indexOf(p.statusKey)>=routeFor(p).indexOf(s)).length,
        color:deptColor('legal'), unit:'files'}))), 'mt')}

    ${sectionHead('Deed register','Charges calculated at Kerala rates')}
    <div class="card pad">${tableHTML(
      [{label:'Plot'},{label:'Customer'},{label:'Stage'},{label:'Agreement',align:'right'},{label:'Stamp duty (8%)',align:'right'},{label:'Registration (2%)',align:'right'},{label:'Total payable',align:'right'},{label:'Officer'}],
      inDeed.concat(done.slice(0,4)).map(p=>{
        const v=totalValue(p), sd=v*0.08, rf=v*0.02;
        return { attr:`data-plot="${p.id}" style="cursor:pointer"`, cells:[
          `<span class="plotno">${esc(p.plot)}</span>`, `<b>${esc(p.customer)}</b>`, statusPill(p.statusKey),
          lakh(v), `<span class="muted">${lakh(sd)}</span>`, `<span class="muted">${lakh(rf)}</span>`,
          `<b>${lakh(sd+rf)}</b>`,
          `<div class="flex">${av(p.assigned,24)}<span class="small">${esc(USERS[p.assigned].name)}</span></div>`]};
      }))}</div>`;
});

/* ---------------- Compliance Tracker ---------------- */
registerView('compliance', ['Compliance Tracker','Statutory filings, licences and approval renewals'], ()=>{
  const overdue=COMPLIANCE.filter(c=>c.status==='Overdue');
  const soon=COMPLIANCE.filter(c=>c.status!=='Overdue' && (c.due-Date.now())/86400000 <= 10);
  const sevColor={HIGH:'#ef4444',MED:'#f59e0b',LOW:'#64748b'};
  const statusColor={'Overdue':'#ef4444','In review':'#3b82f6','On track':'#16a34a'};

  return `
    ${overdue.length?`<div class="attn" style="border-color:#ef4444;background:linear-gradient(90deg,#fef2f2,#fff)">
      <div style="font-size:20px">⚠️</div>
      <div class="txt" style="flex:1"><b>${overdue.length} statutory item${overdue.length>1?'s are':' is'} overdue.</b>
        <div class="muted small">${esc(overdue.map(o=>o.item).join(' · '))}</div></div>
    </div>`:''}

    <div class="grid cols-4">
      ${miniStat('Tracked obligations', COMPLIANCE.length, 'across all departments', '#3a4fb0')}
      ${miniStat('Overdue', overdue.length, 'needs action today', overdue.length?'#ef4444':'#16a34a')}
      ${miniStat('Due within 10 days', soon.length, 'plan ahead', '#f59e0b')}
      ${miniStat('Compliance score', pct(COMPLIANCE.length-overdue.length, COMPLIANCE.length)+'%', 'on-time filing rate', '#16a34a')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Obligations by severity','Weighted by business impact',
        C.donut([
          {label:'High', value:COMPLIANCE.filter(c=>c.severity==='HIGH').length, color:'#ef4444'},
          {label:'Medium', value:COMPLIANCE.filter(c=>c.severity==='MED').length, color:'#f59e0b'},
          {label:'Low', value:COMPLIANCE.filter(c=>c.severity==='LOW').length, color:'#64748b'},
        ],{size:160, center:String(COMPLIANCE.length), centerSub:'items'}))}
      ${panel('Status split','Where each obligation stands',
        C.hBars(['On track','In review','Overdue'].map(s=>({label:s,
          value:COMPLIANCE.filter(c=>c.status===s).length, color:statusColor[s]})),{fmt:v=>v+' items'}))}
    </div>

    ${sectionHead('Statutory register','Owner and due date for every obligation',
      `<button class="btn sm" data-demo="Adds a new compliance obligation.">${icon('plus',15)} Add obligation</button>`)}
    <div class="card pad">${tableHTML(
      [{label:'Obligation'},{label:'Owner'},{label:'Due date'},{label:'Severity'},{label:'Status'},{label:'',align:'right'}],
      COMPLIANCE.slice().sort((a,b)=>a.due-b.due).map(c=>({cells:[
        `<b>${esc(c.item)}</b>`,
        `<div class="flex">${av(c.owner,24)}<span class="small">${esc(USERS[c.owner].name)}</span></div>`,
        `${fmtDate(c.due)}<div class="muted small">${c.due<Date.now()?'overdue':'in '+Math.ceil((c.due-Date.now())/86400000)+' days'}</div>`,
        `<span class="prio ${c.severity}">${c.severity}</span>`,
        tag(c.status, statusColor[c.status]),
        `<button class="btn secondary sm" data-demo="Marks the filing complete and stores the acknowledgement.">Mark filed</button>`]})))}</div>`;
});
})();
