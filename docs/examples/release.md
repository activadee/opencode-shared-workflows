# Release Command Examples

## GitHub Action

```yaml
name: release
on:
  workflow_dispatch:
    inputs:
      tag:
        description: Tag to release
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Publish release notes
        uses: activadee/codex-shared-workflows@v2
        with:
          command: release
          tag_name: ${{ github.event.inputs.tag }}
          release_title: Codex SDK ${{ github.event.inputs.tag }}
          target: main
          go_version: 1.22.5
          commit_limit: 80
          notes_extra: |
            Include customer-facing migrations if present.
          project_name: Codex JS SDK
          project_language: TypeScript
          package_name: npmjs.com/@activadee/codex
          project_purpose: Provides JS bindings for Codex workflows.
          repository_url: https://github.com/activadee/codex-js
          network_access: false
          web_search: false
        env:
          CODEX_AUTH_JSON_B64: ${{ secrets.CODEX_AUTH_JSON_B64 }}
```

## CLI

```bash
export CODEX_AUTH_JSON_B64=...
export GITHUB_TOKEN=...

npx codex-workflows release \
  --tag-name v1.5.0 \
  --release-title "Codex SDK v1.5.0" \
  --notes-extra "Call out the new streaming API" \
  --project-name "Codex JS SDK" \
  --project-language TypeScript \
  --package-name "@activadee/codex" \
  --project-purpose "Provides JS bindings for Codex workflows." \
  --repository-url "https://github.com/activadee/codex-js" \
  --enable-network \
  --enable-web-search \
  --dry-run
```
