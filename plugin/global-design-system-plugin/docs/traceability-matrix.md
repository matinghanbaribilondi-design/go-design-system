# Traceability Matrix (v0.4.0)

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Context is a separate, optional step before Scope | ui.html `STEPS[1]`, `drawContent` | manual | implemented |
| Context modes: Auto / Manual / Content document / Skip | ui.html `CM`; code.js `analyze` (`cm`) | core.test.js "auto mode…", "content pack…" | implemented |
| Context never fabricated; omitted = valid | code.js `buildContext`, `ctxMd` | "context omitted…" | implemented |
| Facts vs inferences, provenance (user / figma / inference) | `buildContext` (`facts[].source`, `inferences[]`) | "pasted context…", "RTL inference…" | implemented |
| Pasted context parsed semantically | `parseContext` | "pasted context…" | implemented |
| Context does not create tokens or change values | `buildContext` has no token output | "context never creates tokens" | implemented |
| Rejected inference removed from output | `ctxMd`, `contentMd` (rejInf) | "rejected inference…" | implemented |
| content.md handoff document | `contentMd`, `gen` | "content pack…" | implemented |
| Max 5 Markdown files | `gen` (typography merged into tokens.md) | "content pack…", "generator…" | implemented |
| Dependency policy: Auto Include / Ask / Ignore + Warning | `applyPolicy` | "auto include", "ask before include", "ignore + warning" | implemented |
| Selection ≠ dependency (origin preserved) | token/component `origin`, `requiredBy` | "selection is not a dependency", "generator…" | implemented |
| Dependency reasons and graph | `planDependencies`, ui `drawDeps` | "token alias dependency…" | implemented |
| Missing nested components: Expand Scope / Include / Continue Anyway | `planDependencies`, `applyPolicy`, ui `drawDeps` | "missing component…", "nested component…" | implemented |
| Context shown during Analyze / Review | ui `cfgHtml` | manual | implemented |
| Context influences semantic interpretation (AI layer) | — | — | not implemented (no AI layer yet) |
| Figma integration (extraction, builder) | `buildDraft`, `extractComponent`, `build` | requires Figma runtime | untested here |

## v0.4.0 additions

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| content.md in every output mode when content is on | `gen` (tier 0) | "package: …", "content pack…" | implemented |
| Up to 6 Markdown files (design, tokens, components, content, reference, validation) | `gen` | "package: … ≤ 6 md files" | implemented |
| Source step merges scope, sections, variables, components with dynamic counts, defaults and tags | ui.html `drawSource`, `preset`, `catCount` | headless smoke test | implemented |
| Content auto-filled from file, editable, can be turned off | code.js `listFrames`, `inferFromFrames`, `buildContext(auto)`; ui `drawContent` | "inference…", "auto content…" | implemented |
| Styles are read (local + used library styles), errors surfaced | `buildDraft`, `styleRec`, `STYLES_UNREADABLE` | "package: styles-only file…" | implemented |
| Icon detection in components and frames, with evidence | `iconScore`, `iconInfo`, `noteIcon`, `scanFrames` | "icon detection…" | implemented |
| Optional frame code reference (HTML + CSS) with suggested frames | `nodeHtml`, `frameRef`, `referenceMd`; ui `drawRef` | `referenceMd` in package test; Figma runtime untested | implemented |
| Prompt generator with a fixed, model-agnostic structure | `buildPrompt`, `promptData`; ui Prompt Generator | "prompt: …" (3 tests) | implemented |
| Stepper with hidden horizontal scrollbar | ui.html `.stepper` | headless smoke test | implemented |

## v0.5.0 additions

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Styles row renders as a checkbox row (UI bug) | ui.html `rowIn` | headless smoke test (screenshot) | fixed |
| Icons labeled "Icon" with confidence and reason | `iconsMd`, ui Icons tab | "icons: unnamed icons are labeled…" | implemented |
| Icons detected without a name (shape, size, content) in components and frames | `iconScore`, `describe`, `scanSmall` | "icon detection: unnamed small vector node…" | implemented |
| Icon pack question (17 packs + Custom, Not sure, Other) | ui `PACKS`, `sel.iconPack`; `iconsMd`, `contentMd`, `buildPrompt` | "icons: … pack appears…" | implemented |
| Icons in a separate tab with separate selection from design components | ui `srcTab`, `selIcon`; code.js `designComps` split | smoke test | implemented |

