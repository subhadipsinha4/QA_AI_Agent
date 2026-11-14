# Test Case MCP Server

A beginner-friendly Python MCP server built with the FastMCP API in the official `mcp` Python SDK. It reads the supplied test-case CSV and demonstrates tools, a resource template, and a prompt.

## Project layout

```text
test-case-create-MCP/
├── server.py
├── requirements.txt
└── README.md
```

The server reads the original CSV at `../resources/test_cases.csv` (from this project folder). It does not copy or modify that file. Set `TEST_CASES_CSV` to use a different CSV location. The supplied file has 5,000 records and these columns: `Issue Type`, `Issue Key`, `Summary`, `Description`, `Priority`, `Component`, `Labels`, `Test Type`, `Preconditions`, `Steps`, `Expected Result`, `Browser`, `Device`, and `Status`.

## Features

- **Tool — `search_test_cases`** searches all CSV columns, case-insensitively. It accepts a keyword and a result limit from 1 to 100.
- **Tool — `get_test_case`** retrieves one record by `Issue Key`.
- **Resource template — `testcases://{issue_key}`** makes an individual record available as JSON, for example `testcases://VWO-1001`.
- **Prompt — `review_test_case`** creates a reusable QA review prompt populated with a selected case.

The server reports a readable error when the CSV is missing, empty, malformed as UTF-8, or missing the `Issue Key` column. Set `TEST_CASES_CSV` to use another CSV file. The source data is only read.

## Install and run

Python 3.10 or newer is recommended.

```bash
cd MCP/test-case-create-MCP
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python server.py
```

The server uses standard input/output (stdio), so keep the terminal process running while a client is connected.

## Connect with MCP Inspector

In another terminal, run the Inspector:

```bash
npx @modelcontextprotocol/inspector
```

In Inspector, choose **STDIO** and configure:

- **Command:** the absolute path to this project's `.venv/bin/python`
- **Arguments:** the absolute path to `server.py`
- **Working directory:** this project directory

On Windows, use `.venv\\Scripts\\python.exe` as the command. Inspector launches the configured server process itself; stop a separately running `python server.py` first if you are using the Inspector launch configuration.

## Try the features in Inspector

1. Connect to the server. Open **Tools**, select `search_test_cases`, and search for `SmartCode` with a limit of `3`.
2. Under **Tools**, call `get_test_case` with `VWO-1001` to retrieve a complete record.
3. Under **Resources**, read `testcases://VWO-1001` to retrieve the same record as resource content.
4. Under **Prompts**, select `review_test_case`, enter `VWO-1001`, and inspect the generated review prompt.

## How the MCP features fit

Tools perform actions at the client's request, resources expose data the client can read, and prompts provide reusable messages populated with data. Here, all three use the same CSV reader and the actual supplied `Issue Key` field.

## Verification status

The CSV header and record count were inspected while preparing this project. The server and Inspector have not been run in this environment; follow the steps above to connect and exercise the features locally.
