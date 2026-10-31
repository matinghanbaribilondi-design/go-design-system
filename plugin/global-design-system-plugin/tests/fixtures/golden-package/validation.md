# Validation

## Health: 89%

| Dimension | Weight | Score | Basis |
|---|---|---|---|
| Token integrity | 3 | 100% | 8 of 8 mode values resolved |
| Naming consistency | 1 | 100% | 4 of 4 names follow "/" |
| Variable coverage | 3 | 100% | 2 of 2 style properties in components are bound to Figma variables |
| Documentation | 1 | 100% | 1 of 1 components documented |
| State coverage | 1 | 0% | 0 of 1 components with states (or single) |

## Fix first

1. **COMPONENT_NO_STATES** ×1 — Add a State property if the component is interactive.

## Findings

| Severity | Code | Count | Affected | How to fix |
|---|---|---|---|---|
| info | COMPONENT_NO_STATES | 1 | Button | Add a State property if the component is interactive. |

## Package self-check: 100 / 100

| Check | Result | Detail |
|---|---|---|
| Total Markdown size is small enough for an AI context | pass | ≈ 3739 tokens (limit 30000) |
| Icon library is summarized, not dumped | pass | 0 icon rows (limit 80) |
| Component names and IDs are unique | pass | 0 duplicate(s) |
| No floating-point noise in numbers | pass | 0 value(s) |
| Spec CSS has no literal colors or spacing (rules match the data) | pass | 0 literal line(s) |
| Every text layer has a mapping, a suggestion or an explicit report | pass | 0 text layer(s) without guidance |
| No repeated boilerplate | pass | 1 repeated notice(s) |
| No meaningless frame names | pass | 0 generic name(s) |
| Frame list appears once (no duplication across files) | pass | ok |
| design.md starts with a read order | pass | read order |
| Every file named in the package line exists | pass | ok |
| JSON, internal references, CSS variables and manifests are consistent | pass | 0 finding(s) |
| No contradictions (themes, rules and data agree) | pass | ok |
| Validation findings are aggregated and self-check reflects source findings | pass | 0 grouped row(s), 0 error/warning finding(s) |
