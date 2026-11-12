# Task Plan — Jira Test Case Generator

## Phase 0: Initialization
- [x] Read `Blast.md` and `Objective.md`.
- [x] Record known requirements, constraints, and open decisions in project memory.
- [x] Add project constitution and input/output schema.
- [x] Confirm schema decisions by applying the user's instruction to proceed automatically from the objective, with conservative defaults documented in `LLM.md`.

## Phase 1: Blueprint (Vision & Logic)
- [x] Complete discovery using the objective and delegated defaults (see `findings.md`).
- [x] Confirm JSON input/output payload shapes and test-case fields.
- [x] Research primary Jira and Groq API documentation.
- [x] Write and approve implementation blueprint under user's instruction to build the final application.

## Build and delivery phases
- [x] Phase 2 — Link: verify Jira and Groq connectivity and credentials safely.
- [x] Phase 3 — Architect: document architecture/SOPs, then build deterministic tools and app logic.
- [x] Phase 4 — Stylize: refine UI and delivery.
- [x] Phase 5 — Trigger: local production packaging and maintenance documentation finalized. Cloud deployment/automation not configured because no target environment or trigger was specified.

## Approved blueprint
- React + Vite interface, Node.js API server, native `fetch` integration modules under `tools/`.
- Server reads `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, and `GROQ_KEY` from `.env`; configurable Groq model with a safe default.
- User enters issue key; server fetches only the Jira issue; generator receives normalized issue data and returns validated test cases.
- Browser renders cases and exports the agreed six-column CSV; credentials never cross the API boundary.
- Categories cover positive, negative, and requirement-supported edge cases. P0–P3 represent relative test priority; only explicit or requirement-evidenced critical flows can be P0.

## Completion checks
- [x] `npm install` completed; 0 reported vulnerabilities.
- [x] `npm run build` completed successfully.
- [x] Node syntax checks passed for server and tool modules.
- [x] Jira and Groq credentials authenticated successfully via connection check (secret values were never printed).
- [x] Local smoke check passed: UI shell 200, API health 200, Jira connection route 200, Groq connection route 200.
- [x] Production-mode server smoke check passed: UI shell 200 and health endpoint 200.
- [ ] Full issue-to-test-plan run: requires a Jira issue key; none was provided.

## Follow-up: app credential settings
- [x] Add in-app inputs for Jira URL, email, API token, Groq key, and model.
- [x] Persist settings to local `.env`; never return credential values to the browser.
- [x] Replace live-looking values in `.env.example` with placeholders.
- [x] Rebuild and verify settings status/save behavior.
- [x] Verify `.env` write mode is `0600` and credential values are absent from status responses.

## Follow-up: updated objective
- [x] Align generation with exhaustive distinct cases supported by each Jira requirement.
- [x] Keep the case set finite and avoid invented combinations or duplicate cases.
- [x] Fail clearly when Groq truncates a plan rather than display partial coverage.
- [x] Rebuild after the objective update; production bundle passed.

## Gate
Do not write scripts in `tools/` until discovery is answered, the schema is confirmed in `LLM.md`, and the blueprint in this plan is approved.
