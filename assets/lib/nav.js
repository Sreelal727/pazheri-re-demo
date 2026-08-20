/* ============================================================
   Pazheri ERP — Navigation tree (module map of the product)
   ============================================================ */
(function(){
'use strict';
const { state } = window.PZ;

const NAV = [
  { id:'overview', label:'Overview', items:[
    { v:'dashboard',   label:'Command Centre',      ic:'grid'   },
    { v:'exec',        label:'Executive Cockpit',   ic:'crown',  tagText:'MD' },
    { v:'cfo',         label:'CFO Console',         ic:'wallet', tagText:'CFO' },
    { v:'analytics',   label:'Analytics & Insights',ic:'chart'  },
  ]},
  { id:'sales', label:'Sales & CRM', items:[
    { v:'leads',       label:'Leads & Enquiries',   ic:'megaphone', badge:()=>LEADS.filter(l=>l.stage==='new').length },
    { v:'pipeline',    label:'Sales Pipeline',      ic:'trend'  },
    { v:'visits',      label:'Site Visits',         ic:'calendar', badge:()=>SITE_VISITS.filter(v=>v.status==='Scheduled').length },
    { v:'customers',   label:'Customer 360',        ic:'users'  },
    { v:'plots',       label:'Bookings & Plots',    ic:'map'    },
  ]},
  { id:'inventory', label:'Inventory & Land', items:[
    { v:'landbank',    label:'Land Bank',           ic:'layers' },
    { v:'projects',    label:'Projects & Phases',   ic:'building' },
    { v:'acquisition', label:'Land Acquisition',    ic:'handshake', badge:()=>ACQUISITIONS.filter(a=>a.stage!=='Registration Scheduled').length },
  ]},
  { id:'legal', label:'Legal', items:[
    { v:'legal',       label:'Legal Desk',          ic:'scale', badgeDept:'legal' },
    { v:'scrutiny',    label:'Title & Scrutiny',    ic:'shield' },
    { v:'deeds',       label:'Deeds & Registration',ic:'book'   },
    { v:'compliance',  label:'Compliance Tracker',  ic:'flag',  badge:()=>COMPLIANCE.filter(c=>c.status==='Overdue').length },
  ]},
  { id:'finance', label:'Finance', items:[
    { v:'finance',     label:'Finance Desk',        ic:'coins', badgeDept:'finance' },
    { v:'receivables', label:'Receivables',         ic:'receipt' },
    { v:'loans',       label:'Bank & Loan Tracker', ic:'bank'   },
    { v:'expenses',    label:'Expenses & Payables', ic:'card'   },
    { v:'commission',  label:'Commissions',         ic:'percent' },
  ]},
  { id:'ops', label:'Operations', items:[
    { v:'operations',  label:'Operations Desk',     ic:'tool'   },
    { v:'registry',    label:'Registration Calendar',ic:'calendar' },
    { v:'vault',       label:'Document Vault',      ic:'folder' },
    { v:'handover',    label:'Handover Tracker',    ic:'key'    },
  ]},
  { id:'people', label:'People', items:[
    { v:'departments', label:'Departments',         ic:'building' },
    { v:'team',        label:'Team Directory',      ic:'user'   },
    { v:'attendance',  label:'Attendance & Leave',  ic:'clock'  },
    { v:'payroll',     label:'Payroll Summary',     ic:'briefcase' },
    { v:'performance', label:'Targets & Performance',ic:'target' },
  ]},
  { id:'gov', label:'Governance', items:[
    { v:'approvals',   label:'Approvals & Tasks',   ic:'clipboard', badge:()=>APPROVALS.filter(a=>a.status==='Pending').length },
    { v:'activity',    label:'Activity & Audit Log',ic:'history' },
    { v:'reports',     label:'Reports Library',     ic:'bars'   },
    { v:'settings',    label:'Settings & Masters',  ic:'settings' },
  ]},
];

/* Flat lookup: view key -> { group, item } */
const INDEX = {};
NAV.forEach(g=>g.items.forEach(it=>{ INDEX[it.v]={ group:g, item:it }; }));

window.PZNav = { NAV, INDEX };
})();
