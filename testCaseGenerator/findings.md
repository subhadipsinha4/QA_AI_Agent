# Findings

## From `Objective.md`
- Product: lightweight React + Node.js application that fetches a Jira issue and generates a test plan.
- Jira is the primary source of truth; issue description provides dynamic feature context.
- Groq is the generation service.
- The plan should enumerate all distinct requirement-supported cases, prioritize identifiable P0/critical flows, and cover positive, negative, and relevant edge cases.
- Every test case must be independently executable and displayed in the app; CSV export is required.
- Use only Jira information; do not infer undocumented behavior. Mark missing/unclear details `[NOT SPECIFIED]`.
- Keep Jira/Groq credentials out of frontend code and application logs.
- On Jira/Groq API failure, show a clear error rather than generating incorrect data.
- Settings named in the objective: Jira base URL, Jira email, Jira API token, Groq API configuration.
- Proposed table fields: Test ID, Category, Description, Steps, Expected Result, Priority.

## Decisions/defaults taken to proceed (user delegated implementation)
- Use Jira Cloud REST API v3 at the configured `JIRA_URL`.
- Fetch summary, description, and all issue fields to locate any Jira field explicitly named as acceptance criteria; no comments or unrelated project data are sent to Groq.
- Use `GROQ_KEY`; allow `GROQ_MODEL` override and choose a model default documented in `.env.example`.
- P0–P3 mean Critical, High, Medium, Low relative test execution priority. P0 requires an explicit critical/P0 signal or a plainly critical required flow; do not label absent evidence as P0.
- Unclear expected behavior is marked `[NOT SPECIFIED]`; omit unsupported scenarios rather than creating requirements.
- CSV columns are exactly the six objective columns; steps are one cell joined with numbered lines.
- Jira and Groq credentials already exist in local `.env`; names only were inspected, values remain private.

## Research (2026-10-25)
- Jira Cloud REST v3 issue endpoint: `GET /rest/api/3/issue/{issueIdOrKey}`. Official docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/
- Groq chat completions endpoint: `POST https://api.groq.com/openai/v1/chat/completions`; JSON / structured output supported. Official docs: https://console.groq.com/docs/api-reference and https://console.groq.com/docs/structured-outputs
- GitHub examples reviewed: [ai-test-case-generator](https://github.com/nileshvary/ai-test-case-generator) is an n8n workflow supporting several LLM providers, and [test-intellect-ai](https://github.com/prashant1507/test-intellect-ai) is a broader app that can write test cases back to Jira and run automation. These projects confirm the general fetch → generate flow; their broader workflow/automation features are outside this objective, so no code was reused. The implementation remains a small native Node `fetch` integration.

## Implementation / verification findings
- Jira and Groq credentials both authenticated successfully on 2026-10-25. Only success/failure was printed; no credential values were exposed.
- Production Vite build passed. Node syntax checks passed for the server and integration modules.
- Local app smoke check passed for the rendered UI shell, health endpoint, Jira connection endpoint, and Groq connection endpoint.
- Production-mode server smoke check also passed for the built UI shell and health endpoint.
- Initial local smoke check found a development HTML middleware configuration issue; fixed by using Vite's default SPA middleware. The rerun passed.
- Full generation was not exercised against a Jira issue because no issue key was provided.
- `.env` is excluded by `testCaseGenerator/.gitignore`; this workspace folder is not inside a Git repository.

## Settings follow-up
- User reported there was no in-app place to configure credentials and updated `.env.example`.
- `.env.example` had live-looking Jira/Groq credentials in clear text. It has been replaced with a placeholder-only template. User should revoke and replace both credentials; do not reproduce their values.
- Added an app settings form that saves user-entered values directly to local `.env` with restrictive permissions; status returns configured flags only and never returns secrets.
- Settings UI build and local smoke check passed. Persistence was verified with dummy values in a temporary directory; the resulting `.env` mode was `0600`, and no secret values were present in returned status.

## Objective update
- The updated objective requests detailed coverage of all possible cases. The generator now asks for every distinct case derivable from stated Jira criteria and variations, avoids duplicates, and keeps coverage finite by not inventing combinations.
- Groq generation is capped at 8,192 completion tokens; truncated output now fails clearly rather than showing an incomplete plan.
