# Project Constitution — Jira Test Case Generator

## Purpose
Build a lightweight React + Node.js application that fetches a Jira issue, generates independently executable test cases through Groq, displays them, and exports them as CSV.

## Behavioral rules
- Jira is the source of truth. Use only information provided by the fetched issue and explicitly agreed Jira fields.
- Do not invent requirements or undocumented behavior. Mark missing or unclear details `[NOT SPECIFIED]`.
- Prioritize identifiable P0/critical flows supported by the requirement; cover positive, negative, and relevant edge cases.
- Enumerate all distinct test cases directly supported by each stated acceptance criterion and requirement variation; avoid duplicates and do not omit distinct cases for brevity.
- Each test case must be independently executable.
- Never expose Jira or Groq credentials in frontend code or application logs.
- On Jira or Groq API failure, report a clear error and do not present fabricated test cases.

## Data schema (approved for implementation)

### Generation request
```json
{
  "issueKey": "string",
  "jiraIssue": {
    "key": "string",
    "summary": "string",
    "description": "string|null",
    "acceptanceCriteria": "string|null",
    "additionalRequirementFields": {"fieldName": "string"}
  }
}
```

`issueKey` is entered by the user. `jiraIssue` is populated by the server from Jira; acceptance criteria is extracted only when Jira exposes a field with an acceptance-criteria name. No other Jira fields are sent to generation. Credentials may be submitted from the local Settings form to the local server for saving, but are never returned to the browser, stored in browser storage, or bundled into frontend code.

### Generation response
```json
{
  "issueKey": "string",
  "testCases": [
    {
      "testId": "string",
      "category": "string",
      "description": "string",
      "steps": ["string"],
      "expectedResult": "string",
      "priority": "P0 | P1 | P2 | P3"
    }
  ]
}
```

Priority mapping: P0 Critical, P1 High, P2 Medium, P3 Low. Assign P0 only when explicitly identified or plainly critical from the requirement. CSV columns: Test ID, Category, Description, Steps, Expected Result, Priority. Steps are serialized into a single CSV cell as numbered lines. Schema decisions follow the user's direction to complete the app from the written objective.

## Architectural invariants
- React is the client; Node.js handles integrations and protects credentials.
- Jira REST API is the source for issue data; Groq is used to generate test cases from that data.
- Keep deterministic validation, API handling, and CSV serialization outside the probabilistic generation step.
- Do not begin implementation until Phase 1 discovery, schema confirmation, and blueprint approval are complete.

## Architecture / SOP
- `server.js` serves the Vite app and handles `/api/health`, `/api/settings/status`, `/api/settings`, `/api/jira/:issueKey`, `/api/generate`.
- `tools/jira_connection.js` loads server-only configuration and performs Jira Basic auth over HTTPS with explicit field selection; it normalizes Atlassian Document Format text and acceptance-criteria field values.
- `tools/test_plan_creator.js` sends only normalized requirement content to Groq, asks for strict JSON, validates every field and priority, and fails closed on invalid output.
- React receives issue content, test cases, configured-state flags, and safe error messages. Settings are sent to the local server only when the user saves. CSV serialization occurs in the browser with proper escaping.
- `.env` stays local and ignored by Git; logs contain no request bodies, auth headers, or secrets.
- The Settings form sends credentials only to the local Node server, which persists them to `.env` with mode `0600`. Status endpoints return configured flags only; credential values are never returned, logged, or stored in browser storage.
- `.env.example` contains placeholders only. Real credentials belong in `.env` or the local Settings form.

## Priority and ambiguity SOP
- Positive cases verify explicitly described successful behavior.
- Negative cases cover failure/validation behavior only when the requirement states it; otherwise expected behavior is `[NOT SPECIFIED]` and unsupported cases are omitted.
- Edge cases are tied to stated boundaries, roles, states, or constraints in the issue.
- Independently executable cases include their own preconditions in steps where the issue specifies them.
- Use `[NOT SPECIFIED]` when an expected outcome cannot be derived from Jira content; do not fabricate an outcome.
- Include all explicitly described variations while keeping coverage finite; never invent combinations. Fail clearly if Groq truncates output rather than returning a partial plan.

## Maintenance log
- 2026-10-25: Schema and blueprint finalized from `Objective.md` under user's instruction to proceed autonomously.
- 2026-10-25: Jira and Groq integration modules, Node server, React UI, CSV export, and generation SOP implemented. Credentials verified; build and local smoke checks passed.
- 2026-10-25: Production-mode delivery smoke check passed; final bundle rebuilt after removing an unused dependency.
- 2026-10-25: Added the Jira/Groq Settings panel and local `.env` persistence; status responses expose configured flags only. Placeholder template restored and `.env` permissions set to `0600` after live-looking credentials were found in `.env.example`.
- 2026-10-25: Updated generation policy for exhaustive distinct requirement-supported coverage; capped completion length and added fail-closed handling for truncated output.
- 2026-10-25: Rebuilt production bundle and syntax-checked the updated Groq integration successfully.
- 2026-10-25: Full generation awaits an issue key for a complete Jira-to-Groq flow. Cloud deployment and automation remain unconfigured until a target is selected.
