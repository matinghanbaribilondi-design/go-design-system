# fig-engine module (contract 1)

HTML and component export for the plugin. The plugin never parses `.fig` files; it only uses fig-engine's
renderer pipeline (SceneNode → IR → HTML/CSS), which is sandbox-safe. The Node-only parts of fig-engine
(`.fig` reader, server, CLI) are intentionally not vendored.

## Layout

```
adapter.ts                 contract implementation (exportFrame, exportComponent)
ENGINE.json                provenance: source repo, version, commit, file hash, entry files
VENDOR-FILES.txt           exact vendored file list (pruned automatically on sync)
vendor/html-generator/     import closure of the renderer (converter, generators, registry, utils)
dist/fig-engine.bundle.js  esbuild IIFE bundle, global `FigEngine` (generated)
```

`code.js` is assembled as `FigEngine` bundle + `src/core.js` by `scripts/build.mjs`.

## Contract

```js
FigEngine.id                      // "fig-engine"
FigEngine.version                 // e.g. "1.0.0"
FigEngine.contract                // 1
FigEngine.capabilities            // ["frame", "component"]

await FigEngine.exportFrame(node, tokens, options)
// -> { engine, version, nodeId, name, width, height, html, css, vars, nodes, files, notes, snapshot?, thumb? }

await FigEngine.exportComponent(node, tokens, options, classNames?)
// -> { engine, version, nodeId, name, className, width, height, html, css, vars, nodes, files, notes }
```

- `tokens` is the core token map (`refTokenMap`), used for value matching and CSS variables.
- `exportComponent` accepts an optional `Set` of class names so components in one build share a namespace and
  do not collide; `COMPONENT_SET` nodes render their first variant.
- `options.matchColorsByValue` maps raw colors to tokens by value; `options.embedImages` keeps assets inline.
- Output is pure CSS (no Tailwind), px units, no reset; the adapter adds links/fonts/asset externalization.
- `core.js` checks `contract === 1` before using the module. If the contract changes, bump it in both places.

## Updating the engine

```
npm run sync-engine          # vendor changed files from the fig-engine repo, refresh ENGINE.json
npm run sync-engine:build    # sync, rebuild the bundle, reassemble code.js
node scripts/build.mjs       # bundle + assemble only
```

Paths default to `C:/Users/matin.ghanbari/Desktop/git hub/figma-ai/fig-engine` with `html-generator` as a
sibling; override with `FIG_ENGINE_DIR` / `FIG_ENGINE_HTML_GENERATOR` or `--source` / `--html`.

The sync script resolves the import closure from these entries, copies only runtime files, fails on new
unexpected external imports, prunes removed files, and records hash + commit in `ENGINE.json`. After syncing,
run `node tests/figma-mock.test.js` — it asserts the engine is present, exposes component export, and renders
reference frames through it.

## Build requirements

`esbuild` is required for bundling (`node_modules/esbuild`). `--assemble-only` reuses the existing dist bundle.
`--no-engine` assembles core alone; the plugin then cannot render references or component HTML.
