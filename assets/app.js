/* ============================================================
   Pazheri Properties ERP — Application shell
   Sidebar, topbar, plot drawer, status workflow & event wiring.
   Individual screens live in assets/views/*.js
   ============================================================ */
(function(){
'use strict';
const P = window.PZ;
const { state, $, $$, esc, icon, av, deptColor, deptName, cu, tint,
        statusPill, deptTag, timeAgo, fmtDateTime, fmtINR, lakh, money,
        totalValue, toast, VIEWS, META } = P;

/* ================= SHELL ================= */
function render(){ renderSidebar(); renderTopbar(); renderView(); }

function renderSidebar(){
  const legalCount = state.projects.filter(p=>deptOfStatus(p.statusKey)==='legal' && p.statusKey!=='completed').length;
  const finCount   = state.projects.filter(p=>deptOfStatus(p.statusKey)==='finance' && p.statusKey!=='completed').length;
  const deptCounts = { legal:legalCount, finance:finCount };

  $('#nav').innerHTML = PZNav.NAV.map(g=>{
    const open = state.navOpen[g.id] !== false;
    const items = g.items.map(it=>{
      let n = 0;
      if(it.badge) { try { n = it.badge(); } catch(e){ n=0; } }
      if(it.badgeDept) n = deptCounts[it.badgeDept]||0;
      const badge = n ? `<span class="badge">${n}</span>` : (it.tagText?`<span class="ntag">${esc(it.tagText)}</span>`:'');
      return `<a data-view="${it.v}" class="${state.view===it.v?'active':''}">${icon(it.ic,17)}<span>${esc(it.label)}</span>${badge}</a>`;
    }).join('');
    return `<div class="nav-group ${open?'open':''}" data-group="${g.id}">
      <button class="cat" data-toggle-group="${g.id}">${esc(g.label)}${icon('chevron',14)}</button>
      <div class="nav-items">${items}</div>
    </div>`;
  }).join('');

  const u=cu();
  $('#sideUser').innerHTML = `${av(state.currentUserKey,34)}
    <div class="su-who"><b>${esc(u.name)}</b><span>${esc(u.role)}</span></div>`;
}

function renderTopbar(){
  const m = META[state.view] || ['Dashboard',''];
  const entry = PZNav.INDEX[state.view];
  $('#pageTitle').textContent = m[0];
  $('#pageSub').textContent   = m[1];
  $('#crumb').innerHTML = entry
    ? `<span>${esc(entry.group.label)}</span>${icon('chevronRight',12)}<b>${esc(entry.item.label)}</b>`
    : `<b>${esc(m[0])}</b>`;

  const u=cu();
  $('#roleBtn').innerHTML = `${av(state.currentUserKey,32)}<div class="who"><b>${esc(u.name)}</b><span>${esc(u.role)}</span></div>${icon('chevron')}`;
  const unread = unreadFor(u.dept);
  $('#bellDot').innerHTML = unread ? `<span class="dot">${unread}</span>` : '';
  $('#periodBtn').innerHTML = `${icon('calendar',15)} ${esc(state.period)} ${icon('chevron',13)}`;
  renderRoleMenu(); renderNotifPanel();
}
function unreadFor(dept){
  if(dept==='admin') return state.notifications.filter(n=>!n.read).length;
  return state.notifications.filter(n=>!n.read && n.dept===dept).length;
}

/* Views are created lazily — one <section> per screen */
function renderView(){
  const id='view-'+state.view;
  let sec=document.getElementById(id);
  if(!sec){ sec=document.createElement('section'); sec.className='view'; sec.id=id; $('.content').appendChild(sec); }
  $$('.view').forEach(v=>v.classList.toggle('active', v.id===id));
  const fn=VIEWS[state.view];
  if(fn) sec.innerHTML = fn();
  else sec.innerHTML = `<div class="empty card pad">This module is part of the full rollout.</div>`;
  $('.content').scrollTop = 0;
  window.scrollTo({top:0});
}
function goto(view){ state.view=view; closeAllMenus(); render(); $('#sidebar').classList.remove('open'); }

/* ================= PLOT DRAWER ================= */
function openPlot(id){
  const p=state.projects.find(x=>x.id===id); if(!p) return;
  state.openPlot=id;
  const route=routeFor(p), ci=stepIndex(p);
  const next = route[ci+1];
  const acts = canAct(p);

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
    pipe+=`<div class="pstep ${cls}">
      <div class="rail"><div class="node">${i<ci?icon('tick',12):(i+1)}</div>${i===route.length-1?'':'<div class="line"></div>'}</div>
      <div class="body"><div class="nm">${esc(st.label)}</div><div class="sub">${sub}</div></div>
    </div>`;
  });

  const tab = state.drawerTab || 'pipeline';
  $('#drawerHead').innerHTML=`
    <button class="close" data-close-drawer>${icon('x')}</button>
    <span class="d-plotno">PLOT ${esc(p.plot)}</span>
    <span class="pay ${p.payment}" style="margin-left:8px">${p.payment}${p.employment?' · '+esc(p.employment):''}</span>
    <div class="d-cust">${esc(p.customer)}</div>
    <div class="d-loc">${icon('pin',14)} ${esc(p.location)} · ${icon('phone',13)} ${esc(p.phone)}</div>
    <div class="d-facts">
      <div><span>Area</span><b>${p.area} cents</b></div>
      <div><span>Rate</span><b>${fmtINR(p.rate)}/cent</b></div>
      <div><span>Total Value</span><b>${lakh(totalValue(p))}</b></div>
      <div><span>Received</span><b>${lakh(P.paidValue(p))}</b></div>
      <div><span>Progress</span><b>${progressPct(p)}%</b></div>
    </div>`;

  const panel =
    tab==='docs'    ? PZDocs.tabHTML(p) :
    tab==='history' ? historyHTML(p) :
    tab==='money'   ? moneyHTML(p) :
      `<div class="section-head"><h2>Process pipeline</h2><span class="hint">${p.payment} route · ${route.length} steps</span></div>
       <div class="card pad"><div class="pipe">${pipe}</div></div>`;

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
          : (!next ? `<span class="pill" style="color:#16a34a;background:#dcfce7"><i class="dt"></i>Completed &amp; Filed</span>`
          : `<span class="chip">🔒 Owned by ${deptName(deptOfStatus(p.statusKey))} — switch role to act</span>`)}
      </div>
    </div>
    <div class="d-tabs">
      <button data-tab="pipeline" class="${tab==='pipeline'?'on':''}">${icon('map',16)} Pipeline</button>
      <button data-tab="docs" class="${tab==='docs'?'on':''}">${icon('file',16)} Documents <span class="cnt">${p.files.length}</span></button>
      <button data-tab="money" class="${tab==='money'?'on':''}">${icon('wallet',16)} Payments</button>
      <button data-tab="history" class="${tab==='history'?'on':''}">${icon('history',16)} History <span class="cnt">${p.timeline.length}</span></button>
    </div>
    <div data-drawer-panel>${panel}</div>`;

  $('#scrim').classList.add('open');
  $('#drawer').classList.add('open');
}
function closeDrawer(){ state.openPlot=null; $('#scrim').classList.remove('open'); $('#drawer').classList.remove('open'); }

function historyHTML(p){
  const audit=[...p.timeline].reverse();
  return `<div class="section-head"><h2>History &amp; audit trail</h2><span class="hint">${p.timeline.length} events</span></div>
    <div class="card pad"><div class="tl">
      ${audit.map(e=>{
        if(e.kind==='doc'){ return `<div class="row">
          <div class="av">${av(e.actorKey,32)}</div>
          <div class="c"><div><b>${esc(USERS[e.actorKey].name)}</b> <span class="muted">(${esc(USERS[e.actorKey].role)})</span> uploaded <b>${esc(e.label)}</b></div>
            <div class="m">Document · ${fmtDateTime(new Date(e.ts))} · ${timeAgo(new Date(e.ts))}</div>
            ${e.fileName?`<div class="note">📎 ${esc(e.fileName)}</div>`:''}</div></div>`; }
        return `<div class="row">
          <div class="av">${av(e.actorKey,32)}</div>
          <div class="c"><div><b>${esc(USERS[e.actorKey].name)}</b> <span class="muted">(${esc(USERS[e.actorKey].role)})</span> set <b>${esc(STATUS[e.statusKey].label)}</b></div>
            <div class="m">${esc(deptName(STATUS[e.statusKey].dept))} · ${fmtDateTime(new Date(e.ts))} · ${timeAgo(new Date(e.ts))}</div>
            ${e.note?`<div class="note">“${esc(e.note)}”</div>`:''}</div></div>`;
      }).join('')}
    </div></div>`;
}
function moneyHTML(p){
  const total=totalValue(p), paid=P.paidValue(p), due=P.dueValue(p);
  const sched=[
    { label:'Booking token (2%)',   amount:P.tokenValue(p), when:'On booking',           done: stepIndex(p) >= routeFor(p).indexOf('token') },
    { label:p.payment==='Loan'?'Bank disbursement (85%)':'Part payment (48%)', amount: total*(p.payment==='Loan'?0.85:0.48),
      when:p.payment==='Loan'?'On sanction':'Before deed', done: p.payment==='Loan' ? stepIndex(p)>=routeFor(p).indexOf('sanction') : stepIndex(p)>=routeFor(p).indexOf('pre_deed') },
    { label:'Balance on registration', amount: Math.max(0,total-P.tokenValue(p)-total*(p.payment==='Loan'?0.85:0.48)),
      when:'At registration', done: stepIndex(p)>=routeFor(p).indexOf('registration') },
  ];
  return `<div class="section-head"><h2>Payment schedule</h2><span class="hint">${p.payment} route</span></div>
    <div class="grid cols-3 mt-s">
      ${P.miniStat('Agreement value', lakh(total),'', 'var(--brand-2)')}
      ${P.miniStat('Received', lakh(paid), P.pct(paid,total)+'% collected', '#16a34a')}
      ${P.miniStat('Outstanding', lakh(due),'', due? '#b45309':'#16a34a')}
    </div>
    <div class="card pad mt">
      ${P.progressBar(paid,total,'linear-gradient(90deg,#34d399,#059669)')}
      <div class="doc-list mt">
        ${sched.map(s=>`<div class="doc-item">
          <div class="d-ic" style="background:${s.done?'#dcfce7':'#f1f5f9'};color:${s.done?'#15803d':'#94a3b8'}">${icon(s.done?'check':'clock',18)}</div>
          <div class="d-info"><div class="nm">${esc(s.label)}</div><div class="sub">${esc(s.when)}</div></div>
          <div class="d-act"><b>${lakh(s.amount)}</b><span class="doc-badge ${s.done?'up':'pend'}">${s.done?'Received':'Due'}</span></div>
        </div>`).join('')}
      </div>
    </div>`;
}

/* ================= PERMISSIONS & WORKFLOW ================= */
function canAct(p){
  const u=cu();
  if(p.statusKey==='completed') return false;
  return u.dept==='admin' || u.dept===deptOfStatus(p.statusKey);
}
function openUpdateModal(id){
  const p=state.projects.find(x=>x.id===id); if(!p) return;
  const route=routeFor(p), ci=stepIndex(p), next=route[ci+1];
  if(!next) return;
  const nextDept=STATUS[next].dept, curDept=deptOfStatus(p.statusKey);
  const handoff = nextDept!==curDept;
  $('#modalScrim').innerHTML=`
    <div class="modal">
      <div class="mh"><h3>Update status — Plot ${esc(p.plot)}</h3><p>${esc(p.customer)} · ${esc(p.location)}</p></div>
      <div class="mb">
        <div class="field"><label>Completing</label><div class="chip" style="font-size:13px">${esc(STATUS[p.statusKey].label)}</div></div>
        <div class="next-preview"><span class="ar">${icon('arrow')}</span>
          <div><b>Next:</b> ${esc(STATUS[next].label)}<div class="muted small">Moves to ${esc(deptName(nextDept))} team</div></div></div>
        ${handoff?`<div class="attn ${nextDept==='finance'?'finance':''}" style="margin:14px 0 0">
          <div style="font-size:18px">🔔</div><div class="txt small">This will <b>instantly notify the ${esc(deptName(nextDept))} team</b> to begin their task, and log the handoff with a timestamp.</div></div>`:''}
        <div class="field mt"><label>Add a note (optional)</label>
          <textarea id="updNote" rows="2" placeholder="e.g. Scrutiny report clear, no encumbrance found"></textarea></div>
      </div>
      <div class="mf">
        <button class="btn secondary" data-close-modal>Cancel</button>
        <button class="btn ${nextDept==='finance'?'finance':''}" data-confirm-update="${p.id}">${handoff?'Update &amp; Notify '+esc(deptName(nextDept)):'Update Status'}</button>
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
  p.assigned = DEPARTMENTS[newDept].members[0];
  p.timeline.push({ ts, actorKey:actor, statusKey:next, note:(note||'').trim() });
  state.activity.unshift({ ts, actorKey:actor, projectId:p.id, statusKey:next });

  if(newDept!==oldDept){
    state.notifications.unshift({ id:'n'+Date.now(), ts, dept:newDept, projectId:p.id, statusKey:next, actorKey:actor,
      title:`Action needed — ${STATUS[next].label}`,
      body:`${USERS[actor].name} (${deptName(oldDept)}) completed ${STATUS[route[ci]].label} · Plot ${p.plot} · ${p.customer}`,
      read:false });
    toast('handoff', `${deptName(newDept)} team notified`, `${STATUS[next].label} · Plot ${p.plot}`, deptColor(newDept));
  } else {
    toast('ok', 'Status updated', `${STATUS[next].label} · Plot ${p.plot}`, deptColor(newDept));
  }
  render();
  if(state.openPlot===id) openPlot(id);
}

