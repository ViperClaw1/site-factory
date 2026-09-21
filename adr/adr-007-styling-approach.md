---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-07-17
aliases: []
adr-id: "007"
supersedes: []
superseded-by: []
---

# ADR-007: Styling Approach

## Status

Approved — Tailwind CSS with per-site CSS variable theming.

## Context

20 sites with different visual identities must share UI components (`packages/ui`) without duplicating stylesheets. Each site needs its own colors and fonts while using the same component primitives.

## Decision

Approved. Tailwind CSS + CSS custom properties for theming.

**Implementation**:

`packages/config/tailwind.preset.js` defines base utilities. Per-site `tailwind.config.js` extends the preset and adds site-specific values via CSS variables:

```css
/* apps/site01-path-marketplace/app/globals.css */
:root {
  --color-primary: #E91E63;
  --color-primary-dark: #C2185B;
  --color-bg: #FAFAFA;
  --font-heading: 'Bebas Neue', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

```js
// tailwind.config.js (per site)
export default {
  presets: [require('@repo/config/tailwind.preset')],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
    },
  },
};
```

`packages/ui` components use `text-primary`, `bg-primary` etc. — resolved to site-specific colors via CSS vars at runtime.

## Rejected Alternatives

- **CSS-in-JS (styled-components, Emotion)**: Runtime overhead, no App Router Server Component support without workarounds
- **CSS Modules per site**: No shared component system — violates DRY
- **Inline styles for theming**: Not composable with Tailwind utilities

## Consequences

- CSS variables must be defined in `app/globals.css` for every site — missing variable = fallback to browser default
- Framer Motion animations use Tailwind classes — must be in `'use client'` components
- `packages/config/tailwind.preset.js` must be kept minimal — site-specific utilities belong in site's own config

## Related

- [[adr-001-monorepo-vs-polyrepo]]
- [[Site Factory Architecture]]
