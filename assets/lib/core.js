/* ============================================================
   Pazheri ERP — Shared core: state, formatters, icons, registry
   Exposes a single global namespace: window.PZ
   ============================================================ */
(function(){
'use strict';

/* ---------- Global app state ---------- */
const state = {
  currentUserKey: 'jabbar',
  view: 'dashboard',
  projects: [],
  activity: [],
  notifications: [],
  filter: { q:'', payment:'all', stage:'all' },
  openPlot: null,
  drawerTab: 'pipeline',
  pendingUpload: null,
  scripted: false,
  period: 'FY 2024-25',
  navOpen: { overview:true, sales:true, inventory:true, legal:true, finance:true, ops:true, people:true, gov:true },
  /* per-screen layout preference: tiles | board | list */
  leadsView: 'tiles',
  pipelineView: 'board',
  customersView: 'tiles',
};

/* ---------- DOM helpers ---------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const el = document.createElement.bind(document);

/* ---------- Escaping ---------- */
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escSvg = s => String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

/* ---------- Number & date formatting ---------- */
const fmtINR = n => '₹' + Math.round(n).toLocaleString('en-IN');
const lakh   = n => '₹' + (n/100000).toLocaleString('en-IN',{maximumFractionDigits:2}) + ' L';
const crore  = n => '₹' + (n/10000000).toLocaleString('en-IN',{maximumFractionDigits:2}) + ' Cr';
const money  = n => Math.abs(n) >= 10000000 ? crore(n) : lakh(n);
const num    = n => Math.round(n).toLocaleString('en-IN');
const pct    = (a,b) => b ? Math.round(a/b*100) : 0;
const plural = (n,word,suffix) => n + ' ' + word + (n===1 ? '' : (suffix||'s'));

function timeAgo(d){
  const s=(Date.now()-d.getTime())/1000;
  if(s<60) return 'just now';
  const m=s/60; if(m<60) return Math.floor(m)+'m ago';
  const h=m/60; if(h<24) return Math.floor(h)+'h ago';
  const dd=h/24; if(dd<7) return Math.floor(dd)+'d ago';
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}
const fmtDate     = d => d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
const fmtDay      = d => d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
const fmtDateTime = d => d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const daysFromNow = n => new Date(Date.now()+n*86400000);

/* ---------- Deterministic pseudo-random (stable demo data) ---------- */
function seeded(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a>>>15), 1 | a);
    t = (t + Math.imul(t ^ (t>>>7), 61 | t)) ^ t;
    return ((t ^ (t>>>14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng()*arr.length)];
const between = (rng, lo, hi) => lo + Math.floor(rng()*(hi-lo+1));

/* ---------- Department / user chrome ---------- */
const cu         = ()=>USERS[state.currentUserKey];
const tint       = (hex,a='22')=> hex + a;
const deptColor  = d => (DEPARTMENTS[d]||DEPARTMENTS.admin).color;
const deptName   = d => (DEPARTMENTS[d]||DEPARTMENTS.admin).name;

function av(userKey,size=32){
  const u=USERS[userKey]; if(!u) return '';
  return `<span class="avatar" title="${esc(u.name)} · ${esc(u.role)}" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.38)}px;background:${deptColor(u.dept)}">${u.initials}</span>`;
}
function statusPill(key){
  const st=STATUS[key]; if(!st) return '';
  const c=deptColor(st.dept);
  return `<span class="pill" style="color:${c};background:${tint(c)}"><i class="dt"></i>${esc(st.label)}</span>`;
}
function deptTag(dept){
  const c=deptColor(dept);
  return `<span class="dept-tag" style="color:${c}"><span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block"></span>${esc(deptName(dept))}</span>`;
}
function tag(text,color,bg){
  return `<span class="pill" style="color:${color};background:${bg||tint(color,'1e')}"><i class="dt"></i>${esc(text)}</span>`;
}
function statChip(label,value,color){
  return `<span class="chip" ${color?`style="color:${color};background:${tint(color,'18')}"`:''}><b>${esc(value)}</b> ${esc(label)}</span>`;
}

/* ---------- Money model on a project ---------- */
const totalValue = p => p.area*p.rate;
const tokenValue = p => Math.round(p.area*p.rate*0.02/1000)*1000;
const paidValue  = p => {
  const i=stepIndex(p), r=routeFor(p);
  if(p.statusKey==='completed') return totalValue(p);
  if(i>=r.indexOf('token')) return tokenValue(p) + (p.payment==='Loan' && i>=r.indexOf('sanction') ? totalValue(p)*0.85 : 0);
  return 0;
};
const dueValue = p => Math.max(0, totalValue(p) - paidValue(p));

/* ---------- View registry ---------- */
const VIEWS = {};      /* key -> render function            */
const META  = {};      /* key -> [title, subtitle, section] */
function registerView(key, meta, fn){ VIEWS[key]=fn; META[key]=meta; }

/* ---------- Toast ---------- */
function toast(kind,title,sub,color){
  const wrap=$('#toastWrap'); if(!wrap) return;
  const t=el('div'); t.className='toast';
  t.innerHTML=`<div class="ti" style="background:${color||'#16a34a'}">${icon(kind==='handoff'?'bell':kind==='warn'?'alert':'check')}</div>
    <div class="tc"><b>${esc(title)}</b><span>${esc(sub)}</span></div>`;
  wrap.appendChild(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),300); }, 4200);
}

