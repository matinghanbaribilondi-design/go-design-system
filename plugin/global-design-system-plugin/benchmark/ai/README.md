# AI effectiveness benchmark contract

This benchmark is separate from `scripts/benchmark.mjs`, which measures code performance. It compares six fixed design tasks under three conditions:

1. `no-package`
2. `current`
3. `updated`

The contract is `tasks.json`. Evaluation is implemented in `scripts/benchmark-ai.mjs`; it never invents missing results.

## Result bundle

```text
results/<run-id>/
├── run.json
├── human-review.json          # required for a complete benchmark
├── model-review.json          # optional and separate from human review
├── no-package/<task-id>/{output.html,answer.md,usage.json,assets/}
├── current/<task-id>/...
└── updated/<task-id>/...
```

`run.json`:

```json
{
  "schemaVersion": "1.0.0",
  "runId": "example",
  "createdAt": "2026-10-28T00:00:00.000Z",
  "model": "recorded-model-name",
  "gradingPackage": "../updated-package",
  "conditions": {
    "no-package": { "providedPackage": null },
    "current": { "providedPackage": "../current-package" },
    "updated": { "providedPackage": "../updated-package" }
  }
}
```

`usage.json` requires:

- `contextTokens`: non-negative number reported by the generating environment.
- `retrievedEvidence`: strings such as `token:--color-primary`, `component:set:1`, `pattern:pattern.x`, `reference:reference/Home.html` and `mode:dark`.
- `filesRead`: package-relative files supplied to or read by the model.

Every UI task is statically checked with `verifyUI` against `gradingPackage`. This measures forbidden literals, nonexistent tokens, invalid variants, unsupported modes and missing assets. It cannot prove visual or UX quality.

## Run

```bash
node scripts/benchmark-ai.mjs --results path/to/results/run-id
```

Exit code `0` means all automated artifacts and human reviews are present. Exit code `2` means blocked or partial; the JSON states exactly what is missing.

A model-assisted visual review is recorded separately and is not equivalent to human approval. No improvement is claimed until all conditions have artifacts, deterministic metrics and the required human visual reviews.

## Current status

**Blocked.** No generated artifacts exist yet for the three conditions and six tasks, and no sanitized visual references have been supplied. The evaluator and fixtures are ready; no benchmark improvement result is reported.
