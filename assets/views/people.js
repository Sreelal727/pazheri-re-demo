/* ============================================================
   Screens — Team Directory, Attendance, Payroll, Performance
   ============================================================ */
(function(){
'use strict';
const P=window.PZ, C=window.PZChart;
const { state, esc, icon, av, deptColor, deptName, money, lakh, crore, num, pct, fmtDate,
        registerView, sectionHead, panel, tableHTML, miniStat, tag, progressBar } = P;

/* ---------------- Team Directory ---------------- */
registerView('team', ['Team Directory','Everyone at Pazheri Properties, by department'], ()=>{
  const byDept={};
  EMPLOYEES.forEach(e=>{ (byDept[e.dept]=byDept[e.dept]||[]).push(e); });
  const order=['admin','sales','legal','finance','operations','purchase','hr'];

  return `
    <div class="grid cols-4">
      ${miniStat('Total headcount', EMPLOYEES.length, 'across 7 departments', '#3a4fb0')}
      ${miniStat('Departments', order.length, 'with defined ownership', '#6366f1')}
      ${miniStat('Branch offices', new Set(EMPLOYEES.map(e=>e.location)).size, 'Kerala-wide', '#10b981')}
      ${miniStat('Annual payroll', crore(EMPLOYEES.reduce((s,e)=>s+e.ctc,0)), 'total CTC', '#b8862b')}
    </div>

    ${panel('Headcount by department','Team size distribution',
      C.hBars(order.map(d=>({label:deptName(d), value:(byDept[d]||[]).length, color:deptColor(d)})),{fmt:v=>v+(v===1?' person':' people')}), 'mt')}

    ${order.map(d=>{
      const list=byDept[d]||[]; if(!list.length) return '';
      return `${sectionHead(deptName(d), list.length+' team members')}
      <div class="grid cols-4">
        ${list.map(e=>`<div class="card person-card">
          <div class="pc-top" style="background:${deptColor(e.dept)}"></div>
          <div class="pc-av">${av(e.key,52)}</div>
          <b class="pc-name">${esc(e.name)}</b>
          <span class="muted small">${esc(e.role)}</span>
          <div class="pc-meta">
            <span class="chip">${esc(e.empId)}</span>
            <span class="chip">${esc(e.location.split(',')[0])}</span>
          </div>
          <div class="pc-foot">
            <div><b>${e.present}</b><span>Present</span></div>
            <div><b>${e.leaves}</b><span>Leaves</span></div>
            <div><b>${(e.ctc/100000).toFixed(1)}L</b><span>CTC</span></div>
          </div>
        </div>`).join('')}
      </div>`;
    }).join('')}`;
});

/* ---------------- Attendance & Leave ---------------- */
registerView('attendance', ['Attendance & Leave','Daily presence by department and leave balances'], ()=>{
  const days=ATTENDANCE_DAYS.map(d=>P.fmtDay(d));
  const avg=Math.round(ATTENDANCE.reduce((s,a)=>s+a.days.reduce((x,y)=>x+y,0)/a.days.length,0)/ATTENDANCE.length);
  const onLeave=EMPLOYEES.filter(e=>e.leaves>2).length;

  return `
    <div class="grid cols-4">
      ${miniStat('Average attendance', avg+'%', 'last 10 working days', avg>=85?'#16a34a':'#f59e0b')}
      ${miniStat('Present today', num(Math.round(EMPLOYEES.length*avg/100)), 'of '+EMPLOYEES.length+' staff', '#16a34a')}
      ${miniStat('On leave', onLeave, 'approved absences', '#f59e0b')}
      ${miniStat('Leave balance avg', '9.4 days', 'per employee this year', '#6366f1')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Attendance trend by department','Percentage present per day',
        C.lineChart(days, ATTENDANCE.slice(0,4).map(a=>({
          name:deptName(a.dept), values:a.days, color:deptColor(a.dept)})),{area:false,yFmt:v=>Math.round(v)+'%'}))}
      ${panel('Attendance heatmap','Department × day (%)',
        C.heatmap(ATTENDANCE.map(a=>deptName(a.dept)), days.slice(-6),
          ATTENDANCE.map(a=>a.days.slice(-6)), {color:'#10b981', fmt:v=>v+'%'}))}
    </div>

    ${sectionHead('Employee attendance register','This month to date')}
    <div class="card pad">${tableHTML(
      [{label:'Employee'},{label:'Emp ID'},{label:'Department'},{label:'Location'},{label:'Present'},{label:'Leaves'},{label:'Attendance'},{label:'Status'}],
      EMPLOYEES.map(e=>({cells:[
        `<div class="flex">${av(e.key,28)}<div class="stack"><b>${esc(e.name)}</b><span class="muted small">${esc(e.role)}</span></div></div>`,
        `<span class="plotno">${esc(e.empId)}</span>`, P.deptTag(e.dept),
        `<span class="muted small">${esc(e.location)}</span>`, num(e.present), num(e.leaves),
        `<div style="min-width:110px">${progressBar(e.present, e.present+e.leaves, e.leaves<=2?'#16a34a':'#f59e0b')}<span class="muted small">${pct(e.present,e.present+e.leaves)}%</span></div>`,
        tag(e.status,'#16a34a')]})))}</div>`;
});

/* ---------------- Payroll ---------------- */
registerView('payroll', ['Payroll Summary','Monthly salary run, deductions and department cost'], ()=>{
  const gross=EMPLOYEES.reduce((s,e)=>s+e.ctc/12,0);
  const pf=gross*0.12, tds=gross*0.06, net=gross-pf-tds;
  const byDept={};
  EMPLOYEES.forEach(e=>{ byDept[e.dept]=(byDept[e.dept]||0)+e.ctc/12; });

  return `
    <div class="grid cols-4">
      ${miniStat('Gross payroll', money(gross), 'per month · '+EMPLOYEES.length+' staff', '#3a4fb0')}
      ${miniStat('Statutory deductions', money(pf+tds), 'PF 12% + TDS 6%', '#b45309')}
      ${miniStat('Net disbursement', money(net), 'credited on the 1st', '#16a34a')}
      ${miniStat('Annual cost', crore(gross*12), 'total employment cost', '#b8862b')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Payroll cost by department','Monthly outflow',
        C.donut(Object.keys(byDept).map(d=>({label:deptName(d), value:Math.round(byDept[d]), color:deptColor(d), display:money(byDept[d])})),
          {size:170, center:money(gross), centerSub:'per month'}))}
      ${panel('Salary band distribution','Headcount per band',
        C.barChart(['<5L','5–10L','10–15L','15–20L','20L+'],[{name:'Employees', color:'#6366f1', values:[
          EMPLOYEES.filter(e=>e.ctc<500000).length,
          EMPLOYEES.filter(e=>e.ctc>=500000&&e.ctc<1000000).length,
          EMPLOYEES.filter(e=>e.ctc>=1000000&&e.ctc<1500000).length,
          EMPLOYEES.filter(e=>e.ctc>=1500000&&e.ctc<2000000).length,
          EMPLOYEES.filter(e=>e.ctc>=2000000).length,
        ]}]))}
    </div>

    ${sectionHead('Salary register','Current month · gross to net',
      `<button class="btn sm" data-demo="Generates the bank advice file for the salary run.">${icon('bank',15)} Run payroll</button>`)}
    <div class="card pad">${tableHTML(
      [{label:'Employee'},{label:'Department'},{label:'Joined'},{label:'Annual CTC',align:'right'},{label:'Gross / month',align:'right'},{label:'PF',align:'right'},{label:'TDS',align:'right'},{label:'Net pay',align:'right'}],
      EMPLOYEES.map(e=>{ const g=e.ctc/12;
        return { cells:[
          `<div class="flex">${av(e.key,28)}<div class="stack"><b>${esc(e.name)}</b><span class="muted small">${esc(e.empId)}</span></div></div>`,
          P.deptTag(e.dept), `<span class="muted small">${fmtDate(e.joined)}</span>`,
          lakh(e.ctc), money(g), `<span class="muted">${money(g*0.12)}</span>`,
          `<span class="muted">${money(g*0.06)}</span>`, `<b>${money(g*0.82)}</b>`]};
      }))}</div>`;
});

/* ---------------- Targets & Performance ---------------- */
registerView('performance', ['Targets & Performance','Individual and departmental scorecards'], ()=>{
  const rows=TARGETS.map(t=>({...t, attainment:pct(t.achieved,t.target)}));
  const totalT=rows.reduce((s,r)=>s+r.target,0), totalA=rows.reduce((s,r)=>s+r.achieved,0);
  const activityByUser={};
  state.activity.forEach(a=>{ activityByUser[a.actorKey]=(activityByUser[a.actorKey]||0)+1; });
  const topActors=Object.keys(activityByUser).map(k=>({label:USERS[k].name, value:activityByUser[k], color:deptColor(USERS[k].dept)}))
    .sort((a,b)=>b.value-a.value).slice(0,8);

  return `
    <div class="grid cols-4">
      ${miniStat('Team attainment', pct(totalA,totalT)+'%', money(totalA)+' of '+money(totalT), totalA>=totalT?'#16a34a':'#f59e0b')}
      ${miniStat('Top performer', USERS[rows.slice().sort((a,b)=>b.attainment-a.attainment)[0].key].name.split(' ')[0], rows.slice().sort((a,b)=>b.attainment-a.attainment)[0].attainment+'% of target', '#16a34a')}
      ${miniStat('Above target', rows.filter(r=>r.attainment>=100).length+'/'+rows.length, 'sales executives', '#10b981')}
      ${miniStat('Actions logged', num(state.activity.length), 'by the whole team', '#3a4fb0')}
    </div>

    <div class="grid cols-2 mt">
      ${panel('Sales target vs achievement','Marker shows the monthly target',
        C.bullet(rows.map(r=>({label:USERS[r.key].name, value:r.achieved, target:r.target, color:deptColor('sales')})),{fmt:money}))}
      ${panel('Most active team members','Workflow actions recorded', C.hBars(topActors,{fmt:v=>P.plural(v,'action')}))}
    </div>

    ${sectionHead('Individual scorecards')}
    <div class="grid cols-4">
      ${rows.map(r=>`<div class="card pad score-card">
        <div class="flex" style="margin-bottom:12px">${av(r.key,40)}
          <div class="stack"><b>${esc(USERS[r.key].name)}</b><span class="muted small">${esc(USERS[r.key].role)}</span></div></div>
        ${C.gauge(r.achieved, r.target, {size:132, color:r.attainment>=100?'#16a34a':'#f59e0b', sub:money(r.achieved)})}
        <div class="sc-foot">
          <div><span>Target</span><b>${money(r.target)}</b></div>
          <div><span>Gap</span><b style="color:${r.achieved>=r.target?'#16a34a':'#b91c1c'}">${r.achieved>=r.target?'+':''}${money(r.achieved-r.target)}</b></div>
        </div>
      </div>`).join('')}
    </div>

    ${sectionHead('Departmental scorecard','Ownership, throughput and open workload')}
    <div class="card pad">${tableHTML(
      [{label:'Department'},{label:'Team size'},{label:'Open files'},{label:'Actions logged'},{label:'Avg TAT'},{label:'Health'}],
      ['sales','legal','finance','operations','purchase','hr'].map(d=>{
        const open=state.projects.filter(p=>deptOfStatus(p.statusKey)===d && p.statusKey!=='completed').length;
        const acts=state.activity.filter(a=>a.statusKey && STATUS[a.statusKey].dept===d).length;
        const tat=[3.1,4.2,11,2.4,16,1.2][['sales','legal','finance','operations','purchase','hr'].indexOf(d)];
        const health=open<=4?'Healthy':open<=7?'Watch':'Overloaded';
        return { cells:[ P.deptTag(d), num(DEPARTMENTS[d].members.length), num(open), num(acts), tat+' days',
          tag(health, health==='Healthy'?'#16a34a':health==='Watch'?'#f59e0b':'#ef4444')]};
      }))}</div>`;
});
})();