/* ---------- Section / card scaffolding used by every module ---------- */
function sectionHead(title, hint, right){
  return `<div class="section-head"><h2>${esc(title)}</h2>${hint?`<span class="hint">${esc(hint)}</span>`:''}
    <div class="spacer"></div>${right||''}</div>`;
}
function panel(title, hint, body, extraClass){
  return `<div class="card pad ${extraClass||''}">
    <div class="row-between" style="margin-bottom:14px">
      <div><h2 style="margin:0;font-size:15px">${esc(title)}</h2>${hint?`<div class="muted small" style="margin-top:2px">${esc(hint)}</div>`:''}</div>
    </div>${body}</div>`;
}
function kpiCard(k){
  return `<div class="card kpi" style="color:${k.c}">
    <div class="k-ic" style="background:${tint(k.c,'1f')};color:${k.c}">${icon(k.ic)}</div>
    <div class="k-val" style="color:var(--ink)">${k.val}</div>
    <div class="k-lab">${esc(k.lab)}</div>
    ${k.tr?`<div class="k-tr ${k.trc||'flat'}">${k.trc==='up'?'▲':k.trc==='down'?'▼':'•'} ${esc(k.tr)}</div>`:''}
    ${k.spark?`<div class="k-spark">${k.spark}</div>`:''}
  </div>`;
}
function tableHTML(cols, rows, opts){
  const o=opts||{};
  return `<div class="tbl-wrap"><table class="tbl ${o.dense?'dense':''}">
    <thead><tr>${cols.map(c=>`<th ${c.align?`style="text-align:${c.align}"`:''}>${esc(c.label)}</th>`).join('')}</tr></thead>
    <tbody>${rows.length? rows.map(r=>`<tr ${r.attr||''}>${r.cells.map((c,i)=>`<td ${cols[i]&&cols[i].align?`style="text-align:${cols[i].align}"`:''}>${c}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${cols.length}"><div class="empty">Nothing to show here yet.</div></td></tr>`}</tbody>
  </table></div>`;
}
function progressBar(value, max, color){
  const w = max ? Math.min(100, Math.round(value/max*100)) : 0;
  return `<div class="bar"><i style="width:${w}%;${color?`background:${color}`:''}"></i></div>`;
}
const VIEW_MODES = {
  tiles: { label:'Tiles', ic:'grid' },
  board: { label:'Board', ic:'layers' },
  list:  { label:'List',  ic:'list' },
};
function modeSwitch(stateKey, modes){
  const cur = state[stateKey];
  return `<div class="mode-seg" role="group" aria-label="Layout">${modes.map(m=>{
    const cfg=VIEW_MODES[m];
    return `<button data-mode-key="${stateKey}" data-mode="${m}" class="${cur===m?'on':''}"
      aria-pressed="${cur===m}" title="${cfg.label} view">${icon(cfg.ic,15)}<span>${cfg.label}</span></button>`;
  }).join('')}</div>`;
}
function miniStat(label, value, sub, color){
  return `<div class="mini-stat"><span class="ms-lab">${esc(label)}</span>
    <b class="ms-val" ${color?`style="color:${color}"`:''}>${value}</b>
    ${sub?`<span class="ms-sub">${esc(sub)}</span>`:''}</div>`;
}

/* ---------- Icon set ---------- */
const ICONS={
  grid:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
  map:'<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/>',
  scale:'<path d="M12 3v18M6 21h12M6 7l-3 6h6zM18 7l-3 6h6zM6 7l6-2 6 2"/>',
  coins:'<circle cx="8" cy="8" r="5"/><path d="M16 8a5 5 0 1 1 0 8"/>',
  history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  building:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h6v6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  tick:'<path d="M20 6 9 17l-5-5"/>',
  wallet:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M17 15h.01"/>',
  bolt:'<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>',
  pin:'<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  bank:'<path d="M3 10 12 4l9 6M4 10v9M20 10v9M8 10v9M16 10v9M3 21h18"/>',
  cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  chevronRight:'<path d="m9 6 6 6-6 6"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  upload:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M12 15V3M8 7l4-4 4 4"/>',
  download:'<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M12 3v12M8 11l4 4 4-4"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ext:'<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  crown:'<path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/><path d="M5 21h14"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  pie:'<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M14 3.2A9 9 0 0 1 20.8 10H14z"/>',
  bars:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  clipboard:'<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M9 13h6M9 17h4"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6 2 2 0 1 1 13 4.6a1.7 1.7 0 0 0 1.9.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.4z"/>',
  layers:'<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  trend:'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  receipt:'<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2z"/><path d="M9 9h6M9 13h6"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z"/>',
  filter:'<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
  alert:'<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5.5h4V20"/>',
  award:'<circle cx="12" cy="8" r="6"/><path d="m8.2 13.4-1.4 7.4L12 18l5.2 2.8-1.4-7.4"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  percent:'<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 9-9M17 6l3 3M14 9l3 3"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  handshake:'<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m13.5 15.5 2.5 2.5a1.4 1.4 0 0 0 2-2l-4-4"/><path d="M3 10 7 6l4 2 3-2 7 6-3 3-4-3-4 4-3-3z"/>',
  megaphone:'<path d="m3 11 15-7v16L3 13z"/><path d="M3 11v2a3 3 0 0 0 3 3h1l1 5h3l-1-5"/>',
  briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
  tool:'<path d="M14.7 6.3a4 4 0 0 0 5 5L21 21l-2 2-9.5-9.5a4 4 0 0 1-5-5l3 3 2.5-2.5-3-3z"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
};
function icon(n,size){
  const s=size||18;
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${s}" height="${s}">${ICONS[n]||ICONS.grid}</svg>`;
}

window.PZ = { state, $, $$, el, esc, escSvg, fmtINR, lakh, crore, money, num, pct, plural,
  timeAgo, fmtDate, fmtDay, fmtDateTime, daysFromNow, seeded, pick, between,
  cu, tint, deptColor, deptName, av, statusPill, deptTag, tag, statChip,
  totalValue, tokenValue, paidValue, dueValue,
  VIEWS, META, registerView, toast, icon, ICONS,
  sectionHead, panel, kpiCard, tableHTML, progressBar, miniStat, modeSwitch, VIEW_MODES };
})();
