/* ============================================================
   Pazheri Properties ERP — Demo data & workflow model
   (all data is mock / illustrative for the client demo)
   ============================================================ */

/* ---- Departments ---------------------------------------- */
const DEPARTMENTS = {
  legal:      { name:'Legal',                     color:'#6366f1', emoji:'⚖️', members:['sinan','anaswara'],
                desc:'Document scrutiny, title verification, eligibility, scrutiny report, evaluation, deed preparation & registration.' },
  finance:    { name:'Finance',                   color:'#10b981', emoji:'💰', members:['rahul','priya'],
                desc:'Loan processing, bank verification & coordination, loan allocation, sanction and fund transfer.' },
  sales:      { name:'Sales & Marketing',         color:'#ec4899', emoji:'📣', members:['deepak'],
                desc:'Enquiry, site visit, booking, token collection and customer relationship (CRE).' },
  purchase:   { name:'Purchase / Land Acquisition',color:'#f59e0b', emoji:'🏞️', members:['faisal'],
                desc:'Sourcing land, negotiation and acquisition of new plots into inventory.' },
  operations: { name:'Operations',                color:'#3b82f6', emoji:'🛠️', members:['meera'],
                desc:'Registrar follow-up, land tax & possession filing and document handover to customer.' },
  hr:         { name:'HR',                        color:'#06b6d4', emoji:'👥', members:['anjali'],
                desc:'Team, roles, attendance and internal coordination across departments.' },
  admin:      { name:'Management',                color:'#64748b', emoji:'🏛️', members:['jabbar'],
                desc:'Oversight of every project, registration scheduling and final approvals.' },
};

/* ---- People --------------------------------------------- */
const USERS = {
  jabbar:  { name:'Jabbar',   role:'Managing Director',      dept:'admin',      initials:'JB' },
  sinan:   { name:'Sinan',    role:'Legal Officer',          dept:'legal',      initials:'SN' },
  anaswara:{ name:'Anaswara', role:'Legal Associate',        dept:'legal',      initials:'AN' },
  rahul:   { name:'Rahul',    role:'Finance Head (CFO)',     dept:'finance',    initials:'RH' },
  priya:   { name:'Priya',    role:'Finance Executive',      dept:'finance',    initials:'PR' },
  deepak:  { name:'Deepak',   role:'Sales Executive (CRE)',  dept:'sales',      initials:'DP' },
  meera:   { name:'Meera',    role:'Operations Executive',   dept:'operations', initials:'ME' },
  faisal:  { name:'Faisal',   role:'Land Acquisition',       dept:'purchase',   initials:'FA' },
  anjali:  { name:'Anjali',   role:'HR Manager',             dept:'hr',         initials:'AJ' },
};

/* Roles selectable in the demo role-switcher */
const ROLE_OPTIONS = ['jabbar','sinan','rahul','deepak','meera'];

/* ---- Workflow status catalog (from client flowchart) ---- */
/* dept = department that OWNS / performs this step               */
const STATUS = {
  enquiry:        { label:'Enquiry & Site Visit',            dept:'sales',      stage:1, hint:'Customer interested in plot' },
  token:          { label:'Token Amount Collected',          dept:'sales',      stage:1, hint:'Booking form, receipt, rate/cent' },
  docs_received:  { label:'Local Documents Received',        dept:'legal',      stage:1, hint:'Deed, backdeed, land tax, possession, thandaperu' },
  scrutiny:       { label:'Scrutiny Report',                 dept:'legal',      stage:1, hint:'Legal scrutiny & document verification' },
  evaluation:     { label:'Evaluation / Valuation',          dept:'legal',      stage:1, hint:'Title & value evaluation' },
  legal_clear:    { label:'Legal Verification Cleared',      dept:'legal',      stage:1, hint:'Complete within 1 week' },

  /* Cash route only */
  kyc:            { label:'KYC Collected',                   dept:'legal',      stage:2, route:'cash', hint:'Aadhar, PAN, 2 photos' },

  /* Loan route only */
  loan_docs:      { label:'Loan Documents Collected',        dept:'sales',      stage:2, route:'loan', hint:'Collected from customer (CRE)' },
  eligibility:    { label:'Loan Eligibility Confirmed',      dept:'legal',      stage:2, route:'loan', hint:'Business: 3yr ITR / Salaried: 6mo slips' },
  bank_verify:    { label:'Bank Verification',               dept:'finance',    stage:2, route:'loan', hint:'Legal & valuator coordination' },
  loan_allocated: { label:'Loan Amount Allocated',           dept:'finance',    stage:2, route:'loan', hint:'Amount fixed by Finance' },
  bank_visit:     { label:'Bank Visit & Processing',         dept:'finance',    stage:2, route:'loan', hint:'Customer bank login' },
  sanction:       { label:'Sanction Letter Received',        dept:'finance',    stage:2, route:'loan', hint:'Shared to customer' },

  /* Common — deed */
  pre_deed:       { label:'Pre-Registration Deed Prepared',  dept:'legal',      stage:2, hint:'Prepared & sent to customer' },
  deed_final:     { label:'Pre-Registration Deed Finalized', dept:'legal',      stage:2, hint:'Corrections closed' },
  reg_date:       { label:'Registration Date Fixed',         dept:'admin',      stage:2, hint:'Scheduled with customer' },
  stamp_deed:     { label:'Deed on Stamp Paper',             dept:'legal',      stage:2, hint:'Prepared on stamp paper' },

  /* Stage 3 & 4 — registration + handover */
  registration:   { label:'Registration Completed',         dept:'legal',      stage:3, hint:'Registration docs & deed collected' },
  land_tax:       { label:'Land Tax & Possession Applied',   dept:'operations', stage:3, hint:'Applied in customer name' },
  handover:       { label:'Documents Handed Over',           dept:'operations', stage:3, hint:'Customer signs receipt form' },
  completed:      { label:'Completed & Filed',               dept:'legal',      stage:3, hint:'All documents filed' },
};