## v0.6.0 additions

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| tokens.css with exact Figma-derived names, aliases as var(), modes as [data-theme], text-style classes, paint/shadow variables | `tokensCss`, `cssNameMap`, `gen` | "tokens.css: …" (2 tests) | implemented |
| Mandatory AI rules inside design.md (use only tokens.css, report MISSING TOKEN, no estimates) | `gen` (`RULES`) | "package: tokens.css is shipped; design.md carries mandatory AI rules…" | implemented |
| Typography table with exact CSS classes inside design.md | `gen` (`textClassTbl`) | same | implemented |
| Exact component sizes: dimensions per variant and Spec CSS using token variables | `componentSpec`, `dimsMd`, `specMd` | same | implemented (Figma runtime untested) |
| Prompt uses exact CSS variable names and the no-literal-values rule | `promptData`, `buildPrompt` | "prompt: tokens are given as exact CSS variables…" | implemented |
| Icons detected from vector shapes and standard sizes (e.g. 20×20), tunable rules, also inside components | `iconScore(rules)`, `scanSmall`, `rescanIcons`; ui "Detection rules" | "icon detection: standard sizes…" | implemented |

## v0.7.0 additions

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Styles: per-style selection, counts per kind, library styles toggle, unreadable styles reported | ui `k_styles`, `styleList`; code.js `styleRec`, `STYLE_UNREADABLE` | figma-mock.test.js (style selection, library styles, styles off) | implemented |
| Figma-side pipeline tested end to end against a mocked Plugin API | tests/figma-mock.test.js | itself | implemented |
| Logo (SVG + PNG) in the UI and as plugin icon assets | assets/logo.svg, logo-128.png, logo-512.png; ui sidebar | headless screenshot | implemented |

## v0.8.0 additions

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| ai-control.md: adherence_level 0–10 in front matter, per-level behavior table, always-rules; read by AI before every task | `LEVELS`, `aiControlMd`, `gen`; design.md rule 9; tokens.css header | "ai-control.md: …", "ai-control: every level keeps…", "package: ai-control.md ships…" | implemented |
| Adherence slider in Generate, Prompt Generator and Settings | ui `syncAdh`; `buildPrompt` (CREATIVITY CONTROL) | "prompt: adherence section…", headless smoke test | implemented |
| Reference modes: Automatic (all frames of selected pages) and Manual (per page / per frame) | ui `drawRef`, `refFrames`, `selObj` | headless smoke test | implemented |
| Frame → standalone HTML (auto layout sizing, text segments, gradients, images, strokes, shadows, blur, rotation, groups, prototype links) | `nodeHtml`, `gradCss`, `paintLayers`, `frameRef` | figma-mock.test.js (rendered in a browser) | implemented (approximation of Figma; Compare view included) |
| Viewer: ~~fit/100%, Figma image compare~~ (removed in the post-0.11.0 UI round), theme switch from modes, links between frames, index, icon sheet | `refDoc`, `refIndex`, `iconsHtml`, `referenceFiles` | "reference: standalone HTML…", "reference: icon sheet…" | superseded by the post-0.11.0 rows below |
| Each HTML is standalone: only the used token variables are inlined | `tokensCss(M, tokens, only)` | "reference: standalone HTML…" | implemented |

## v0.9.0 additions

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Reference as a separate, updatable module with a versioned contract | reference-engine/adapter.ts (contract 1), ENGINE.json, `getEngine`/`refFrame` in core | figma-mock.test.js (engine and fallback) | implemented |
| User's Pixel-Perfect converter/generators used for Figma → HTML, vendored unchanged | reference-engine/vendor/pixel-perfect/ | figma-mock.test.js (rendered in a browser) | implemented |
| HTML uses the same CSS variable names as tokens.css (ids → names, styles, color-by-value) | adapter `buildRegistry`, core `refTokenMap` | figma-mock.test.js | implemented |
| Update only the Reference module: sync script with diff report, contract check, rebuild | scripts/sync-reference.mjs, scripts/build.mjs | manual run (added file, version bump, contract break detected) | implemented |
| Engine selection and fallback in the UI | ui `refEngine`; core `engineInfo` | headless smoke test | implemented |

