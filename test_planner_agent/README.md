# TestPlan Studio

A local React + Node.js application for fetching Jira issues, drafting an editable test plan, requiring explicit plan approval, and generating test cases with PDF/CSV export.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL printed by the client (usually `http://127.0.0.1:5173`). The local API runs at `http://127.0.0.1:8787`. For a production build, run `npm run build` then `npm start`.

## Configure connections

Use the LLM Connection and Jira Connection pages. Test a connection, then choose Save settings. Credentials are stored by the local Node process in `server/settings.json` with restrictive file permissions; that file is ignored by Git. The browser receives connection status and non-secret identifiers only. Use this local app on a trusted machine and do not expose the API server to a public network.

The LLM page uses Groq. Enter your Groq API key and a model ID; the app uses Groq's Chat Completions endpoint automatically.

## Workflow

1. Configure and save the LLM and Jira connections.
2. Fetch a Jira issue and review the normalized description and acceptance criteria.
3. Add optional context and draft a test plan.
4. Review/edit and approve the plan. Any saved edit clears approval.
5. Generate test cases, review/search/filter them, and download CSV or PDF.

Test plans and approvals are held in server memory for the active local process. Restarting the server clears them; generate a new plan after restart. Jira access depends on the configured user's permissions and Jira field availability.
