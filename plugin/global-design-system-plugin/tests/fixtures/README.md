# Test fixtures

## Synthetic golden package

`golden-package/` is generated from `tests/fixture-golden.js`. It is deterministic and intentionally small. It covers tokens, aliases, dark mode, one component family/variant, two references, observed patterns, a contextual reference index and package lint.

It does **not** prove behavior against a real Figma document. It does not cover real library components, inaccessible styles, mixed values, large files, real prototype graphs, real font availability or organization-specific naming.

Regenerate only after reviewing the diff:

```bash
node scripts/update-golden.mjs
node tests/golden.test.js
node tests/zip-roundtrip.test.js
```

## Exact material required for a real fixture

Do not synthesize a "real" fixture. A real regression fixture requires all of the following:

1. A sanitized copy of the Figma design file, or maintainer access to a dedicated fixture file whose key is stored outside the repository.
2. Written permission to retain its extracted output as a test fixture.
3. The selected page IDs/names and the reference frame IDs that define the intended scope.
4. The expected local/library variable collections, aliases, modes and default modes.
5. Text, paint and effect styles, including at least one library or remote style if that behavior matters.
6. Main components and component sets with their real variants, properties, nested instances and any known broken sets.
7. Reference frames, prototype links, external components, fonts and image assets used by those frames.
8. A declared expected license state for every supplied font and asset, or an explicit unknown-license marker.
9. Confidential copy, images, names and identifiers removed according to the project's sanitization policy. Figma internal node IDs may remain if the file is otherwise sanitized; the Figma file key must not be committed.
10. A reviewed baseline generated with `node scripts/update-golden.mjs` equivalent for the real model and the exact plugin/engine versions.

Store only sanitized fixture output and metadata in this repository. Keep the source file key and any restricted source content in the approved private location, not in Git.

## Current limitation

No real Figma fixture was supplied. Real-document acceptance remains unverified. The mock Figma suite and synthetic golden package are regression evidence, not substitutes for real-fixture acceptance.
