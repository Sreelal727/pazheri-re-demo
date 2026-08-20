/* ============================================================
   Pazheri ERP — Extended demo datasets
   Adds the org chart, CRM, land bank, financial & HR records
   that the executive / departmental modules render.
   ============================================================ */

/* ---- Extra staff so the org feels like a real company ---- */
Object.assign(USERS, {
  nithin:   { name:'Nithin Raj',    role:'Chief Executive Officer',  dept:'admin',      initials:'NR' },
  shameem:  { name:'Shameem P K',   role:'Chief Operating Officer',  dept:'operations', initials:'SP' },
  arjun:    { name:'Arjun Das',     role:'Sales Manager',            dept:'sales',      initials:'AD' },
  divya:    { name:'Divya Menon',   role:'Sales Executive (CRE)',    dept:'sales',      initials:'DM' },
  hari:     { name:'Hari Krishnan', role:'Tele-caller / Pre-sales',  dept:'sales',      initials:'HK' },
  reshma:   { name:'Reshma Nair',   role:'Legal Associate',          dept:'legal',      initials:'RN' },
  vivek:    { name:'Vivek Shankar', role:'Title Search Officer',     dept:'legal',      initials:'VS' },
  nowfal:   { name:'Nowfal K',      role:'Accounts Executive',       dept:'finance',    initials:'NK' },
  aswathi:  { name:'Aswathi R',     role:'Collections Officer',      dept:'finance',    initials:'AR' },
  sajith:   { name:'Sajith Kumar',  role:'Registrar Liaison',        dept:'operations', initials:'SK' },
  bindu:    { name:'Bindu Thomas',  role:'Documentation Officer',    dept:'operations', initials:'BT' },
  rafeeq:   { name:'Rafeeq M',      role:'Land Scout',               dept:'purchase',   initials:'RM' },
  seema:    { name:'Seema Joseph',  role:'HR Executive',             dept:'hr',         initials:'SJ' },
});

DEPARTMENTS.sales.members      = ['arjun','deepak','divya','hari'];
DEPARTMENTS.legal.members      = ['sinan','anaswara','reshma','vivek'];
DEPARTMENTS.finance.members    = ['rahul','priya','nowfal','aswathi'];
DEPARTMENTS.operations.members = ['shameem','meera','sajith','bindu'];
DEPARTMENTS.purchase.members   = ['faisal','rafeeq'];
DEPARTMENTS.hr.members         = ['anjali','seema'];
DEPARTMENTS.admin.members      = ['nithin','jabbar'];

/* Role switcher now covers the whole leadership team */
ROLE_OPTIONS.length = 0;
ROLE_OPTIONS.push('nithin','jabbar','rahul','sinan','arjun','shameem','anjali','faisal');

const RNG = PZ.seeded(20250820);

/* ---- 12-month financial & commercial series ------------- */
const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
const MONTHLY = MONTHS.map((m,i)=>{
  const base = 1 + i*0.06;
  return {
    month:m,
    leads:        PZ.between(RNG, 48, 96),
    siteVisits:   PZ.between(RNG, 18, 44),
    bookings:     PZ.between(RNG, 4, 13),
    registrations:PZ.between(RNG, 2, 9),
    revenue:      Math.round((2200000 + RNG()*2600000) * base),
    collections:  Math.round((1800000 + RNG()*2300000) * base),
    expenses:     Math.round((900000  + RNG()*700000)  * base),
    acquisition:  Math.round((RNG()>0.6 ? 3000000+RNG()*6000000 : 0)),
  };
});

/* ---- Lead pipeline (CRM) -------------------------------- */
const LEAD_STAGES = [
  { key:'new',        label:'New Enquiry',   color:'#94a3b8' },
  { key:'contacted',  label:'Contacted',     color:'#3b82f6' },
  { key:'qualified',  label:'Qualified',     color:'#6366f1' },
  { key:'visit',      label:'Site Visit',    color:'#f59e0b' },
  { key:'negotiation',label:'Negotiation',   color:'#ec4899' },
  { key:'booked',     label:'Booked',        color:'#16a34a' },
  { key:'lost',       label:'Lost',          color:'#ef4444' },
];
const LEAD_SOURCES = ['Walk-in','Facebook','Instagram','Google Ads','Referral','Property Portal','Hoarding','Broker'];
const LEAD_NAMES = ['Sudheer Babu','Neethu Ann','Rejith Raj','Sabu Mathew','Haseena Yousuf','Vipin Chandran','Meenakshi S',
  'Ashraf Ali','Deepa Suresh','Jithin Jose','Rasheed K','Anju Elizabeth','Manoj Pillai','Sruthi Ravi','Basheer Ahamed',
  'Tony Varghese','Lakshmi Priya','Naveen Kumar','Shabana Rasheed','Girish Menon','Preethi Ann','Jomon Jacob',
  'Salma Beevi','Rakesh Nambiar','Vidya Balan K','Ajmal Khan','Renjini Devi','Kiran Thomas','Fousiya N','Bijesh Kumar'];
