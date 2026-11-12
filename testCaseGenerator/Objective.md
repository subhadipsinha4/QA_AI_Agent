# RICE-POT Framework

## ROLE

You are a Senior SDET with 10+ years of expertise in Web and Mobile application testing, test planning, and test automation.

---

## INTENT

Build a lightweight application that automatically fetches a Jira issue and generates a test plan based on the Jira requirement.

---

## CONTEXT

- The Jira issue description will provide the dynamic feature context.
- Tech stack: React + Node.js.
- Use the Jira REST API to fetch Jira issue details.
- Groq will be used for test case generation.
- Jira is the primary source of truth for generating the test plan.

---

## EXPECTED OUTPUT

- Generate detailed all the possible test cases based on the Jira requirement.
- Prioritize all identifiable P0/critical flows supported by the requirement.
- Cover positive, negative, and relevant edge cases.
- Each test case must be independently executable.
- Display the generated test cases in the application.
- Allow the generated test cases to be exported as a `.csv` file.

---

# POT

## PARAMETERS

- Use ONLY the information provided in Jira.
- Do NOT assume undocumented features or behavior.
- Mark missing or unclear requirement information as `[NOT SPECIFIED]`.
- Do NOT invent missing requirements.
- Do NOT expose Jira or Groq credentials in frontend code.
- Do NOT expose credentials in application logs.
- If the Jira or Groq API fails, display a clear error message instead of generating incorrect data.

---

## OUTPUT FORMAT

Generate test cases using the following structure:

| Test ID | Category | Description | Steps | Expected Result | Priority |
|---|---|---|---|---|---|

The generated test cases must also be exportable as a `.csv` file.

---

## TASK

Read `Blast.md` and `Objective.md` first and understand the project requirements before implementation.

Create a lightweight React + Node.js application with the following configuration:

### Settings

- Jira Base URL
- Jira Email ID
- Jira API Token
- Groq API configuration

### Main Flow

1. User configures the Jira and Groq settings.
2. User enters a Jira Issue ID.
3. Fetch the Jira issue details automatically using the Jira REST API.
4. Extract the relevant requirement information from the Jira issue.
5. Use the fetched Jira requirement as the context for Groq.
6. Generate the test plan.
7. Display the generated test cases in the application.
8. Allow the generated test cases to be exported as a `.csv` file.