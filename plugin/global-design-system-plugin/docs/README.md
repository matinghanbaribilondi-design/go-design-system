# Documentation index

Read in this order when you need to understand, verify or change the product contract.

| # | Document | Audience | What it answers |
|---|---|---|---|
| 1 | [`README.md`](../README.md) | anyone installing the plugin | install, build, test and the output package at a glance |
| 2 | [`package-contract.md`](package-contract.md) | consumer of a generated package | which files exist in each mode, which are mandatory, what is deliberately not shipped |
| 3 | [`verify-rules.md`](verify-rules.md) | whoever validates a package or generated UI | every rule ID, its severity, meaning and fix |
| 4 | [`glossary.md`](glossary.md) | everyone | the exact meaning of the domain terms used across the docs |
| 5 | [`v2.0-acceptance-checklist.md`](v2.0-acceptance-checklist.md) | maintainer | what currently passes, what is blocked and why |
| 6 | [`v2-architecture-decisions.md`](v2-architecture-decisions.md) | maintainer | the seven decisions D1–D7, their status and their migration impact |
| 7 | [`d7-font-asset-contract-proposal.md`](d7-font-asset-contract-proposal.md) | maintainer, legal/privacy | the proposed font and asset licence contract (D7), still proposed |
| 8 | [`traceability-matrix.md`](traceability-matrix.md) | maintainer, reviewer | the current v2.0 requirement → implementation → test mapping |
| 9 | [`history-traceability.md`](history-traceability.md) | archaeology only | the superseded v0.4.0–v0.11.0 requirement rows |
| 10 | [`archive/v2-acceptance-audit.md`](archive/v2-acceptance-audit.md) | archaeology only | the 2026-10-28 pre-implementation audit, kept unedited as history |

## Status vocabulary

Every status column in these documents uses exactly one of these values. Nothing else is a valid status.

| Status | Meaning |
|---|---|
| `implemented` | The behaviour exists in code and at least one automated test fails if it regresses. |
| `tested` | The behaviour is covered by an automated test that runs in `npm test`; use it only when the requirement is a test contract rather than a feature. |
| `manual` | The behaviour exists but only manual or browser checks exist; it is not covered by `npm test`. |
| `documented` | The requirement is satisfied by documentation alone, with no code path. |
| `proposed` | A decision or schema exists as a proposal and is not implemented. |
| `blocked` | Implementation is impossible or unsafe until an external input arrives (approval, licence, a real Figma file). |
| `not-implemented` | The scope is known and explicitly out of the current product. |
| `superseded` | Replaced by a later row or decision; kept only for history. |

`fixed` is not a status: a bug fix is `implemented` plus a test. `untested` is not a status either: it is `implemented` with a `manual` test column, or `blocked` when the test cannot be written yet.

## Rules for editing these documents

1. Numbers are copied from a command, never estimated. `npm test` prints the test, golden and ZIP counts; `node scripts/verify.mjs` prints the file count.
2. `node tests/docs-consistency.test.js` must pass. It fails when a documented count, file path or rule ID drifts from the code.
3. A fact lives in one document and is linked from the others. The acceptance checklist owns current status; the architecture report owns the decisions; the package contract owns the file list.
4. When a decision changes, update the decision report first, then the checklist, then the history document. Never leave two documents claiming different states.
5. Do not claim a behaviour is verified unless a command in this repository proves it. A mock or synthetic fixture is regression evidence, not acceptance evidence.

## Language policy

Documents aimed at a package consumer or at an external AI agent (`README.md`, `package-contract.md`, `verify-rules.md`, `glossary.md`, `engines/fig-engine/README.md`, `benchmark/ai/README.md`, `tests/fixtures/README.md`) are written in English, because the generated package and its diagnostics are English.

Decision records, audits and acceptance status (`v2-architecture-decisions.md`, `v2.0-acceptance-checklist.md`, `d7-font-asset-contract-proposal.md`, `archive/`) are written in Persian, because their audience is the maintainer.

`traceability-matrix.md` stays English: it mirrors English code identifiers and test names.