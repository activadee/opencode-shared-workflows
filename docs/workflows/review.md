# Review Workflow

The `opencode-review.yml` workflow provides AI-powered code review for pull requests.

## Overview

When a pull request is ready for review, this workflow:
1. Checks out the repository
2. Installs OpenCode via curl
3. Fetches PR details using GitHub API
4. Loads the review prompt from this repository
5. Runs OpenCode to analyze the changes
6. Posts line-specific review comments on the PR using gh CLI

## Usage

```yaml
# .github/workflows/pr-review.yml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  review:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-review.yml@main
    secrets: inherit
```

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | string | `minimax/MiniMax-M2.1` | AI model to use |
| `fallback_model` | string | `opencode/big-pickle` | Fallback model |
| `share` | boolean | `false` | Share the OpenCode session |

## Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `MINIMAX_API_KEY` | Yes | MiniMax API key |

## Behavior

The review workflow:
- Only runs on non-draft pull requests
- Installs OpenCode via `curl -fsSL https://opencode.ai/install | bash`
- Fetches PR title, description, and commit SHA via `gh` API
- Creates line-specific comments on files for violations
- Comments "lgtm" if no significant issues found
- Focuses on correctness, security, stability, and maintainability
- Avoids style zealotry - only flags style issues that hide bugs or cause confusion

## Customization

### Using a Different Model

```yaml
jobs:
  review:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-review.yml@main
    secrets: inherit
    with:
      model: opencode/big-pickle
```

### Disabling Session Sharing

```yaml
jobs:
  review:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-review.yml@main
    secrets: inherit
    with:
      share: false
```

## Prompt

The review prompt is located at [`prompts/review.md`](../../prompts/review.md) and instructs OpenCode to:

- Review only changes in the PR
- Prioritize correctness, security, stability, and maintainability
- Create line-specific comments using the gh CLI
- Avoid style zealotry
- Comment "lgtm" if no violations found
- Rate severity (critical/high/medium/low)
