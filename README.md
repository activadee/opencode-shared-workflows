# OpenCode Shared Workflows

Reusable GitHub Actions workflows powered by [OpenCode](https://opencode.ai) for automated code review, issue labeling, and documentation sync.

## Workflows

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `opencode-review.yml` | AI-powered PR code review | `pull_request` events |
| `opencode-label.yml` | Automatic issue labeling | `issues` events |
| `opencode-doc-sync.yml` | Sync documentation with code changes | `pull_request` events |
| `opencode-interactive.yml` | Slash-command handler (`/oc`, `/opencode`) | `issue_comment`, `pull_request_review_comment` |

## Quick Start

### 1. Install OpenCode GitHub App

Visit https://github.com/apps/opencode-agent and install it on your repository.

### 2. Add API Key Secret

Add `ZHIPU_API_KEY` to your repository secrets (Settings → Secrets → Actions).

Get your API key from [Z.AI Coding Plan](https://z.ai/subscribe).

### 3. Create Workflows

#### PR Review (Auto-triggered)

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

#### Issue Labeling (Auto-triggered)

```yaml
# .github/workflows/issue-label.yml
name: Issue Label

on:
  issues:
    types: [opened, edited]

jobs:
  label:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-label.yml@main
    secrets: inherit
```

#### Doc Sync (Auto-triggered)

```yaml
# .github/workflows/doc-sync.yml
name: Doc Sync

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sync:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-doc-sync.yml@main
    secrets: inherit
```

#### Interactive (Slash Commands)

```yaml
# .github/workflows/opencode.yml
name: OpenCode

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  opencode:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-interactive.yml@main
    secrets: inherit
```

## Configuration

### Inputs

All workflows accept these optional inputs:

| Input | Default | Description |
|-------|---------|-------------|
| `model` | `zai-coding-plan/glm-4.7` | Primary AI model |
| `fallback_model` | `opencode/big-pickle` | Fallback if primary fails |

### Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `ZHIPU_API_KEY` | Yes | Z.AI API key for GLM models |

### Model Options

- **`zai-coding-plan/glm-4.7`** - Z.AI's latest model (200K context, free with Coding Plan)
- **`opencode/big-pickle`** - OpenCode's free model (200K context, no API key needed)

## Slash Commands

When using `opencode-interactive.yml`, users can trigger OpenCode by commenting:

```
/oc explain this issue
/opencode fix this bug
/oc review this PR
```

## Repository Structure

```
opencode-shared-workflows/
├── .github/workflows/
│   ├── opencode-review.yml
│   ├── opencode-label.yml
│   ├── opencode-doc-sync.yml
│   └── opencode-interactive.yml
├── prompts/
│   ├── review.md
│   ├── label.md
│   └── doc-sync.md
├── docs/
│   ├── setup.md
│   └── workflows/
├── opencode.json
└── README.md
```

## Documentation

- [Setup Guide](docs/setup.md)
- [Review Workflow](docs/workflows/review.md)
- [Label Workflow](docs/workflows/label.md)
- [Doc Sync Workflow](docs/workflows/doc-sync.md)

## License

MIT
