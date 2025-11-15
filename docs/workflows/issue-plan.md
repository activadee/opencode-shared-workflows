# Codex Issue Implementation Plan Workflow

The `issue-plan` reusable workflow reads an issue, inspects the repository on the requested branch (defaults to `main`), asks Codex (GPT-5.1-codex on high effort with network access) to write a comprehensive implementation plan, and posts the resulting markdown back to the issue via the GitHub CLI. Use it to bootstrap planning discussions without immediately writing code.

## When to use it

- Need a structured plan before starting on an issue or RFC.
- Want Codex to highlight affected files, migrations, testing strategy, and risks based on the current `main` branch.
- Prefer the plan to live on the issue timeline for async collaboration.

## Required secrets

- `CODEX_AUTH_JSON_B64` – the shared Codex auth bundle used by the other workflows. The workflow also relies on the calling repository’s `GITHUB_TOKEN` (forwarded as `GH_TOKEN`) so Codex can run `gh` inside the sandbox and so the workflow can create the final comment.

## Permissions

- `contents: read` – checkout the repository so Codex can reference the codebase.
- `issues: write` – create/update issue comments via `gh api`.

## Inputs

| Name | Default | Purpose |
| --- | --- | --- |
| `target_ref` | `main` | Branch/ref to check out before calling Codex. |
| `issue_number` | _empty_ | Override when the triggering event is not an `issues` event. |
| `prompt_extra` | _empty_ | Additional markdown appended to the shared prompt template. |
| `model` | `gpt-5.1-codex` | Codex model used for planning. |
| `effort` | `high` | Reasoning effort passed through to Codex. |
| `safety_strategy` | `drop-sudo` | Sandbox strategy for Codex. |
| `codex_args` | `["--config","sandbox_workspace_write.network_access=true"]` | Forces network access while keeping the workspace-write sandbox. |
| `pass_through_env` | `GH_TOKEN,GITHUB_TOKEN` | Env vars exposed to Codex so it can call `gh`/`git`. |
| `max_issue_body_chars` | `8000` | Caps issue body length embedded into the prompt. |
| `max_comment_body_chars` | `2000` | Caps each embedded comment. |
| `max_comments` | `6` | Number of most recent comments appended beneath the issue body. |

## Outputs

| Name | Description |
| --- | --- |
| `summary` | Short synopsis returned by Codex. |
| `plan_markdown` | Full markdown plan that was posted to the issue. |
| `comment_url` | URL of the GitHub comment created via `gh api`. |

## Usage example

```yaml
name: Implementation Plan

on:
  issues:
    types: [opened, edited, reopened]

jobs:
  plan:
    uses: activadee/codex-shared-workflows/.github/workflows/issue-plan.yml@v1
    secrets: inherit
    with:
      prompt_extra: |
        Prioritize DX improvements and note any tracking issues we should create.
      max_comments: 4
```

## How it works

1. Check out the caller’s repository at `inputs.target_ref` so Codex can inspect files under `main`.
2. `actions/issue-plan/prepare` fetches the issue + latest comments via the GitHub API, truncates long bodies, captures a repository snapshot (top-level tree, recent commits, HEAD SHA), and populates `prompts/codex-issue-plan.md` plus its JSON schema.
3. `activadee/codex-action` runs GPT-5.1-codex in high-effort mode with `--config sandbox_workspace_write.network_access=true`, forwarding `GH_TOKEN` so Codex can call `gh` if it needs extra details.
4. A short Python step validates the JSON response, creates the final markdown comment (including any risks/dependencies/questions arrays), and generates a JSON payload file.
5. The workflow posts the comment back to the source issue using `gh api repos/{owner}/{repo}/issues/{number}/comments --method POST --input <payload>`, capturing the resulting `html_url` as a workflow output.

## Requirements & limitations

- Run this workflow from `issues` events (or provide `issue_number`) so the shared action knows which issue to fetch.
- The calling workflow must forward `GITHUB_TOKEN` (or another PAT) with permission to read issues and create comments.
- Codex only drafts a plan—it does not commit code. Use the doc-sync or review workflows for change automation.
- The workflow keeps at most `max_comments` recent comments in the prompt; increase the input if historical discussion is critical.
- Concurrency is keyed per-issue to avoid racing comment updates. Re-running the job posts a new comment instead of editing old ones.
