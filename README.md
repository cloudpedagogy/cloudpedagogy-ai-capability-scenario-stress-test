# AI Capability Scenario Stress-Test

A lightweight, browser-based exploratory tool for examining how a current AI capability profile may hold up under plausible change scenarios, using the **CloudPedagogy AI Capability Framework**.

The Scenario Stress-Test helps teams surface tensions, fragilities, and pressure points that may emerge when AI use is stressed by rapid change, disruption, or increased scrutiny. It is designed to support **strategic discussion, foresight, and judgement** — not prediction or decision-making.

This tool is part of the **CloudPedagogy AI Capability Tools** suite.


---
## 🛠️ Getting Started

### Clone the repository

```bash
git clone [repository-url]
cd [repository-folder]
```

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Once running, your terminal will display a local URL (often http://localhost:5173). Open this in your browser to use the application.

### Build for production

```bash
npm run build
```

The production build will be generated in the `dist/` directory and can be deployed to any static hosting service.

---

## 🔐 Privacy & Security

- **Fully local**: All data remains in the user's browser  
- **No backend**: No external API calls or database storage  
- **Privacy-preserving**: No tracking or data exfiltration  
- Suitable for use in sensitive organisational and governance contexts  

---
## What this application is

The AI Capability Scenario Stress-Test helps individuals, teams, and organisations:

- explore how existing AI capability might perform under plausible future or disruptive scenarios  
- surface stress points where current practice may become fragile or contested  
- examine how scenario demands interact with strengths, gaps, and imbalances across capability domains  
- support foresight, risk-aware discussion, and strategic sense-making  
- identify small stabilising steps before scaling or extending AI use  

The tool is **capability-led, exploratory, and interpretive**.  
It is explicitly designed to support **professional judgement**, not replace it.

---

## What this application is not

This tool is **not**:

- a prediction engine or forecasting model  
- a compliance audit, checklist, or benchmark  
- a maturity model or ranking system  
- a risk register or legal assessment  
- a policy recommender or automated decision system  
- a substitute for institutional governance or accountability  

All outputs are **signals, prompts, and lenses for discussion**, not decisions.

---

## The AI Capability domains

The Scenario Stress-Test is grounded in the six interdependent domains of the CloudPedagogy AI Capability Framework:

### Awareness & Orientation  
Shared understanding, boundaries, risks, and realistic expectations of AI in context

### Human–AI Co-Agency  
Role clarity, partnership practices, prompting as collaboration, and human judgement in the loop

### Applied Practice & Innovation  
Practical use of AI in workflows, experimentation, iteration, and improvement of practice

### Ethics, Equity & Impact  
Fairness, inclusion, harm reduction, transparency, and attention to downstream impacts

### Decision-Making & Governance  
Accountability, approvals, oversight, policy alignment, and decision hygiene

### Reflection, Learning & Renewal  
Review cycles, learning from experience, capability renewal, and institutional memory

These domains act as **lenses**, not checklists.

---

## How the tool works (user overview)

1. Enter basic context information (team or organisation name, optional notes)  
2. Provide reflective **baseline capability scores (0–4)** across the six domains  
   - If completing as a team, scores should be agreed through discussion  
3. Select **one plausible or strategically relevant scenario**, such as:
   - rapid AI uptake in assessment  
   - regulatory tightening or audit scrutiny  
   - reputational or public incident  
   - vendor disruption or withdrawal  
   - loss of a key AI champion  
   - shifts toward more agentic AI workflows  
4. Optionally select **context signals** (e.g. high-stakes use, public-facing outputs, sensitive data)  
5. Optionally provide **coverage estimates (0–100%)** to highlight structural emphasis or neglect  
6. Run the stress-test to generate:
   - scenario pressure signals by domain  
   - stress-amplified gap and imbalance signals  
   - “why this matters” explanations  
   - committee- and workshop-ready discussion prompts  
   - suggested small stabilisers to consider  

The tool is designed to be used **collaboratively**, not mechanically.

---

## Outputs

The Scenario Stress-Test generates a structured results view including:

- scenario summary and framing  
- baseline capability profile  
- scenario pressure by domain  
- stress-amplified risk and imbalance signals  
- domain-specific context and explanations  
- structured discussion prompts  
- example stabilising actions to consider  

---

## Export / reuse

- **Copy summary for discussion**  
  Copy/paste outputs into:
  - committee papers  
  - QA or governance notes  
  - scenario planning workshop materials  
  - programme or institutional documentation  

- **Print / Save as PDF**  
  Uses the browser’s print function for archiving or sharing.

---

## Typical use cases

- Strategic curriculum foresight and scenario planning  
- AI governance and risk-aware leadership discussions  
- Preparing for regulatory, audit, or reputational scrutiny  
- Stress-testing AI use before scaling or formalisation  
- Design sprints and futures-oriented workshops  
- Exploring resilience under disruption or change  

The tool is especially effective when used with **cross-functional groups** (educators, professional staff, leaders, governance roles).

---

## Data handling and privacy

- The application runs entirely client-side  
- No accounts, analytics, or tracking  
- No data is uploaded or transmitted  
- All inputs exist only in the user’s browser session  
- Clearing the browser resets the session  
- Suitable for static hosting (e.g. AWS S3)

---

## Disclaimer

This repository contains exploratory, framework-aligned tools developed for reflection, learning, and discussion.

These tools are provided **as-is** and are not production systems, audits, or compliance instruments. Outputs are indicative only and should be interpreted in context using professional judgement.

All applications are designed to run locally in the browser. No user data is collected, stored, or transmitted.

---

## Licensing & Scope

This repository contains open-source software released under the MIT License.

CloudPedagogy frameworks and related materials are licensed separately and are not embedded or enforced within this software.

---

## About CloudPedagogy

CloudPedagogy develops open, governance-credible resources for building confident, responsible AI capability across education, research, and public service.

- Website: https://www.cloudpedagogy.com/
- Framework: https://github.com/cloudpedagogy/cloudpedagogy-ai-capability-framework
