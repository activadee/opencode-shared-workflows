# Go Tests Command Examples

## GitHub Action

```yaml
name: go-tests
on:
  pull_request:
  push:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: activadee/codex-shared-workflows@v2
        with:
          command: go-tests
          go_version: 1.22.5
          working_directory: ./backend
          test_flags: ./... -race -count=1
          pre_test: go vet ./...
```

## CLI

```bash
npx codex-workflows go-tests \
  --go-version 1.22.5 \
  --working-directory ./backend \
  --test-flags "./... -race" \
  --pre-test "go vet ./..." \
  --env GOEXPERIMENT=arenas
```
