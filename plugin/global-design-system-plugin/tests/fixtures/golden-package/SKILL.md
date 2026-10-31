---
name: golden-ui-design-system
description: Design system exported from the Figma file "Golden UI". Use when building UI that must follow these tokens, components and rules.
---
# Golden UI — agent entrypoint

This package is the source of truth. Do not restyle it from screenshots; read the files.

## Read order

1. `design.md` — rules and overview
2. `tokens.css` — every value
3. `components.css` + `components/*.html` — component markup and spec
4. `components/index.json` — component graph, observed patterns and reference index
5. `reference/index.json` + `reference/*.html` — canonical source-evidence index and one standalone/shared frame file
6. `manifest.json` — sources, entities and outputs

## Authority

- Values come from `tokens.css` only: colors, spacing, radius, borders, shadows, typography.
- Components come from `components/index.json`; the HTML next to it is the canonical markup for the default variant.
- `reference/` pages are evidence of composition, not a source of values.
- If a value or component is missing, say so and propose a token; never hard-code a replacement.

## Contextual retrieval

1. Start in `reference/index.json`; `components/index.json.references` is only a pointer to it. Filter `entries` by page, frame name, viewport, component/family ID, variant properties, token variable or pattern ID. Do not open every reference.
2. Open only the selected entry's `file`. For a component task, read its family/variant in `components/index.json.graph` and its canonical HTML before opening composition evidence.
3. For layout reuse, select a pattern, read its normalized `structure`, then open only relevant occurrences. Apply every viewport or component-variant exception; never turn an observed structure into an inferred semantic rule.
4. Follow only links whose status is `resolved`. `unresolved-in-package` names a destination that is not available as package evidence.
5. Use `tokens.css` for values and component HTML for canonical markup; references provide composition evidence only.
6. Check `cssMode`: Shared references depend on `../tokens.css`; Standalone references inline the token values they need.

## Rules

- Use `var(--name)` and the `.text-*` classes; never literals.
- Keep component structure and class names from `components/*.html` unless the user asks for a variant.
- Do not edit `tokens.css`, `components.css` or `manifest.json` by hand.
- Read `ai-control.md` before creative work: its `adherence_level` controls how far you may deviate.

## Verification

1. Before delivery, run the package verifier when the environment provides it: `node scripts/verify.mjs package <package-dir>`. Fix errors; warnings must be disclosed, never converted to pass.
2. For generated UI, run the separate UI mode: `node scripts/verify.mjs ui <ui-dir> --package <package-dir>`. It checks forbidden literals, undefined tokens, invalid variants, unsupported modes, missing local assets and malformed CSS.
3. Treat static checks as rule evidence only. They do not prove visual similarity, usability or UX quality; a human or explicitly labeled review is still required when those claims matter.

## Inventory

| Item | Count |
|---|---|
| Tokens | 4 |
| Components | 1 |
| Component HTML | 1 |
| Icons | 0 |
| Reference pages | 2 |
| Observed patterns | 1 |
| Text styles | 1 |

## Components

- Button (component-set, 1 variant(s))

## References

- Home → `reference/Home.html`
- Settings → `reference/Settings.html`
