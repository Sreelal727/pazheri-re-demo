/* ============================================================
   Screens — Land Bank, Projects & Phases, Land Acquisition
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, money, lakh, crore, num, pct, fmtINR, fmtDate,
        registerView, sectionHead, panel, tableHTML, miniStat, tag, progressBar } = P;

const available = p => p.totalPlots - p.sold - p.blocked;
const STATUS_COLOR = { 'Selling':'#16a34a', 'Launch':'#3b82f6', 'Pre-launch':'#f59e0b' };

/* ---------------- Land Bank ---------------- */
registerView('landbank', ['Land Bank','Every acre held, sold and available across Kerala'], ()=>{
  const inv=EXT.inventoryTotals();
  const heldValue=LAND_BANK.reduce((s,p)=>s+available(p)*p.rate*6,0);

  return `
    <div class="grid cols-4">
      ${miniStat('Land held', inv.acres.toFixed(1)+' acres', LAND_BANK.length+' projects', '#3a4fb0')}
      ${miniStat('Plots available', num(inv.available), 'ready to sell', '#16a34a')}
      ${miniStat('Blocked / on hold', num(inv.blocked), 'token paid, not registered', '#f59e0b')}
      ${miniStat('Unsold stock value', crore(heldValue), 'at current rate card', '#b8862b')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Inventory absorption by project','Sold / blocked / available',
        C.barChart(LAND_BANK.map(p=>p.code),[
          {name:'Sold',      values:LAND_BANK.map(p=>p.sold), color:'#16a34a'},
          {name:'Blocked',   values:LAND_BANK.map(p=>p.blocked), color:'#f59e0b'},
          {name:'Available', values:LAND_BANK.map(p=>available(p)), color:'#cbd5e1'},
        ],{stacked:true}))}
      ${panel('Held value by project','Unsold stock at current rates',
        C.hBars(LAND_BANK.map((p,i)=>({label:p.name, value:available(p)*p.rate*6, color:C.PALETTE[i%C.PALETTE.length]}))
          .sort((a,b)=>b.value-a.value),{fmt:money}))}
    </div>

    ${sectionHead('Project inventory register','Rate card and absorption per layout',
      `<button class="btn sm" data-demo="Opens the new project setup wizard.">${icon('plus',15)} Add project</button>`)}
    <div class="grid cols-2">
      ${LAND_BANK.map((p,i)=>`
        <div class="card land-card">
          <div class="lc-head" style="background:linear-gradient(135deg,${C.PALETTE[i%C.PALETTE.length]},${C.PALETTE[i%C.PALETTE.length]}bb)">
            <div class="lc-code">${esc(p.code)}</div>
            <div class="lc-name"><b>${esc(p.name)}</b><span>${icon('pin',12)} ${esc(p.city)}</span></div>
            ${tag(p.status, '#fff', 'rgba(255,255,255,.22)')}
          </div>
          <div class="lc-body">
            <div class="lc-stats">
              <div><span>Total plots</span><b>${p.totalPlots}</b></div>
              <div><span>Sold</span><b style="color:#16a34a">${p.sold}</b></div>
              <div><span>Blocked</span><b style="color:#b45309">${p.blocked}</b></div>
              <div><span>Available</span><b>${available(p)}</b></div>
            </div>
            <div class="row-between small mt-s"><span class="muted">Absorption</span><b>${pct(p.sold,p.totalPlots)}%</b></div>
            ${progressBar(p.sold,p.totalPlots,'#16a34a')}
            <div class="lc-foot">
              <span class="chip">${p.acres} acres</span>
              <span class="chip">${fmtINR(p.rate)}/cent</span>
              <span class="chip">Acquired ${esc(p.acquired)}</span>
            </div>
            <div class="muted small mt-s">${icon('shield',12)} ${esc(p.approval)}</div>
          </div>
        </div>`).join('')}
    </div>`;
});