/* ================= MENUS ================= */
function renderNotifPanel(){
  const u=cu();
  const list=state.notifications.filter(n=> u.dept==='admin' || n.dept===u.dept);
  $('#notifPanel').innerHTML=`
    <div class="nh"><b>Notifications</b>${list.some(n=>!n.read)?`<button class="btn ghost sm" data-mark-all>Mark all read</button>`:''}</div>
    <div class="notif-list">
      ${list.length? list.map(n=>{ const c=deptColor(n.dept);
        return `<div class="notif ${n.read?'':'unread'}" data-notif="${n.id}" data-plot="${n.projectId}">
          <div class="ni" style="background:${c}">${icon('bell',16)}</div>
          <div class="nt"><b>${esc(n.title)}</b><div class="muted">${esc(n.body)}</div>
            <div class="nw">${esc(deptName(n.dept))} · ${timeAgo(n.ts)}</div></div>
        </div>`; }).join('')
      : `<div class="notif-empty">No notifications for the ${esc(deptName(u.dept))} team.</div>`}
    </div>`;
}
function renderRoleMenu(){
  $('#roleMenu').innerHTML=`
    <div class="rm-h">View the ERP as…</div>
    ${ROLE_OPTIONS.map(k=>{ const u=USERS[k];
      return `<div class="rm-i ${state.currentUserKey===k?'on':''}" data-role="${k}">
        ${av(k,32)}<div class="who"><b>${esc(u.name)}</b><span>${esc(u.role)} · ${esc(deptName(u.dept))}</span></div>
        ${state.currentUserKey===k?`<span class="ck">${icon('tick',16)}</span>`:''}</div>`;
    }).join('')}`;
}
function closeAllMenus(){ $('#roleMenu').classList.remove('open'); $('#notifPanel').classList.remove('open'); }

