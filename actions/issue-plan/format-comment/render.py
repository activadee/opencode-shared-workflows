#!/usr/bin/env python3
"""Render Codex issue-plan JSON into markdown files and GitHub outputs."""

from __future__ import annotations

import json
import os
from pathlib import Path


def _clean_list(items):
    if not isinstance(items, list):
        return []
    cleaned = []
    for item in items:
        if isinstance(item, str):
            text = item.strip()
            if text:
                cleaned.append(text)
    return cleaned


def _env(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def main() -> None:
    output_path = Path(os.environ["OUTPUT_PATH"])  # validated by caller
    data = json.loads(output_path.read_text())

    plan = (data.get("plan_markdown") or "").strip()
    if not plan:
        raise SystemExit("Codex response missing plan_markdown")

    summary = (data.get("summary") or "").strip()
    risks = _clean_list(data.get("risks", []))
    dependencies = _clean_list(data.get("dependencies", []))
    questions = _clean_list(data.get("open_questions", []))
    next_steps = _clean_list(data.get("next_steps", []))
    confidence = (data.get("confidence") or "").strip()
    effort = (data.get("estimated_effort") or "").strip()

    issue_number = _env("ISSUE_NUMBER")
    issue_url = _env("ISSUE_URL")
    issue_title_env = _env("ISSUE_TITLE")

    if issue_title_env:
        issue_title = issue_title_env
    elif issue_number:
        issue_title = f"Issue #{issue_number}"
    else:
        issue_title = "Issue"

    lines = ["### 🧩 Codex Implementation Plan"]
    if issue_number:
        display = issue_title or f"Issue #{issue_number}"
        if issue_url:
            lines.append(f"**Issue:** [{display}]({issue_url}) (#{issue_number})")
        else:
            lines.append(f"**Issue:** {display} (#{issue_number})")

    if summary:
        lines.append(f"**Summary:** {summary}")
    if confidence:
        lines.append(f"**Confidence:** {confidence}")
    if effort:
        lines.append(f"**Estimated Effort:** {effort}")

    lines.append("")
    lines.append(plan)

    def block(label: str, items: list[str]):
        if not items:
            return None
        joined = "\n".join(f"- {item}" for item in items)
        return f"#### {label}\n{joined}"

    for section in (
        block("Additional Risks", risks),
        block("Dependencies", dependencies),
        block("Open Questions", questions),
        block("Immediate Next Steps", next_steps),
    ):
        if section:
            lines.append("\n" + section)

    comment_text = "\n".join(lines).strip() + "\n"

    comment_path = Path(os.environ["COMMENT_PATH"])
    comment_path.write_text(comment_text)

    payload_path = Path(os.environ["PAYLOAD_PATH"])
    payload_path.write_text(json.dumps({"body": comment_text}, indent=2))

    github_output = Path(os.environ["GITHUB_OUTPUT"])
    with github_output.open("a", encoding="utf-8") as fh:
        fh.write(f"comment_path={comment_path}\n")
        fh.write(f"comment_payload_path={payload_path}\n")
        fh.write("summary<<'EOF'\n")
        fh.write(summary + "\n")
        fh.write("'EOF'\n")
        fh.write("plan_markdown<<'EOF'\n")
        fh.write(plan + "\n")
        fh.write("'EOF'\n")


if __name__ == "__main__":
    main()

