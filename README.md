# Pazheri Properties — Sales, Legal & Business ERP (UI Demo)

A clickable, front-end **demo UI** for the Pazheri Properties real-estate ERP.
It focuses on the client's core pain point: **live, shared status tracking of every
plot** across departments — so the moment the **Legal** team updates a project, the
**Finance** team (and admins) are notified to begin their task, with a complete,
timestamped history of who did what.

> This is a **design/UX demo** with realistic mock data. No backend, no build step,
> no dependencies — just open `index.html` in any browser.

---

## What it demonstrates

| Client requirement | In the demo |
|---|---|
| Live status of each project, shared to legal members, admins & finance | **Dashboard** + **live activity feed** + notification bell (per-department) |
| Legal status change should *prompt* the finance team | **Finance Desk** shows an **"Action needed"** banner the instant Legal clears a step |
| Proper history — who was assigned, who changed status, all timestamps | **Activity & Audit Log** + per-plot **History & audit trail** |
| Customer name mapped to plot number | Every card & drawer shows **Plot ↔ Customer** mapping |
| Cash vs Loan collection routes | Separate **Cash (KYC)** and **Loan (Financing)** pipelines |
| 6 departments | **Departments** view: Legal, Sales & Marketing, Purchase/Land Acquisition, Operations, Finance, HR |
| Leadership visibility | **Executive Cockpit** (MD) and **CFO Console** with board-level KPIs, charts and approval queues |
| Wider business coverage | 33 modules across Overview, Sales & CRM, Inventory, Legal, Finance, Operations, People and Governance |
| Onboarding a newcomer | **Take a tour** — a 20-step guided walkthrough of the screen, the modules, the workflow and the data flow |

## The workflow (from the client's flowchart)

**Stage 1 — Booking & Verification** → Enquiry & site visit · Token collected ·
Local documents received · **Scrutiny report** · **Evaluation** · Legal verification cleared
_(Sales → Legal)_

**Stage 2 — Payment & Financing**
- **Cash route:** KYC collected (Aadhar, PAN, photos)
- **Loan route:** Loan documents → **Loan eligibility (Legal)** → **Bank verification →
  Loan allocated → Bank visit → Sanction letter (Finance)**
- Then: Pre-registration deed → Deed finalized → Registration date fixed → Deed on stamp paper

**Stage 3 & 4 — Registration & Handover** → Registration completed · Land tax &
possession applied · Documents handed over · Completed & filed _(Legal → Operations)_

The **Legal → Finance handoff** on the loan route is the heart of the demo.

## Try it

0. New to the system? Click **Take a tour** in the header — a 20-step guided
   walkthrough spotlights each part of the screen, explains every button, walks a
   plot through the full workflow and shows what happens to the data on each action.
   Use **→ / ←** to move and **Esc** to leave.
1. Open **`index.html`**.
2. On the Dashboard, follow the tip: switch to the **Legal** role, open plot
   **D-22 · Nazeer Ahmed**, and click **Mark Complete** on *Loan Eligibility*.
3. Switch the role (top-right) to **Finance** — the **bell** and **Finance Desk** now
   show an *Action needed* prompt for that plot.
4. Open any plot to see its **pipeline**, **documents checklist**, and full
   **audit trail**. Check **Activity & Audit Log** for the company-wide history.
5. Open **Executive Cockpit** and **CFO Console** for the leadership view — revenue,
   margin, receivables ageing, budget utilisation and the approval queues.

The role switcher (top-right) lets you view the ERP as **CEO, Managing Director, CFO,
Legal, Sales, Operations, HR or Land Acquisition** — actions are gated to the department
that owns each step.

## Module map

The sidebar groups **33 screens** into eight areas:

| Group | Screens |
|---|---|
| **Overview** | Command Centre · Executive Cockpit (MD) · CFO Console · Analytics & Insights |
| **Sales & CRM** | Leads & Enquiries · Sales Pipeline · Site Visits · Customer 360 · Bookings & Plots |
| **Inventory & Land** | Land Bank · Projects & Phases · Land Acquisition |
| **Legal** | Legal Desk · Title & Scrutiny · Deeds & Registration · Compliance Tracker |
| **Finance** | Finance Desk · Receivables · Bank & Loan Tracker · Expenses & Payables · Commissions |
| **Operations** | Operations Desk · Registration Calendar · Document Vault · Handover Tracker |
| **People** | Departments · Team Directory · Attendance & Leave · Payroll Summary · Targets & Performance |
| **Governance** | Approvals & Tasks · Activity & Audit Log · Reports Library · Settings & Masters |

Every dashboard is built from a dependency-free SVG chart toolkit — line/area, grouped
and stacked bars, donuts, radial gauges, funnels, heatmaps, bullet charts and sparklines.

**Leads, Sales Pipeline and Customer 360** each render in interchangeable layouts —
**Tiles**, **Board** (kanban) and **List** (table) — switchable from the control on the screen.

## Project structure

```
index.html                  # app shell + script order
assets/styles.css           # design tokens & base components
assets/styles-modules.css   # nav groups, charts and v2 screen styles
assets/data.js              # departments, people, workflow catalog & plots
assets/data-extra.js        # org chart, CRM, land bank, financial & HR datasets
assets/lib/core.js          # shared state, formatters, icons, view registry
assets/lib/charts.js        # SVG chart toolkit (no dependencies)
assets/lib/docs.js          # document catalog, upload & viewer
assets/lib/build.js         # derives timelines, audit feed & notifications
assets/lib/nav.js           # navigation tree
assets/lib/tour-steps.js    # the guided tour script & data-flow diagram
assets/lib/tour.js          # tour engine: spotlight, positioning, keyboard
assets/views/*.js           # one file per functional area, self-registering
assets/app.js               # shell: sidebar, topbar, drawer, workflow & events
```

Screens register themselves with `PZ.registerView(key, [title, subtitle], renderFn)`,
so adding a module is one function in one file plus one line in `nav.js`.

## Notes for the client demo

- All data is illustrative. Timestamps, names, amounts and plots are sample content.
- Everything runs client-side, so status changes reset on page reload — this keeps the
  demo self-contained. A production build would persist to a database and push real-time
  updates to every logged-in user.
