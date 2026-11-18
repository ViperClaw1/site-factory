# Source of this copy

Vendored from `Path-platform-standards/05-templates/catalog`, commit `b4d2a59e8d17ede49866cf142160a370bd41749b`.
Synced 2026-11-18. Do not edit these files by hand.

Files: `catalog.schema.json`, `categories.csv`, `example.json`, `catalog.csv`, `translations.csv`, `changes.csv`.

`expected/` holds the output of `catalog.py` from the same commit: `check` on every
fixture in `../fixtures/fixtures.json` and `csv2json` of `catalog.csv` + `translations.csv`.

Update after a change in the standard:

```bash
pnpm --filter @repo/catalog sync-standard [path/to/Path-platform-standards]
pnpm --filter @repo/catalog test
```
