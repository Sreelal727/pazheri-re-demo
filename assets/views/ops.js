/* ============================================================
   Screens — Registration Calendar, Document Vault, Handover
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, deptColor, deptName, money, lakh, num, pct, fmtDate, fmtDay,
        timeAgo, totalValue, registerView, sectionHead, panel, tableHTML, miniStat, tag,
        progressBar, statusPill } = P;

/* ---------------- Registration Calendar ---------------- */
registerView('registry', ['Registration Calendar','Sub-registrar slots, tokens and completion'], ()=>{
  const upcoming=state.projects.filter(p=>['reg_date','stamp_deed'].includes(p.statusKey));
  const done=state.projects.filter(p=>routeFor(p).indexOf(p.statusKey)>=routeFor(p).indexOf('registration'));
  const rng=PZ.seeded(7788);
  const slots=upcoming.map((p,i)=>({
    p, date:PZ.daysFromNow(PZ.between(rng,1,18)),
    time:PZ.pick(rng,['10:00 AM','11:30 AM','01:00 PM','02:30 PM']),
    office:PZ.pick(rng,['SRO Palakkad','SRO Thrissur','SRO Kozhikode','SRO Kannur','SRO Ernakulam']),
  })).sort((a,b)=>a.date-b.date);

  const days=Array.from({length:14},(_,i)=>PZ.daysFromNow(i));

  return `
    <div class="grid cols-4">
      ${miniStat('Scheduled registrations', slots.length, 'next 3 weeks', '#3b82f6')}
      ${miniStat('Completed this year', done.length, 'deeds registered', '#16a34a')}
      ${miniStat('Registration value', money(slots.reduce((s,x)=>s+totalValue(x.p),0)), 'in the scheduled queue', '#b8862b')}
      ${miniStat('Avg slot lead time', '11 days', 'from date-fixing to registry', '#6366f1')}
    </div>

    ${sectionHead('Next 14 days','Registrar appointments by day')}
    <div class="card pad"><div class="cal-strip">
      ${days.map(d=>{
        const items=slots.filter(s=>s.date.toDateString()===d.toDateString());
        return `<div class="cal-day ${items.length?'has':''}">
          <span class="cd-dow">${d.toLocaleDateString('en-IN',{weekday:'short'})}</span>
          <b class="cd-num">${d.getDate()}</b>
          <span class="cd-mon">${d.toLocaleDateString('en-IN',{month:'short'})}</span>
          ${items.length?`<span class="cd-count">${items.length}</span>`:'<span class="cd-empty">—</span>'}
        </div>`;
      }).join('')}
    </div></div>

    ${sectionHead('Scheduled appointments','Confirm the customer 48 hours before',
      `<button class="btn sm" data-demo="Books a new sub-registrar slot.">${icon('calendar',15)} Book slot</button>`)}
    <div class="card pad">${tableHTML(
      [{label:'Date'},{label:'Time'},{label:'Sub-registrar office'},{label:'Plot'},{label:'Customer'},{label:'Value',align:'right'},{label:'Stage'},{label:'Coordinator'}],
      slots.map(s=>({ attr:`data-plot="${s.p.id}" style="cursor:pointer"`, cells:[
        `<b>${fmtDate(s.date)}</b>`, esc(s.time), `<span class="chip">${esc(s.office)}</span>`,
        `<span class="plotno">${esc(s.p.plot)}</span>`, esc(s.p.customer), lakh(totalValue(s.p)),
        statusPill(s.p.statusKey),
        `<div class="flex">${av('sajith',24)}<span class="small">${esc(USERS.sajith.name)}</span></div>`]})))}</div>

    ${sectionHead('Registration throughput','Deeds registered per month')}
    <div class="card pad">${C.barChart(EXT.months,[{name:'Registrations', values:EXT.series('registrations'), color:'#3b82f6'}],{w:1000})}</div>`;
});

