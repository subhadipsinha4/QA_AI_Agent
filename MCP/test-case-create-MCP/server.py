"""A small FastMCP server for exploring test cases from a CSV file."""

from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from mcp.server.fastmcp import FastMCP


PROJECT_DIR = Path(__file__).resolve().parent
CSV_PATH = Path(
    os.environ.get(
        "TEST_CASES_CSV",
        PROJECT_DIR.parent / "resources" / "test_cases.csv",
    )
)
KEY_COLUMN = "Issue Key"  # Verified against the supplied CSV header.

mcp = FastMCP("test-case-create")


def read_test_cases() -> tuple[list[str], list[dict[str, str]]]:
    """Read the CSV and return its headers and non-empty records."""
    try:
        with CSV_PATH.open("r", newline="", encoding="utf-8-sig") as csv_file:
            reader = csv.DictReader(csv_file)
            columns = reader.fieldnames
            if not columns:
                raise ValueError(f"CSV file is empty or has no header row: {CSV_PATH}")
            if KEY_COLUMN not in columns:
                raise ValueError(
                    f"CSV must contain a {KEY_COLUMN!r} column; found: {', '.join(columns)}"
                )
            records = [
                {key: (value or "") for key, value in row.items() if key is not None}
                for row in reader
                if row and any(value and value.strip() for value in row.values() if value)
            ]
    except FileNotFoundError as exc:
        raise ValueError(
            f"Test-case CSV not found at {CSV_PATH}. Set TEST_CASES_CSV to its location."
        ) from exc
    except UnicodeDecodeError as exc:
        raise ValueError(f"Could not read {CSV_PATH} as UTF-8 text: {exc}") from exc

    if not records:
        raise ValueError(f"Test-case CSV has a header but contains no records: {CSV_PATH}")
    return columns, records


def find_test_case(issue_key: str) -> dict[str, str] | None:
    _, records = read_test_cases()
    wanted = issue_key.strip().casefold()
    return next(
        (record for record in records if record.get(KEY_COLUMN, "").strip().casefold() == wanted),
        None,
    )


@mcp.tool()
def search_test_cases(keyword: str, limit: int = 10) -> str:
    """Search every CSV field for a keyword and return matching cases as JSON."""
    keyword = keyword.strip()
    if not keyword:
        raise ValueError("keyword must not be empty")
    if not 1 <= limit <= 100:
        raise ValueError("limit must be between 1 and 100")

    _, records = read_test_cases()
    needle = keyword.casefold()
    matches = [
        record
        for record in records
        if any(needle in value.casefold() for value in record.values())
    ]
    return json.dumps(
        {
            "keyword": keyword,
            "total_matches": len(matches),
            "returned": min(len(matches), limit),
            "cases": matches[:limit],
        },
        ensure_ascii=False,
        indent=2,
    )


@mcp.tool()
def get_test_case(issue_key: str) -> str:
    """Look up one test case by its Issue Key, for example VWO-1001."""
    if not issue_key.strip():
        raise ValueError("issue_key must not be empty")
    record = find_test_case(issue_key)
    if record is None:
        return f"No test case found with {KEY_COLUMN} {issue_key!r}."
    return json.dumps(record, ensure_ascii=False, indent=2)


@mcp.resource("testcases://{issue_key}")
def test_case_resource(issue_key: str) -> str:
    """Expose one complete test case as JSON at testcases://VWO-1001."""
    record = find_test_case(issue_key)
    if record is None:
        raise ValueError(f"No test case found with {KEY_COLUMN} {issue_key!r}.")
    return json.dumps(record, ensure_ascii=False, indent=2)


@mcp.prompt()
def review_test_case(issue_key: str) -> str:
    """Build a reusable QA review prompt from a selected test case."""
    if not issue_key.strip():
        raise ValueError("issue_key must not be empty")
    record = find_test_case(issue_key)
    if record is None:
        raise ValueError(f"No test case found with {KEY_COLUMN} {issue_key!r}.")
    case_details = "\n".join(f"{column}: {value}" for column, value in record.items())
    return (
        "Review the following test case for clarity, coverage, and testability. "
        "Identify concrete gaps or ambiguities, then suggest improvements without "
        "changing the intended behavior.\n\n"
        f"{case_details}"
    )


if __name__ == "__main__":
    mcp.run()
