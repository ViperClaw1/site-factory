# Source of this copy

Vendored from `Path-platform-standards/05-templates/catalog`, commit `bb250121cd4ef933584c63311bb288adfc0912f8`.
Synced 2026-11-23. Do not edit these files by hand.

Files: `catalog.schema.json`, `categories.csv`, `example.json`, `catalog.csv`, `translations.csv`, `changes.csv`.

`expected/` holds the output of `catalog.py` from the same commit: `check` on every
fixture in `../fixtures/fixtures.json` and `csv2json` of `catalog.csv` + `translations.csv`.

Update after a change in the standard:

```bash
pnpm --filter @repo/catalog sync-standard [path/to/Path-platform-standards]
pnpm --filter @repo/catalog test
```
