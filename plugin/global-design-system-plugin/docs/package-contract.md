# Generated package contract

This document is the human-readable contract for the ZIP produced by the plugin. The machine-readable contracts are the
JSON Schemas in [`../schemas/`](../schemas/) and the verifier in [`../scripts/verify.mjs`](../scripts/verify.mjs).

The package is a one-way export (decision D1). Nothing in it is imported back into Figma, and no file is written to the
Figma document by the export path.

## Modes and file counts

`gen(model, mode)` filters files by a numeric tier (`tier <= { minimal: 0, standard: 1, full: 2, agent: 3 }[mode]`).
Counts below are produced by `tests/docs-consistency.test.js` from the synthetic golden fixture, so they include one
component and two reference frames. A real file with more components or frames produces more files in the same tiers.

<!-- FILE-COUNTS:START -->
| Mode | Files | What it adds |
|---|---|---|
| `minimal` | 6 | `design.md`, `tokens.css`, `SKILL.md`, `ai-control.md` and one HTML per reference frame |
| `standard` | 13 | adds `tokens.md`, `components.md`, `components.css`, component HTML, `components/index.json`, `reference/index.json`, `validation.md` |
| `full` | 17 | adds `metadata/token-map.json`, `metadata.json`, `manifest.json`, `validation-report.json` |
| `agent` | 18 | adds `rules/validation-rules.json` |
<!-- FILE-COUNTS:END -->

The UI always requests `full` (`ui.html` sends `mode: 'full'`), so a downloaded package is the 17-file shape above,
plus one HTML file per component variant and per reference frame.

## Files

### Tier 0 — always present

| Path | Role |
|---|---|
| `design.md` | Human and agent overview: rules, read order, typography, themes, project context. |
| `SKILL.md` | Agent entrypoint: read order, authority order, contextual-retrieval protocol, verification commands. |
| `tokens.css` | Single source of truth for every value: CSS variables, `.text-*` classes, paints, shadows, `[data-theme]` selectors. |
| `ai-control.md` | `adherence_level` front matter, per-level behaviour, always-rules. Read before every task. |
| `content.md` | Product context pack. **Not** part of the default package (decision D6); produced only when the content pack is explicitly requested. |
| `components.css` | Rules for the exported component HTML, once per component. |
| `reference/<frame>.html` | One standalone HTML document per selected reference frame, named after the frame. |
| `reference/assets/<file>` | Binary assets used by a reference frame, externalized instead of inlined. |

### Tier 1 — `standard` and above

| Path | Role |
|---|---|
| `tokens.md` | Explains tokens: accounting, per-category tables, aliases, modes, gaps. |
| `components.md` | Component list with exact sizes, variants, Spec CSS built only from tokens. |
| `components/<component>.html` | One HTML document per main component and per component-set variant. |
| `components/index.json` | Schema `1.1.0`. Coverage, variant rows, component graph, observed patterns, and a **pointer** to `reference/index.json`. |
| `reference/index.json` | Canonical source-evidence index: page, file, viewport, pattern, component, variant, instance, token and link evidence, plus `cssMode`. |
| `validation.md` | Design-system health, grouped findings, package self-check score. |

### Tier 2 — `full` and above

| Path | Role |
|---|---|
| `metadata/token-map.json` | Canonical token data: stable IDs, alias chains, roles, per-mode status, CSS emission state. |
| `manifest.json` | Inventory: generator, source, scope, capabilities, dependencies, limitations, validation status, output fingerprints. |
| `metadata.json` | Generator version, timestamp and mode. Excluded from fingerprints because it changes every run. |
| `validation-report.json` | Complete findings array plus package findings and counts. |
| `icons.json` | Detected icons with confidence and evidence, when any icon was detected. |

### Tier 3 — `agent` only

| Path | Role |
|---|---|
| `rules/validation-rules.json` | The rule IDs that fired for this file, so an agent can react without parsing prose. |

## Deliberately not shipped

| Not shipped | Why |
|---|---|
| `schemas/` | Decision D5. Schemas are development-time contracts; the verifier reads them from the repository, and copying them into the package would inflate the agent context. |
| `tests/`, `scripts/`, `engines/` | Development-only. |
| Font files | Decision D7 is unresolved. The Figma Plugin API does not hand out font files, and bundling a font without a licence is a legal risk. Custom fonts are declared, then referenced by `@font-face` with a `fonts/` folder the user must supply. |
| Figma layer images or screenshots | Reference output is HTML only; previews stay inside the plugin. |
| `content.md` by default | Decision D6. Product context stays in `design.md` → Project Context. |

## Migration notes

| Change | Consumers must |
|---|---|
| `components/index.json` `1.0.0` → `1.1.0` | Stop reading `references.entries`; follow `references.index` to `reference/index.json`. This is an intentional breaking change; the duplicate list is not retained. |
| Reference CSS gained an explicit mode | Read `reference/index.json.cssMode`; `standalone` is still the default and behaves as before. |
| `content.md` left the default package | Read Project Context from `design.md` instead. |
| Fingerprints were added to `manifest.outputs` | Treat `manifest.json` and `metadata.json` as unhashed by design; both exclusions are declared in the manifest. |

## Verifying a package

```bash
node scripts/verify.mjs package <package-dir>
```

Rules, severities and fixes are catalogued in [`verify-rules.md`](verify-rules.md). A package that passes `verify` still
cannot be claimed as visually correct: the verifier checks internal consistency, never design quality.