/* ================= EVENTS ================= */
document.addEventListener('click',e=>{
  const t=e.target;

  const grp=t.closest('[data-toggle-group]');
  if(grp){ const id=grp.dataset.toggleGroup; state.navOpen[id]=!(state.navOpen[id]!==false); renderSidebar(); return; }

  const nav=t.closest('[data-view]');
  if(nav){ goto(nav.dataset.view); return; }

  const tabBtn=t.closest('[data-tab]');
  if(tabBtn && state.openPlot){ state.drawerTab=tabBtn.dataset.tab; openPlot(state.openPlot); return; }

  const upl=t.closest('[data-upload-doc]');
  if(upl){ e.stopPropagation(); const parts=upl.dataset.uploadDoc.split(':');
    PZDocs.trigger(parts[0], parts[1], parts[2]?decodeURIComponent(parts[2]):''); return; }

  const vdoc=t.closest('[data-view-doc]');
  if(vdoc){ e.stopPropagation(); const parts=vdoc.dataset.viewDoc.split(':'); PZDocs.openViewer(parts[0],parts[1]); return; }
  if(t.closest('[data-close-viewer]') || t.id==='viewerScrim'){ PZDocs.closeViewer(); return; }

  const plotEl=t.closest('[data-plot]');
  if(plotEl && !t.closest('[data-advance]') && !t.closest('[data-update]')){
    const nEl=t.closest('[data-notif]');
    if(nEl){ const n=state.notifications.find(x=>x.id===nEl.dataset.notif); if(n)n.read=true; closeAllMenus(); }
    openPlot(plotEl.dataset.plot); renderTopbar(); return;
  }
  const adv=t.closest('[data-advance]');
  if(adv){ e.stopPropagation(); openUpdateModal(adv.dataset.advance); return; }
  const upd=t.closest('[data-update]');
  if(upd){ openUpdateModal(upd.dataset.update); return; }
  const conf=t.closest('[data-confirm-update]');
  if(conf){ const note=$('#updNote')?$('#updNote').value:''; const id=conf.dataset.confirmUpdate; closeModal(); advanceStatus(id,note); return; }
  if(t.closest('[data-close-modal]')|| t.id==='modalScrim'){ closeModal(); return; }
  if(t.closest('[data-close-drawer]')|| t.id==='scrim'){ closeDrawer(); return; }

  if(t.closest('#roleBtn')){ e.stopPropagation(); $('#notifPanel').classList.remove('open'); $('#roleMenu').classList.toggle('open'); return; }
  const roleI=t.closest('[data-role]');
  if(roleI){ state.currentUserKey=roleI.dataset.role; closeAllMenus(); render(); if(state.openPlot)openPlot(state.openPlot); return; }
  if(t.closest('#bellBtn')){ e.stopPropagation(); $('#roleMenu').classList.remove('open'); $('#notifPanel').classList.toggle('open'); return; }
  if(t.closest('[data-mark-all]')){ state.notifications.forEach(n=>{ if(cu().dept==='admin'||n.dept===cu().dept)n.read=true; }); render(); $('#notifPanel').classList.add('open'); return; }

  const seg=t.closest('[data-seg] button');
  if(seg){ const key=seg.closest('[data-seg]').dataset.seg; state.filter[key]=seg.dataset.val; renderView(); return; }

  const demo=t.closest('[data-demo]');
  if(demo){ toast('ok','Demo build', demo.dataset.demo || 'This action is wired to the live system in production.', '#1b2769'); return; }

  if(t.closest('#menuBtn')){ $('#sidebar').classList.toggle('open'); return; }
  if(!t.closest('.notif-wrap')&&!t.closest('#roleMenu')&&!t.closest('#roleBtn')) closeAllMenus();
});

