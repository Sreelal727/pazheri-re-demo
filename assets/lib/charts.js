/* ============================================================
   Pazheri ERP — Dependency-free SVG chart toolkit
   Every chart is a pure function returning an SVG string.
   Animation is compositor-friendly (opacity / transform / dash).
   ============================================================ */
(function(){
'use strict';
const { esc, escSvg } = window.PZ;

const PALETTE = ['#3a4fb0','#d4a93f','#10b981','#6366f1','#ec4899','#f59e0b','#06b6d4','#8b5cf6','#ef4444','#64748b'];
const uid = (()=>{ let i=0; return p=>`${p}${++i}`; })();

/* Build a smooth-ish polyline path from points */
function linePath(pts){
  return pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
}
function niceMax(v){
  if(v<=0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v/mag;
  const step = n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;
  return step*mag;
}

/* ---------- Area / line chart with grid + axes ---------- */
/* series: [{name, color, values:[n,...]}]  labels: [str,...] */
function lineChart(labels, series, opts){
  const o = Object.assign({ h:230, w:540, area:true, yFmt:v=>v, dots:true, grid:5 }, opts||{});
  const W=o.w, H=o.h, padL=54, padR=14, padT=16, padB=30;
  const iw=W-padL-padR, ih=H-padT-padB;
  const max = niceMax(Math.max(...series.flatMap(s=>s.values), 1) * 1.08);
  const x = i => padL + (labels.length<2?iw/2:(i/(labels.length-1))*iw);
  const y = v => padT + ih - (v/max)*ih;

  let grid='';
  for(let g=0; g<=o.grid; g++){
    const gv = max*g/o.grid, gy = y(gv);
    grid += `<line x1="${padL}" x2="${W-padR}" y1="${gy.toFixed(1)}" y2="${gy.toFixed(1)}" stroke="#eef2f7" stroke-width="1"/>
      <text x="${padL-9}" y="${(gy+4).toFixed(1)}" text-anchor="end" class="ax">${escSvg(o.yFmt(gv))}</text>`;
  }
  const xlab = labels.map((l,i)=> (labels.length>12 && i%2) ? '' :
    `<text x="${x(i).toFixed(1)}" y="${H-9}" text-anchor="middle" class="ax">${escSvg(l)}</text>`).join('');

  const body = series.map((s,si)=>{
    const c = s.color || PALETTE[si%PALETTE.length];
    const pts = s.values.map((v,i)=>[x(i), y(v)]);
    const gid = uid('g');
    const areaPath = `${linePath(pts)} L${x(labels.length-1).toFixed(1)} ${(padT+ih).toFixed(1)} L${x(0).toFixed(1)} ${(padT+ih).toFixed(1)} Z`;
    return `${o.area?`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}" stop-opacity=".26"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/>
      </linearGradient></defs><path d="${areaPath}" fill="url(#${gid})"/>`:''}
      <path d="${linePath(pts)}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="ch-line"/>
      ${o.dots? pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="#fff" stroke="${c}" stroke-width="2"><title>${escSvg(labels[i])}: ${escSvg(o.yFmt(s.values[i]))}</title></circle>`).join('') : ''}`;
  }).join('');

  return `<div class="chart">${legend(series)}
    <svg viewBox="0 0 ${W} ${H}" class="ch">${grid}${xlab}${body}</svg></div>`;
}

/* ---------- Grouped / stacked vertical bars ---------- */
function barChart(labels, series, opts){
  const o = Object.assign({ h:230, w:540, stacked:false, yFmt:v=>v, radius:5 }, opts||{});
  const W=o.w, H=o.h, padL=54, padR=14, padT=16, padB=30;
  const iw=W-padL-padR, ih=H-padT-padB;
  const totals = labels.map((_,i)=> o.stacked ? series.reduce((s,x)=>s+x.values[i],0) : Math.max(...series.map(x=>x.values[i])));
  const max = niceMax(Math.max(...totals,1)*1.1);
  const y = v => padT + ih - (v/max)*ih;
  const slot = iw/labels.length;
  const bw = o.stacked ? Math.min(30, slot*0.52) : Math.min(20, (slot*0.66)/series.length);

  let grid='';
  for(let g=0; g<=4; g++){
    const gv=max*g/4, gy=y(gv);
    grid+=`<line x1="${padL}" x2="${W-padR}" y1="${gy.toFixed(1)}" y2="${gy.toFixed(1)}" stroke="#eef2f7"/>
      <text x="${padL-9}" y="${(gy+4).toFixed(1)}" text-anchor="end" class="ax">${escSvg(o.yFmt(gv))}</text>`;
  }
  const bars = labels.map((l,i)=>{
    const cx = padL + slot*i + slot/2;
    if(o.stacked){
      let acc=0;
      return series.map((s,si)=>{
        const c=s.color||PALETTE[si%PALETTE.length];
        const h=(s.values[i]/max)*ih; const yy=padT+ih-acc-h; acc+=h;
        return `<rect x="${(cx-bw/2).toFixed(1)}" y="${yy.toFixed(1)}" width="${bw}" height="${Math.max(h,0).toFixed(1)}" fill="${c}" class="ch-bar" rx="${si===series.length-1?o.radius:0}">
          <title>${escSvg(l)} · ${escSvg(s.name)}: ${escSvg(o.yFmt(s.values[i]))}</title></rect>`;
      }).join('');
    }
    const gw = bw*series.length + 4*(series.length-1);
    return series.map((s,si)=>{
      const c=s.color||PALETTE[si%PALETTE.length];
      const h=(s.values[i]/max)*ih;
      const xx = cx - gw/2 + si*(bw+4);
      return `<rect x="${xx.toFixed(1)}" y="${y(s.values[i]).toFixed(1)}" width="${bw}" height="${Math.max(h,0).toFixed(1)}" rx="${o.radius}" fill="${c}" class="ch-bar">
        <title>${escSvg(l)} · ${escSvg(s.name)}: ${escSvg(o.yFmt(s.values[i]))}</title></rect>`;
    }).join('');
  }).join('');
  const xlab = labels.map((l,i)=>`<text x="${(padL+slot*i+slot/2).toFixed(1)}" y="${H-9}" text-anchor="middle" class="ax">${escSvg(l)}</text>`).join('');
  return `<div class="chart">${legend(series)}<svg viewBox="0 0 ${W} ${H}" class="ch">${grid}${bars}${xlab}</svg></div>`;
}

/* ---------- Horizontal bars (rankings) ---------- */
function hBars(rows, opts){
  const o = Object.assign({ fmt:v=>v, height:26, gap:12 }, opts||{});
  const max = Math.max(...rows.map(r=>r.value), 1);
  return `<div class="hbars">${rows.map((r,i)=>`
    <div class="hbar">
      <span class="hb-lab">${esc(r.label)}</span>
      <span class="hb-track"><i style="width:${Math.max(2,r.value/max*100).toFixed(1)}%;background:${r.color||PALETTE[i%PALETTE.length]}"></i></span>
      <b class="hb-val">${esc(o.fmt(r.value))}</b>
    </div>`).join('')}</div>`;
}

/* ---------- Donut / ring ---------- */
function donut(segments, opts){
  const o = Object.assign({ size:180, thickness:26, center:'', centerSub:'', legend:true }, opts||{});
  const total = segments.reduce((s,x)=>s+x.value,0) || 1;
  const r = (o.size - o.thickness)/2, cx=o.size/2, cy=o.size/2, C=2*Math.PI*r;
  let acc=0;
  const arcs = segments.map((s,i)=>{
    const frac=s.value/total, dash=C*frac;
    const c=s.color||PALETTE[i%PALETTE.length];
    const el=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${o.thickness}"
      stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-acc*C).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" class="ch-arc"><title>${escSvg(s.label)}: ${escSvg(s.value)}</title></circle>`;
    acc+=frac; return el;
  }).join('');
  return `<div class="donut-wrap">
    <div class="donut" style="width:${o.size}px;height:${o.size}px">
      <svg viewBox="0 0 ${o.size} ${o.size}" width="${o.size}" height="${o.size}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#eef2f7" stroke-width="${o.thickness}"/>${arcs}</svg>
      ${o.center!==''?`<div class="donut-c"><b>${o.center}</b>${o.centerSub?`<span>${esc(o.centerSub)}</span>`:''}</div>`:''}
    </div>
    ${o.legend?`<div class="donut-legend">${segments.map((s,i)=>`
      <div class="dl-row"><span class="dot" style="background:${s.color||PALETTE[i%PALETTE.length]}"></span>
        <span class="dl-lab">${esc(s.label)}</span><b>${esc(s.display!=null?s.display:s.value)}</b>
        <span class="muted small">${Math.round(s.value/total*100)}%</span></div>`).join('')}</div>`:''}
  </div>`;
}

