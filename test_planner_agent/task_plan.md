# Task Plan — Jira Test Planner Agent

## Phase 0: Blueprint setup
- [x] Review `B.L.A.S.T_Framework.md`, the test-plan template, and UI screen sketches.
- [x] Capture product requirements and implementation constraints.
- [x] Define initial plan and test-case data contracts in `LLM.md`.
- [x] User approval of this blueprint (2026-11-08).

## Phase 1: Link
- [x] Add configurable OpenAI-compatible and Anthropic provider/API fields and connection check.
- [x] Implement Jira connection test using base URL, email, and API token.
- [x] Store credentials in a local server-side JSON settings file with mode 0600; ignore the file in Git and expose status only.

## Phase 2: Architect
- [x] Initialize React app navigation for Dashboard, LLM Connection, Jira Connection, issue preview, plan review, and generated test cases.
- [x] Implement Jira issue fetch and normalized preview.
- [x] Implement test-plan generation and revision workflow.
- [x] Enforce explicit server-side approval before test-case generation.
- [x] Implement structured test-case generation and schema shape checks.
- [x] Add CSV and PDF downloads.

## Phase 3: Stylize
- [x] Apply the screen sketches as the interaction reference.
- [x] Add responsive layout, light/dark mode, loading, empty, success, and error states.
- [x] Add plan editing and test-case search/filter for review.

## Phase 4: Trigger / delivery
- [x] Document configuration and local startup in `README.md`.
- [x] Production frontend build completes successfully.
- [x] Node server syntax check passes.
- [ ] No cloud deployment or automation is included unless requested.

## Blueprint summary
A React application guides the user through connection settings, Jira issue preview, optional additional context, test-plan generation/review, explicit approval, test-case generation, and PDF/CSV export. Jira remains the requirements source of truth; unsupported behavior is not invented. See `LLM.md` for payload contracts and architecture invariants.

## Gate
Blueprint/schema approval was received on 2026-11-08. Application implementation is complete for the local-development scope; external Jira/LLM credentials have not been configured or tested.
