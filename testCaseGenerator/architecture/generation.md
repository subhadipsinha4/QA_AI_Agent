# Test Plan Generation SOP

## Goal
Convert one fetched Jira issue into a detailed, exhaustive set of distinct requirement-supported and independently executable test cases.

## Inputs
- Jira issue key entered in the browser.
- Server-normalized issue key, summary, description, and acceptance-criteria field, where present.
- Groq model and API credential from server environment.

## Flow
1. Validate the issue key format and fetch the issue through Jira REST API v3.
2. Convert Jira rich-text description and custom acceptance-criteria values into plain text.
3. Send only the normalized issue content to Groq. Never send secrets, comments, or unrelated Jira fields.
4. Request JSON test cases with Positive, Negative, or Edge Case category; concrete steps; expected result; and P0–P3 priority.
5. Parse and validate the JSON before returning it. Fail the request if the response is incomplete or has unsupported enum values.
6. Render the validated cases in the React table and serialize the six agreed columns to CSV with proper quoting.

## Test design rules
- Use only stated behavior from the Jira requirement.
- Cover every acceptance criterion and every distinct stated input, role, state, boundary, and flow variation; do not collapse distinct supported cases for brevity.
- Keep coverage finite by including explicitly described variations only; do not invent combinations.
- Cover positive paths, negative paths, and relevant edges only where supported by requirement details.
- P0 is reserved for explicit critical/P0 flows or an unmistakably critical flow required by the Jira issue.
- Mark unclear expected behavior `[NOT SPECIFIED]`; never fill gaps by guessing.
- Include setup/preconditions in each case's own steps so each case can be executed by itself.
- Use stable IDs `TC-001`, `TC-002`, … for each generated plan.

## Failure handling
- Jira authentication, permissions, lookup, connectivity, or missing configuration errors stop generation and return a clear user-facing message.
- Groq authentication, rate limit, timeout, transport, invalid JSON, or schema-validation errors stop rendering; never substitute fabricated test cases.
- Do not write request bodies, issue contents, or credential material to application logs.

## CSV
- Header order: Test ID, Category, Description, Steps, Expected Result, Priority.
- Serialize steps as numbered lines in one cell; escape embedded double quotes and use CRLF records.