## v0.10.0 additions (package quality + reference hardening)

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Icon library summarized (pack inferred from names, used icons only, full list in icons.json) | `iconSummary`, `guessPack`, `iconsMd` | "package quality: realistic file…" | implemented |
| Derived tokens for spacing/radius/border so Spec CSS has no literals | `deriveTokens`, `enrichModel`, tokensCss derived block | same | implemented |
| Unbound text → matching text style or explicit report; unbound colors → nearest token + gap table | `matchTextStyle`, `nearestColor` | same | implemented |
| Unique component names/IDs; rounding; compact context; screens grouped, icon sheets excluded | `uniquifyComponents`, `groupScreens`, `ctxMd`, `scanFrames` | same | implemented |
| Read order, conditional rules/themes, aggregated validation, weighted health | `gen`, `rulesMd`, `aggregateIssues`, `validate` | same | implemented |
| Package self-check (13 checks, score shown in UI and validation.md) | `lintPackage` | "package quality: lint catches real defects" | implemented |
| Reference: images and Figma pictures as files (not base64), shared assets | adapter `externalizeImages`, `referenceFiles` | "reference: …", figma-mock.test.js | implemented |
| Reference: custom fonts never break the Google Fonts link; fonts.css + instructions | `isGoogleFont`, `fontsCss` | "reference: custom fonts…" | implemented |
| Reference: chunked transfer, binary files, per-frame fallback, report, frame-list time budget | `sendFiles`, `refFrame`, `listFrames`; ui | "files are sent in chunks…", headless smoke | implemented |

## v0.11.0 additions (fig-engine module + four-step UI)

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| HTML export and component HTML use fig-engine as an updatable module | engines/fig-engine/adapter.ts (contract 1: `exportFrame`, `exportComponent`), ENGINE.json provenance, `engineModule()` in core | figma-mock.test.js (engine id/capabilities, component HTML) | implemented |
| Engine can be re-synced without touching core | scripts/sync-fig-engine.mjs (import closure, pruning, hash/commit), `npm run sync-engine` / `sync-engine:build` | manual run; build.mjs assemble | implemented |
| Component HTML in the package | `exportComponent` per component with shared class set; `components/*.html`, `components.css`, `components/index.json` | figma-mock.test.js | implemented |
| Four-step UI (Source → References → Build → Download) with real progress | ui.html rewritten; `progress`/`analysis`/files messages drive the ring, tasks and file list; real ZIP (store + CRC32) | preview-harness.html manual browser run | implemented |
| Figma pages as a source dimension | `discover` returns pages with recommendation; UI selection feeds `pageIds`; page changes reset refs | preview-harness.html manual browser run | implemented |
| SKILL.md entry point for AI agents | `skillMd()` in core, packaged first in read order | core.test.js (markdown limits), figma-mock.test.js (file list) | implemented |
| Legacy reference engine superseded | reference-engine/ no longer bundled; `FigEngine` preferred by core | figma-mock.test.js asserts fig-engine | implemented |

