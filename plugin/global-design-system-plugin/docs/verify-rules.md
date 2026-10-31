# Verification rule catalogue

Three independent engines produce findings. They never share codes, and a package can pass one while failing another.

| Engine | Command | Scope |
|---|---|---|
| Package verifier | `node scripts/verify.mjs package <dir>` | A downloaded package, checked without Figma and without rebuilding the model. |
| UI verifier | `node scripts/verify.mjs ui <dir> --package <pkg>` | Generated HTML/CSS against a package's tokens and component index. |
| Package lint | `lintPackage` inside the generator | Cross-file defects inside the package the generator just wrote, reported in `validation.md` and `validation-report.json`. |

Every finding carries `code`, `severity`, `file`, `location` and a `message` that states the fix. `location` is never
`root` for file-scoped findings, so a finding can always be opened.

## Package verifier rules (`VERIFY_*`)

| Code | Severity | Meaning | Fix |
|---|---|---|---|
| `VERIFY_REQUIRED_FILE` | error | A mandatory file is missing. | Regenerate; the package is incomplete. |
| `VERIFY_JSON_INVALID` | error | A machine file is not valid JSON. | Regenerate the file; never hand-edit generated JSON. |
| `VERIFY_SCHEMA_INVALID` | error | A machine file violates its Schema. | Compare with the contract in `schemas/` and regenerate. |
| `VERIFY_SCHEMA_UNREADABLE` | error | The development Schema could not be loaded. | Run from the repository root so `schemas/` resolves. |
| `VERIFY_INVALID_REFERENCE` | error | A package-relative reference points outside or is malformed. | Use a path inside the package. |
| `VERIFY_BROKEN_REFERENCE` | error | A local link or `src` target does not exist. | Export the missing file or fix the link. |
| `VERIFY_BROKEN_ANCHOR` | error | A Markdown/HTML anchor has no matching heading or `id`. | Fix the anchor, not the heading the package already declares. |
| `VERIFY_REFERENCE_SCRIPT` | error | A standalone reference HTML contains a script. | Reference HTML must be inert evidence; remove the script. |
| `VERIFY_CSS_BLOCK` | error | A CSS block is unbalanced. | Fix the generated CSS or the token value that produced it. |
| `VERIFY_TOKEN_COUNT` | error | Manifest token count differs from the token map's `sourceTokens`. | Both must come from one calculation; regenerate. |
| `VERIFY_TOKEN_STATS` | error | Manifest token statistics differ from the token map. | Same as above. |
| `VERIFY_COMPONENT_COUNT` | error | Manifest component counts differ from `components/index.json`. | Regenerate; do not patch the manifest by hand. |
| `VERIFY_REFERENCE_COUNT` | error | Manifest reference or pattern count differs from the reference index. | Regenerate. |
| `VERIFY_SHARED_STATS` | error | Manifest and index statistics were not produced by one shared calculation. | Regenerate both together. |
| `VERIFY_COMPONENT_COVERAGE` | error | Declared coverage does not match the exported and failed rows. | Fix extraction; coverage must be observed, not asserted. |
| `VERIFY_GRAPH_STATS` | error | Component graph statistics disagree with the component rows. | Regenerate the graph. |
| `VERIFY_PATTERN_COUNT` | error | Pattern statistics do not match their occurrences. | Regenerate patterns from the references. |
| `VERIFY_COMPONENT_FILE` | error | A component HTML file named in the index is missing. | Re-export the component. |
| `VERIFY_PATTERN_EVIDENCE` | error | A pattern cites an evidence file that does not exist. | Regenerate; evidence must point at real references. |
| `VERIFY_REFERENCE_INDEX_PATH` | error | The nested reference pointer does not point to `reference/index.json`. | Decision D4 fixes that path; regenerate. |
| `VERIFY_REFERENCE_INDEX_STATS` | error | Pointer statistics differ from `reference/index.json`. | Both come from one object; regenerate. |
| `VERIFY_REFERENCE_FILE` | error | A reference HTML named in the index is missing. | Re-export the frame. |
| `VERIFY_REFERENCE_CLASSIFICATION` | error | A reference HTML is missing from the source-evidence classification. | Regenerate the index. |
| `VERIFY_REFERENCE_LINK` | error | A resolved prototype link targets a missing file, or an unresolved link claims a file it does not ship. | Never imply a packaged destination that does not exist. |
| `VERIFY_SHARED_CSS` | error | Shared Reference mode without `tokens.css`, or without the `../tokens.css` link. | Ship `tokens.css` or fall back to standalone; the index records which. |
| `VERIFY_STANDALONE_CSS` | error | Standalone Reference mode unexpectedly links the shared `tokens.css`. | Remove the link; standalone inlines its values. |
| `VERIFY_VALIDATION_REPORT` | error | `validation-report.json` is missing. | Regenerate with `full` mode or above. |
| `VERIFY_VALIDATION_COUNTS` | error | Manifest validation counts differ from the report. | Regenerate; counts are copied from the report. |
| `VERIFY_SOURCE_ID` | error | `source.fileKey` and `source.fileKeyStatus` disagree. | The key is either recorded or explicitly unavailable, never invented. |
| `VERIFY_GENERATOR_VERSION` | error | Manifest and metadata generator versions differ. | Regenerate the whole package in one run. |
| `VERIFY_MANIFEST_ASSET` | error | A bundled asset declared in the manifest is missing. | Export the asset or remove the declaration. |
| `VERIFY_OUTPUT_MISSING` | error | A fingerprinted output is missing. | Regenerate; the manifest fingerprints what it ships. |
| `VERIFY_OUTPUT_FINGERPRINT` | error | Output content does not match its recorded fingerprint. | A file was edited after generation; regenerate instead. |
| `VERIFY_UNEXPECTED_FILE` | warning | A file is not declared in `manifest.outputs`. | Declare it or remove it; it will not survive regeneration. |

