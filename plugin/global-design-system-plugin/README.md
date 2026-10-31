# Global Design System — one-way Figma → package exporter

## Install (Figma desktop app)
Plugins → Development → Import plugin from manifest → choose `manifest.json`. No build is needed:
`code.js` and `ui.html` are ready to run.

The panel opens at 920×720. Drag the grip in the bottom-right corner to resize it (double-click resets to the
default); the last size is remembered in `figma.clientStorage`.

## Product direction
The supported product contract is one-way export: Figma → design-system package. The legacy `build` message remains
available only as an explicitly `experimental`, color-only import capability; it is not a bidirectional compiler and
is not exposed as a supported UI workflow.

## Layout
```
manifest.json, code.js (generated), ui.html
src/core.js                 the compiler (extraction, tokens, validation, generators, prompt, AI control)
engines/fig-engine/         HTML + component engine, vendored from fig-engine (see engines/fig-engine/README.md)
reference-engine/           legacy Reference module (no longer bundled; kept for reference)
scripts/build.mjs           builds the engine bundle and assembles code.js = engine + core
scripts/sync-fig-engine.mjs updates the engine module from the fig-engine repo
scripts/verify.mjs          validates a downloaded package or generated UI independently
scripts/benchmark.mjs       measures pattern, reference-index and package-generation cost
scripts/benchmark-ai.mjs    evaluates supplied artifacts for the fixed AI-effectiveness benchmark
scripts/update-golden.mjs   regenerates the reviewed deterministic package fixture
benchmark/ai/               six fixed tasks, three conditions and the result contract
schemas/                    internal JSON Schema Draft 2020-12 contracts used by verify and tests
tests/                      core.test.js (unit), figma-mock.test.js (pipeline against a mocked Figma API),
                            golden.test.js + fixtures/golden-package (byte-identical output fixture),
                            verify.test.js (schema/package checks), verify-ui.test.js (UI rules),
                            zip-roundtrip.test.js (real UI ZIP archive), benchmark-ai.test.js,
                            preview-harness.html (mock UI for manual browser checks)
docs/traceability-matrix.md, docs/v2.0-acceptance-checklist.md, docs/v2-architecture-decisions.md
assets/                     logo
```

Documentation is indexed in [`docs/README.md`](docs/README.md). Start there for the status vocabulary, the language
policy and the reading order. The two contracts a consumer needs are
[`docs/package-contract.md`](docs/package-contract.md) (what the ZIP contains in each mode) and
[`docs/verify-rules.md`](docs/verify-rules.md) (every rule ID with its meaning and fix).

## Build and test
```
npm install                       # only needed to rebuild the engine (esbuild)
node scripts/build.mjs            # engine bundle + code.js
node scripts/build.mjs --assemble-only   # reuse the prebuilt engine bundle
npm test                          # unit, Figma mock, golden, package/UI Verify, ZIP and benchmark suites
node scripts/verify.mjs <package-dir>                      # check a downloaded package
node scripts/verify.mjs ui <ui-dir> --package <package-dir>  # check generated UI against the package
node scripts/benchmark.mjs 500                              # measure code performance with 500 references
node scripts/benchmark-ai.mjs --results <run-dir>            # evaluate a complete AI benchmark artifact bundle
node tests/docs-consistency.test.js                          # keep documented counts, paths and rule IDs honest
npm run golden                    # review the diff before accepting a fixture change
```
Edit `src/core.js` (never `code.js`), then rebuild. Per D5, `schemas/` and example fixtures remain development-time
contracts: they are not copied into the AI package. `scripts/verify.mjs` reads them from the development package, while
package-time validation checks generated JSON without shipping redundant schemas to the AI context.

## Output package
`SKILL.md`, `design.md`, `tokens.css`, `tokens.md`, `components.md`, `validation.md`, `ai-control.md`,
`reference/index.json` plus exactly one HTML file per selected frame, named after the frame,
`components/` + `components.css` (HTML per main component and every component-set variant from every page, rendered automatically by fig-engine; no component selection or export cap). The default variant keeps the family file name; other variants have their own HTML files. `components/index.json` reports source/exported/failed variant coverage and includes a searchable graph of family/variant relationships, stable token links, nested dependencies, observed instances and a pointer to the canonical Reference Index. Extraction status and missing/external dependencies remain explicit.

`components/index.json` also contains observed reference patterns. References are grouped by a deterministic normalized HTML-structure fingerprint before counts are calculated. Text, generated classes, inline styles, Figma node IDs and variant values do not affect the fingerprint. Each pattern retains its normalized tree, exact reference/node evidence, component states, viewport or variant exceptions, `Observed` status and explicit limitations; semantic pattern names are not guessed.

`reference/index.json` is the canonical source-evidence index. Current HTML is classified as `source-evidence`; no generated-guide artifacts exist, so no misleading empty subdirectories are created. The index contains each frame's page, file, viewport, pattern IDs, component/family IDs, variant and instance evidence, token variables, extraction limitations and prototype links. Component relationships remain in `components/index.json`; the nested `references` object is only a pointer, not a duplicate. `SKILL.md` tells an agent to filter index entries and open only the relevant frame, component or pattern.

