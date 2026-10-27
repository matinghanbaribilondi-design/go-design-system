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
| Reference output is HTML only: no Figma layer image, no snapshots/thumbs in the package | `snap()` deleted; `frameRef`/`refFrame`/`referenceFiles` no longer carry snapshot/thumb; viewer bar has only back link, title and theme | core.test.js "no Figma layer images are packaged", figma-mock.test.js | implemented |
| No Fit / 100% or compare controls; the frame renders at its natural size | new `VIEWER_CSS` + `refDoc` (`.stage > .pane > .frame` at `w×h` px) | core.test.js ("HTML only: no Figma image and no zoom/compare controls") | implemented |
| Step connector line stops at the label, never under or over it | `.steps` flex layout with explicit `.step-line` separators; `setStep` marks the passed ones | preview-harness.html browser run (line boxes sit strictly between label and next number) | implemented |
| Panel can be resized in Figma and remembers its size | `.grip` drag in ui.html sends `resize` (+`commit`), `uiSize` clamp and `figma.ui.resize`, `clientStorage['ui-size']` restored at start | figma-mock.test.js (clamp + committed size), browser drag test with 3-column wide layout | implemented |
