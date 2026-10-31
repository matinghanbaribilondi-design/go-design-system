# Design System

## Overview

- Source: Figma file "Golden UI"
- Scope: Screens, Components
- Entities: 4 tokens, 1 components, 1 styles
- Variable coverage: 2 of 2 style properties in components use Figma variables (100%); the rest use derived or nearest tokens, so Spec CSS never needs literals.
- Dependency policy: auto_include (0 token(s), 0 component(s) included as dependencies)
- Package: SKILL.md, design.md, tokens.css, tokens.md, components.md, ai-control.md, validation.md, reference/ (one HTML per frame), components/ (HTML)

### Read order

| File | Purpose | Size |
|---|---|---|
| `SKILL.md` | Agent entrypoint: read order, authority, inventory | ≈ 867 tokens |
| `design.md` | Rules, typography, overview | this file |
| `tokens.css` | ALL values: variables, text classes, shadows (single source of truth) | ≈ 278 tokens |
| `ai-control.md` | Creative freedom level (read before every task) | ≈ 1189 tokens |
| `components.md` | Component list, sizes and Spec CSS; open only the component you need | ≈ 160 tokens |
| `components/index.json` | Component graph, observed patterns and a pointer to the reference index | ≈ 2112 tokens |
| `reference/index.json` | Canonical reference source-evidence index and CSS mode | ≈ 893 tokens |
| `tokens.md` | Explains tokens: names, usage, gaps | ≈ 297 tokens |
| `validation.md` | Design-system health and what to fix | ≈ 183 tokens |

### Rules for AI agents (mandatory)

1. Use ONLY the CSS variables, `.text-*` classes, paint and shadow variables defined in tokens.css (including the derived tokens), written exactly: `var(--name)`. tokens.css is the single source of truth for values.
2. Never write a literal color, spacing, radius, shadow or font value. Never estimate, round or "normalize" a value. The only literals allowed are the fixed component sizes (width, height) given in components.md.
3. Typography: use only the `.text-*` classes listed under Typography. Font sizes that are not listed do not exist.
4. Component structure and sizes: take them from components.md (Size and Spec CSS). The Spec already uses tokens; do not guess heights, paddings or radii.
5. Prefer semantic tokens over primitive tokens.
6. If a needed value does not exist, follow the "If something is missing" line of the current level in ai-control.md (strict levels: stop and report `MISSING TOKEN: <what is needed>`; higher levels: closest token or a named proposed token). Never invent a literal value.
7. Support every theme mode via `[data-theme="<mode>"]`: Light, Dark.
8. Before answering, list every variable and class you used and confirm each exists in tokens.css.
9. Creative freedom is set by `adherence_level` (0–10) in ai-control.md. Read it before every task. Rules 1 and 2 never change at any level.

## Project Context

- Product: Golden
- Screens: 2 top-level frame(s) on 1 page(s)
- Not provided: Description, Users, Goals, Capabilities, Flows, Platforms, Language, Direction

## Tokens

Source of truth for values: `tokens.css` (exact Figma names in comments).

| Category | Count |
|---|---|
| color | 2 |
| size | 1 |
| spacing | 1 |

Styles: 1 text, 0 paint, 0 effect

Details: tokens.md

## Themes

| Collection | Modes |
|---|---|
| Theme | Light, Dark |

## Typography

Use only these text styles (classes are defined in tokens.css).

| Figma text style | CSS class | Font | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|---|---|
| Heading/H1 | `.text-heading-h1` | Inter | 32px | 700 | 40px | -0.02em |

## Components

| Component | Kind | Variants | States |
|---|---|---|---|
| [Button](components.md#button) | component-set | 1 | — |

## Patterns

Observed HTML structures: 1 across 2 reference(s); 1 structure(s) repeat. Fingerprints exclude text, generated classes, styles, node IDs and variant values. Evidence, exceptions and normalized trees are in components/index.json. These observations are not inferred semantic rules.

## Other sections

Foundations, Layout, Responsive, Interaction, Accessibility, Content, Documentation, Governance: not available from the selected sources.

## Validation

- Health: 89% · Errors 0 · Warnings 0 · Info 1 (details: validation.md)
