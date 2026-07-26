# Pazheri Properties — Sales & Legal ERP (UI Demo)

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

1. Open **`index.html`**.
2. On the Dashboard, follow the tip: switch to the **Legal** role, open plot
   **D-22 · Nazeer Ahmed**, and click **Mark Complete** on *Loan Eligibility*.
3. Switch the role (top-right) to **Finance** — the **bell** and **Finance Desk** now
   show an *Action needed* prompt for that plot.
4. Open any plot to see its **pipeline**, **documents checklist**, and full
   **audit trail**. Check **Activity & Audit Log** for the company-wide history.

The role switcher (top-right) lets you view the ERP as **Management, Legal, Finance,
Sales or Operations** — actions are gated to the department that owns each step.

## Project structure

```
index.html          # app shell
assets/styles.css   # design system
assets/data.js      # mock departments, people, workflow catalog & plots
assets/app.js       # rendering + interactions (vanilla JS, no framework)
```

## Notes for the client demo

- All data is illustrative. Timestamps, names, amounts and plots are sample content.
- Everything runs client-side, so status changes reset on page reload — this keeps the
  demo self-contained. A production build would persist to a database and push real-time
  updates to every logged-in user.
