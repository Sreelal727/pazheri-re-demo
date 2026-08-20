/* ============================================================
   Pazheri ERP — Document catalog, upload, preview & viewer
   ============================================================ */
(function(){
'use strict';
const { state, $, esc, escSvg, icon, timeAgo, toast } = window.PZ;

/* Which documents are expected, and at which workflow stage */
function catalog(p){
  const idStage = p.payment==='Cash' ? 'kyc' : 'loan_docs';
  let list=[
    {key:'booking',     label:'Booking Form',           stage:'token'},
    {key:'deed',        label:'Original Deed',          stage:'docs_received'},
    {key:'backdeed',    label:'Backdeed',               stage:'docs_received'},
    {key:'landtax',     label:'Land Tax Receipt',       stage:'docs_received'},
    {key:'possession',  label:'Possession Certificate', stage:'docs_received'},
    {key:'thandaper',   label:'Thandaper',              stage:'docs_received'},
    {key:'scrutiny_r',  label:'Scrutiny Report',        stage:'scrutiny'},
    {key:'evaluation_r',label:'Evaluation Report',      stage:'evaluation'},
    {key:'aadhar',      label:'Aadhar Card',            stage:idStage},
    {key:'pan',         label:'PAN Card',               stage:idStage},
  ];
  if(p.payment==='Loan') list=list.concat([
    {key:'bank_stmt',   label:'Bank Statement (1 yr)',  stage:'loan_docs'},
    {key:'income',      label:p.employment==='Business'?'3-Year ITR':'6-Month Salary Slips', stage:'loan_docs'},
    {key:'sanction_l',  label:'Sanction Letter',        stage:'sanction'},
  ]);
  return list;
}
function latestFile(p,key){ for(let i=p.files.length-1;i>=0;i--) if(p.files[i].key===key) return p.files[i]; return null; }
const isImg = m => /^image\//.test(m||'');
const isPdf = m => /pdf/.test(m||'');

/* A mock "scanned document" preview rendered as an SVG data URL */
function sample(label,p){
  const lines=Array.from({length:11},(_,i)=>`<rect x="40" y="${170+i*34}" width="${360-(i%4)*40}" height="9" rx="4" fill="#e2e8f0"/>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="560" height="760" viewBox="0 0 560 760">
    <rect width="560" height="760" fill="#ffffff"/>
    <rect width="560" height="104" fill="#0b1133"/>
    <text x="40" y="46" fill="#ecca6f" font-family="Arial, sans-serif" font-size="21" font-weight="bold">PAZHERI PROPERTIES</text>
    <text x="40" y="78" fill="#ffffff" font-family="Arial, sans-serif" font-size="17">${escSvg(label)}</text>
    <text x="40" y="146" fill="#0b1133" font-family="Arial, sans-serif" font-size="15" font-weight="bold">Plot ${escSvg(p.plot)} · ${escSvg(p.customer)}</text>
    ${lines}
    <g transform="translate(400,600) rotate(-14)">
      <circle cx="60" cy="60" r="58" fill="none" stroke="#16a34a" stroke-width="4"/>
      <text x="60" y="55" fill="#16a34a" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">VERIFIED</text>
      <text x="60" y="78" fill="#16a34a" font-family="Arial, sans-serif" font-size="11" text-anchor="middle">PAZHERI LEGAL</text>
    </g>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}

/* Documents tab inside the plot drawer */
function tabHTML(p){
  const rows=catalog(p).map(d=>{
    const f=latestFile(p,d.key);
    return `<div class="doc-item">
      <div class="d-ic">${f?`<img src="${f.dataUrl}" alt="">`:icon('file')}</div>
      <div class="d-info">
        <div class="nm">${esc(d.label)}</div>
        <div class="sub">${f?`${esc(f.fileName)} · ${esc(USERS[f.by].name)} · ${timeAgo(new Date(f.ts))}`:'No document attached yet'}</div>
      </div>
      <div class="d-act">
        <span class="doc-badge ${f?'up':'pend'}">${f?'Uploaded':'Pending'}</span>
        ${f?`<button class="btn secondary sm" data-view-doc="${p.id}:${d.key}">${icon('eye')} View</button>`:''}
        <button class="btn sm" data-upload-doc="${p.id}:${d.key}:${encodeURIComponent(d.label)}">${icon('upload')} ${f?'Replace':'Upload'}</button>
      </div>
    </div>`;
  }).join('');
  const custom=p.files.filter(f=>f.key.indexOf('custom_')===0);
  return `<div class="section-head"><h2>Documents</h2><span class="hint">${p.files.length} attached · upload scans (image/PDF) and view them</span></div>
    <div class="doc-list">${rows}
      ${custom.map(f=>`<div class="doc-item">
        <div class="d-ic">${isImg(f.mime)?`<img src="${f.dataUrl}" alt="">`:icon('file')}</div>
        <div class="d-info"><div class="nm">${esc(f.label)}</div>
          <div class="sub">${esc(f.fileName)} · ${esc(USERS[f.by].name)} · ${timeAgo(new Date(f.ts))}</div></div>
        <div class="d-act"><span class="doc-badge up">Uploaded</span>
          <button class="btn secondary sm" data-view-doc="${p.id}:${f.key}">${icon('eye')} View</button></div>
      </div>`).join('')}
      <button class="btn secondary block" data-upload-doc="${p.id}:custom:" style="margin-top:4px">${icon('plus')} Upload additional document</button>
    </div>`;
}

/* ---- Full-screen viewer ---- */
function openViewer(pid,key){
  const p=state.projects.find(x=>x.id===pid); if(!p) return;
  const f=latestFile(p,key); if(!f) return;
  let stage;
  if(isImg(f.mime)) stage=`<img src="${f.dataUrl}" alt="${esc(f.label)}">`;
  else if(isPdf(f.mime)) stage=`<iframe src="${f.dataUrl}" title="${esc(f.label)}"></iframe>`;
  else stage=`<div style="color:#fff;text-align:center"><div style="font-size:40px">📄</div><div style="margin-top:10px">${esc(f.fileName)}</div><div style="color:#cbd5e1;margin-top:6px">Preview not available for this file type</div></div>`;
  $('#viewerScrim').innerHTML=`
    <div class="viewer-bar">
      <div>${icon('file')}</div>
      <div><div class="vt">${esc(f.label)}</div><div class="vs">Plot ${esc(p.plot)} · ${esc(f.fileName)} · uploaded by ${esc(USERS[f.by].name)}</div></div>
      <div class="sp"></div>
      <a href="${f.dataUrl}" target="_blank" rel="noopener">${icon('ext')} Open in new tab</a>
      <a href="${f.dataUrl}" download="${esc(f.fileName)}">${icon('download')} Download</a>
      <button data-close-viewer>${icon('x')} Close</button>
    </div>
    <div class="viewer-stage">${stage}</div>`;
  $('#viewerScrim').classList.add('open');
}
function closeViewer(){ $('#viewerScrim').classList.remove('open'); $('#viewerScrim').innerHTML=''; }

/* ---- Upload handling ---- */
function trigger(pid,key,label){ state.pendingUpload={pid,key,label}; $('#fileInput').click(); }
function onFileChosen(input, afterRender){
  const file=input.files&&input.files[0];
  const target=state.pendingUpload; state.pendingUpload=null; input.value='';
  if(!file||!target) return;
  const reader=new FileReader();
  reader.onload=()=>{
    const p=state.projects.find(x=>x.id===target.pid); if(!p) return;
    const custom = target.key==='custom';
    const key = custom ? 'custom_'+p.files.length+'_'+file.size : target.key;
    const label = custom ? file.name.replace(/\.[^.]+$/,'') : target.label;
    const ts=new Date();
    p.files.push({ key, label, fileName:file.name, mime:file.type||'application/octet-stream',
      dataUrl:reader.result, by:state.currentUserKey, ts });
    p.timeline.push({ ts, actorKey:state.currentUserKey, kind:'doc', label, fileName:file.name });
    state.activity.unshift({ ts, actorKey:state.currentUserKey, projectId:p.id, kind:'doc', label });
    p.updatedAt=ts;
    toast('ok','Document uploaded',`${label} · Plot ${p.plot}`,'#10b981');
    state.drawerTab='docs';
    afterRender(p.id);
  };
  reader.readAsDataURL(file);
}

window.PZDocs = { catalog, latestFile, sample, tabHTML, openViewer, closeViewer, trigger, onFileChosen, isImg, isPdf };
})();
