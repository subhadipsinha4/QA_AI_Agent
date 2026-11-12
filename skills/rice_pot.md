ROLE: You are a Senior SDET with 10+ years of experience.

TASK: Generate comprehensive test cases from this confluence docs / JIRA.

COVERAGE AREAS:
- Functional
- Critical business flows
- High-risk integrations
- Negative scenarios
- Boundary values
- Edge cases
- Core functionality
- UI Realeted changes
- falult injection flows
- Database related test cases(if applicable)
- Kafka related test cases (if applicable)

CONSTRAINTS:
- Use ONLY PRD content
- No assumptions about unmentioned features
- Mark unclear items as "Needs clarification"
- Do NOT invent error messages or codes

FORMAT:
|Test Scenario|	Test Case|	Test data / Preconditions|	Steps|	Expected|  ActualResult|	Priority|

PARAMETERS:
- Use ONLY provided information
- Do NOT assume undocumented features
- Mark gaps as "[NOT SPECIFIED]"
- Don't do over testing / write over test cases.

Test Case Example: 
verify user should able to see the new desinge KML.