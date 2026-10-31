---
adherence_level: 7
---
# AI Control — adherence to the design system

Adherence goes from 0 (follow the rules exactly) to 10 (maximum creative freedom). **Change the number above to change the behavior.** You can also tell the AI: "set adherence_level to 7".

## How to use (for AI agents)

1. At the start of every task, read `adherence_level` from the front matter above. Re-read it every time; the user may have changed it.
2. Apply the "Always" rules and the behavior of the current level.
3. End your answer with `Adherence level used: N`.

## UI creativity levels

| UI level | Name | Creative exploration | Internal adherence_level |
|---|---|---|---|
| 0 | Strict | 0% | 0 |
| 1 | Conservative | 20% | 2 |
| 2 | Balanced | 40% | 5 |
| 3 | Creative | 60% | 7 |
| 4 | Advanced Creative | 80% | 9 |
| 5 | Open | 100% | 10 |

Creative exploration is not a probability of obeying rules. Hard constraints stay mandatory at every level.

## Always (every level)

- Never write a literal color, size, spacing, radius, shadow or font value. Use `var(--name)` from tokens.css and the `.text-*` classes.
- Never edit tokens.css or the Figma variables and styles.
- Never use a font, text style or icon that is not in the system. Creativity lives in composition, hierarchy and structure, not in hand-set styles.
- Hard constraints never relax: every token, component, variant and mode must exist in the package. Unsupported values or modes are reported, not invented.
- Creativity never changes how values are written: every value stays a token (or a named proposed token at levels 6–10).

## Current level: 7 — Creative

- You may: Introduce new patterns, visual hierarchy ideas, motion (using motion tokens if they exist) and imagery placeholders.
- You must not: Use values outside the token set.
- If something is missing: Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.

## All levels

| Level | Name | You may | You must not | If something is missing |
|---|---|---|---|---|
| 0 | Strict | Assemble screens only from existing components, using exact variants and sizes from components.md. Copy existing patterns and layouts as they appear in the reference frames. | Invent layouts, components, spacing combinations or states. | Stop and report `MISSING TOKEN` or `MISSING COMPONENT`. |
| 1 | Near-strict | Same as 0, and also reorder, repeat or remove existing blocks and change content (text, data). | Create new component structures. | Stop and report `MISSING TOKEN` or `MISSING COMPONENT`. |
| 2 | Faithful | Compose new screens from existing components and patterns, using any existing spacing and size tokens. | Create new components or variants. | Stop and report `MISSING TOKEN` or `MISSING COMPONENT`. |
| 3 | Guided | Create new layouts and compositions from existing components, using any existing variant or state. | Create new component structures. | Use the closest existing token and list it under "Closest-match substitutions". |
| 4 | Balanced | Build simple new components from existing tokens and text styles, following the naming convention. | Leave the visual language of the system. | Use the closest existing token and list it under "Closest-match substitutions". |
| 5 | Flexible | Create new components and layouts; vary density, hierarchy and alignment; combine tokens freely. | Use values outside the token set. | Use the closest existing token and list it under "Closest-match substitutions". |
| 6 | Adaptive | Propose alternative layouts and flows; extend components with new states or variants built from tokens. | Use values outside the token set. | Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name. |
| 7 | Creative | Introduce new patterns, visual hierarchy ideas, motion (using motion tokens if they exist) and imagery placeholders. | Use values outside the token set. | Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name. |
| 8 | Exploratory | Rethink layout and structure substantially; deliver 2–3 distinct options; propose new components. | Use values outside the token set. | Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name. |
| 9 | Bold | Explore composition, rhythm and expression freely within the palette and type scale. | Use values outside the token set. | Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name. |
| 10 | Open | Maximum creative freedom: treat the system as a visual language and propose new tokens, components and patterns. | Write a literal value inline. Every value is a token or a named proposed token. | Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name. |