/* ---------------- Projects & Phases ---------------- */
registerView('projects', ['Projects & Phases','Development status, approvals and plot numbering'], ()=>{
  const phases = LAND_BANK.flatMap(p=>{
    const n = p.totalPlots>40?3:p.totalPlots>25?2:1;
    return Array.from({length:n},(_,i)=>({
      project:p, phase:'Phase '+(i+1),
      plots: Math.round(p.totalPlots/n),
      sold: Math.round(p.sold/n),
      work: ['Completed','In progress','Planned'][Math.min(i, 2)],
    }));
  });
  const workColor={'Completed':'#16a34a','In progress':'#3b82f6','Planned':'#94a3b8'};

  return `
    <div class="grid cols-4">
      ${miniStat('Active projects', LAND_BANK.filter(p=>p.status==='Selling').length, 'open for booking', '#16a34a')}
      ${miniStat('Under launch', LAND_BANK.filter(p=>p.status!=='Selling').length, 'launch & pre-launch', '#3b82f6')}
      ${miniStat('Phases tracked', phases.length, 'across all layouts', '#6366f1')}
      ${miniStat('RERA registered', LAND_BANK.filter(p=>p.approval.startsWith('RERA')).length+'/'+LAND_BANK.length, 'approvals on file', '#b8862b')}
    </div>

    ${sectionHead('Development phases','Site work status per phase')}
    <div class="card pad">${tableHTML(
      [{label:'Project'},{label:'City'},{label:'Phase'},{label:'Plots'},{label:'Sold'},{label:'Absorption'},{label:'Site work'},{label:'Approval'}],
      phases.map(ph=>({cells:[
        `<b>${esc(ph.project.name)}</b>`, `<span class="muted small">${esc(ph.project.city)}</span>`,
        `<span class="chip">${esc(ph.phase)}</span>`, num(ph.plots), num(ph.sold),
        `<div style="min-width:110px">${progressBar(ph.sold,ph.plots,'#16a34a')}<span class="muted small">${pct(ph.sold,ph.plots)}%</span></div>`,
        tag(ph.work, workColor[ph.work]),
        `<span class="muted small">${esc(ph.project.approval)}</span>`]})))}</div>

    ${sectionHead('Rate card','Current selling rate per cent by project')}
    <div class="card pad">${C.hBars(LAND_BANK.map((p,i)=>({label:p.name+' · '+p.city, value:p.rate, color:C.PALETTE[i%C.PALETTE.length]})),{fmt:fmtINR})}</div>`;
});

/* ---------------- Land Acquisition ---------------- */
registerView('acquisition', ['Land Acquisition','Sourcing pipeline run by the Purchase team'], ()=>{
  const stages=['Sourcing','Negotiation','Title Search','Legal Due Diligence','Advance Paid','Registration Scheduled'];
  const stageColor={'Sourcing':'#94a3b8','Negotiation':'#f59e0b','Title Search':'#6366f1',
    'Legal Due Diligence':'#8b5cf6','Advance Paid':'#3b82f6','Registration Scheduled':'#16a34a'};
  const committed=ACQUISITIONS.reduce((s,a)=>s+a.offer,0);
  const acres=ACQUISITIONS.reduce((s,a)=>s+a.acres,0);
  const saving=ACQUISITIONS.reduce((s,a)=>s+(a.ask-a.offer),0);

  return `
    <div class="grid cols-4">
      ${miniStat('Deals in pipeline', ACQUISITIONS.length, acres.toFixed(1)+' acres under discussion', '#f59e0b')}
      ${miniStat('Committed value', crore(committed), 'at offered price', '#3a4fb0')}
      ${miniStat('Negotiated saving', money(saving), pct(saving, ACQUISITIONS.reduce((s,a)=>s+a.ask,0))+'% off asking', '#16a34a')}
      ${miniStat('Closing this month', ACQUISITIONS.filter(a=>a.stage==='Registration Scheduled'||a.stage==='Advance Paid').length, 'advance paid or scheduled', '#6366f1')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Acquisition funnel','Deals by stage',
        C.funnel(stages.map(s=>({label:s, value:ACQUISITIONS.filter(a=>a.stage===s).length||0, color:stageColor[s], unit:'deals'}))))}
      ${panel('Ask vs our offer','Per parcel (₹ lakh)',
        C.barChart(ACQUISITIONS.map(a=>a.id),[
          {name:'Asking price', values:ACQUISITIONS.map(a=>a.ask/100000), color:'#cbd5e1'},
          {name:'Our offer',    values:ACQUISITIONS.map(a=>a.offer/100000), color:'#f59e0b'},
        ],{yFmt:v=>'₹'+Math.round(v)+'L'}))}
    </div>

    ${sectionHead('Acquisition register','Every parcel being sourced',
      `<button class="btn sm" data-demo="Opens the land sourcing entry form.">${icon('plus',15)} Log parcel</button>`)}
    <div class="card pad">${tableHTML(
      [{label:'ID'},{label:'Parcel'},{label:'Owner'},{label:'Extent'},{label:'Asking',align:'right'},{label:'Our offer',align:'right'},{label:'Stage'},{label:'Scout'},{label:'Next milestone'}],
      ACQUISITIONS.map(a=>({cells:[
        `<span class="plotno">${esc(a.id)}</span>`,
        `<b>${esc(a.land)}</b><div class="muted small">${esc(a.city)}</div>`, esc(a.owner),
        a.acres+' acres', `<span class="muted">${money(a.ask)}</span>`, `<b>${money(a.offer)}</b>`,
        tag(a.stage, stageColor[a.stage]),
        `<div class="flex">${av(a.scout,24)}<span class="small">${esc(USERS[a.scout].name)}</span></div>`,
        `<span class="muted small">${fmtDate(a.due)}</span>`]})))}</div>`;
});
})();
