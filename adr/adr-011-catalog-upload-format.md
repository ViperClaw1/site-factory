---
tags: [project/task-4-site-factory, type/adr, status/proposed]
project: "Task 4 - Site Factory"
status: proposed
created: 2026-11-10
updated: 2026-11-12
aliases: [Catalog upload format, Bulk upload]
adr-id: "011"
supersedes: []
superseded-by: []
---

# ADR-011: One Catalog Upload Format: the Ecosystem Catalog Standard

## Status

Proposed. Needs a decision before the card requirements are re-listed (open question 3 of the acceptance checklist of 09.11).

## Context

- The ecosystem rules require one card format and one standard for loading, exporting and changing the catalog, for every site and channel (rule 10). The standard is `katalog.schema.json` with CSV/XLSX templates and the checker `katalog.py` in `Path-platform-standards`. The acceptance checklist (item 2.1) checks the last uploaded file with `katalog.py check …`.
- Since 09.11 the site01 admin accepts bulk uploads as JSON in its own shape (`lib/admin/schema.ts`):
  - fields: `title`, `category`, `price`, `productType`, `stock`, `slug`, `variants`, `story`, …
  - It is not the standard: it has no `format`, `version`, `catalog`, `mode` envelope.
  - It lacks fields the standard requires:
    - `sku` as the item key, `brand`, `brand_owner`;
    - `availability`, `lead_time_days`;
    - `not_sold_to`, `hs_code`, `country_of_origin`, dimensions;
    - videos and audio with a rights source;
    - texts per language (`texts.<lang>`).
- Two formats for one catalog mean the standard's checker can't verify what the admin loads, and the gap grows with every upload.

## Decision

- The admin's bulk upload, single-item form and export use the catalog standard: JSON per `katalog.schema.json` and CSV per its templates. The admin's own format is removed.
- Validation on upload uses the same schema (`katalog.schema.json` compiled with ajv, or an equivalent zod schema generated from it), so the admin and `katalog.py` accept and reject the same files.
- Fields site01 needs and the standard lacks (`collectible_story`, `edition_size`, `series`, `character`, `collection`) go into the standard's `attributes`, or are proposed as additions to the standard. They are not kept as a parallel format.
- The upload maps onto the unified schema of ADR-008:
  - `catalog` is the ecosystem catalog code (one catalog for the ecosystem), not the site; the site comes from the item's category (`categories.site_id`, ADR-012);
  - stock through the import function that writes `stock_movements`;
  - `mode` (`merge` / `replace`): `merge` changes only the items in the file, `replace` also archives items of the same catalog absent from the file.
- Export produces the same format, so a file exported from one environment can be loaded into another.

## Consequences

- `lib/admin/schema.ts`, the bulk upload dialog, the downloadable template and the export in site01 change. site02 uses the same component for courses (`type: service` or `digital`, no stock).
- CI checks the example and template files in the repository with the standard's schema.
- Until the unified schema (`packages/db`) ships, the upload writes to the current per-site tables through a mapping layer. The mapping moves to the new schema with it.

## Related

- [[adr-008-unified-commerce-and-auth]]
- `Path-platform-standards`: `02-standarty/katalog-tovarov.md`, `05-shablony/katalog/`
- `specs/site01-admin-content-upload.md`