const LEADS = LEAD_NAMES.map((name,i)=>{
  const stage = PZ.pick(RNG, ['new','new','contacted','contacted','qualified','qualified','visit','visit','negotiation','booked','lost']);
  return {
    id:'L'+(101+i), name,
    phone:'9'+PZ.between(RNG,4000000000,4999999999).toString().slice(0,9),
    source: PZ.pick(RNG, LEAD_SOURCES),
    project: PZ.pick(RNG, ['Green Valley, Palakkad','Riverside Meadows, Thrissur','Hill View Gardens, Malappuram',
      'Lake County, Kozhikode','Palm Grove, Kannur','Sunrise Residency, Ernakulam','Orchard Springs, Wayanad','Coastal Enclave, Alappuzha']),
    stage,
    score: PZ.between(RNG, 24, 98),
    budget: PZ.between(RNG, 12, 48) * 100000,
    owner: PZ.pick(RNG, ['arjun','deepak','divya','hari']),
    ageDays: PZ.between(RNG, 0, 60),
    nextAction: PZ.pick(RNG, ['Follow-up call','Schedule site visit','Send price sheet','Negotiate rate','Collect token','Share brochure']),
  };
});

/* ---- Scheduled site visits ------------------------------ */
const SITE_VISITS = Array.from({length:16},(_,i)=>{
  const offset = PZ.between(RNG,-4,9);
  return {
    id:'SV'+(1+i),
    lead: PZ.pick(RNG, LEAD_NAMES),
    project: PZ.pick(RNG, ['Green Valley, Palakkad','Riverside Meadows, Thrissur','Lake County, Kozhikode','Palm Grove, Kannur','Sunrise Residency, Ernakulam']),
    date: PZ.daysFromNow(offset),
    slot: PZ.pick(RNG, ['09:30 AM','11:00 AM','02:00 PM','03:30 PM','05:00 PM']),
    host: PZ.pick(RNG, ['arjun','deepak','divya']),
    status: offset<0 ? PZ.pick(RNG,['Completed','Completed','No-show']) : 'Scheduled',
    vehicle: PZ.pick(RNG, ['Company car','Customer vehicle','Pick-up arranged']),
  };
});

/* ---- Land bank / project inventory ---------------------- */
const LAND_BANK = [
  { code:'GVP', name:'Green Valley',      city:'Palakkad',    totalPlots:48, sold:31, blocked:6, acres:8.2,  rate:275000, acquired:'Mar 2022', status:'Selling',      approval:'RERA · K-RERA/P/2022/118' },
  { code:'RMT', name:'Riverside Meadows', city:'Thrissur',    totalPlots:36, sold:22, blocked:4, acres:6.4,  rate:310000, acquired:'Aug 2022', status:'Selling',      approval:'RERA · K-RERA/P/2022/241' },
  { code:'HVG', name:'Hill View Gardens', city:'Malappuram',  totalPlots:30, sold:19, blocked:3, acres:5.1,  rate:240000, acquired:'Jan 2023', status:'Selling',      approval:'RERA · K-RERA/P/2023/077' },
  { code:'LCK', name:'Lake County',       city:'Kozhikode',   totalPlots:42, sold:24, blocked:7, acres:7.8,  rate:338000, acquired:'Jun 2023', status:'Selling',      approval:'RERA · K-RERA/P/2023/162' },
  { code:'PGK', name:'Palm Grove',        city:'Kannur',      totalPlots:26, sold:11, blocked:2, acres:4.3,  rate:212000, acquired:'Nov 2023', status:'Selling',      approval:'RERA · K-RERA/P/2023/398' },
  { code:'SRE', name:'Sunrise Residency', city:'Ernakulam',   totalPlots:54, sold:17, blocked:9, acres:9.6,  rate:358000, acquired:'Feb 2024', status:'Launch',       approval:'RERA · K-RERA/P/2024/044' },
  { code:'OSW', name:'Orchard Springs',   city:'Wayanad',     totalPlots:22, sold:6,  blocked:3, acres:11.4, rate:186000, acquired:'May 2024', status:'Launch',       approval:'Layout approved' },
  { code:'CEA', name:'Coastal Enclave',   city:'Alappuzha',   totalPlots:18, sold:4,  blocked:2, acres:3.6,  rate:326000, acquired:'Jul 2024', status:'Pre-launch',   approval:'Approval in progress' },
];