/* ---------------- Document Vault ---------------- */
registerView('vault', ['Document Vault','Every scanned document across every file'], ()=>{
  const all=state.projects.flatMap(p=>p.files.map(f=>({...f, project:p})));
  const byType={};
  all.forEach(f=>{ byType[f.label]=(byType[f.label]||0)+1; });
  const typeRows=Object.keys(byType).map(k=>({label:k, value:byType[k]})).sort((a,b)=>b.value-a.value).slice(0,10);
  const expected=state.projects.reduce((s,p)=>s+PZDocs.catalog(p).length,0);

  return `
    <div class="grid cols-4">
      ${miniStat('Documents on file', num(all.length), 'across '+state.projects.length+' plots', '#3a4fb0')}
      ${miniStat('Completeness', pct(all.length,expected)+'%', all.length+' of '+expected+' expected', '#16a34a')}
      ${miniStat('Uploaded this week', num(all.filter(f=>(Date.now()-new Date(f.ts))<7*86400000).length), 'new scans', '#f59e0b')}
      ${miniStat('Files pending', num(expected-all.length), 'still to be collected', '#ef4444')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Most-held document types','Count across all customer files', C.hBars(typeRows,{fmt:v=>P.plural(v,'file')}))}
      ${panel('Document completeness by plot','Collected vs expected',
        C.hBars(state.projects.slice(0,10).map(p=>({label:'Plot '+p.plot,
          value:pct(p.files.length, PZDocs.catalog(p).length), color:'#10b981'})),{fmt:v=>v+'%'}))}
    </div>

    ${sectionHead('Recent uploads','Newest scans first — click to open the file',
      `<button class="btn secondary sm" data-demo="Bulk downloads the selected documents as a ZIP.">${icon('download',15)} Bulk export</button>`)}
    <div class="card pad">${tableHTML(
      [{label:'Document'},{label:'Plot / Customer'},{label:'Uploaded by'},{label:'When'},{label:'Type'},{label:'',align:'right'}],
      all.sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,25).map(f=>({cells:[
        `<div class="flex"><span class="doc-mini">${icon('file',14)}</span><b>${esc(f.label)}</b></div>`,
        `<span class="plotno">${esc(f.project.plot)}</span> · ${esc(f.project.customer)}`,
        `<div class="flex">${av(f.by,24)}<span class="small">${esc(USERS[f.by].name)}</span></div>`,
        `<span class="muted small">${timeAgo(new Date(f.ts))}</span>`,
        `<span class="chip">${esc((f.fileName.split('.').pop()||'pdf').toUpperCase())}</span>`,
        `<button class="btn secondary sm" data-view-doc="${f.project.id}:${f.key}">${icon('eye',14)} View</button>`]})))}</div>`;
});

/* ---------------- Handover Tracker ---------------- */
registerView('handover', ['Handover Tracker','Land tax, possession filing and document handover'], ()=>{
  const inHandover=state.projects.filter(p=>['land_tax','handover'].includes(p.statusKey));
  const complete=state.projects.filter(p=>p.statusKey==='completed');
  const steps=['registration','land_tax','handover','completed'];

  return `
    <div class="grid cols-4">
      ${miniStat('In handover', inHandover.length, 'post-registration formalities', deptColor('operations'))}
      ${miniStat('Fully closed', complete.length, 'documents handed over & filed', '#16a34a')}
      ${miniStat('Avg closure time', '6 days', 'registration → handover', '#3a4fb0')}
      ${miniStat('Pending signatures', inHandover.filter(p=>p.statusKey==='handover').length, 'receipt form awaiting customer', '#f59e0b')}
    </div>

    ${panel('Post-registration flow','Files reaching each closing step',
      C.funnel(steps.map(s=>({label:STATUS[s].label,
        value:state.projects.filter(p=>routeFor(p).indexOf(p.statusKey)>=routeFor(p).indexOf(s)).length,
        color:deptColor('operations'), unit:'files'}))), 'mt')}

    ${sectionHead('Closing checklist per file')}
    <div class="card pad">${tableHTML(
      [{label:'Plot'},{label:'Customer'},{label:'Registered'},{label:'Land tax'},{label:'Possession'},{label:'Handover'},{label:'Coordinator'},{label:'Status'}],
      inHandover.concat(complete).map(p=>{
        const idx=routeFor(p).indexOf(p.statusKey);
        const at=k=>idx>=routeFor(p).indexOf(k);
        const mark=ok=>ok?`<span class="tickmark on">${icon('check',12)}</span>`:`<span class="tickmark off">${icon('clock',12)}</span>`;
        return { attr:`data-plot="${p.id}" style="cursor:pointer"`, cells:[
          `<span class="plotno">${esc(p.plot)}</span>`, `<b>${esc(p.customer)}</b>`,
          mark(at('registration')), mark(at('land_tax')), mark(at('land_tax')), mark(at('handover')),
          `<div class="flex">${av(p.assigned,24)}<span class="small">${esc(USERS[p.assigned].name)}</span></div>`,
          statusPill(p.statusKey)]};
      }))}</div>`;
});
})();