## Reference HTML only + resizable panel (post-0.11.0 UI round)

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Each References-step card shows a real preview of the frame | `frameThumb` in core (Figma `exportAsync` PNG, cached, size-capped), lazy queue + IntersectionObserver in ui.html | figma-mock.test.js ("reference card preview…", cache, missing frame), preview-harness.html browser run | implemented |
| Reference output is HTML only: no Figma layer image, no snapshots/thumbs in the package | `snap()` deleted; `referenceFiles` emits only the selected frames and referenced assets | core.test.js "no Figma layer images are packaged", figma-mock.test.js | implemented |
| No Fit / 100% or compare controls in exported reference HTML | bare `refDoc`; `VIEWER_CSS`, viewer scripts and wrappers deleted | core.test.js, figma-mock.test.js (body contains only the frame root) | implemented |
| Step connector line stops at the label, never under or over it | `.steps` flex layout with explicit `.step-line` separators; `setStep` marks the passed ones | preview-harness.html browser run (line boxes sit strictly between label and next number) | implemented |
| Panel can be resized in Figma and remembers its size | `.grip` drag in ui.html sends `resize` (+`commit`), `uiSize` clamp and `figma.ui.resize`, `clientStorage['ui-size']` restored at start | figma-mock.test.js (clamp + committed size), browser drag test with 3-column wide layout | implemented |
| Engine re-synced to fig-engine/html-generator HEAD (rotated rules, RTL columns, blurred glass, real form controls already in the bundle) | `node scripts/sync-fig-engine.mjs` → 39 files, hash `b8a275eb0acc`, commit `ea0c8a6` in ENGINE.json | sync dry report + figma-mock.test.js renders through the bundle | superseded by the metadata sync below |
| Component & variant metadata from the engine (fig-engine `4b02080`) | sync → 40 files, hash `63c4c172135e`; adapter `componentMeta()` + `usedComponents()`; `exportFrame.components`, `exportComponent.metadata`, capability `metadata`; core writes `metadata` + `usedIn` into `components/index.json` | figma-mock.test.js (`data-component-family`, `data-component-family-id`, `data-variant-size`, index.json family/variant/options and `usedIn: ['Home.html']`) | implemented |
| Reference frames name the Figma component behind each subtree | adapter `exportFrame` passes `{ componentMarkers: true }` to `generateHtml`; capability `markers` added | figma-mock.test.js (`data-component="Size=Medium" data-component-id="v:Size=Medium"` on an INSTANCE in the mock frame) | implemented |
| Renderer options that conflict with standalone HTML stay off, on record | `componentDedup`, `responsive`/`intrinsicReflow`/`designWidth`, `embedFontsBase64`, `debugFigmaIds` — rationale table in engines/fig-engine/README.md | engines/fig-engine/README.md | documented |
| Sections are entered, never read as a reference; frames inside a frame are never offered separately | `topFrames(page)` is now async, descends through `SECTION` at any depth and stops at the first `FRAME` (used by `listFrames`, `scanFrames`, screens, and the page counts in `discover`) | figma-mock.test.js (`['fr:1','fr:2','fr:4','fr:3']` with a section inside a section and a frame inside Home) | implemented |
| Live refresh of the frame list without leaving the References step | `#refsReload` re-sends `frames`; UI diffs the reply (new / renamed / removed), keeps the selection for surviving frames, resets previews; `listFrames` clears the sandbox preview cache | preview-harness.html browser run ("Reloaded · 1 new, 1 renamed, 1 removed." with previews re-fetched) | implemented |
| Each reference is the frame's HTML only, named after the frame | `refFileName`/`refFileNames` (frame name made FS-safe, ` (2)` only on collision), new bare `refDoc` (no bar, no select, no script; `data-go` now names the target file), `referenceFiles` emits one file per frame and nothing else (`refIndex`, `iconsHtml`, `VIEWER_CSS` deleted; `@font-face` inlined per file) | core.test.js (three reference tests), figma-mock.test.js (no index/icons/fonts.css, body holds only the frame) | implemented |
| Discrete AI creativity slider: five positions 0–4 (Strict / Conservative / Balanced / Creative / Open) with rule-adherence and creative-freedom percentages, dark track filling to the selected marker (passed dots go black too), summary pill, keyboard support | `CREATIVITY_STEPS` + `levelPicker()` in core (positions map to ai-control.md levels 0/2/5/7/10) shipped in the `discover` payload; `#adhTrack` in the Source step (pointer drag with snap, click, Arrow/Home/End, `role="slider"` + `aria-valuetext`), `#adhSum` pill; `sel.adherence` → `MODEL.adherence` → `ai-control.md` | core.test.js (five positions, exact labels and percentages, each mapping a real level), figma-mock.test.js (`steps` in discover, `adherence_level: 7` shipped), browser checks (default 0 → 100/0; click 1 → fill 25% and 80/20; keys 2→4→3→0; percentages never collide at 520px or 920px) | implemented |
| All main frames are found: page level and the first frame level inside sections, without a cap | `listFrames` no longer slices at 80; `analyze` no longer caps refs at 100; `discover` counts frames + sections only | figma-mock.test.js (94 frames listed incl. `mf:89` two sections deep, `screens: 94`) | implemented |
| Full view of any reference frame from its card | `frameThumb` `size: 'full'` (≤1500×4000, never upscaled, byte-capped with step-down, cached per size); `⤢ Full view` + `#viewer` overlay in ui.html with Fit/100%, two-axis scroll, Esc/backdrop close and focus return | figma-mock.test.js (full vs card sizes differ, dims reported, errors routed), browser check (open, 1440px at 100%, scroll, Esc) | implemented |
| Every main component and component set on every page exports automatically as HTML | all-page scan in `buildDraft`, independent of `pageIds` and legacy component selection; uncapped `FigEngine.exportComponent` loop with progress and yielding; component toggle removed from Source | figma-mock.test.js (Badge lives only on unselected p2; `componentIds: []` + `componentHtml: false` cannot disable it; both HTML files and index rows asserted) | implemented |
| Select all references | `#refsAll` selects every id in `S.frames`, then refreshes cards, count and footer | preview-harness.html browser run (None → 0; Select all → 4/4; no console errors) | implemented |