/* ---- Land acquisition pipeline (Purchase dept) ---------- */
const ACQUISITIONS = [
  { id:'AQ-01', land:'Kanjikode 3.2 acre', city:'Palakkad',   owner:'Sivaraman & family', acres:3.2, ask:9200000,  offer:8400000,  stage:'Negotiation',      scout:'faisal', due: PZ.daysFromNow(9)  },
  { id:'AQ-02', land:'Ottapalam river-front', city:'Palakkad',owner:'K M Estates',        acres:5.6, ask:16800000, offer:15500000, stage:'Title Search',     scout:'rafeeq', due: PZ.daysFromNow(4)  },
  { id:'AQ-03', land:'Kunnamkulam hillside', city:'Thrissur', owner:'Joseph Varghese',    acres:2.4, ask:6100000,  offer:5750000,  stage:'Advance Paid',     scout:'faisal', due: PZ.daysFromNow(16) },
  { id:'AQ-04', land:'Tirur bypass frontage', city:'Malappuram',owner:'Haji Abdul Kader', acres:1.8, ask:7400000,  offer:6900000,  stage:'Legal Due Diligence',scout:'rafeeq',due: PZ.daysFromNow(2) },
  { id:'AQ-05', land:'Mananthavady slope',   city:'Wayanad',  owner:'Mathew Estates',     acres:8.5, ask:12300000, offer:11000000, stage:'Sourcing',         scout:'faisal', due: PZ.daysFromNow(24) },
  { id:'AQ-06', land:'Cherthala backwater',  city:'Alappuzha',owner:'Padmini Amma',       acres:2.1, ask:8900000,  offer:8500000,  stage:'Registration Scheduled',scout:'rafeeq',due: PZ.daysFromNow(6) },
];

/* ---- Banking partners & loan performance ---------------- */
const BANKS = [
  { name:'SBI',              cases:14, sanctioned:11, pending:2, rejected:1, avgTat:12, rate:8.4, color:'#2563eb' },
  { name:'Federal Bank',     cases:11, sanctioned:8,  pending:3, rejected:0, avgTat:9,  rate:8.6, color:'#0891b2' },
  { name:'HDFC Ltd',         cases:9,  sanctioned:7,  pending:1, rejected:1, avgTat:14, rate:8.8, color:'#7c3aed' },
  { name:'Canara Bank',      cases:7,  sanctioned:5,  pending:2, rejected:0, avgTat:16, rate:8.3, color:'#059669' },
  { name:'South Indian Bank',cases:6,  sanctioned:4,  pending:1, rejected:1, avgTat:11, rate:8.9, color:'#d97706' },
  { name:'LIC Housing',      cases:4,  sanctioned:3,  pending:1, rejected:0, avgTat:18, rate:8.7, color:'#db2777' },
];

/* ---- Expense ledger (CFO console) ----------------------- */
const EXPENSE_HEADS = [
  { head:'Land Acquisition',      amount:24800000, budget:30000000, color:'#3a4fb0' },
  { head:'Development & Layout',  amount:9350000,  budget:11000000, color:'#d4a93f' },
  { head:'Salaries & Payroll',    amount:6420000,  budget:6800000,  color:'#10b981' },
  { head:'Marketing & Ads',       amount:3180000,  budget:2800000,  color:'#ec4899' },
  { head:'Legal & Registration',  amount:2240000,  budget:2600000,  color:'#6366f1' },
  { head:'Sales Commission',      amount:1960000,  budget:2200000,  color:'#f59e0b' },
  { head:'Office & Admin',        amount:1180000,  budget:1400000,  color:'#06b6d4' },
  { head:'Statutory & Taxes',     amount:2760000,  budget:3000000,  color:'#64748b' },
];

/* ---- Vendors / payables --------------------------------- */
const VENDORS = [
  { name:'Kerala Survey Associates', category:'Survey & Layout',  outstanding:340000, terms:'30 days', lastPaid: PZ.daysFromNow(-12) },
  { name:'Adv. R Krishnadas',        category:'Legal Retainer',   outstanding:120000, terms:'Monthly', lastPaid: PZ.daysFromNow(-5)  },
  { name:'Bright Media Kerala',      category:'Marketing',        outstanding:585000, terms:'45 days', lastPaid: PZ.daysFromNow(-21) },
  { name:'Sreedhar Earth Movers',    category:'Site Development', outstanding:1240000,terms:'On bill', lastPaid: PZ.daysFromNow(-3)  },
  { name:'Nova Fencing Works',       category:'Site Development', outstanding:298000, terms:'30 days', lastPaid: PZ.daysFromNow(-33) },
  { name:'Sub-Registrar Fees Pool',  category:'Statutory',        outstanding:0,      terms:'Prepaid', lastPaid: PZ.daysFromNow(-1)  },
];

