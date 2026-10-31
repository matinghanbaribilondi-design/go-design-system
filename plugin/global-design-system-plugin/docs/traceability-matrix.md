# Traceability Matrix (v2.0)

This file covers the **current** v2.0 requirements. Rows for v0.4.0–v0.11.0 moved to
[`history-traceability.md`](history-traceability.md) and are kept there as history only.

Status values are defined in [`README.md`](README.md#status-vocabulary). `node tests/docs-consistency.test.js` fails when
a row claims something that the code, the file counts or the other documents contradict.

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Context is a separate, optional step before Scope | `ui.html` step model and `drawContent` | manual browser run only | manual |
| Context modes: Auto / Manual / Content document / Skip | ui.html `CM`; code.js `analyze` (`cm`) | core.test.js "auto mode…", "content pack…" | implemented |
| Context never fabricated; omitted = valid | code.js `buildContext`, `ctxMd` | "context omitted…" | implemented |
| Facts vs inferences, provenance (user / figma / inference) | `buildContext` (`facts[].source`, `inferences[]`) | "pasted context…", "RTL inference…" | implemented |
| Pasted context parsed semantically | `parseContext` | "pasted context…" | implemented |
| Context does not create tokens or change values | `buildContext` has no token output | "context never creates tokens" | implemented |
| Rejected inference removed from output | `ctxMd`, `contentMd` (rejInf) | "rejected inference…" | implemented |
| `content.md` handoff document, produced only when the content pack is requested | `contentMd`, `gen` | "content pack…" | implemented |
| Markdown file budget (typography merged into `tokens.md`) | `gen` | "content pack…", "generator…" | implemented |
| Dependency policy: Auto Include / Ask / Ignore + Warning | `applyPolicy` | "auto include", "ask before include", "ignore + warning" | implemented |
| Selection ≠ dependency (origin preserved) | token/component `origin`, `requiredBy` | "selection is not a dependency", "generator…" | implemented |
| Dependency reasons and graph | `planDependencies`, ui `drawDeps` | "token alias dependency…" | implemented |
| Missing nested components: Expand Scope / Include / Continue Anyway | `planDependencies`, `applyPolicy`, ui `drawDeps` | "missing component…", "nested component…" | implemented |
| Context shown during Analyze / Review | ui `cfgHtml` | manual | implemented |
| Prompt generation gives a model-agnostic, fixed-structure request; it is not an AI layer inside the plugin | `buildPrompt`, `promptData` | "prompt: …" (3 tests) | implemented |
| Figma integration (extraction, builder) | `buildDraft`, `extractComponent`, `build` | requires Figma runtime | untested here |

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

## v2.0 Reference Index and Contextual Retrieval

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| An agent can find the relevant reference by page, frame, viewport, component, variant, token or pattern | `referenceIndexData().entries` in the canonical `reference/index.json`, generated from source frames and observed patterns | core.test.js filters and asserts component, family, variant, pattern and token fields; figma-mock.test.js checks real instance i1 | implemented |
| Prototype traversal never implies a packaged destination that does not exist | per-link `resolved` / `unresolved-in-package` status with an exact file only for resolved targets | core.test.js resolved Settings link plus unresolved destination; figma-mock.test.js links Home to Settings.html | implemented |
| Retrieval is targeted rather than a demand to read every reference | `SKILL.md` contextual-retrieval protocol filters index entries and opens only selected files, patterns and component evidence | core.test.js and figma-mock.test.js assert the protocol text | implemented |
| Index entries, statistics and links cannot drift from source evidence or manifest counts | entry/stats/link/pattern lint rules plus shared manifest reference statistics | core.test.js corrupts `withComponents` and expects `REFERENCE_INDEX_STATS_MISMATCH`; package-lint suite | implemented |

## v2.0 Verify, schemas, manifest and golden fixture

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| A downloaded package can be verified without Figma or the plugin build | `scripts/verify.mjs` checks required files, schemas, local links/anchors, CSS structure, component/reference evidence and shared statistics | `tests/verify.test.js` verifies the golden package and a generated full package; removes evidence and expects `VERIFY_REFERENCE_FILE` | implemented |
| Machine files have versioned JSON Schema Draft 2020-12 contracts | `schemas/` contains manifest, token-map, components-index, metadata, validation-report and icons contracts with URN IDs and controlled enums | every schema receives generated valid data and an invalid fixture; the manifest also rejects missing required fields | implemented |
| Manifest states format, source, inventory and validation without inventing counts | additive manifest fields generated from the shared model; inventory lint rejects divergence | core package tests plus existing full-mode Figma mock | implemented |
| Reviewed output cannot change silently | deterministic golden model and 13 byte-compared package files; regeneration is an explicit script | `tests/golden.test.js` regenerates twice and compares every file | implemented |
| Performance work has a repeatable measurement | `scripts/benchmark.mjs` measures pattern grouping, reference indexing and package generation for a chosen reference count | manual benchmark command documented in README | implemented |

## v2.0 continuation: UI verification, ZIP, benchmark contract and metadata

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| Package and generated-UI validation stay separate | `verifyUI` and `verify package|ui` CLI; stable UI rule IDs for literals, tokens, variants, modes, assets and CSS | pass/fail/malformed UI fixtures, CLI exit codes and 10 rule families | implemented |
| Complete ZIP is actually opened and inspected | `zip-roundtrip.test.js` executes the ZIP function from `ui.html`, parses headers/CRCs, checks required/extra/binary files, extracts and runs package Verify, then compares stable golden files | 19-file archive with binary assets | implemented |
| Manifest completeness cannot be faked | generator/source/scope/capabilities/dependencies/limitations, explicit unavailable `fileKey`, and dual-hash output fingerprints excluding only declared volatile/self files | schema validation, fingerprint tamper test, unexpected-file warning and deterministic manifest test | implemented |
| Nested Reference Index carries retrieval metadata without choosing a new path | title, page/file, explicit no-source tags, supported modes, pattern/structure summary, component/token links and extraction status/limitations | core and Figma mock references | implemented |
| AI benchmark is specified and evaluates artifacts without inventing results | 6 tasks, 3 conditions, automated/UI/retrieval/context metrics, separate human and model-assisted fields | evaluator pass/fail fixtures and blocked CLI status | contract implemented; execution blocked |
| Real Figma fixture requirements are explicit | `tests/fixtures/README.md` lists required sanitized material and current limitation | documentation review | blocked pending source material |
| Decisions and remaining gaps stay explicit | `docs/v2-architecture-decisions.md` and `docs/v2.0-acceptance-checklist.md` | updated acceptance checklist | D1–D6 approved; D7 proposed |

## v2.0 approved architecture decisions

| Decision | Implementation | Test | Status |
|---|---|---|---|
| D1 one-way export; no silent compiler | UI exposes no import; `build` message returns Experimental, export-only, colors-only | Figma mock asserts the Experimental contract | implemented |
| D2 exactly six creativity levels | Six labels and creativity `0/20/40/60/80/100`; documented internal map `0/2/5/7/9/10`; hard constraints at all levels | core mapping, Figma discover payload, static slider contract | implemented |
| D3 Standalone and Shared Reference CSS | Explicit UI option; Standalone default; Shared links `../tokens.css`; all token uses must be defined; fallback recorded | generation, determinism, missing stylesheet/token, package Verify Shared checks | implemented |
| D4 canonical `reference/` and index | `reference/index.json` owns entries/classification; `components/index.json.references` is a pointer; no empty guide directories | core path/pointer, schema, package Verify, Golden, ZIP | implemented |
| D5 schemas remain development-only | Seven development schemas; verifier reads repository contracts; ZIP excludes them | schema samples and package contents | implemented |
| D6 `content.md` out of default scope | Default package contains neither file nor references; Product Context remains in `design.md`; optional Content Pack remains isolated | core default-package regression test and Golden | implemented |
| D7 font/asset license contract | Proposed schema and migration; no public license fields yet | proposal document only; no fabricated metadata | blocked pending approval |