## UI verifier rules (`UI_*`)

| Code | Severity | Meaning | Fix |
|---|---|---|---|
| `UI_LITERAL_COLOR` | error | A literal colour (`#hex`, `rgb()`, named colour) in CSS or a `fill`/`stroke` attribute. | Use `var(--token)` or `currentColor`. |
| `UI_LITERAL_SPACING` | error | A literal length in `padding`, `margin`, `gap`, `width`, `height` or similar. | Use a spacing, radius or border token. |
| `UI_LITERAL_FONT` | error | A literal `font-size`, `font-weight`, `line-height` or `letter-spacing`. | Use a `.text-*` class or a typography token. |
| `UI_LITERAL_SHADOW` | error | A literal `box-shadow`. | Use a package shadow token. |
| `UI_TOKEN_UNDEFINED` | error | `var(--x)` is not defined in the package or the UI's own CSS. | Use a token the package ships, or report the gap. |
| `UI_COMPONENT_UNKNOWN` | error | A `data-component-*` marker names a family the package never exported. | Use an exported family or report the missing component. |
| `UI_VARIANT_INVALID` | error | A variant ID or an axis value that the package does not export. | Use an exported variant; report the gap instead of inventing one. |
| `UI_MODE_UNSUPPORTED` | error | A theme selector the package does not define. | Use one of the package modes listed in the finding. |
| `UI_ASSET_MISSING` | error | A local asset target does not exist in the UI or the package. | Ship the asset or remove the reference. |
| `UI_LOCAL_REFERENCE` | error | A local page or document link has no target. | Ship the target or make the link non-navigable. |
| `UI_CSS_MALFORMED` | error | Unbalanced or unparseable CSS. | Fix the CSS; the verifier still reports the rest of the file. |
| `UI_SOURCE_MISSING` | error | The UI directory contains no HTML or CSS to check. | Point the verifier at the directory that holds the generated UI. |
| `UI_PACKAGE_CONTEXT_MISSING` | error | No `--package` was supplied, so tokens and components cannot be resolved. | Pass `--package <dir>`. |
| `UI_PACKAGE_INVALID` | error | The supplied package is missing `tokens.css`, or `components/index.json` is unreadable. | Verify the package first. |

The UI verifier deliberately has no rule for visual similarity, usability or aesthetics. It proves that the generated UI
stays inside the design system; it never proves the design is good.

## Package lint rules

Package lint runs inside the generator, so these appear in `validation.md` and `validation-report.json` rather than in a
separate command. Codes below are the ones the linter emits; source-extraction codes that reach the same report are
listed after them.

### Cross-file integrity

