# Blast Framework

## Protocol 0: Initialization (Mandatory)

Before any code is written or tools are built:

### 1. Initialize Project Memory

Create:

- `task_plan.md` → Phases, goals, and checklists
- `findings.md` → Research, discoveries, and constraints
- `progress.md` → What was done, errors, tests, and results

Initialize `LLM.md` as the **Project Constitution** containing:

- Data schemas
- Behavioral rules
- Architectural invariants

### 2. Halt Execution

You are strictly forbidden from writing scripts in `tools/` until:

- Discovery Questions are answered
- The Data Schema is defined in `LLM.md`
- `task_plan.md` has an approved Blueprint

---

## 🏗️ Phase 1: B - Blueprint (Vision & Logic)

### 1. Discovery

Ask the user the following 5 questions:

- **North Star:** What is the singular desired outcome?
- **Integrations:** Which external services (Slack, Shopify, etc.) do we need? Are keys ready?
- **Source of Truth:** Where does the primary data live?
- **Delivery Payload:** How and where should the final result be delivered?
- **Behavioral Rules:** How should the system act? For example, tone, specific logic constraints, or "Do Not" rules.

### 2. Data-First Rule

You must define the **JSON Data Schema** (Input/Output shapes) in `LLM.md`.

Coding only begins once the **Payload** shape is confirmed.

### 3. Research

Search GitHub repositories and other relevant databases/resources for anything helpful to the project.

---

## ⚡ Phase 2: L - Link (Connectivity)

### 1. Verification

Test all API connections and `.env` credentials.

### 2. Handshake

Build minimal scripts in `tools/` to verify that external services are responding correctly.

Do not proceed to the full application logic if the **Link** is broken.

---

## ⚙️ Phase 3: A - Architect (The 3-Layer Build)

You operate within a 3-layer architecture that separates concerns to maximize reliability.

LLMs are probabilistic; business logic must be deterministic.

### Layer 1: Architecture (`architecture/`)

- Technical SOPs are written in Markdown.
- Define goals, inputs, tool logic, and edge cases.
- **The Golden Rule:** If logic changes, update the SOP before updating the code.

### Layer 2: Navigation (Decision Making)

- This is your reasoning layer.
- Route data between SOPs and Tools.
- Do not try to perform complex tasks yourself.
- Call execution tools in the correct order.

### Layer 3: Tools (`tools/`)

- Deterministic Python scripts.
- Tools should be atomic and testable.
- Environment variables/tokens are stored in `.env`.
- Use `.tmp/` for all intermediate file operations.

---

## ✨ Phase 4: S - Stylize (Refinement & UI)

### 1. Payload Refinement

Format all outputs for professional delivery.

Examples:

- Slack blocks
- Notion layouts
- Email HTML
- Structured application output

### 2. UI/UX

If the project includes a dashboard or frontend:

- Apply clean CSS/HTML.
- Keep the interface intuitive.
- Present the final payload clearly.

### 3. Feedback

Present the stylized results to the user for feedback before final deployment.

---

## 🛰️ Phase 5: T - Trigger (Deployment)

### 1. Cloud Transfer

Move finalized logic from local testing to the production cloud environment.

### 2. Automation

Set up execution triggers where required.

Examples:

- Cron jobs
- Webhooks
- Listeners

### 3. Documentation

Finalize the **Maintenance Log** in `LLM.md` for long-term stability.