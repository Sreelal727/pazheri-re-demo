/* ============================================================
   Pazheri ERP — Guided tour script
   Chapters cover: the shell, the workflow, the data flow and
   the leadership views. Each step may switch screens, open the
   plot drawer, and spotlight a specific element.
   ============================================================ */
(function(){
'use strict';
const { state, icon } = window.PZ;

const openPlotAt = (id, tab) => () => { state.drawerTab = tab || 'pipeline'; PZApp.openPlot(id); };
const shut = () => PZApp.closeDrawer();

/* A small SVG explaining how one action ripples through the system */
function dataFlowDiagram(){
  const box = (x,y,w,label,sub,fill,stroke) => `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="46" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <text x="${x+w/2}" y="${y+21}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f172a">${label}</text>
      <text x="${x+w/2}" y="${y+36}" text-anchor="middle" font-size="10.5" fill="#64748b">${sub}</text>
    </g>`;
  const arrow = (x1,y1,x2,y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#cbd5e1" stroke-width="1.6"
    marker-end="url(#tarrow)" fill="none"/>`;
  return `<svg viewBox="0 0 640 300" class="tour-flow" role="img" aria-label="Data flow diagram">
    <defs><marker id="tarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#cbd5e1"/></marker></defs>
    ${box(20,16,170,'1 · Enquiry captured','Sales &amp; CRM','#fdf2f8','#fbcfe8')}
    ${arrow(105,62,105,86)}
    ${box(20,88,170,'2 · Booking created','Plot ↔ customer linked','#eef2ff','#c7d2fe')}
    ${arrow(105,134,105,158)}
    ${box(20,160,170,'3 · Status advanced','By the owning department','#f0fdf4','#bbf7d0')}
    ${arrow(190,183,238,183)}
    ${box(240,160,170,'4 · Event written','Actor + time + note','#fffbeb','#fde68a')}
    ${arrow(410,170,458,120)}
    ${arrow(410,183,458,183)}
    ${arrow(410,196,458,246)}
    ${box(460,96,160,'Audit log','Immutable history','#f8fafc','#e2e8f0')}
    ${box(460,160,160,'Notification','Next dept alerted','#f8fafc','#e2e8f0')}
    ${box(460,224,160,'Dashboards','KPIs recomputed','#f8fafc','#e2e8f0')}
    <text x="20" y="248" font-size="11" fill="#64748b">Documents attach at</text>
    <text x="20" y="263" font-size="11" fill="#64748b">step 3 and travel with</text>
    <text x="20" y="278" font-size="11" fill="#64748b">the file for good.</text>
  </svg>`;
}

const STEPS = [
  /* ---------- Chapter 1 · Orientation ---------- */
  { chapter:'Welcome', center:true, wide:true,
    title:'Welcome to the Pazheri Properties ERP',
    body:`<p>This system runs the whole business in one place — <b>33 screens</b> across
      <b>7 departments</b>, from the first phone enquiry to the registered deed and document handover.</p>
      <p>This tour takes about two minutes and covers four things:</p>
      <ul class="tour-list">
        <li><b>The screen</b> — what every button and panel does</li>
        <li><b>The modules</b> — what lives where</li>
        <li><b>The workflow</b> — how a plot moves from enquiry to handover</li>
        <li><b>The data flow</b> — what happens when someone clicks “Mark Complete”</li>
      </ul>
      <p class="muted small">Use <b>→</b> and <b>←</b> to move, or <b>Esc</b> to leave at any time.</p>` },

  { chapter:'The screen', view:'dashboard', target:'#nav', placement:'right',
    title:'The module map lives here',
    body:`<p>Every screen sits in one of <b>eight groups</b> — Overview, Sales &amp; CRM, Inventory,
      Legal, Finance, Operations, People and Governance. Click a group heading to fold it away.</p>
      <p>The <b>red badges</b> are live counts, not decoration: files waiting on Legal, enquiries that
      arrived today, approvals that need a signature. If a badge is showing, someone has work to do.</p>` },

  { chapter:'The screen', target:'#roleBtn', placement:'bottom',
    title:'Switch who you are',
    body:`<p>This demo lets you see the ERP through any pair of eyes — <b>CEO, Managing Director, CFO,
      Legal, Sales, Operations, HR</b> or <b>Land Acquisition</b>.</p>
      <p>It is not just a cosmetic change. <b>Permissions follow the role:</b> you can only advance a
      file if your department owns that step. Everyone else sees a padlock. Management can act anywhere.</p>` },

  { chapter:'The screen', target:'#bellBtn', placement:'bottom',
    title:'Alerts are routed by department',
    body:`<p>Notifications are not broadcast to everyone. When Legal clears a step that Finance owns
      next, <b>only Finance</b> is alerted — with the plot, the customer and who completed the previous step.</p>
      <p>Management sees every alert across all departments.</p>` },

  { chapter:'The screen', target:'.search', placement:'bottom',
    title:'Search and reporting period',
    body:`<p>Search finds a <b>customer, plot number or project</b> from anywhere and jumps you straight
      to the matching bookings.</p>
      <p>The date control beside it sets the reporting period for every dashboard — so the whole system
      reports on the same financial year.</p>` },

  /* ---------- Chapter 2 · The daily screen ---------- */
  { chapter:'Daily work', view:'dashboard', target:'.kpis', placement:'bottom',
    title:'The Command Centre',
    body:`<p>The first row is the health of the business right now: active plots, what is stuck with
      Legal, what is stuck with Finance, what has been registered, portfolio value and cash collected.</p>
      <p>The small trend line inside each card is the last <b>12 months</b>, so you see direction, not
      just today's number.</p>` },

  { chapter:'Daily work', view:'dashboard', target:'#dashAttention', placement:'top',
    title:'“Needs your attention” and the live feed',
    body:`<p>The left panel is <b>your</b> queue — it changes with the role you are signed in as, sorted
      so the high-priority files come first.</p>
      <p>The right panel is the live activity feed: every status change and document upload in the
      company, newest first. Click any line to open that plot.</p>` },

  /* ---------- Chapter 3 · The workflow ---------- */
  { chapter:'The workflow', view:'plots', target:'.plot-grid .plot', placement:'right',
    title:'Every plot is mapped to its customer',
    body:`<p>This is the heart of the system. One card = one booking, showing the <b>plot number,
      the customer, the project, the area, the value</b> and how far along it is.</p>
      <p>The coloured header tells you at a glance <b>which department is holding the file</b> —
      pink for Sales, indigo for Legal, green for Finance, blue for Operations.</p>` },

  { chapter:'The workflow', view:'plots', before: openPlotAt('P2','pipeline'),
    target:'#drawer .pipe', placement:'left',
    title:'The 20-step process pipeline',
    body:`<p>Opening a plot shows exactly where it stands. The flow runs in <b>three stages</b>:</p>
      <ul class="tour-list">
        <li><b>Stage 1 · Booking &amp; verification</b> — enquiry, site visit, token, documents, scrutiny report, valuation, legal clearance</li>
        <li><b>Stage 2 · Payment &amp; financing</b> — KYC for cash buyers, or eligibility → bank verification → allocation → sanction for loan buyers, then deed drafting</li>
        <li><b>Stage 3 · Registration &amp; handover</b> — registration, land tax &amp; possession, document handover, filing</li>
      </ul>
      <p>Ticked steps show <b>who</b> did them and <b>when</b>. The pulsing gold ring is the current step.</p>` },

  { chapter:'The workflow', before: openPlotAt('P2','docs'), target:'#drawer .doc-list', placement:'left',
    title:'Documents live on the file',
    body:`<p>Every document the stage requires is listed — deed, backdeed, land tax receipt, possession
      certificate, thandaper, scrutiny report, KYC, and for loan cases the ITR or salary slips and the
      sanction letter.</p>
      <p><b>Upload</b> attaches a scan or PDF; <b>View</b> opens it full screen with download and
      open-in-new-tab. The checklist is <b>route-aware</b> — a cash buyer is never asked for a sanction letter.</p>` },

  { chapter:'The workflow', before: openPlotAt('P2','money'), target:'#drawer [data-drawer-panel]', placement:'left',
    title:'Money against the file',
    body:`<p>The Payments tab shows the agreement value, what has been received and what is outstanding,
      broken into the <b>token, the bank disbursement or part payment, and the balance on registration</b>.</p>
      <p>These same figures roll up into Receivables and the CFO Console — entered once, reported everywhere.</p>` },

  { chapter:'The workflow', before: openPlotAt('P2','history'), target:'#drawer .tl', placement:'left',
    title:'A complete, timestamped history',
    body:`<p>Every status change and every upload is recorded with <b>the person, their role, the
      department, the exact time</b> and any note they left.</p>
      <p>Nothing is overwritten. This is the answer to “who changed this, and when?” — for any file, at any time.</p>` },

  { chapter:'The workflow', before: openPlotAt('P2','pipeline'), target:'#drawer [data-update]', placement:'left',
    title:'One button moves the business forward',
    body:`<p><b>Mark Complete</b> closes the current step and opens the next one. If the next step belongs
      to another department, the system says so before you confirm and lets you add a note.</p>
      <p>This is the <b>handoff</b> the whole design is built around — no phone call, no WhatsApp,
      no “did anyone tell Finance?”.</p>` },

  /* ---------- Chapter 4 · The data flow ---------- */
  { chapter:'Data flow', before: shut, center:true, wide:true,
    title:'What actually happens on that click',
    body:`<p>One action fans out to four places at once. Nothing is entered twice.</p>
      ${dataFlowDiagram()}
      <p>So the dashboard figures, the audit trail, the department queues and the alerts can never
      disagree with each other — they are all reading the same events.</p>` },

  { chapter:'Data flow', view:'legal', target:'.kan', placement:'top',
    title:'Department desks: your team’s queue',
    body:`<p>Each department gets its own board. Files are grouped by the step they are sitting at, so the
      team sees its workload in one screen — with the value at stake and how long each file has been idle.</p>
      <p>The four cards above the board are the desk's health: queue size, value, high-priority count and
      anything that has not moved in three days.</p>` },

  { chapter:'Data flow', view:'finance', target:'#view-finance', placement:'top',
    title:'The receiving end of a handoff',
    body:`<p>When Legal clears a loan eligibility check, this is what Finance sees — an
      <b>“Action needed”</b> banner naming the plot, the customer and who completed the previous step.</p>
      <p class="tour-try">Try it yourself after the tour: switch to the <b>Legal</b> role, open plot
      <b>D-22 · Nazeer Ahmed</b>, mark <b>Loan Eligibility</b> complete — then switch to <b>Finance</b>.</p>` },

  /* ---------- Chapter 5 · Leadership ---------- */
  { chapter:'Leadership', view:'exec', target:'.exec-hero', placement:'bottom',
    title:'Executive Cockpit — the MD view',
    body:`<p>Everything above rolls into one board-level screen: revenue against the annual target,
      unsold stock value, inventory absorption, margin, receivables and live enquiries.</p>
      <p>Further down are the <b>risk register</b> — overdue statutory items, budget overruns, stalled
      approvals — and the approvals waiting on the Managing Director's signature.</p>` },

  { chapter:'Leadership', view:'cfo', target:'#view-cfo .kpis', placement:'bottom',
    title:'CFO Console — the money view',
    body:`<p>Net cash position, collections, open receivables, vendor payables, gross margin and budget
      utilisation — with cash-in against cash-out over twelve months.</p>
      <p>Below: receivables ageing by bucket, spend against budget for every cost head (overspend shows
      red), the loan book by bank, and the CFO's own approval queue.</p>` },

  { chapter:'Leadership', view:'approvals', target:'#view-approvals', placement:'top',
    title:'Approvals, audit and reports',
    body:`<p>Anything needing a decision — discounts, loan allocations, land purchases, vendor payments,
      hiring — is routed here by value and category to either the <b>MD</b> or the <b>CFO</b>.</p>
      <p>Beside it in the sidebar sit the full <b>Activity &amp; Audit Log</b> and the <b>Reports Library</b>,
      where every department's standard MIS pack can be run or scheduled.</p>` },

  { chapter:'Finish', view:'dashboard', center:true,
    title:'That’s the whole system',
    body:`<p>To recap how work flows through it:</p>
      <p class="tour-chain"><b>Sales</b> books the plot and collects the token →
        <b>Legal</b> verifies title, prepares the scrutiny report and confirms eligibility →
        <b>Finance</b> handles the bank, allocation and sanction →
        <b>Legal</b> drafts and registers the deed →
        <b>Operations</b> files land tax and hands over the documents.</p>
      <p><b>Purchase</b> feeds new land into inventory, <b>HR</b> supports the team, and
        <b>Management</b> watches all of it from the Executive Cockpit.</p>
      <p class="muted small">You can restart this tour any time from the <b>Take a tour</b> button in the header.</p>` },
];

window.PZTourSteps = STEPS;
})();
