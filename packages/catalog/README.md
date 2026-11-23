# @repo/catalog

The ecosystem catalog standard (`Path-platform-standards/05-templates/catalog`) as a
TypeScript contract: one upload, export and storage format for every site (ADR-008, ADR-011).
No site uses it yet; the admins switch to it when ADR-011 is accepted.

| Export | What it does |
|---|---|
| `CatalogFile`, `CatalogItem`, … | Types of the upload file, written from the schema; tests keep them in step |
| `checkCatalog(doc)` | Schema (ajv over the vendored `catalog.schema.json`) plus the rules of `catalog.py`. Returns `Issue[]`; any `error` blocks the upload |
| `formatRu(issue, origins?)`, `formatReportRu` | The exact lines `catalog.py check` prints |
| `csvToDocument`, `documentToCsv` | `catalog.csv` + `translations.csv` ↔ document, as `catalog.py csv2json` / `json2csv` |
| `CATEGORIES` | `categories.csv`: fields per category and whether third-party brands are allowed |

```ts
import { checkCatalog, csvToDocument, formatReportRu, hasErrors } from "@repo/catalog";

const { doc, origins, issues } = csvToDocument({ name: "catalog.csv", text }, null, "example-store", "merge");
const all = doc ? [...issues, ...checkCatalog(doc)] : issues;
if (hasErrors(all)) console.log(formatReportRu(all, origins).join("\n"));
```

Like `catalog.py`, the check sees only the file. Whether an item exists in the catalog and
whether a new item is complete in `merge` mode is for the upload service.

## The vendored standard

`standard/` is a copy, never edited by hand; `standard/SOURCE.md` names the commit.
`standard/expected/` holds `catalog.py` reports for every fixture in `fixtures/fixtures.json`;
the tests require the same lines from `formatReportRu`.

After a change in the standard (needs Python 3.9+ and a checkout of `Path-platform-standards`
next to `site-factory`, or its path as an argument):

```bash
pnpm --filter @repo/catalog sync-standard [path/to/Path-platform-standards]
pnpm --filter @repo/catalog test
```

The workflow `catalog-standard.yml` warns when the copy is behind the standard's `main`. It
needs the secret `STANDARDS_READ_TOKEN` (fine-grained, contents: read on
`Path-animation/Path-platform-standards`); without it the check is skipped with a warning.

`catalog.py csv2json` reads `attributes` as strings and drops `generated_at`, so CSV → JSON
is compared with its output, not with `example.json` (queue item К-4 in the standards repo).
