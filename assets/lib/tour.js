/* ============================================================
   Pazheri ERP — Guided tour engine
   Spotlights a target element, anchors an explainer card beside
   it, and drives the app between screens as the tour advances.
   Steps are declared in tour-steps.js.
   ============================================================ */
(function(){
'use strict';
const { state, $, esc, icon } = window.PZ;

const GAP = 14;           /* space between spotlight and card */
const PAD = 8;            /* spotlight padding around target   */
const EDGE = 16;          /* min distance from viewport edge   */

const tour = { active:false, i:0, steps:[] };
let showTimer=null, measureTimer=null, reflowTimer=null;

/* ---------- Mount / unmount the overlay ---------- */
function mount(){
  if($('#tourRoot')) return;
  const root=document.createElement('div');
  root.id='tourRoot';
  root.className='tour-root';
  root.innerHTML=`<div class="tour-spot" id="tourSpot"></div><div class="tour-card" id="tourCard"></div>`;
  document.body.appendChild(root);
}
function unmount(){ const r=$('#tourRoot'); if(r) r.remove(); }

/* ---------- Public controls ---------- */
function start(from){
  tour.steps = window.PZTourSteps || [];
  if(!tour.steps.length) return;
  tour.active = true;
  tour.i = typeof from==='number' ? from : 0;
  document.body.classList.add('tour-on');
  mount();
  show();
}
function stop(){
  tour.active=false;
  clearTimeout(showTimer); clearTimeout(measureTimer); clearTimeout(reflowTimer);
  document.body.classList.remove('tour-on');
  unmount();
  const sb=$('#sidebar'); if(sb) sb.classList.remove('open');
  PZApp.closeDrawer();
  PZApp.render();
}
function go(delta){
  const next = tour.i + delta;
  if(next < 0) return;
  if(next >= tour.steps.length){ finish(); return; }
  tour.i = next;
  show();
}
function finish(){
  stop();
  window.PZ.toast('ok','Tour complete','Restart it any time from the header','#b8862b');
}

/* ---------- Render one step ---------- */
function show(){
  const st = tour.steps[tour.i];
  if(!st) return;

  /* Put the app on the right screen first, then run any setup */
  if(st.view && state.view!==st.view){ state.view=st.view; PZApp.render(); }
  else if(st.view) PZApp.renderView();
  if(st.before) { try { st.before(); } catch(e){} }

  /* Let layout settle (view swap, drawer transition) before measuring.
     setTimeout rather than rAF: rAF never fires in a background tab, which
     would leave the card stuck on the previous step. */
  clearTimeout(showTimer);
  showTimer = setTimeout(()=>paint(st), st.before ? 340 : 40);
}

function paint(st){
  if(!tour.active) return;
  const card=$('#tourCard'), spot=$('#tourSpot');
  if(!card||!spot) return;

  syncSidebar(st);
  const el = st.target ? document.querySelector(st.target) : null;
  if(el && !inView(el)) el.scrollIntoView({block:'center', inline:'nearest'});

  card.className = 'tour-card' + (st.wide?' wide':'');
  card.innerHTML = cardHTML(st);

  /* Measure once the card has its real content and a size */
  clearTimeout(measureTimer);
  measureTimer = setTimeout(()=>{
    const rect = el ? el.getBoundingClientRect() : null;
    const usable = rect && rect.width>0 && rect.height>0 &&
                   rect.bottom>0 && rect.top<innerHeight &&
                   rect.right>0 && rect.left<innerWidth;
    placeSpot(spot, usable ? rect : null);
    placeCard(card, usable?rect:null, st.placement);
  }, 0);
}

/* With no target, collapse the cut-out to a point at the centre so the
   surrounding box-shadow still dims the whole screen. */
function placeSpot(spot, r){
  spot.classList.toggle('bare', !r);
  if(!r){
    spot.style.left = (innerWidth/2)+'px';
    spot.style.top  = (innerHeight/2)+'px';
    spot.style.width = '0px';
    spot.style.height = '0px';
    return;
  }
  spot.style.left   = (r.left - PAD)+'px';
  spot.style.top    = (r.top  - PAD)+'px';
  spot.style.width  = (r.width  + PAD*2)+'px';
  spot.style.height = (r.height + PAD*2)+'px';
}

function placeCard(card, r, placement){
  const cw=card.offsetWidth, ch=card.offsetHeight;
  if(!r){
    card.style.left = Math.round((innerWidth-cw)/2)+'px';
    card.style.top  = Math.round(Math.max(EDGE,(innerHeight-ch)/2))+'px';
    return;
  }
  /* Try the requested side, then fall back to whichever side has room */
  const room = {
    right:  innerWidth - r.right - GAP,
    left:   r.left - GAP,
    bottom: innerHeight - r.bottom - GAP,
    top:    r.top - GAP,
  };
  const order = [placement||'bottom','right','bottom','left','top']
    .filter((v,i,a)=>a.indexOf(v)===i);
  const side = order.find(s => room[s] >= (s==='left'||s==='right' ? cw : ch)) || 'bottom';

  let left, top;
  if(side==='right'){ left=r.right+GAP;      top=r.top + r.height/2 - ch/2; }
  else if(side==='left'){ left=r.left-GAP-cw; top=r.top + r.height/2 - ch/2; }
  else if(side==='top'){ top=r.top-GAP-ch;    left=r.left + r.width/2 - cw/2; }
  else { top=r.bottom+GAP;                    left=r.left + r.width/2 - cw/2; }

  card.style.left = Math.round(clamp(left, EDGE, innerWidth - cw - EDGE))+'px';
  card.style.top  = Math.round(clamp(top,  EDGE, innerHeight - ch - EDGE))+'px';
}
const clamp = (v,lo,hi) => Math.max(lo, Math.min(v, hi));

/* On narrow screens the sidebar is off-canvas — slide it in for the steps
   that point at it, and out again for every other step. */
function syncSidebar(st){
  const sb=$('#sidebar'); if(!sb || innerWidth>920) return;
  const wantsNav = !!st.target && /^#(nav|sidebar)/.test(st.target);
  sb.classList.toggle('open', wantsNav);
}

/* Comfortably visible? Used to avoid scroll churn on every repaint. */
function inView(el){
  const r=el.getBoundingClientRect();
  return r.top >= EDGE && r.bottom <= innerHeight - EDGE && r.height <= innerHeight - EDGE*2;
}

function cardHTML(st){
  const n=tour.steps.length, i=tour.i;
  return `
    <div class="tc-head">
      <span class="tc-chapter">${esc(st.chapter||'Tour')}</span>
      <button class="tc-x" data-tour="stop" aria-label="End tour">${icon('x',16)}</button>
    </div>
    <h3 class="tc-title">${st.title}</h3>
    <div class="tc-body">${st.body}</div>
    <div class="tc-foot">
      <div class="tc-dots" aria-hidden="true">${tour.steps.map((_,k)=>
        `<i class="${k===i?'on':(k<i?'past':'')}"></i>`).join('')}</div>
      <span class="tc-count">${i+1} / ${n}</span>
      <div class="tc-btns">
        ${i>0?`<button class="btn secondary sm" data-tour="prev">Back</button>`:
              `<button class="btn ghost sm" data-tour="stop">Skip</button>`}
        <button class="btn sm" data-tour="next">${i===n-1?'Finish':'Next'} ${i===n-1?'':icon('chevronRight',14)}</button>
      </div>
    </div>`;
}

/* ---------- Wiring ---------- */
document.addEventListener('click', e=>{
  if(e.target.closest('#tourBtn')){ e.stopPropagation(); start(0); return; }
  const btn = e.target.closest('[data-tour]');
  if(!btn) return;
  e.stopPropagation();
  const act=btn.dataset.tour;
  if(act==='next') go(1);
  else if(act==='prev') go(-1);
  else stop();
}, true);

document.addEventListener('keydown', e=>{
  if(!tour.active) return;
  if(e.key==='Escape'){ e.stopPropagation(); stop(); }
  else if(e.key==='ArrowRight'||e.key==='Enter'){ e.preventDefault(); go(1); }
  else if(e.key==='ArrowLeft'){ e.preventDefault(); go(-1); }
}, true);

/* Keep the spotlight glued to its target while the page moves. Uses its own
   timer so it can never cancel the one show() is waiting on. */
const reflow=()=>{
  if(!tour.active) return;
  clearTimeout(reflowTimer);
  reflowTimer = setTimeout(()=>{ if(tour.active) paint(tour.steps[tour.i]); }, 60);
};
addEventListener('resize', reflow);
addEventListener('scroll', reflow, true);

window.PZTour = { start, stop, go };
})();
