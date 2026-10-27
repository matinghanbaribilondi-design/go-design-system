# Reference engine (pluggable module)

This folder is the whole "Reference" feature: it turns Figma frames into standalone HTML + CSS.
The rest of the plugin (`src/core.js`) never imports anything from `vendor/`; it only talks to
`adapter.ts` through a small contract. That is what lets you update this part on its own.

```
reference-engine/
  ENGINE.json                 id, contract version, engine version, hash of the vendored files
  adapter.ts                  the ONLY file the host depends on (contract v1)
  vendor/pixel-perfect/       your Pixel-Perfect plugin (converter, generators, IR, variables), copied unchanged
  dist/reference-engine.bundle.js   prebuilt bundle (esbuild, IIFE, global `ReferenceEngine`)
```

## Contract v1 (what core.js relies on)

```ts
ReferenceEngine.contract            // 1
ReferenceEngine.id / .version       // "pixel-perfect" / "1.0.0"
ReferenceEngine.exportFrame(node, tokens, options) -> Promise<{
  bodyHtml, css, width, height, vars[], links[], fonts{family:[weights]}, rtl, nodes, assets, notes[]
}>
tokens = { variables: {variableId: "--css-name"}, styles: {styleId: "--css-name"}, colors: {"#RRGGBB": "--css-name"} }
```
`tokens` carries the host's own CSS variable names, so the exported HTML uses exactly the same
variables as `tokens.css`. The host wraps `bodyHtml` + `css` in its viewer (Fit/100%, Figma image
compare, theme switch, links between frames) and inlines only the variables that were used.
If the engine is missing or its contract differs, the host falls back to its built-in simple renderer.

## How to update only this module

1. **Sync from your plugin repo** (recommended)
   `node scripts/sync-reference.mjs ../your-plugin --build`
   It copies converter, types, variables, shared and the HTML/CSS/Tailwind generators, prints what was
   added / changed / removed, checks that the functions the adapter needs still exist, updates
   `ENGINE.json` and rebuilds `code.js`. Use `--dry` to only see the report.
2. **Drop in a prebuilt bundle**
   Replace `dist/reference-engine.bundle.js`, then `node scripts/build.mjs --assemble-only`
   (no esbuild needed).
3. **Replace the engine entirely**
   Keep `adapter.ts` exporting the same contract and point it at the new code.
4. **Turn it off**
   `node scripts/build.mjs --no-engine` builds `code.js` with the built-in renderer only.

If the sync prints `ADAPTER NEEDS UPDATE`, a function the adapter imports was renamed or moved:
edit `adapter.ts` (a few lines), then run `node scripts/build.mjs`.

## Rules for changing the contract
- Additive changes (new optional fields) keep `contract = 1`.
- A breaking change bumps `contract` in `adapter.ts`; `core.js` then ignores the engine and uses the
  fallback until `core.js` is updated to the new contract.
