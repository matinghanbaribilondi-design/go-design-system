# Global Design System — Figma ↔ design.md compiler

## Install (Figma desktop app)
Plugins → Development → Import plugin from manifest → choose `manifest.json`. No build is needed:
`code.js` and `ui.html` are ready to run.

The panel opens at 920×720. Drag the grip in the bottom-right corner to resize it (double-click resets to the
default); the last size is remembered in `figma.clientStorage`.

## Layout
```
manifest.json, code.js (generated), ui.html
src/core.js                 the compiler (extraction, tokens, validation, generators, prompt, AI control)
engines/fig-engine/         HTML + component engine, vendored from fig-engine (see engines/fig-engine/README.md)
reference-engine/           legacy Reference module (no longer bundled; kept for reference)
scripts/build.mjs           builds the engine bundle and assembles code.js = engine + core
scripts/sync-fig-engine.mjs updates the engine module from the fig-engine repo
tests/                      core.test.js (unit), figma-mock.test.js (pipeline against a mocked Figma API),
                            preview-harness.html (mock UI for manual browser checks)
docs/traceability-matrix.md
assets/                     logo
```

## Build and test
```
npm install                       # only needed to rebuild the engine (esbuild)
node scripts/build.mjs            # engine bundle + code.js
node scripts/build.mjs --assemble-only   # reuse the prebuilt engine bundle
npm test
```
Edit `src/core.js` (never `code.js`), then rebuild.

## Output package
`SKILL.md`, `design.md`, `tokens.css`, `tokens.md`, `components.md`, `content.md`, `validation.md`, `ai-control.md`,
`reference/` — exactly one HTML file per selected frame, named after the frame and containing that frame only
(no index, no icon sheet, no shared stylesheet, no Figma image exports),
`components/` + `components.css` (HTML per main component and every component-set variant from every page, rendered automatically by fig-engine; no component selection or export cap). The default variant keeps the family file name; other variants have their own HTML files. `components/index.json` reports source/exported/failed variant coverage and includes a searchable graph of family/variant relationships, stable token links, nested dependencies, observed instances and reference usage. Extraction status and missing/external dependencies remain explicit.

The same index contains observed reference patterns: references are grouped by a deterministic normalized HTML-structure fingerprint before counts are calculated. Text, generated classes, inline styles, Figma node IDs and variant values do not affect the fingerprint. Each pattern retains its normalized tree, exact reference/node evidence, component states, viewport or variant exceptions, `Observed` status and explicit limitations; semantic pattern names are not guessed.

Full and Agent modes also include `metadata/token-map.json` and `manifest.json`. Both share one token-accounting calculation covering source tokens, aliases, mode values, emitted CSS variables, unresolved values and ambiguous color matches. Collection IDs, default modes and per-mode IDs are preserved.

## Package validation
`lintPackage` checks Markdown, HTML, CSS and JSON, including local links and anchors, `data-go`, `url()` / `@import`, undefined CSS variables, basic JSON schemas, manifest/model consistency and missing mode selectors. Findings carry a code, severity, file, location and message, and are written to `validation.md` and `validation-report.json`. Source errors or warnings prevent a perfect package self-check even when all files exist.

Token CSS names are deterministic under input reordering. Aliases and explicit bindings resolve by Figma ID; ambiguous same-value color matches stay unresolved instead of guessing a semantic token.

## Source step: AI creativity level
A discrete slider with exactly five positions, 0–4:

| Position | Label | Rule adherence | Creative freedom | `adherence_level` |
|---|---|---|---|---|
| 0 | Strict (default) | 100% | 0% | 0 |
| 1 | Conservative | 80% | 20% | 2 |
| 2 | Balanced | 60% | 40% | 5 |
| 3 | Creative | 40% | 60% | 7 |
| 4 | Open | 20% | 80% | 10 |

The dark track runs from the left end to the selected marker, the selected marker is near-black with a focus ring,
and the pill under the slider repeats the two percentages. Positions, labels and the mapping to `ai-control.md`
levels come from `levelPicker()` in `src/core.js` and travel in the `discover` payload, so the plugin can never
drift from the file. Drag, click or use Arrow/Home/End keys; the choice is remembered in `clientStorage`.

## References step
Every top-level frame is collected — from the page itself and from sections at any depth; a frame nested inside a
frame is never offered on its own, and a section is never a reference. **Reload** re-reads the selected pages in
place: added, renamed and deleted frames appear without leaving the step and the selection is kept for the frames
that still exist. **Select all** selects every discovered frame, while **Recommended** and **None** provide the other
selection presets. Each card shows a live preview of its frame; **⤢ Full view** opens it full screen with Fit / 100%
switching and two-axis scrolling so the whole frame can be inspected (previews stay in the plugin, never packaged).

## Engine module
`code.js` = fig-engine bundle (global `FigEngine`, contract 1) + `src/core.js`. Reference frames and component
HTML both come from `FigEngine.exportFrame` / `FigEngine.exportComponent`. To update the engine later, run
`npm run sync-engine:build` — see `engines/fig-engine/README.md`.
