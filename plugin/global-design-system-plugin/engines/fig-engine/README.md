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
FigEngine.capabilities            // ["frame", "component", "markers", "metadata"]

await FigEngine.exportFrame(node, tokens, options)
// -> { engine, version, name, width, height, bodyHtml, css, vars, links, fonts, rtl, nodes, assets, files, components, notes }

await FigEngine.exportComponent(node, tokens, options, classNames?)
// -> { engine, version, nodeId, name, className, width, height, html, css, vars, nodes, files, metadata, notes }
```

- `tokens` is the core token map (`refTokenMap`), used for value matching and CSS variables.
- `exportComponent` accepts an optional `Set` of class names so components in one build share a namespace and
  do not collide; `COMPONENT_SET` nodes render their first variant.
- `options.matchColorsByValue` maps raw colors to tokens by value; `options.embedImages` keeps assets inline.
- Output is pure CSS (no Tailwind), px units, no reset; the adapter adds links/fonts/asset externalization.
- `markers`: reference frames carry `data-component` / `data-component-id` on every node that came from a Figma
  component, so a frame states which component each subtree is — the link from `reference/*.html` to
  `components/*.html` that a standalone HTML file can actually hold.
- `metadata`: the engine's `readComponentMetadata` also yields the Component **Set** identity and the property
  values, so markers grow to `data-component-family`, `data-component-family-id`, `data-variant-<axis>` and
  `data-component-prop-<name>`. `exportFrame.components` is the de-duplicated list of components the frame uses
  (id, name, family, variantProperties, propertyDefinitions) and `exportComponent.metadata` is the same thing for
  the exported component itself. `core.js` writes both into `components/index.json` (`metadata` + `usedIn`).
- `core.js` checks `contract === 1` before using the module. If the contract changes, bump it in both places.

### Renderer options the adapter deliberately leaves off

| Renderer option | Why the plugin does not use it |
|---|---|
| `componentDedup` | It shares one class per component and emits its rules once, across the whole export. Each reference frame here must stay standalone HTML, so a later frame would reference rules its own stylesheet does not contain. |
| `responsive` / `intrinsicReflow` / `designWidth` | The reference HTML is visual evidence: it has to render at the size it was designed at, not reflow. |
| `embedFontsBase64` / `customFonts` | The Figma Plugin API does not hand out font files; the package ships `fonts.css` plus instructions instead. |
| `debugFigmaIds` | `data-figma-id` is for the pixel-diff harness; the package keeps the markup clean. |

## Updating the engine

```
npm run sync-engine          # vendor changed files from the fig-engine repo, refresh ENGINE.json
npm run sync-engine:build    # sync, rebuild the bundle, reassemble code.js
node scripts/build.mjs       # bundle + assemble only
node scripts/sync-fig-engine.mjs --dry   # report added/changed/removed vendored files, write nothing
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