/* ---- HR: employment records, attendance, payroll -------- */
const EMPLOYEES = Object.keys(USERS).map((k,i)=>{
  const u=USERS[k];
  return {
    key:k, name:u.name, role:u.role, dept:u.dept,
    empId:'PP-'+(1001+i),
    joined: new Date(2019 + PZ.between(RNG,0,5), PZ.between(RNG,0,11), PZ.between(RNG,1,28)),
    ctc: PZ.between(RNG, 3, 22) * 100000,
    present: PZ.between(RNG, 18, 22),
    leaves: PZ.between(RNG, 0, 4),
    location: PZ.pick(RNG, ['Head Office, Palakkad','Thrissur Branch','Kozhikode Branch','Ernakulam Branch']),
    status: 'Active',
  };
});
const ATTENDANCE_DAYS = Array.from({length:10},(_,i)=>PZ.daysFromNow(-(9-i)));
const ATTENDANCE = ['sales','legal','finance','operations','purchase','hr'].map(d=>({
  dept:d,
  days: ATTENDANCE_DAYS.map(()=>PZ.between(RNG, 60, 100)),
}));

/* ---- Targets vs achievement (sales performance) --------- */
const TARGETS = [
  { key:'arjun',  target:9000000,  achieved:10450000 },
  { key:'deepak', target:7500000,  achieved:6820000  },
  { key:'divya',  target:6000000,  achieved:6340000  },
  { key:'hari',   target:3000000,  achieved:2180000  },
];

/* ---- Approvals & task inbox ----------------------------- */
const APPROVALS = [
  { id:'AP-101', type:'Rate Discount',   subject:'Plot D-22 · 4% discount request', raisedBy:'deepak', amount:124000, level:'MD',  status:'Pending',  age:2 },
  { id:'AP-102', type:'Loan Allocation', subject:'Plot C-03 · ₹28.5 L allocation',  raisedBy:'priya',  amount:2850000,level:'CFO', status:'Pending',  age:1 },
  { id:'AP-103', type:'Land Purchase',   subject:'AQ-03 Kunnamkulam advance',       raisedBy:'faisal', amount:600000, level:'MD',  status:'Approved', age:5 },
  { id:'AP-104', type:'Vendor Payment',  subject:'Sreedhar Earth Movers bill #4471',raisedBy:'nowfal', amount:1240000,level:'CFO', status:'Pending',  age:3 },
  { id:'AP-105', type:'Commission',      subject:'Q2 sales incentive payout',       raisedBy:'anjali', amount:486000, level:'CFO', status:'Approved', age:8 },
  { id:'AP-106', type:'Registration',    subject:'Plot B-11 · date confirmation',   raisedBy:'meera',  amount:0,      level:'MD',  status:'Pending',  age:1 },
  { id:'AP-107', type:'Hiring',          subject:'2 CRE positions · Ernakulam',     raisedBy:'seema',  amount:0,      level:'MD',  status:'Pending',  age:6 },
  { id:'AP-108', type:'Marketing Spend', subject:'Onam campaign · digital',         raisedBy:'arjun',  amount:450000, level:'CFO', status:'Rejected', age:11 },
];

/* ---- Compliance & statutory tracker --------------------- */
const COMPLIANCE = [
  { item:'K-RERA quarterly filing — Q2',       owner:'sinan',   due: PZ.daysFromNow(6),   status:'On track',  severity:'MED'  },
  { item:'GST return GSTR-3B — August',        owner:'nowfal',  due: PZ.daysFromNow(3),   status:'On track',  severity:'HIGH' },
  { item:'TDS remittance — 194IA',             owner:'rahul',   due: PZ.daysFromNow(-1),  status:'Overdue',   severity:'HIGH' },
  { item:'Layout approval renewal — Wayanad',  owner:'faisal',  due: PZ.daysFromNow(21),  status:'On track',  severity:'MED'  },
  { item:'Fire NOC — Sunrise Residency',       owner:'shameem', due: PZ.daysFromNow(14),  status:'In review', severity:'MED'  },
  { item:'Professional tax — half yearly',     owner:'anjali',  due: PZ.daysFromNow(9),   status:'On track',  severity:'LOW'  },
  { item:'Encumbrance certificate refresh',    owner:'vivek',   due: PZ.daysFromNow(-3),  status:'Overdue',   severity:'HIGH' },
  { item:'Shops & Establishments renewal',     owner:'seema',   due: PZ.daysFromNow(38),  status:'On track',  severity:'LOW'  },
];

