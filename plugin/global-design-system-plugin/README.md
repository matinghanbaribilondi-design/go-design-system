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
`reference/` (standalone HTML per frame only — no Figma layer images — plus `index.html` and `icons.html`),
`components/` + `components.css` (HTML per component, rendered by fig-engine).

## Engine module
`code.js` = fig-engine bundle (global `FigEngine`, contract 1) + `src/core.js`. Reference frames and component
HTML both come from `FigEngine.exportFrame` / `FigEngine.exportComponent`. To update the engine later, run
`npm run sync-engine:build` — see `engines/fig-engine/README.md`.
