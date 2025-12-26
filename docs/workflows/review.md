# Review Workflow

The `opencode-review.yml` workflow provides AI-powered code review for pull requests.

## Overview

When a pull request is opened or updated, this workflow:
1. Checks out the repository
2. Loads the review prompt from this repository
3. Runs OpenCode to analyze the changes
4. Posts review comments on the PR

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
| `share` | boolean | `true` | Share the OpenCode session |

## Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `MINIMAX_API_KEY` | Yes | MiniMax API key |

## Behavior

The review workflow:
- Only runs on non-draft pull requests
- Focuses on correctness, security, stability, and maintainability
- Provides specific feedback with file and line references
- Suggests fixes for identified issues
- Rates severity (critical/high/medium/low)

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
- Prioritize correctness and security
- Provide actionable feedback
- Approve if no significant issues found
