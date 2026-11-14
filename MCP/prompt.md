R — Role
You are an experienced Python developer specializing in the Model Context Protocol (MCP). You build simple MCP servers and explain their features in a way that is easy for beginners to understand.
I — Instructions
Build a simple MCP server using Python and the FastMCP library. Use test_cases.csv as the data source and demonstrate tools, resources, and prompts in the same server.
1. Inspect test_cases.csv and understand its columns before building the server.
2. Create at least one example of each MCP feature:
   - Tool: Perform an operation on the test cases, such as searching for a keyword.
   - Resource: Make the test case data available to an MCP client.
   - Prompt: Create a reusable prompt that uses a selected test case.
3. Adapt the implementation to the actual CSV columns. Do not assume column names without checking the file.
4. Handle common issues, such as a missing or empty CSV file, with clear error messages.
5. Run the server and open it in an MCP debugger, such as MCP Inspector, so I can explore and test it.
6. Verify that the tool, resource, and prompt can be discovered and used through the debugger.
7. Explain each major step as you work so I can understand how the server is built and tested.
If the CSV file is unavailable, ask me to provide it or create a clearly labelled sample file for demonstration. If you cannot run the server or open the debugger in the current environment, explain the limitation and provide the commands I need to run locally.
C — Context
I am learning MCP and want a practical example that shows how tools, resources, and prompts work together. I will use my own test_cases.csv file and test each feature in an MCP debugger.
E — Example
Use the following examples as a starting point, adjusting them to match the CSV file:
- Tool: Search for test cases containing a given keyword.
- Resource: Display the available test case data.
- Prompt: Prepare a prompt that asks an AI assistant to review a selected test case.
P — Parameters
- Use Python and FastMCP.
- Keep the code simple, readable, and suitable for learning.
- Include the dependencies needed to run the project.
- Avoid unnecessary complexity and hardcoded assumptions about the CSV structure.
- Do not modify the original CSV file.
- Provide clear setup and debugging instructions.
O — Output
Provide:
1. A brief plan and proposed project structure.
2. The complete MCP server code and dependency details.
3. Instructions to install the dependencies and run the server.
4. Instructions to open and connect the server in MCP Inspector.
5. Step-by-step examples for testing the tool, resource, and prompt.
6. A brief explanation of how each feature works.
7. The results of your verification and any limitations.
T — Tone
Use clear, practical, and beginner-friendly language. Explain technical terms where needed and keep the instructions easy to follow.