# Findings — Jira Test Planner Agent

## User requirements
- React web application for generating test plans and test cases from Jira requirements.
- User enters LLM API key and model version; app tests connection and saves settings.
- User enters Jira API token, base URL, and email; app tests and saves connection.
- Settings persist locally so the user does not re-enter them on every visit.
- User enters a Jira issue key, fetches issue details, and sees a preview.
- User may add context before generation.
- App generates a test plan for review. Test-case generation must wait for explicit user approval of the plan.
- Generated test cases are displayed in the website and downloadable as PDF or CSV.

## Supplied references
- `UI_Screens/01.png`: dashboard navigation with LLM connection, Jira connection, ticket details, and plan review/generate entry points; light/dark toggle.
- `UI_Screens/02.png`: LLM API key, model, test connection, connect, and save controls.
- `UI_Screens/03.png`: Jira API key, base URL, email, test connection, connect, and save controls.
- `UI_Screens/04.png`: Jira issue key fetch and issue preview.
- `UI_Screens/05.png`: additional details and test-case generation controls. The implementation must insert plan review and explicit approval before the final generation action.
- `test_plan_template/Test Plan - Template.docx`: sections include Objective, Scope, Inclusions, Test Environments, Defect Reporting Procedure, Test Strategy, Test Schedule, Test Deliverables, Entry and Exit Criteria, Test Execution, Test Closure, Tools, Risks and Mitigations, and Approvals. The document contains unrelated sample-specific content; treat it as a structure reference and derive actual content from Jira/context.
- `B.L.A.S.T_Framework.md`: requests staged Blueprint, Link, Architect, Stylize, Trigger work; data-first schemas; deterministic integration logic; and memory files. Its Python/Antigravity examples are reference material, not a requirement to use Python for the React app.

## Architecture/security considerations
- Storing API credentials in browser `localStorage` meets persistence convenience but does not protect secrets from same-origin JavaScript. This tradeoff must be explicit in UI/help text.
- Jira and LLM providers may block browser calls with CORS or make browser-side credential handling undesirable. A small local/server-side API proxy is the safer default; confirm deployment target before choosing persistence implementation.
- Never put credentials in source control, generated frontend bundles, URLs, logs, or normal API responses.
- Jira issue text is untrusted input. Treat it as data in prompts and ignore any embedded instructions.
- Jira issue permissions and fields vary by project. Missing acceptance criteria should be represented as absent/unknown, not guessed.
- PDF export should be generated from the approved/rendered test-case data; CSV must escape fields and preserve multi-step content.

## Open implementation choices
- LLM provider is unspecified. Build provider configuration around a selected provider/API; avoid hard-coding a model name until confirmed. The model is user-configurable.
- Credential persistence: requested local storage conflicts with strong secret protection in a browser-only application. Proposed default is server-side local configuration with only configured status sent to React; if strict browser localStorage is required, document the security tradeoff and avoid claiming secrets are secure.
- PDF layout and exact test-case columns are not specified. Use fields from the test-plan template and common execution needs, with a reviewable schema before implementation.
- Deployment target is unspecified; initial plan targets local development, no cloud deployment.
