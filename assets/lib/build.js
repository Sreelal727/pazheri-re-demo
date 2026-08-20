/* ============================================================
   Pazheri ERP — Derives timelines, audit feed & notifications
   from the seed projects. Runs once at boot.
   ============================================================ */
(function(){
'use strict';
const { state, fmtINR, deptName } = window.PZ;

function seedNote(key,p){
  if(key==='token') return `Token ${fmtINR(PZ.tokenValue(p))} collected · ${p.area} cents @ ${fmtINR(p.rate)}/cent`;
  if(key==='scrutiny') return 'Scrutiny report prepared — title clear, no encumbrance.';
  if(key==='eligibility') return `${p.employment} profile verified — eligible for loan.`;
  if(key==='sanction') return 'Sanction letter received from bank and shared with customer.';
  if(key==='evaluation') return 'Valuation completed by empanelled valuator.';
  if(key==='registration') return 'Registration completed at Sub-Registrar office.';
  return '';
}

function buildData(){
  const now=Date.now();
  state.projects = SEED_PROJECTS.map(seed=>{
    const p={...seed};
    const route=routeFor(p);
    const ci=route.indexOf(p.statusKey);
    const createdAt = now - p.ageDays*86400000;
    p.createdAt = new Date(createdAt);
    const idNum = parseInt(p.id.slice(1),10) || 1;
    const recencyMs = (1 + (idNum*17)%95) * 3600000;
    const endTs = now - recencyMs;
    p.timeline=[];
    for(let i=0;i<=ci;i++){
      const key=route[i];
      const dept=STATUS[key].dept;
      const members=DEPARTMENTS[dept].members;
      const actor = (i===ci) ? p.assigned : members[i % members.length];
      const t = createdAt + Math.round((endTs-createdAt) * (ci===0?1:i/ci));
      p.timeline.push({ ts:new Date(t), actorKey:actor, statusKey:key, note: seedNote(key,p) });
    }
    p.updatedAt = p.timeline.length ? p.timeline[p.timeline.length-1].ts : p.createdAt;

    /* Pre-seed "scanned" documents for every completed stage */
    p.files=[];
    const rte=routeFor(p), pi=rte.indexOf(p.statusKey);
    PZDocs.catalog(p).forEach(d=>{
      const si=rte.indexOf(d.stage);
      if(si>=0 && si<=pi){
        const tl=p.timeline.find(e=>e.statusKey===d.stage);
        p.files.push({ key:d.key, label:d.label, fileName:d.label.replace(/[^a-z0-9]+/gi,'_')+'.pdf',
          mime:'image/svg+xml', dataUrl:PZDocs.sample(d.label,p),
          by: tl?tl.actorKey:p.assigned, ts:(tl?tl.ts:p.createdAt), sample:true });
      }
    });
    return p;
  });

  state.activity=[];
  state.projects.forEach(p=>p.timeline.forEach(e=>{
    state.activity.push({ ts:e.ts, actorKey:e.actorKey, projectId:p.id, statusKey:e.statusKey });
  }));
  state.activity.sort((a,b)=>b.ts-a.ts);

  state.notifications=[
    { id:'n1', ts:new Date(now-3*3600000),  dept:'finance', projectId:'P1', statusKey:'bank_verify',
      title:'Action needed — Bank Verification', body:'Legal cleared eligibility for Plot A-12 · Ramesh Kumar', read:false, actorKey:'sinan' },
    { id:'n2', ts:new Date(now-26*3600000), dept:'finance', projectId:'P8', statusKey:'loan_allocated',
      title:'Loan processing in progress', body:'Plot C-03 · Anitha Raj — allocate & proceed to bank', read:true, actorKey:'rahul' },
    { id:'n3', ts:new Date(now-5*3600000),  dept:'legal',   projectId:'P4', statusKey:'pre_deed',
      title:'Sanction received — prepare deed', body:'Finance received sanction for Plot C-21 · Abdul Rahman', read:false, actorKey:'rahul' },
    { id:'n4', ts:new Date(now-9*3600000),  dept:'admin',   projectId:'P12', statusKey:'reg_date',
      title:'Registration date approval', body:'Plot B-11 · Joseph Kurian — confirm slot with Sub-Registrar', read:false, actorKey:'meera' },
    { id:'n5', ts:new Date(now-31*3600000), dept:'operations', projectId:'P10', statusKey:'handover',
      title:'Handover pending signature', body:'Plot A-18 · Sneha Pillai — receipt form awaiting customer sign', read:false, actorKey:'meera' },
  ];
}

window.PZBuild = { buildData };
})();