## v2.0 phase zero: deterministic tokens and package validation

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| CSS names are independent of token traversal order; every collision member gets a stable ID-based suffix | `nameHash`, grouped and sorted `cssNameMap`; ambiguous `byName` entries omitted | core.test.js collision test plus reverse, rotation and sorted permutations | implemented |
| Aliases and component bindings resolve by Figma ID before any legacy name fallback | `resolve().aliasId` / `ids`, `componentSpec().boundId`, ID-first `bindingCss` and `tokensCss` | core.test.js multi-level, broken and circular alias fixture; explicit-binding package test | implemented |
| Equal color values never select a semantic role by guess | `valueMatchIssues`; ambiguous values excluded by `refTokenMap` and `nearestColor` | core.test.js equal-value ambiguity test | implemented |
| Font-weight names map to standard numeric CSS; unknown names remain unresolved | `fontWeightValue`, `cssValue`, `TOKEN_INVALID_CSS_VALUE` | core.test.js Regular=400 and CustomWeight error | implemented |
| `content.md` is referenced only when generated | conditional `ctxMd(..., contentPack)` | existing content-pack and generator tests | implemented |
| Package lint covers JSON syntax/basic schemas, Markdown/HTML/CSS references, anchors, CSS variables, manifests and mode selectors | `packageLintFindings`; structured `code`, `severity`, `file`, `location`, `message`; findings included in validation.md/report | core.test.js cross-format defect and manifest/mode mismatch fixtures | implemented |
| Package self-check cannot report 100/100 while source errors or warnings remain | `valid` check includes real validation findings; weighted score remains explainable | realistic fixture scores 95 with 13 warnings and zero package-integrity findings | implemented |

## v2.0 token accounting and complete variant HTML

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Source-token, alias, mode-value, emitted-CSS, unresolved and ambiguous-value counts are explainable | `tokenMapData().stats`; Accounting section in tokens.md; the same object in manifest.json | core.test.js token-map accounting fixture, including an unresolved token | implemented |
| Canonical token data drives token-map.json, tokens.md, tokens.css and manifest output | `metadata/token-map.json` with stable IDs, alias paths, roles/provenance, usage and per-mode status; unresolved tokens are retained but not claimed as emitted CSS | core.test.js plus full-mode figma-mock.test.js | implemented |
| Collection, default-mode and per-mode IDs survive extraction | `collectionId`, `defaultMode`, `modeMap` in the model and explicit collection mappings in token-map.json | figma-mock.test.js asserts c1, Light and m1 after real extraction | implemented |
| Every variant of every component set is rendered by fig-engine | all-variant export loop; default variant selected from componentPropertyDefinitions rather than child order; separate HTML for non-default variants | figma-mock.test.js uses [Small, Medium] child order with Medium default and exports three HTML files across two families | implemented |
| Partial component extraction is visible and machine-readable | `coverage` and per-variant `failed` rows in components/index.json; `COMPONENT_HTML_EXPORT_FAILED` validation error | figma-mock.test.js removes a node and asserts 3 source / 2 exported / 1 failed | implemented |

## v2.0 Component Graph

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Families, variants and their real properties are searchable without reading components.md | `componentGraphData().families`; every exported/failed variant carries stable source IDs, property values, HTML path and extraction state | core.test.js graph fixture; figma-mock.test.js Medium + Small graph assertions | implemented |
| Component bindings and nested dependencies remain linked by stable Figma ID | extraction walks every variant plus boundVariables/fills/strokes/effects; graph token rows and resolved/missing/external dependency edges | core.test.js token and dependency fixture; figma-mock.test.js var:primary/var:size/var:space | implemented |
| Observed instances and reference usage are evidence, not inferred examples | fig-engine `exportFrame.components[].instances`; graph links actual instance IDs to reference frame files | figma-mock.test.js asserts instance i1 in reference/Home.html | implemented |
| Graph and package coverage cannot silently diverge | per-family extraction status/limitations plus graph count, dependency and statistics lint rules | core.test.js graph lint check; existing full-package lint tests | implemented |

## v2.0 Pattern Extraction

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| References are grouped before pattern counts are reported | `patternData` groups by the complete normalized structure, then derives pattern/reference/repetition statistics from those groups | core.test.js three-reference fixture: two patterns, one repeated group and one singleton; figma-mock.test.js real export counts | implemented |
| Fingerprints are deterministic and exclude transient IDs, text, generated classes, styles and variant values | IR-backed `exportFrame.structure`; fixed-order normalization and dual-hash-plus-length fingerprint; the full structure key prevents accidental hash merging | core.test.js reverses references and changes node IDs without changing fingerprints | implemented |
| Every observation retains exact sources, independent structure, states and exceptions | per-occurrence reference file/page/frame evidence, source-node paths, normalized tree, component variant values, viewport/variant exceptions and `Observed` status | core.test.js evidence and exception assertions; figma-mock.test.js asserts real instance i1 in the Home pattern | implemented |
| Pattern claims remain limited to observed structure and cannot drift from package statistics | explicit evidence levels and limitations; pattern stats/fingerprint/evidence lint plus shared manifest statistics | core.test.js pattern lint check and existing package-lint suite | implemented |
