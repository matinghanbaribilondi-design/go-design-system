# Glossary

Terms below have one meaning across the package, the code and these documents. Where a term is deliberately narrow, the
limitation is part of the definition.

| Term | Meaning |
|---|---|
| **adherence_level** | The internal 0–10 scale written into `ai-control.md` front matter. It is the machine contract. The UI exposes six positions over it. |
| **Adherence vs creativity** | Adherence is how closely an agent follows the system. Creativity is how much design exploration the level permits. Neither is a probability, and hard constraints never relax. |
| **Agent mode** | The widest generation mode; adds `rules/validation-rules.json` so an agent can react to fired rules without parsing prose. |
| **Alias** | A token whose value is another token. Chains may be multi-level. A broken or circular chain is reported and left unresolved rather than guessed. |
| **Binding (explicit)** | A Figma variable bound to a property by ID. It always outranks value matching, because Figma states the intent directly. |
| **Canonical** | The single owner of a fact. `tokens.css` is canonical for values; `reference/index.json` is canonical for reference metadata. Everything else points at them. |
| **Capability** | A declared, limited ability of the generator or engine, such as `colors-only` for the experimental import. Never a synonym for the whole product. |
| **Component family** | A Figma Component Set, or a lone main component. Its members are variants. |
| **Component graph** | The searchable structure in `components/index.json` linking families, variants, token bindings, nested dependencies and observed instances. |
| **Content pack** | The optional `content.md` product-context document. Outside the default scope (D6). |
| **Coverage** | Counted, not claimed: `sourceVariants`, `exportedVariants` and `failedVariants` in `components/index.json`. A failed variant stays visible. |
| **cssMode** | The recorded Reference CSS decision in `reference/index.json`: the requested mode, the resolved mode, whether it is active, and the fallback reason. |
| **Deterministic** | Same input produces byte-identical output. Golden tests assert this; a clock or random ID that leaks into output is a defect. |
| **Dual fingerprint** | `fnv1a32-dual+length`: two hashes plus the content length, used for pattern structures and manifest outputs. |
| **Evidence** | A recorded source fact an observation rests on, such as a node path, file name or frame ID. Evidence is required; intent is not invented. |
| **Fallback** | An explicit, recorded downgrade. Shared Reference CSS falling back to Standalone is a fallback, and the reason is written into `cssMode`. |
| **Golden fixture** | The synthetic package in `tests/fixtures/golden-package`, compared byte for byte. It proves determinism, not real-file behaviour. |
| **Hard constraint** | A rule that holds at every creativity level: valid tokens only, existing components and variants only, supported modes only. |
| **Mode (generation)** | The tier filter `minimal` / `standard` / `full` / `agent`. Files carry a numeric tier and are included when `tier <= mode`. |
| **Mode (theme)** | A Figma variable collection mode, emitted as `[data-theme]` selectors. Unrelated to generation mode. |
| **Observed pattern** | A structural group derived from the normalized HTML of reference frames. Observed means derived from real evidence, never from a semantic guess. |
| **Pattern fingerprint** | The reproducible hash of a normalized structure, excluding text, generated classes, inline styles, node IDs and variant values. |
| **Pointer** | A reference to the canonical owner instead of a duplicate. `components/index.json.references` is a pointer; it must never carry the entries again. |
| **Reference frame** | A top-level frame selected as source evidence. Frames nested inside other frames are not offered separately; sections are never references. |
| **Self-check** | The weighted score at the end of `validation.md`. It cannot be 100/100 while any error or warning finding remains. |
| **Shared CSS** | Reference CSS mode that links `../tokens.css` instead of inlining values. Requires the file and every used variable to be defined. |
| **Source evidence** | HTML extracted from Figma and kept as-is. It is evidence of what the source looked like, not a generated guide, and no empty guide directories are created. |
| **Standalone CSS** | The default Reference CSS mode: each frame HTML inlines only the token values it uses. |
| **Superseded** | Replaced by a later decision or row and kept only for history. A superseded row must say which row replaced it. |
| **tier** | The numeric file level `0..3` used by the generator's mode filter. Tier 0 is always shipped. |
| **Token map** | `metadata/token-map.json`: canonical token data with stable IDs, alias chains, roles, per-mode status and CSS emission state. |
| **Validation** | Two distinct things: source validation of the Figma file (health and findings) and package verification against its own contracts. They must not be conflated. |