| Code | Meaning |
|---|---|
| `JSON_INVALID` | A generated JSON file does not parse. |
| `JSON_SCHEMA_INVALID` | A generated JSON file violates its embedded contract. |
| `CSS_UNBALANCED_BLOCK` | Generated CSS has an unbalanced block. |
| `CSS_INVALID_VALUE` | A declaration value is not valid CSS. |
| `CSS_TOKEN_UNDEFINED` | A CSS file uses `var(--x)` that no shipped file defines. |
| `PACKAGE_INVALID_REFERENCE` | A relative reference is malformed or escapes the package. |
| `PACKAGE_BROKEN_REFERENCE` | A local target does not exist. |
| `PACKAGE_BROKEN_ANCHOR` | An anchor has no matching heading or `id`. |
| `MANIFEST_COUNT_MISMATCH` | A manifest count disagrees with the file that owns the data. |
| `MANIFEST_TOKEN_MISSING` | A token present in the model is absent from the manifest inventory. |
| `MANIFEST_INVENTORY_MISMATCH` | Manifest inventory disagrees with the emitted files. |
| `TOKEN_DOCUMENTATION_MISMATCH` | `tokens.md` and `tokens.css` disagree about a token. |
| `TOKEN_MAP_COUNT_MISMATCH` | `metadata/token-map.json` counts differ from the manifest. |
| `TOKEN_MAP_CSS_MISMATCH` | The token map claims a CSS variable that was not emitted, or the reverse. |
| `TOKEN_STATS_MISMATCH` | Token statistics were computed twice and disagree. |
| `COMPONENT_COVERAGE_MISMATCH` | Declared coverage differs from the exported and failed rows. |
| `COMPONENT_GRAPH_COUNT_MISMATCH` | Graph family/variant counts disagree with the component rows. |
| `COMPONENT_GRAPH_DEPENDENCY_INVALID` | A dependency edge names a token or component that does not exist. |
| `COMPONENT_GRAPH_STATS_MISMATCH` | Graph statistics disagree with their own evidence. |
| `PATTERN_STATS_MISMATCH` | Pattern statistics disagree with their occurrences. |
| `PATTERN_FINGERPRINT_MISMATCH` | A fingerprint is not reproducible from the normalized structure. |
| `PATTERN_EVIDENCE_INVALID` | A pattern cites evidence that is not a real reference node. |
| `REFERENCE_INDEX_STATS_MISMATCH` | `reference/index.json` statistics disagree with its entries. |
| `REFERENCE_INDEX_MISSING` | References exist but the index was not written. |
| `REFERENCE_INDEX_ENTRY_INVALID` | An index entry is missing a required field or names a missing file. |
| `REFERENCE_INDEX_PATTERN_INVALID` | An entry references a pattern that does not exist. |
| `REFERENCE_INDEX_LINK_INVALID` | A link claims a resolution status that its target contradicts. |
| `COLLECTION_DUPLICATE_NAME` | Two variable collections share a name, so mode mapping would be ambiguous. |
| `THEME_MODE_MISSING` | The package documents theme modes but emits no mode selector, or the reverse. |

### Source-extraction findings

These describe what Figma actually contained. They are warnings about the source, not package defects, and they prevent
a perfect self-check score even when every file is valid.

| Code | Meaning |
|---|---|
| `TOKEN_CIRCULAR_REFERENCE` | An alias chain loops; the token is left unresolved rather than guessed. |
| `TOKEN_UNRESOLVED_REFERENCE` | An alias points at a variable that the selection does not include. |
| `TOKEN_INVALID_VALUE` | A variable value cannot be expressed as a CSS value. |
| `TOKEN_INVALID_CSS_VALUE` | A value maps to invalid CSS, such as an unknown font-weight name. |
| `TOKEN_VALUE_MATCH_AMBIGUOUS` | Two tokens share one value, so no semantic role was chosen by guess. |
| `NAMING_INCONSISTENT` | A token category came from a name heuristic rather than from Figma. |
| `COMPONENT_UNDOCUMENTED` | A component exists in Figma but has no documentation entry. |
| `COMPONENT_NO_STATES` | A component has a single state and no variants. |
| `COMPONENT_SET` | A component set is present, recorded as context for coverage. |
| `COMPONENT_SET_HAS_ERRORS` | A component set reports its own errors; the fallback is visible, not hidden. |
| `COMPONENT_HTML_EXPORT_FAILED` | The engine could not render a variant; it stays an explicit failure. |
| `TEXT_STYLE_NOT_BOUND` | A text node uses no text style; a match was proposed. |
| `COLOR_NOT_TOKENIZED` | A colour is not bound to a variable; the nearest token and its distance are reported. |
| `STYLE_UNREADABLE` | A single style could not be read. |
| `STYLES_UNREADABLE` | Styles as a whole could not be read; the package states it instead of pretending. |
| `REFERENCE_FAILED` | A selected reference frame could not be exported; the report names the frame. |
| `DEPENDENCY_EXCLUDED` | A dependency was excluded by the dependency policy; the warning is deliberate. |
| `DEPENDENCY_MISSING_COMPONENT` | A nested component instance has no source in the selection. |

## Reading a report

`validation.md` groups findings by code with a count, the affected items and a recovery instruction, and ends with the
package self-check score. `validation-report.json` carries the same findings as data, plus `packageQuality`,
`packageErrorCount` and `packageWarningCount`.

An error means the package contradicts itself. A warning means the package is honest about a limitation in the source.
Neither is a score you can argue with: `valid` check in the self-check fails while any error or warning remains.