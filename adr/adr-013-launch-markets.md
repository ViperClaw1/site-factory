---
tags: [project/task-4-site-factory, type/adr, status/accepted]
project: "Task 4 - Site Factory"
status: accepted
created: 2026-11-12
updated: 2026-11-12
aliases: [Launch markets, Countries at launch]
adr-id: "013"
supersedes: []
superseded-by: []
---

# ADR-013: Launch Markets: the US and Commonwealth Countries

## Status

Accepted on 12.11.2026 by the site-factory team and the infrastructure owner. The decision package of 12.11 orients content and legal texts to the US and Commonwealth countries. The list was given as "US, GB, AU, CA, NZ, IE?"; Ireland and Quebec were decided on 12.11 (below).

## Context

- **Infrastructure is in Germany** (ADR-008, 12.11). Content and legal texts target the US and Commonwealth.
- **Legal documents are written per jurisdiction, not translated** (12.11). This is `legal_documents.jurisdiction` in ADR-012.
- **The sites still offer 19 interface languages** (rules 04, 15). A language is not a market (rule 01: "Russian as an interface language does not mean sales to Russia").
- **Currency is USD only** (rule 01). Duties and taxes of the buyer's country are included in the order total (rule 01, O-2 open).
- **Country profiles in `Path-platform-standards/03-strany`** exist for `us`, `eu`, `de`, `ee`, `ru`. There are none for GB, CA, AU, NZ. The acceptance checklist already lists missing country profiles as a blocker.

## Decision

- **Launch markets:** `US`, `GB`, `CA`, `AU`, `NZ`. In `countries` (ADR-012) only these have `sales_enabled = true`; `sites.markets` is a subset of them.
- **Ireland is not a launch market (decided 12.11).** It is in the EU: GDPR, ePrivacy opt-in, EU consumer law, EU VAT on imports (IOSS). It joins together with an EU contour based on the existing `eu` profile.
- **Quebec is excluded from delivery at launch (decided 12.11).** Selling to Quebec consumers requires French content and French legal documents. Legal texts are written for a jurisdiction, not translated, so this needs a separate French set from a lawyer. Checkout rejects delivery addresses in Quebec (`CA`, province `QC`) until that set exists.
- **Interface languages are unchanged:** 19 languages, English by default. Visitors from any country can browse; checkout accepts only delivery to a launch market (and never to a country in a product's `not_sold_to`).
- **English variant:** one English text (US spelling) for all launch markets. `hreflang` stays `en`, no `en-GB` or `en-AU` copies. Legal documents differ by jurisdiction, not by spelling.
- **Legal documents:** a base set for the seller's jurisdiction, plus a version for each launch market where its law requires different content. The legal entity (O-3) decides the base jurisdiction.

What each launch market adds. These are points for the lawyer and the tax adviser, not settled law:

| Market | Privacy and marketing | Cookies | Tax and duties at checkout | Other |
|---|---|---|---|---|
| US | CCPA/CPRA notice, "Do Not Sell or Share", GPC; CAN-SPAM (opt-out email); TCPA for SMS | no general opt-in law; consent-first by rule 05 anyway | state sales tax (economic nexus per state); import duties | COPPA for children's sites; ADA accessibility claims |
| GB | UK GDPR, PECR (prior consent for marketing email; soft opt-in for existing customers) | prior consent (PECR) | UK VAT on goods ≤ £135 collected by the seller at the point of sale; VAT on digital services to consumers | Age Appropriate Design Code for children's sites; UK representative (art. 27) without a UK establishment |
| CA | PIPEDA; CASL (express or implied consent for commercial email, unsubscribe) | implied consent is common, consent-first by rule 05 anyway | GST/HST on digital services from non-residents above the registration threshold; duties and taxes on imported goods | Quebec: French is required for commerce with Quebec consumers (Charter of the French language); French is among the 19 languages but in `fr-FR` |
| AU | Privacy Act 1988 (APPs); Spam Act 2003 (consent for commercial email) | no specific cookie law | GST on imported goods ≤ A$1,000 and on digital services, collected by registered sellers above the threshold | Australian Consumer Law (guarantees, refunds) |
| NZ | Privacy Act 2020; Unsolicited Electronic Messages Act (consent) | no specific cookie law | GST on imported goods ≤ NZ$1,000 and on digital services, collected by registered sellers above the threshold | Consumer Guarantees Act |

- **One rule across all five markets:** marketing email and SMS only with prior consent (`countries.marketing_consent_required`). The US allows opt-out email, but one rule is simpler and satisfies the others.
- **Cookies and tracking:** consent first everywhere, as rule 05 says (O-10 open).

## Consequences

- **Country profiles:** GB, CA, AU, NZ are needed in `Path-platform-standards/03-strany` before their legal documents are written and before the public launch.
- **Tax and duties:** GST/VAT registration in GB, AU, NZ, CA depends on sales volume and the legal entity (O-3). The "duties and taxes" line at checkout (O-2) must come from a calculation per market, not one estimate.
- **Quebec:** delivery to `CA`/`QC` is blocked at checkout. Lifting it needs the French legal set and French content for Quebec buyers. The `countries` table works at country level, so the province rule lives in the delivery check, not in `countries`.
- **Latency:** visitors in AU and NZ are far from the servers in Germany. Catalog pages are served from our own cache; a CDN counts as cloud (ADR-008).
- **Seed data:** `countries` seeds `sales_enabled`, `consent_model`, `marketing_consent_required` and `min_consent_age` for the five markets.
- **Open questions:**
  - when Ireland and the EU contour are added;
  - when the French set for Quebec is commissioned;
  - the seller's jurisdiction (O-3);
  - Russia (O-1, already open);
  - whether other Commonwealth countries (for example India, Singapore, South Africa) follow.

## Related

- [[adr-008-unified-commerce-and-auth]]
- [[adr-010-locale-routing]]
- [[adr-012-reference-data]]
- `path-ecosystem-rules`: rules 01, 04, 05; O-1, O-2, O-3, O-10
- `Path-platform-standards`: `03-strany/`