/* ---- Reports library ------------------------------------ */
const REPORTS = [
  { name:'Monthly Sales MIS',            dept:'sales',      period:'Monthly',   format:'XLSX', owner:'arjun',   runs:142 },
  { name:'Collection & Receivables Aging',dept:'finance',   period:'Weekly',    format:'XLSX', owner:'aswathi', runs:96  },
  { name:'Loan Pipeline & Bank TAT',     dept:'finance',    period:'Weekly',    format:'PDF',  owner:'rahul',   runs:74  },
  { name:'Legal Scrutiny Turnaround',    dept:'legal',      period:'Fortnightly',format:'PDF', owner:'sinan',   runs:58  },
  { name:'Registration Schedule',        dept:'operations', period:'Weekly',    format:'PDF',  owner:'meera',   runs:110 },
  { name:'Inventory & Unsold Stock',     dept:'purchase',   period:'Monthly',   format:'XLSX', owner:'faisal',  runs:47  },
  { name:'Payroll Register',             dept:'hr',         period:'Monthly',   format:'PDF',  owner:'anjali',  runs:36  },
  { name:'Board Pack — P&L Summary',     dept:'admin',      period:'Quarterly', format:'PDF',  owner:'rahul',   runs:12  },
  { name:'Lead Source ROI',              dept:'sales',      period:'Monthly',   format:'XLSX', owner:'divya',   runs:41  },
  { name:'Compliance Status Register',   dept:'legal',      period:'Monthly',   format:'PDF',  owner:'reshma',  runs:29  },
];

/* ---- System masters (settings screen) ------------------- */
const MASTERS = [
  { name:'Projects & Layouts',    count:LAND_BANK.length, icon:'layers',   desc:'Project codes, phases, plot numbering and base rates.' },
  { name:'Workflow Stages',       count:Object.keys(STATUS).length, icon:'list', desc:'The 20-step sales → legal → finance → registration flow.' },
  { name:'Departments & Roles',   count:Object.keys(DEPARTMENTS).length, icon:'building', desc:'Department ownership and step-level permissions.' },
  { name:'Users & Access',        count:Object.keys(USERS).length, icon:'users', desc:'Staff logins, role mapping and approval limits.' },
  { name:'Document Checklist',    count:13, icon:'file',    desc:'Mandatory documents per stage and payment route.' },
  { name:'Banking Partners',      count:BANKS.length, icon:'bank', desc:'Empanelled banks, interest slabs and contact desks.' },
  { name:'Charge & Fee Master',   count:9,  icon:'receipt', desc:'Stamp duty, registration fee, maintenance and legal charges.' },
  { name:'Notification Rules',    count:16, icon:'bell',    desc:'Which department gets alerted at each handoff.' },
  { name:'Numbering Series',      count:7,  icon:'sliders', desc:'Booking, receipt, invoice and approval ID formats.' },
];

/* ---- Aggregate helpers used across modules -------------- */
const EXT = {
  months: MONTHS,
  monthly: MONTHLY,
  ytd(key){ return MONTHLY.reduce((s,m)=>s+m[key],0); },
  lastMonth(key){ return MONTHLY[MONTHLY.length-1][key]; },
  prevMonth(key){ return MONTHLY[MONTHLY.length-2][key]; },
  growth(key){
    const a=EXT.lastMonth(key), b=EXT.prevMonth(key);
    return b ? Math.round((a-b)/b*100) : 0;
  },
  series(key){ return MONTHLY.map(m=>m[key]); },
  inventoryTotals(){
    return LAND_BANK.reduce((a,p)=>({
      total:a.total+p.totalPlots, sold:a.sold+p.sold, blocked:a.blocked+p.blocked,
      available:a.available+(p.totalPlots-p.sold-p.blocked),
      acres:a.acres+p.acres,
      stockValue:a.stockValue+(p.totalPlots-p.sold-p.blocked)*p.rate*6,
    }),{total:0,sold:0,blocked:0,available:0,acres:0,stockValue:0});
  },
  leadsByStage(){
    return LEAD_STAGES.map(s=>({...s, count:LEADS.filter(l=>l.stage===s.key).length}));
  },
  leadsBySource(){
    return LEAD_SOURCES.map(src=>({ source:src,
      count: LEADS.filter(l=>l.source===src).length,
      won:   LEADS.filter(l=>l.source===src && l.stage==='booked').length }));
  },
};