document.addEventListener('input',e=>{
  if(e.target.id==='globalSearch'){
    state.filter.q=e.target.value;
    if(state.view!=='plots'){ goto('plots'); } else renderView();
    $('#globalSearch').focus();
  }
  if(e.target.dataset && e.target.dataset.filter){
    state.filter[e.target.dataset.filter]=e.target.value; renderView();
  }
});
document.addEventListener('change',e=>{
  if(e.target.id==='fileInput') PZDocs.onFileChosen(e.target, pid=>{ render(); if(state.openPlot===pid) openPlot(pid); });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if($('#viewerScrim').classList.contains('open')){ PZDocs.closeViewer(); return; }
    closeModal(); closeDrawer(); closeAllMenus();
  }
});

/* ---------- Scripted "live" update for demo realism ---------- */
function scheduleLiveDemo(){
  setTimeout(()=>{
    if(state.scripted) return; state.scripted=true;
    const p=state.projects.find(x=>x.id==='P1');
    if(p && p.statusKey==='bank_verify')
      advanceStatus('P1','Bank verification cleared — valuation & legal opinion received.','rahul');
  }, 12000);
}

/* ================= BOOT ================= */
PZBuild.buildData();
render();
scheduleLiveDemo();

window.PZApp = { render, renderView, openPlot, goto, canAct, advanceStatus };
window.__pazheri={state};
})();