const STAGES = [
  { n:1, name:'Booking & Verification' },
  { n:2, name:'Payment & Financing' },
  { n:3, name:'Registration & Handover' },
];

const ROUTE_CASH = ['enquiry','token','docs_received','scrutiny','evaluation','legal_clear',
  'kyc','pre_deed','deed_final','reg_date','stamp_deed','registration','land_tax','handover','completed'];

const ROUTE_LOAN = ['enquiry','token','docs_received','scrutiny','evaluation','legal_clear',
  'loan_docs','eligibility','bank_verify','loan_allocated','bank_visit','sanction',
  'pre_deed','deed_final','reg_date','stamp_deed','registration','land_tax','handover','completed'];

/* ---- Projects (customer ↔ plot) ------------------------- */
/* statusKey = CURRENT stage the plot is sitting at            */
const SEED_PROJECTS = [
  { id:'P1', plot:'A-12', customer:'Ramesh Kumar',   phone:'98470 11223', location:'Green Valley, Palakkad',
    area:8,  rate:275000, payment:'Loan', employment:'Salaried', statusKey:'bank_verify', assigned:'rahul', priority:'HIGH', ageDays:26 },
  { id:'P2', plot:'D-22', customer:'Nazeer Ahmed',   phone:'99610 44556', location:'Riverside Meadows, Thrissur',
    area:12, rate:310000, payment:'Loan', employment:'Business', statusKey:'eligibility', assigned:'sinan', priority:'HIGH', ageDays:14 },
  { id:'P3', plot:'B-07', customer:'Lakshmi Nair',   phone:'94470 77889', location:'Hill View Gardens, Malappuram',
    area:6,  rate:225000, payment:'Cash', employment:null,       statusKey:'stamp_deed', assigned:'sinan', priority:'MED', ageDays:31 },
  { id:'P4', plot:'C-21', customer:'Abdul Rahman',   phone:'97440 33221', location:'Lake County, Kozhikode',
    area:10, rate:340000, payment:'Loan', employment:'Business', statusKey:'sanction', assigned:'rahul', priority:'MED', ageDays:22 },
  { id:'P5', plot:'A-05', customer:'Suresh Menon',   phone:'90370 88776', location:'Green Valley, Palakkad',
    area:5,  rate:260000, payment:'Cash', employment:null,       statusKey:'completed', assigned:'sinan', priority:'LOW', ageDays:48 },
  { id:'P6', plot:'D-14', customer:'Fathima Beevi',  phone:'85890 22114', location:'Riverside Meadows, Thrissur',
    area:7,  rate:295000, payment:'Loan', employment:'Salaried', statusKey:'scrutiny', assigned:'anaswara', priority:'MED', ageDays:9 },
  { id:'P7', plot:'B-19', customer:'George Thomas',  phone:'99950 66332', location:'Hill View Gardens, Malappuram',
    area:9,  rate:240000, payment:'Cash', employment:null,       statusKey:'pre_deed', assigned:'anaswara', priority:'LOW', ageDays:35 },
  { id:'P8', plot:'C-03', customer:'Anitha Raj',     phone:'70120 99001', location:'Lake County, Kozhikode',
    area:11, rate:330000, payment:'Loan', employment:'Salaried', statusKey:'loan_allocated', assigned:'priya', priority:'HIGH', ageDays:19 },
  { id:'P9', plot:'E-08', customer:'Vishnu Prasad',  phone:'94960 55443', location:'Palm Grove, Kannur',
    area:4,  rate:210000, payment:'Cash', employment:null,       statusKey:'token', assigned:'deepak', priority:'LOW', ageDays:4 },
  { id:'P10',plot:'A-18', customer:'Sneha Pillai',   phone:'80860 12345', location:'Green Valley, Palakkad',
    area:6,  rate:270000, payment:'Loan', employment:'Business', statusKey:'handover', assigned:'meera', priority:'MED', ageDays:41 },
  { id:'P11',plot:'E-15', customer:'Nazrin Fathima', phone:'75940 87654', location:'Palm Grove, Kannur',
    area:5,  rate:205000, payment:'Cash', employment:null,       statusKey:'enquiry', assigned:'deepak', priority:'LOW', ageDays:2 },
  { id:'P12',plot:'B-11', customer:'Joseph Kurian',  phone:'98950 33445', location:'Hill View Gardens, Malappuram',
    area:8,  rate:250000, payment:'Loan', employment:'Salaried', statusKey:'reg_date', assigned:'jabbar', priority:'MED', ageDays:29 },

  { id:'P13',plot:'F-04', customer:'Prakash Varma',  phone:'90720 45611', location:'Green Valley, Palakkad',
    area:7,  rate:280000, payment:'Loan', employment:'Salaried', statusKey:'evaluation', assigned:'anaswara', priority:'MED', ageDays:11 },
  { id:'P14',plot:'F-09', customer:'Zainaba Kunju',  phone:'94002 78123', location:'Coastal Enclave, Alappuzha',
    area:6,  rate:235000, payment:'Cash', employment:null,       statusKey:'kyc', assigned:'sinan', priority:'LOW', ageDays:7 },
  { id:'P15',plot:'G-02', customer:'Thomas Mathew',  phone:'99461 20934', location:'Lake County, Kozhikode',
    area:13, rate:345000, payment:'Loan', employment:'Business', statusKey:'bank_visit', assigned:'priya', priority:'HIGH', ageDays:24 },
  { id:'P16',plot:'G-11', customer:'Radhika Menon',  phone:'85471 66200', location:'Riverside Meadows, Thrissur',
    area:5,  rate:300000, payment:'Cash', employment:null,       statusKey:'registration', assigned:'sinan', priority:'LOW', ageDays:44 },
  { id:'P17',plot:'H-03', customer:'Ibrahim Haji',   phone:'97889 51044', location:'Orchard Springs, Wayanad',
    area:15, rate:260000, payment:'Loan', employment:'Business', statusKey:'loan_docs', assigned:'deepak', priority:'MED', ageDays:6 },
  { id:'P18',plot:'H-08', customer:'Sowmya Nair',    phone:'90370 44528', location:'Hill View Gardens, Malappuram',
    area:8,  rate:245000, payment:'Cash', employment:null,       statusKey:'deed_final', assigned:'anaswara', priority:'MED', ageDays:33 },
  { id:'P19',plot:'A-24', customer:'Alan Jacob',     phone:'98470 90012', location:'Green Valley, Palakkad',
    area:9,  rate:275000, payment:'Loan', employment:'Salaried', statusKey:'eligibility', assigned:'sinan', priority:'HIGH', ageDays:13 },
  { id:'P20',plot:'B-30', customer:'Devika Suresh',  phone:'70129 33417', location:'Sunrise Residency, Ernakulam',
    area:10, rate:360000, payment:'Loan', employment:'Salaried', statusKey:'sanction', assigned:'rahul', priority:'MED', ageDays:21 },
  { id:'P21',plot:'C-14', customer:'Muhammed Ali',   phone:'94960 71828', location:'Lake County, Kozhikode',
    area:6,  rate:335000, payment:'Cash', employment:null,       statusKey:'pre_deed', assigned:'sinan', priority:'LOW', ageDays:28 },
  { id:'P22',plot:'D-31', customer:'Anju Rani',      phone:'80860 55290', location:'Riverside Meadows, Thrissur',
    area:12, rate:315000, payment:'Loan', employment:'Business', statusKey:'loan_allocated', assigned:'priya', priority:'HIGH', ageDays:18 },
  { id:'P23',plot:'E-19', customer:'Fahad Rahman',   phone:'75940 12093', location:'Palm Grove, Kannur',
    area:5,  rate:215000, payment:'Cash', employment:null,       statusKey:'handover', assigned:'meera', priority:'LOW', ageDays:39 },
  { id:'P24',plot:'F-22', customer:'Gopika Krishnan',phone:'98950 78341', location:'Orchard Springs, Wayanad',
    area:7,  rate:290000, payment:'Loan', employment:'Salaried', statusKey:'scrutiny', assigned:'anaswara', priority:'MED', ageDays:8 },
  { id:'P25',plot:'G-18', customer:'Benny Varghese', phone:'94470 30187', location:'Coastal Enclave, Alappuzha',
    area:11, rate:325000, payment:'Loan', employment:'Business', statusKey:'token', assigned:'deepak', priority:'LOW', ageDays:3 },
  { id:'P26',plot:'H-15', customer:'Shalini Pillai', phone:'99610 82244', location:'Sunrise Residency, Ernakulam',
    area:6,  rate:355000, payment:'Cash', employment:null,       statusKey:'completed', assigned:'sinan', priority:'LOW', ageDays:52 },
];

/* documents checklist template (per project we mark collected) */
const DOC_LIST = ['Booking Form','Original Deed','Backdeed','Land Tax Receipt','Possession Certificate','Thandaper','Aadhar Card','PAN Card'];

/* Route helpers */
function routeFor(p){ return p.payment === 'Loan' ? ROUTE_LOAN : ROUTE_CASH; }
function stepIndex(p){ return routeFor(p).indexOf(p.statusKey); }
function progressPct(p){ const r=routeFor(p); return Math.round(((r.indexOf(p.statusKey)+1)/r.length)*100); }
function deptOfStatus(k){ return STATUS[k] ? STATUS[k].dept : 'admin'; }
