# Setup Guide

This guide walks you through setting up OpenCode Shared Workflows in your repository.

## Prerequisites

- A GitHub repository
- Repository admin access (to install GitHub App and add secrets)
- A [Z.AI Coding Plan](https://z.ai/subscribe) subscription (for the API key)

## Step 1: Install the OpenCode GitHub App

1. Visit https://github.com/apps/opencode-agent
2. Click **Install**
3. Select the repository (or repositories) where you want to use OpenCode
4. Authorize the app

The GitHub App enables OpenCode to interact with issues, pull requests, and comments on your behalf.

## Step 2: Add Your API Key

1. Get your API key from [Z.AI](https://z.ai/subscribe)
2. Go to your repository's **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `MINIMAX_API_KEY`
5. Value: Your MiniMax API key
6. Click **Add secret**

## Step 3: Create Workflow Files

Create the workflow files you need in your repository's `.github/workflows/` directory.

### Option A: All-in-One Setup

Create a single file that imports all workflows:

```yaml
# .github/workflows/opencode.yml
name: OpenCode

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  review:
    if: github.event_name == 'pull_request'
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-review.yml@main
    secrets: inherit

  label:
    if: github.event_name == 'issues'
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-label.yml@main
    secrets: inherit

  doc-sync:
    if: github.event_name == 'pull_request'
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-doc-sync.yml@main
    secrets: inherit

  interactive:
    if: github.event_name == 'issue_comment' || github.event_name == 'pull_request_review_comment'
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-interactive.yml@main
    secrets: inherit
```

### Option B: Individual Workflow Files

Create separate files for each workflow (recommended for more control):

See the [README](../README.md) for individual workflow examples.

## Step 4: Verify Setup

1. Create a test issue in your repository
2. Comment `/oc explain this issue`
3. OpenCode should respond within a few minutes

If you encounter issues:
- Check the **Actions** tab for workflow run logs
- Verify the `MINIMAX_API_KEY` secret is correctly set
- Ensure the OpenCode GitHub App is installed on the repository

## Configuration Options

### Using a Different Model

Override the default model by passing the `model` input:

```yaml
jobs:
  review:
    uses: activadee/opencode-shared-workflows/.github/workflows/opencode-review.yml@main
    secrets: inherit
    with:
      model: opencode/big-pickle  # Use the free OpenCode model
```

### Available Models

| Model | Provider | Context | Notes |
|-------|----------|---------|-------|
| `minimax/MiniMax-M2.1` | MiniMax | 200K | Default |
| `opencode/big-pickle` | OpenCode | 200K | Free, no API key needed |

## Troubleshooting

### Workflow not triggering

- Check that the OpenCode GitHub App is installed
- Verify the workflow file is in `.github/workflows/`
- Check the workflow's `on:` triggers match your event

### API key errors

- Ensure `MINIMAX_API_KEY` is set in repository secrets
- Verify the API key is valid and has not expired
- Check that `secrets: inherit` is included in the job

### OpenCode not responding to commands

- Ensure the comment contains `/oc` or `/opencode`
- Check the Actions tab for workflow run errors
- Verify the `opencode-interactive.yml` workflow is set up

## Next Steps

- [Review Workflow Documentation](workflows/review.md)
- [Label Workflow Documentation](workflows/label.md)
- [Doc Sync Workflow Documentation](workflows/doc-sync.md)