/* ---------- Radial gauge (target attainment) ---------- */
function gauge(value, max, opts){
  const o = Object.assign({ size:150, color:'#3a4fb0', label:'', sub:'' }, opts||{});
  const p = Math.max(0, Math.min(1, value/(max||1)));
  const r=(o.size-22)/2, cx=o.size/2, cy=o.size/2;
  const start=Math.PI*0.75, end=Math.PI*2.25, ang=start+(end-start)*p;
  const arc=(a0,a1,color,w)=>{
    const large = (a1-a0) > Math.PI ? 1 : 0;
    return `<path d="M${(cx+r*Math.cos(a0)).toFixed(2)} ${(cy+r*Math.sin(a0)).toFixed(2)} A${r} ${r} 0 ${large} 1 ${(cx+r*Math.cos(a1)).toFixed(2)} ${(cy+r*Math.sin(a1)).toFixed(2)}"
      fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  };
  return `<div class="gauge" style="width:${o.size}px">
    <svg viewBox="0 0 ${o.size} ${o.size}" width="${o.size}" height="${o.size}">
      ${arc(start,end,'#eef2f7',13)}${p>0.002?arc(start,ang,o.color,13):''}
      <text x="${cx}" y="${cy+2}" text-anchor="middle" class="g-val">${Math.round(p*100)}%</text>
      <text x="${cx}" y="${cy+20}" text-anchor="middle" class="g-sub">${escSvg(o.sub)}</text>
    </svg>
    ${o.label?`<div class="g-lab">${esc(o.label)}</div>`:''}</div>`;
}

/* ---------- Sparkline (KPI cards) ---------- */
function spark(values, color, opts){
  const o=Object.assign({w:120,h:34,fill:true},opts||{});
  const max=Math.max(...values,1), min=Math.min(...values,0);
  const rng=(max-min)||1;
  const pts=values.map((v,i)=>[ (i/(values.length-1))*o.w, o.h-2-((v-min)/rng)*(o.h-6) ]);
  const gid=uid('sp');
  return `<svg viewBox="0 0 ${o.w} ${o.h}" width="100%" height="${o.h}" preserveAspectRatio="none" class="spark">
    ${o.fill?`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity=".3"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${linePath(pts)} L${o.w} ${o.h} L0 ${o.h} Z" fill="url(#${gid})"/>`:''}
    <path d="${linePath(pts)}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}

/* ---------- Funnel (sales pipeline) ---------- */
function funnel(steps){
  const top = steps[0] ? steps[0].value : 1;
  return `<div class="funnel">${steps.map((s,i)=>{
    const w = Math.max(16, s.value/top*100);
    const c = s.color||PALETTE[i%PALETTE.length];
    const drop = i? Math.round((steps[i-1].value-s.value)/(steps[i-1].value||1)*100) : 0;
    return `<div class="fn-row">
      <div class="fn-meta"><b>${esc(s.label)}</b><span class="muted small">${esc(s.value)} ${s.unit||''}</span></div>
      <div class="fn-bar"><i style="width:${w}%;background:linear-gradient(90deg,${c},${c}cc)"><span>${Math.round(s.value/top*100)}%</span></i></div>
      ${i?`<span class="fn-drop">−${drop}%</span>`:'<span class="fn-drop base">entry</span>'}
    </div>`; }).join('')}</div>`;
}

/* ---------- Heatmap grid (activity by day / dept) ---------- */
function heatmap(rows, cols, matrix, opts){
  const o=Object.assign({color:'#3a4fb0', fmt:v=>v},opts||{});
  const max=Math.max(...matrix.flat(),1);
  return `<div class="heat">
    <div class="heat-grid" style="grid-template-columns:120px repeat(${cols.length},1fr)">
      <div></div>${cols.map(c=>`<div class="hm-col">${esc(c)}</div>`).join('')}
      ${rows.map((r,ri)=>`<div class="hm-row">${esc(r)}</div>${matrix[ri].map((v,ci)=>{
        const a=(v/max);
        return `<div class="hm-cell" style="background:${o.color}${Math.round(18+a*222).toString(16).padStart(2,'0')};color:${a>0.55?'#fff':'#334155'}" title="${esc(r)} · ${esc(cols[ci])}: ${esc(o.fmt(v))}">${v||''}</div>`;
      }).join('')}`).join('')}
    </div></div>`;
}

/* ---------- Stacked progress meter (single row composition) ---------- */
function meter(segments, opts){
  const o=Object.assign({height:12, legend:true},opts||{});
  const total=segments.reduce((s,x)=>s+x.value,0)||1;
  return `<div class="meter-wrap">
    <div class="meter" style="height:${o.height}px">${segments.map((s,i)=>
      `<i style="width:${(s.value/total*100).toFixed(1)}%;background:${s.color||PALETTE[i%PALETTE.length]}" title="${esc(s.label)}: ${esc(s.value)}"></i>`).join('')}</div>
    ${o.legend?`<div class="meter-legend">${segments.map((s,i)=>
      `<span><i style="background:${s.color||PALETTE[i%PALETTE.length]}"></i>${esc(s.label)} <b>${esc(s.display!=null?s.display:s.value)}</b></span>`).join('')}</div>`:''}
  </div>`;
}

/* ---------- Legend row shared by line/bar ---------- */
function legend(series){
  if(series.length<2 && !series[0].forceLegend) return '';
  return `<div class="ch-legend">${series.map((s,i)=>
    `<span><i style="background:${s.color||PALETTE[i%PALETTE.length]}"></i>${esc(s.name)}</span>`).join('')}</div>`;
}

/* ---------- Bullet chart (actual vs target) ---------- */
function bullet(rows, opts){
  const o=Object.assign({fmt:v=>v, invert:false},opts||{});
  const max=Math.max(...rows.flatMap(r=>[r.value,r.target]),1);
  return `<div class="bullets">${rows.map((r,i)=>{
    const c=r.color||PALETTE[i%PALETTE.length];
    /* invert: the target is a ceiling (budgets, cost), not a floor */
    const hit=o.invert ? r.value<=r.target : r.value>=r.target;
    const hitColor=o.invert?'#16a34a':'#16a34a', missColor=o.invert?'#ef4444':c;
    return `<div class="bl-row">
      <span class="bl-lab">${esc(r.label)}</span>
      <span class="bl-track">
        <i class="bl-fill" style="width:${(r.value/max*100).toFixed(1)}%;background:${hit?hitColor:missColor}"></i>
        <s class="bl-target" style="left:${(r.target/max*100).toFixed(1)}%" title="Target ${esc(o.fmt(r.target))}"></s>
      </span>
      <b class="bl-val" style="color:${hit?'#16a34a':(o.invert?'#b91c1c':'inherit')}">${esc(o.fmt(r.value))}</b>
      <span class="muted small bl-t">/ ${esc(o.fmt(r.target))}</span>
    </div>`; }).join('')}</div>`;
}

window.PZChart = { lineChart, barChart, hBars, donut, gauge, spark, funnel, heatmap, meter, bullet, PALETTE };
})();