`components/index.json` is schema `1.1.0`: consumers that previously read `references.entries` must now follow `references.index` to `reference/index.json`. This is an intentional breaking migration; the duplicate nested list is not retained.

Reference CSS has an explicit mode. **Standalone** remains the default and inlines the used token values. **Shared** links `../tokens.css` and expects the canonical package variables and theme selectors. Shared mode falls back to Standalone if `tokens.css` is absent or any used variable is not defined; `reference/index.json.cssMode` records the requested/resolved mode and fallback reason.

`content.md` is not part of the current default package. Product context remains available in `design.md` Project Context. The legacy optional Content Pack code stays isolated and is not exposed by the default workflow.

Full and Agent modes also include `metadata/token-map.json` and `manifest.json`. Both share one token-accounting calculation covering source tokens, aliases, mode values, emitted CSS variables, unresolved values and ambiguous color matches. Collection IDs, default modes and per-mode IDs are preserved.

`manifest.json` now records the generator version, optional Figma `fileKey` (never fabricated), extraction scope, capability/coverage states, declared external font/component dependencies, bundled asset paths, limitations, validation report path and deterministic fingerprints for generated files. `metadata.json` is excluded from fingerprints because it contains `generatedAt`; the manifest itself is excluded as a self-reference. Both exclusions are declared in the manifest.

## Package validation
`lintPackage` checks Markdown, HTML, CSS and JSON, including local links and anchors, `data-go`, `url()` / `@import`, undefined CSS variables, basic JSON schemas, manifest/model consistency and missing mode selectors. Findings carry a code, severity, file, location and message, and are written to `validation.md` and `validation-report.json`. Source errors or warnings prevent a perfect package self-check even when all files exist.

Token CSS names are deterministic under input reordering. Aliases and explicit bindings resolve by Figma ID; ambiguous same-value color matches stay unresolved instead of guessing a semantic token.

`verify.mjs ui` is separate from package validation. Its input contract is a UI directory containing local HTML/CSS/assets plus a `--package` directory for `tokens.css` and `components/index.json`. It checks forbidden literals, undefined token references, invalid component variants, unsupported themes, missing assets and malformed CSS. Diagnostics carry stable rule IDs (`UI_LITERAL_COLOR`, `UI_TOKEN_UNDEFINED`, `UI_VARIANT_INVALID`, `UI_MODE_UNSUPPORTED`, `UI_ASSET_MISSING`, and others), severity, file, location and an actionable message. It does not claim to prove visual or UX quality.

## AI-effectiveness benchmark
`benchmark/ai/tasks.json` defines six fixed design tasks and three conditions (`no-package`, `current`, `updated`). `scripts/benchmark-ai.mjs` evaluates supplied artifacts with the deterministic UI rules, retrieval evidence, context consumption and required answer phrases. Human visual review and model-assisted review are separate fields and cannot be substituted for each other.

No benchmark artifacts or human reviews exist yet, so the benchmark status is **blocked** and no improvement is reported. See `benchmark/ai/README.md`. Architecture decisions that still require approval are documented in `docs/v2-architecture-decisions.md`; font/asset licensing remains blocked by decision D7.

## Source step: AI creativity level
A discrete slider with exactly six positions, 0–5:

| Position | Label | Creative freedom | Internal `adherence_level` |
|---|---|---|---|
| 0 | Strict (default) | 0% | 0 |
| 1 | Conservative | 20% | 2 |
| 2 | Balanced | 40% | 5 |
| 3 | Creative | 60% | 7 |
| 4 | Advanced Creative | 80% | 9 |
| 5 | Open | 100% | 10 |

Creativity measures design exploration and permitted deviation; it is not a probability of obeying rules. Hard
constraints (valid tokens, existing components/variants and supported modes) remain mandatory at every level.
The dark track runs from the left end to the selected marker and the pill states the creativity percentage plus
the enforced-constraints status. Positions, labels and the mapping to `ai-control.md` come from `levelPicker()`
in `src/core.js` and travel in the `discover` payload, so the plugin cannot drift from the file. Drag, click or use
Arrow/Home/End keys; the choice is remembered in `clientStorage`.

## References step
Every top-level frame is collected — from the page itself and from sections at any depth; a frame nested inside a
frame is never offered on its own, and a section is never a reference. **Reload** re-reads the selected pages in
place: added, renamed and deleted frames appear without leaving the step and the selection is kept for the frames
that still exist. **Select all** selects every discovered frame, while **Recommended** and **None** provide the other
selection presets. The **Reference CSS** control selects Standalone or Shared mode explicitly. Each card shows a live
preview of its frame; **⤢ Full view** opens it full screen with Fit / 100% switching and two-axis scrolling so the
whole frame can be inspected (previews stay in the plugin, never packaged).

## Engine module
`code.js` = fig-engine bundle (global `FigEngine`, contract 1) + `src/core.js`. Reference frames and component
HTML both come from `FigEngine.exportFrame` / `FigEngine.exportComponent`. To update the engine later, run
`npm run sync-engine:build` — see `engines/fig-engine/README.md`.
