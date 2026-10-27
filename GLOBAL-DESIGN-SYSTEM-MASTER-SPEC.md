# Global Design System
## Master Specification & Technical Decisions

Version: 3.0.0  
Status: Proposed — implementation must be validated against the actual plugin source code and Figma fixtures.  
Purpose: Single source of truth for architecture, export structure, schemas, validation, and Figma extraction capabilities.

---

# 1. Purpose and Scope

This document consolidates the Global Design System plugin architecture, resolves decisions N-01 through N-14, defines the exported package structure, establishes data contracts, and distinguishes implemented capabilities from planned or unverified capabilities.

The plugin must transform design information from Figma into a portable, structured, AI-agent-ready design system package.

The exported package must be usable without requiring the receiving AI agent to access the original Figma file.

The system must preserve traceability to the original Figma source and must never represent inferred or unavailable information as confirmed source data.

## 1.1 Core Architecture

The required processing architecture is:

Figma / Markdown / Project Context
→ Source Adapters
→ Deterministic Extraction
→ Normalization
→ Canonical Design System Model
→ Relationship Graph
→ Rule Evaluation and Optional AI Assistance
→ Validation
→ Export Package

Directly converting raw Figma data into Markdown is not the target architecture.

The Canonical Design System Model is the semantic center of the system. All source adapters must map their data into this model before export generation.

## 1.2 Core Principles

1. Deterministic extraction must happen before AI interpretation.
2. Source facts and inferred conclusions must remain distinguishable.
3. Stable identifiers must not depend on display names.
4. Token relationships and aliases must be preserved.
5. Components must retain source identity and extraction coverage information.
6. Unsupported extraction capabilities must be reported explicitly.
7. Validation must happen before the final package is marked ready.
8. The export must be portable and independent of the source application.
9. Human decisions and approved overrides must be traceable.
10. The user interface must remain simple while the internal architecture supports advanced functionality.

---

# 2. Terminology

## 2.1 Source Fact

A value or relationship directly extracted from an available source.

Example:
A Figma variable has the name `color/brand/primary` and a value of `#31FFF2` in a particular mode.

## 2.2 Inference

A conclusion derived from source evidence but not explicitly declared by the source.

Example:
A color variable may be classified as a primary brand color because of its name and usage.

## 2.3 Confirmed

Information directly supported by source data or explicitly approved by an authorized user.

## 2.4 Observed

Information visible in source content but not necessarily available as structured metadata.

Example:
A rendered reference page visually demonstrates a spacing pattern.

## 2.5 Inferred

Information derived from heuristics, AI interpretation, naming patterns, or incomplete evidence.

## 2.6 Proposed

A suggestion that has not been approved and must not silently become part of the official design system.

## 2.7 Canonical Model

The normalized internal representation used to reconcile all supported input formats and generate exports.

## 2.8 Reference Page

A standalone HTML page that demonstrates the appearance or behavior of a design system element. A reference page is evidence and documentation, not the authoritative source for structured token or component data.

---

# 3. Final Export Package Structure

The following structure defines the target package contract.

```text
global-design-system/
│
├── manifest.json
├── SKILL.md
├── ai-control.md
├── design.md
├── content.md
├── tokens.css
├── components.css
│
├── components/
│   ├── index.json
│   ├── buttons/
│   │   ├── component.json
│   │   └── preview.html
│   ├── inputs/
│   │   ├── component.json
│   │   └── preview.html
│   └── ...
│
├── references/
│   ├── index.json
│   ├── overview.html
│   ├── colors.html
│   ├── typography.html
│   ├── spacing.html
│   ├── components.html
│   └── ...
│
├── rules/
│   ├── index.json
│   └── ...
│
├── metadata/
│   ├── context.json
│   ├── token-map.json
│   ├── decisions.json
│   ├── validation.json
│   ├── sources.json
│   ├── icons.json
│   └── assets.json
│
├── schemas/
│   ├── common-definitions.schema.json
│   ├── manifest.schema.json
│   ├── component.schema.json
│   ├── components-index.schema.json
│   ├── references-index.schema.json
│   ├── decisions.schema.json
│   ├── token-map.schema.json
│   ├── validation.schema.json
│   ├── icons.schema.json
│   ├── sources.schema.json
│   └── assets-index.schema.json
│
├── assets/
│   ├── fonts/
│   ├── images/
│   └── icons/
│
└── examples/
    ├── manifest.example.json
    ├── decisions.example.json
    └── validation.example.json
```

## 3.1 Required Files

The following files are required for a complete package:

- `manifest.json`
- `SKILL.md`
- `ai-control.md`
- `design.md`
- `tokens.css`
- `components.css`
- `components/index.json`
- `references/index.json`
- `metadata/decisions.json`
- `metadata/validation.json`
- `metadata/sources.json`

Other files may be optional when their associated content does not exist.

An optional file must not be generated with fabricated data merely to satisfy the directory structure.

If the plugin does not yet implement one of these files, the implementation must report the gap rather than claiming that the export is complete.

## 3.2 Empty Directories

Do not include empty directories unless the packaging format or implementation explicitly requires them.

## 3.3 Index Files

`components/index.json` and `references/index.json` are navigation and discovery files.

They must not become the only location where full component or reference data exists.

Individual components must have individual metadata files when component-level export is supported.

Reference HTML files must contain the actual rendered reference content.

# 4. Responsibilities of Export Files

## 4.1 manifest.json

The manifest is the package entry point.

It must describe:

- Package format version.
- Generation timestamp.
- Source information.
- Export scope.
- Included files and entities.
- Available capabilities.
- Known limitations.
- Validation status.
- Package statistics.
- Relevant provenance metadata.

The manifest must not contain its own cryptographic hash because that creates a self-reference problem.

## 4.2 SKILL.md

`SKILL.md` explains how an AI agent should discover and use the exported package.

It should include:

- Package entry points.
- File discovery instructions.
- Recommended reading order.
- How to locate token definitions.
- How to locate component definitions.
- How to use reference pages.
- How to interpret metadata.
- How to interpret extraction confidence.
- How to interpret validation results.
- What to do when information is missing.

It should act as the navigation and operational guide.

It must not duplicate the complete contents of `design.md` or `ai-control.md`.

## 4.3 ai-control.md

`ai-control.md` contains constraints governing AI-generated designs and implementations.

It should define:

- Prohibited design decisions.
- Required token usage.
- Required component reuse.
- Restrictions on inventing tokens.
- Restrictions on inventing components.
- Rules for inferred information.
- Required handling of missing information.
- Rules for responsive behavior.
- Accessibility constraints.
- Rules for deviations from the design system.
- Conditions requiring user confirmation.

This file is separate from `design.md` because implementation constraints and design documentation have different purposes.

## 4.4 design.md

`design.md` is the main human-readable design system document.

It should describe:

- Design philosophy.
- Brand identity.
- Color system.
- Typography.
- Spacing.
- Sizing.
- Layout.
- Responsive behavior.
- Component usage.
- Interaction patterns.
- Accessibility.
- Design patterns.
- Naming conventions.
- Rules for extending the system.

It should explain how to use the design system, not merely reproduce the token inventory.

## 4.5 content.md

`content.md` preserves optional project-specific context supplied by the user or source documents.

Examples include:

- Product context.
- Audience.
- Platform.
- Project goals.
- Domain terminology.
- Existing design constraints.
- User-provided requirements.

Preserve user-provided context without silently replacing it with AI-generated assumptions.

## 4.6 tokens.css

`tokens.css` is the authoritative CSS-mappable token export.

It should contain all supported CSS-compatible token values, including:

- Colors.
- Typography.
- Font families.
- Font sizes.
- Font weights.
- Line heights.
- Letter spacing.
- Spacing.
- Dimensions.
- Border widths.
- Border radii.
- Shadows.
- Opacity.
- Z-index values.
- Motion durations and easing values.
- Other supported scalar or structured values that can be represented meaningfully in CSS.

The exporter must preserve supported aliases, modes, themes, original names, and source relationships.

Do not silently flatten an alias into a literal value if doing so would discard important relationship information.

CSS variables may require normalized names. The original source names must remain available in metadata.

## 4.7 components.css

`components.css` contains shared component styles that can be reliably extracted or generated from confirmed component data.

It must not become a dump of all CSS from every reference page.

Page-specific layout, demonstration scaffolding, and unrelated HTML styles belong in the individual reference pages.

Component CSS must use exported tokens whenever reliable token mappings exist.

## 4.8 components/index.json

This file lists exported components and provides navigation metadata.

It may include:

- Stable component ID.
- Display name.
- Relative metadata path.
- Relative preview path.
- Source identity.
- Component type.
- Extraction status.
- Supported variant information.
- Known limitations.

It must not claim that a component's nested structure or variants are fully extracted unless the corresponding extraction capability is implemented and validated.

## 4.9 references/index.json

This file lists available HTML references.

It may include:

- Stable reference ID.
- Display name.
- Relative path.
- Reference category.
- Related token IDs.
- Related component IDs.
- Source identity.
- Evidence status.
- Rendering status.

Only create token or component relationships when sufficient evidence exists.

## 4.10 metadata/token-map.json

This file maps source token identities to exported token identities and CSS custom properties.

It should preserve:

- Stable token ID.
- Original source name.
- Normalized CSS name.
- Source variable ID where available.
- Collection and mode information.
- Alias relationships.
- Resolved values.
- Source provenance.
- Resolution status.
- Warnings.

## 4.11 metadata/decisions.json

This file records decisions made during extraction, normalization, interpretation, and review.

It should contain:

- User approvals.
- Rejected proposals.
- Proposed mappings.
- Conflicts.
- Overrides.
- Inference explanations.
- Confidence and evidence.
- Resolution history where available.

## 4.12 metadata/validation.json

This file contains the complete validation report.

It should include:

- Overall status.
- Validation timestamp.
- Errors.
- Warnings.
- Informational messages.
- Schema validation results.
- Reference integrity results.
- Token integrity results.
- Component integrity results.
- Asset integrity results.
- Capability coverage.
- Known limitations.

The manifest should contain a concise summary, not a duplicate of the complete report.

## 4.13 metadata/sources.json

This file records source provenance.

It should include available source information such as:

- Source type.
- Source file identifier.
- Source page or node identifier.
- Source name.
- Source URL where appropriate.
- Extraction timestamp.
- Extraction method.
- Available source metadata.
- Limitations of the source adapter.

Do not include credentials, access tokens, or other secrets.

## 4.14 metadata/icons.json

This file records supported icon metadata.

It should include:

- Stable icon ID.
- Original icon name.
- Source identity.
- Exported asset path when available.
- Format.
- Dimensions where known.
- Export status.
- License information where known.
- Warnings.

Actual icon assets belong under `assets/icons/`.

## 4.15 metadata/assets.json

This file records exported assets.

It should include:

- Stable asset ID.
- Original name.
- Relative path.
- Media type.
- Dimensions where available.
- Source identity.
- Export status.
- Licensing status where known.
- Whether the asset is embedded, copied, external, or unavailable.

# 5. Canonical Design System Model

All adapters must map source data into a common semantic model.

## 5.1 Required Entity Categories

The model should support:

- Project context.
- Sources.
- Tokens.
- Token collections.
- Modes and themes.
- Aliases and token relationships.
- Components.
- Component sets.
- Component variants.
- Component properties.
- Component hierarchy.
- References.
- Assets.
- Icons.
- Design rules.
- Decisions.
- Evidence.
- Validation findings.

Not every source adapter will provide every entity category.

Missing categories must be represented as unavailable, unsupported, or absent rather than fabricated.

## 5.2 Entity Identity

Every canonical entity must have a stable identifier.

An entity ID must not be derived solely from its display name because names can change and duplicates can exist.

The identifier should remain stable across repeated exports of the same source entity when the underlying identity is unchanged.

When the source does not provide a stable identifier, the exporter may use a deterministic fallback based on stable source information.

Fallback identity rules must be documented and tested.

## 5.3 Source Identity

Preserve original source identifiers separately from canonical identifiers.

For a Figma source, available fields may include:

- File key.
- Node ID.
- Variable ID.
- Component key.
- Page ID.
- Source name.
- Source URL.

Only populate fields that are actually available.

## 5.4 Provenance

Every important extracted entity should retain provenance.

Recommended provenance fields:

- Source reference.
- Extraction method.
- Extraction timestamp.
- Source confidence.
- Evidence type.
- Transformation history where relevant.

## 5.5 Confidence

Confidence values must not be treated as objective measurements unless a defined calculation supports them.

Use documented confidence categories or scores with explicit meanings.

Recommended categories:

- `high`
- `medium`
- `low`
- `unknown`

Confidence must not replace a clear distinction between facts and inferences.

## 5.6 Fact and Inference Separation

Every derived conclusion must be identifiable as an inference.

Recommended statuses:

- `confirmed`
- `observed`
- `inferred`
- `proposed`
- `unavailable`
- `unsupported`

An inference must not silently overwrite a confirmed source value.

# 6. Decision Register: N-01 to N-14

## N-01 — Stable Entity IDs

Decision: Use deterministic, stable canonical IDs for exported entities.

Rules:

1. Never use a display name as the only identifier.
2. Preserve source identifiers independently.
3. Use deterministic fallback IDs only when source identifiers are unavailable.
4. Do not parse meaning from opaque IDs.
5. Resolve entities through explicit references.
6. Test repeated exports for identity stability.

Status: Accepted.

## N-02 — Decision and Evidence Storage

Decision: Store decisions, proposals, approvals, conflicts, and evidence in `metadata/decisions.json`.

Rules:

1. Preserve original source data.
2. Record proposed transformations separately.
3. Record user approvals explicitly.
4. Do not silently apply unapproved inferences to official output.
5. Include evidence references whenever available.

Status: Accepted.

## N-03 — Validation Report

Decision: Store the full validation report in `metadata/validation.json`.

Rules:

1. The manifest contains only a validation summary.
2. Validation must include errors and warnings.
3. Validation must cover schemas, references, assets, tokens, and components where applicable.
4. A failed validation must not be reported as successful.
5. Validation status must reflect actual executed checks.

Status: Accepted.

## N-04 — Project Context

Decision: Preserve optional `content.md` and structured `metadata/context.json`.

Rules:

1. User-provided content must be preserved.
2. Context fields should be structured when possible.
3. Unknown values must remain unknown.
4. AI-generated assumptions must be identified.
5. Missing context must not block unrelated extraction tasks.

Status: Accepted.

## N-05 — Icon Registry

Decision: Use `metadata/icons.json` and `assets/icons/`.

Rules:

1. Preserve source icon identity when available.
2. Record asset paths explicitly.
3. Include license information only when supported by evidence.
4. Do not claim that every icon was extracted if some were unavailable.
5. An HTML icon gallery is optional.

Status: Accepted.

## N-06 — Proposed Tokens

Decision: Proposed tokens must not be silently inserted into the official token export.

Rules:

1. Confirmed tokens belong in `tokens.css`.
2. Unapproved proposed tokens belong in the decision/proposal metadata.
3. Optional proposed-token previews may be exported separately.
4. Proposed values must be labeled.
5. AI must not treat proposals as official design system rules.

Status: Accepted.

## N-07 — Component CSS Scope

Decision: `components.css` contains shared component styles only.

Rules:

1. Shared component styles belong in `components.css`.
2. Reference-specific layout styles belong in reference HTML.
3. Token usage should be preferred where mappings are reliable.
4. Do not claim semantic component styles when the source only provides rendered pixels or visual evidence.
5. Preserve rendering limitations in metadata.

Status: Accepted.

## N-08 — Reference Rendering Strategy

Decision: Use a hybrid reference-rendering strategy.

The exporter may combine:

- Confirmed tokens.
- Confirmed component metadata.
- Shared component CSS.
- Source-derived visual evidence.
- Fallback styles needed to preserve visual fidelity.

Rules:

1. Preserve visual fidelity when possible.
2. Do not invent component relationships.
3. Attach token or component IDs only when evidence is sufficient.
4. Clearly distinguish semantic mapping from visual approximation.
5. Record unresolved mappings and fallback usage.

Status: Accepted.

## N-09 — Manifest Contract

Decision: Keep `manifest.json` at the package root.

It must include:

- Package format version.
- Source and scope.
- File inventory.
- Capabilities.
- Limitations.
- Validation summary.
- Generation metadata.

The manifest must not include its own hash.

Status: Accepted.

## N-10 — Component Extraction Coverage

Decision: Component extraction coverage must be reported honestly.

A root-level component record does not prove complete extraction of:

- Nested component hierarchies.
- Instance overrides.
- Slots.
- Instance swaps.
- Component property dependencies.
- Nested variants.
- All component set dimensions.

Rules:

1. Report partial coverage when only root-level information is available.
2. Report unsupported capabilities explicitly.
3. Do not claim complete recursive extraction without implementation and tests.
4. Test nested components, component sets, and instance overrides against real fixtures.

Status: Accepted.

## N-11 — Asset Registry and Limits

Decision: Use a centralized asset registry with deterministic export behavior.

Rules:

1. Register exported assets in `metadata/assets.json`.
2. Preserve stable asset identifiers.
3. Use relative paths inside the package where possible.
4. Record unavailable or external assets explicitly.
5. Do not fabricate license status.
6. Apply documented package size limits.
7. Make asset omission visible in validation results.

Status: Accepted.

## N-12 — Versioning and Migration

Decision: Version the package format and schema contracts separately from the plugin implementation.

Rules:

1. Every package must declare a format version.
2. Schema changes must be documented.
3. Breaking changes require a major format version increment.
4. Backward-compatible additions may use a minor version increment.
5. Bug fixes that do not change the contract may use a patch increment.
6. Migration logic must be tested against previous supported package versions.

Status: Accepted.

## N-13 — Documentation Separation

Decision: Separate the documentation files by responsibility.

- `SKILL.md`: how an AI agent discovers and uses the package.
- `ai-control.md`: constraints and behavioral requirements.
- `design.md`: design principles, tokens, patterns, and usage guidance.
- `content.md`: optional project-specific context.

Rules:

1. Avoid unnecessary duplication.
2. Cross-reference files where useful.
3. Do not allow conflicting rules to remain unresolved.
4. Treat explicit control constraints as higher priority than optional visual suggestions.

Status: Accepted.

## N-14 — Index Files

Decision: Index files are navigation layers, not substitutes for full entity records.

Rules:

1. `components/index.json` lists exported components.
2. Individual component files contain detailed component metadata.
3. `references/index.json` lists reference pages.
4. Reference HTML files contain actual rendered content.
5. All index paths must resolve to existing files.
6. Index entries must not claim unsupported extraction coverage.

Status: Accepted.

# 7. Token Extraction and CSS Naming

## 7.1 Token Preservation

Preserve as much source information as possible:

- Original name.
- Source ID.
- Original value.
- Resolved value.
- Alias target.
- Collection.
- Mode.
- Theme.
- Type.
- Description.
- Provenance.
- Resolution status.

Only include fields supported by the source.

## 7.2 CSS Custom Property Naming

CSS custom properties should use a deterministic naming strategy.

Example:

```
:root {
  --color-brand-primary: #31fff2;
  --color-text-primary: #1a1a1a;
  --spacing-4: 16px;
  --radius-md: 8px;
}
```

These names are illustrative, not evidence of the user's actual Figma tokens.

The exporter must maintain a mapping between normalized CSS names and original source names.

## 7.3 Name Collisions

When two source tokens normalize to the same CSS name:

1. Detect the collision.
2. Resolve it deterministically.
3. Preserve the original names.
4. Record the mapping.
5. Emit a warning.
6. Never silently overwrite a token.

## 7.4 Aliases

Aliases should remain explicit in metadata.

If CSS cannot directly express a source relationship in the required form, preserve the relationship in metadata and generate a documented CSS fallback only when necessary.

## 7.5 Modes and Themes

Do not flatten different modes into one value if doing so discards meaningful distinctions.

When supported, represent modes with appropriate CSS selectors or custom-property scopes.

Example:

```
:root {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
}

[data-theme="dark"] {
  --color-background: #1a1a1a;
  --color-text: #ffffff;
}
```

This is an illustrative pattern. Actual selectors and values must be generated from the source data and configured export rules.

## 7.6 Invalid Values

Do not export unresolved values as `[object Object]`, malformed CSS, or misleading placeholder values.

If a value cannot be converted:

1. Preserve the source representation in metadata where possible.
2. Mark the conversion as unresolved.
3. Emit a validation warning or error according to severity.
4. Exclude the invalid CSS declaration.
5. Continue exporting unrelated valid tokens when safe.

# 8. Component Extraction Contract

## 8.1 Component Metadata

Each component record should contain supported information such as:

- Stable canonical ID.
- Original component name.
- Source identity.
- Component type.
- Description.
- Component properties.
- Variant dimensions.
- Supported variants.
- Nested component relationships.
- Token references.
- Preview path.
- Extraction coverage.
- Provenance.
- Limitations.

Only include fields that can be supported by extracted data.

## 8.2 Component Sets

Component sets must not be considered fully extracted merely because one child or one variant was inspected.

The extractor should enumerate all supported variants and properties.

Any implementation limits must be explicit and configurable where appropriate.

## 8.3 Nested Components

Nested component relationships require recursive traversal or another validated relationship-extraction method.

If the implementation only extracts root-level metadata, the package must label the result as partial.

## 8.4 Instance Overrides

Instance overrides must only be exported when the extraction method can reliably identify them.

Do not infer overrides from visual differences alone unless they are labeled as inferred observations.

## 8.5 Component Coverage

Recommended coverage statuses:

- `complete`
- `partial`
- `metadata_only`
- `visual_only`
- `unsupported`
- `failed`

The status must reflect actual extraction behavior.

# 9. Reference HTML Contract

## 9.1 Purpose

Reference pages provide visual and practical examples of the exported system.

They may include:

- Color palettes.
- Typography specimens.
- Spacing examples.
- Component previews.
- Icon galleries.
- Layout examples.
- Interaction demonstrations.

## 9.2 Independence

Each reference should be usable as a standalone HTML file whenever practical.

Relative paths must be used for packaged assets.

External dependencies must be declared and must not be assumed to be available offline.

## 9.3 Semantic Mapping

A reference element may contain attributes such as:

```
<div
  data-design-system-token-id="token_123"
  data-design-system-component-id="component_456"
>
  Example
</div>
```

The example above illustrates the contract only.

Actual IDs must reference real exported entities.

Do not attach semantic IDs to elements when the mapping is uncertain.

## 9.4 Visual Fallbacks

A reference page may use fallback CSS to preserve visual fidelity.

Fallback styles must not be misrepresented as confirmed source tokens.

## 9.5 Reference Validation

Validation should verify:

- Referenced assets exist.
- Local links resolve.
- Token IDs resolve.
- Component IDs resolve.
- Required styles are present.
- External dependencies are declared.
- Unsupported interactions are disclosed.

# 10. JSON Schema Contracts

The following examples illustrate the required data contracts. They are not substitutes for formal JSON Schema files. Before implementation is considered complete, each schema file listed in Section 3 must contain a valid, versioned JSON Schema definition and must be tested against valid and invalid fixtures.

## 10.1 Manifest Example

```
{
  "formatVersion": "3.0.0",
  "packageType": "global-design-system",
  "generatedAt": "2026-10-27T00:00:00.000Z",
  "source": {
    "type": "figma",
    "name": "Example Design System",
    "fileId": null
  },
  "scope": {
    "tokens": true,
    "components": true,
    "references": true,
    "assets": true
  },
  "inventory": {
    "files": [],
    "tokenCount": 0,
    "componentCount": 0,
    "referenceCount": 0,
    "assetCount": 0
  },
  "capabilities": {
    "tokens": {
      "status": "supported",
      "coverage": "unknown"
    },
    "components": {
      "status": "partial",
      "coverage": "partial"
    },
    "references": {
      "status": "supported",
      "coverage": "unknown"
    }
  },
  "limitations": [],
  "validation": {
    "status": "not_run",
    "errorCount": 0,
    "warningCount": 0,
    "reportPath": "metadata/validation.json"
  }
}
```

## 10.2 Component Example

```
{
  "schemaVersion": "1.0.0",
  "id": "component_example_button",
  "name": "Button",
  "source": {
    "type": "figma",
    "fileId": null,
    "nodeId": null,
    "componentKey": null
  },
  "status": "partial",
  "coverage": {
    "metadata": "complete",
    "variants": "partial",
    "nestedComponents": "unsupported",
    "overrides": "unsupported"
  },
  "properties": [],
  "variants": [],
  "relationships": {
    "tokens": [],
    "components": []
  },
  "preview": "preview.html",
  "evidence": [],
  "limitations": [
    "Replace this example with actual extraction results."
  ]
}
```

## 10.3 Decision Example

```
{
  "schemaVersion": "1.0.0",
  "decisions": [
    {
      "id": "decision_example_001",
      "type": "token_mapping",
      "status": "proposed",
      "subjectId": "token_example",
      "proposal": {
        "target": "color.brand.primary"
      },
      "evidence": [],
      "confidence": "unknown",
      "approvedByUser": false,
      "createdAt": "2026-10-27T00:00:00.000Z"
    }
  ]
}
```

## 10.4 Validation Example

```
{
  "schemaVersion": "1.0.0",
  "status": "warning",
  "validatedAt": "2026-10-27T00:00:00.000Z",
  "summary": {
    "errors": 0,
    "warnings": 1,
    "info": 0
  },
  "checks": [
    {
      "id": "check_component_coverage",
      "status": "warning",
      "message": "Component extraction is partial.",
      "entityIds": [],
      "filePaths": []
    }
  ]
}
```

## 10.5 Schema Requirements

Every formal schema must define:

- `$schema`.
- `$id`.
- `title`.
- `description`.
- `type`.
- `properties`.
- Required fields.
- Enumerations for controlled status values.
- Constraints for arrays and strings where applicable.
- Reference rules where expressible.
- Version information.

Use JSON Schema Draft 2020-12 unless implementation constraints require another explicitly documented version.

Do not assume JSON Schema alone can validate all cross-file relationships. Cross-file validation must be implemented separately.

# 11. Validation Rules

## 11.1 Validation Levels

### Level 1 — Package Structure

Verify:

- Required files exist.
- Paths are valid.
- File names are unique where required.
- JSON files parse successfully.
- No invalid path traversal is present.
- Manifest inventory is consistent with actual package contents.

### Level 2 — Schema Validation

Verify each structured file against its declared schema.

### Level 3 — Entity Integrity

Verify:

- IDs are unique within their required scope.
- Required identifiers are present.
- Entity references resolve.
- Index entries point to existing entity files.
- Token aliases resolve where required.
- Component relationships resolve where supported.

### Level 4 — Asset Integrity

Verify:

- Registered assets exist.
- File types match declared types.
- Relative paths resolve.
- Required fonts and images are present when included.
- Missing assets are reported.

### Level 5 — CSS Integrity

Verify:

- CSS parses.
- Custom property names are valid.
- Duplicate variable names are detected.
- Invalid values are excluded or reported.
- Alias mappings are consistent.
- Theme scopes do not create unintended collisions.

### Level 6 — Reference Integrity

Verify:

- HTML files are readable.
- Internal links resolve.
- Local assets resolve.
- Semantic IDs refer to existing exported entities.
- External dependencies are declared.
- Missing visual dependencies are reported.

### Level 7 — Capability and Coverage

Verify that claimed extraction coverage matches the capabilities actually executed.

Examples:

- If component variants were not enumerated, variant coverage cannot be `complete`.
- If nested component relationships were not extracted, nested component coverage cannot be `complete`.
- If source aliases were not resolved, alias coverage cannot be `complete`.
- If a reference uses inferred mappings, those mappings must be labeled accordingly.

## 11.2 Validation Status

Use the following overall statuses:

- `passed`: required checks passed and no blocking errors exist.
- `warning`: the package is usable but has known warnings or partial coverage.
- `failed`: blocking errors prevent safe use.
- `not_run`: validation has not been executed.

Do not use `passed` when required checks were skipped.

## 11.3 Severity

Use:

- `error`
- `warning`
- `info`

Errors should block a successful validation status when they affect package integrity or the correctness of required output.

Warnings should disclose partial coverage, unresolved optional relationships, or known limitations.

Informational messages should explain non-blocking details.

# 12. Figma Capability Audit

The plugin must maintain a capability matrix that reflects real implementation behavior.

A feature must not be marked as supported merely because the Figma API may theoretically expose the necessary information.

Support means that the current plugin implementation extracts the information reliably and has tests that demonstrate it.

## 12.1 Capability Status Values

Use:

- `implemented_verified`
- `implemented_unverified`
- `partial`
- `planned`
- `unsupported`
- `not_applicable`

## 12.2 Capability Matrix

| Capability                 | Required behavior                                   | Verification requirement                                                  |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Token extraction           | Extract supported variables and styles              | Test colors, numbers, strings, and supported types                        |
| Token aliases              | Preserve and resolve supported aliases              | Test valid, missing, and cyclic relationships                             |
| Modes                      | Preserve values by mode                             | Test multiple modes                                                       |
| CSS naming                 | Generate deterministic custom properties            | Test collisions and unusual names                                         |
| Typography                 | Extract supported typography information            | Test text styles and missing font data                                    |
| Component metadata         | Extract supported component identity and properties | Test regular components                                                   |
| Component sets             | Enumerate supported variants                        | Test multi-dimensional component sets                                     |
| Nested components          | Preserve supported nested relationships             | Test nested instances and components                                      |
| Instance overrides         | Extract supported override data                     | Test overridden text, properties, and nested instances                    |
| Component properties       | Preserve supported property definitions             | Test Boolean, text, instance-swap, and variant properties where available |
| References                 | Generate HTML demonstrations                        | Compare output against source fixtures                                    |
| Semantic reference mapping | Link HTML elements to canonical IDs                 | Verify every mapping                                                      |
| Assets                     | Export and register assets                          | Test missing and external assets                                          |
| Icons                      | Export supported icons and metadata                 | Test SVG and other supported formats                                      |
| Fonts                      | Preserve supported font metadata and files          | Test unavailable or restricted fonts                                      |
| Validation                 | Generate accurate reports                           | Test invalid schemas and broken references                                |
| Provenance                 | Preserve source identity and extraction method      | Verify source IDs and relationships                                       |

## 12.3 Previously Reported Implementation Findings

The earlier audit notes reported the following observations. They must be verified against the current plugin source code before being treated as confirmed implementation facts.

- A `tokensCss` implementation reportedly exists.
- Basic alias and mode handling reportedly exists.
- A `refTokenMap` and `cssNameMap` reportedly exist.
- Component metadata reportedly uses `M.components` and `extractComponent`.
- `componentSpec` reportedly handles only root-level component data.
- Component Set extraction reportedly inspects only `n.children[0]`.
- Text extraction reportedly has a limit of four items.
- Variant dimensions reportedly have a limit of thirty.
- Recursive nested component relationships reportedly are not fully extracted.
- Instance overrides, slots, and instance-swap relationships reportedly are not fully extracted.
- Reference HTML generation reportedly exists with inline CSS.
- HTML semantic mapping reportedly uses a `data-component` attribute based on component names.
- Stable semantic token/component identity in reference pages reportedly is not guaranteed.
- A validation output reportedly exists as `validation-report.json`.
- Icon output reportedly includes `icons.json` and `reference/icons.html`.
- `content.md` reportedly exists.
- `fonts.css` and `reference/assets` reportedly exist.

These are audit notes, not independently verified facts in this document.

The implementation team must inspect the current source and run fixtures before changing their status to `implemented_verified`.

## 12.4 API and Implementation Limitations

The capability audit must distinguish between:

1. Information unavailable from the source API.
2. Information available from the API but not extracted by the plugin.
3. Information extracted but not normalized.
4. Information normalized but not exported.
5. Information exported but not validated.
6. Information that can only be inferred visually.

These categories must not be combined into a generic claim that a feature is “unsupported.”

## 12.5 Avoiding False Guarantees

The plugin must never claim:

- Complete component extraction when only root metadata is extracted.
- Complete variant extraction when enumeration is limited.
- Complete override extraction when overrides are not traversed.
- Complete token resolution when aliases remain unresolved.
- Semantic HTML mapping when mappings are based only on names.
- Full visual fidelity when assets or fonts are missing.
- Successful validation when validation was not executed.

# 13. Source Adapter Architecture

## 13.1 Adapter Responsibilities

Each source adapter must:

1. Read supported source data.
2. Preserve source identifiers.
3. Normalize supported fields.
4. Report unavailable fields.
5. Report extraction errors.
6. Produce canonical entities.
7. Attach provenance.
8. Avoid silently fabricating missing information.

## 13.2 Figma Adapter

The Figma adapter should extract supported information about:

- Variables.
- Collections.
- Modes.
- Styles.
- Components.
- Component sets.
- Component properties.
- Node hierarchy.
- Text and typography.
- Assets.
- Source metadata.

The actual capability must be determined by the current plugin API, permissions, runtime environment, and implementation.

## 13.3 Markdown Adapter

The Markdown adapter should:

1. Parse headings and sections.
2. Preserve original text.
3. Extract structured information when possible.
4. Identify candidate tokens, components, and rules.
5. Mark ambiguous mappings as inferred or proposed.
6. Preserve the source document location or heading where available.
7. Avoid silently overwriting confirmed Figma facts.

## 13.4 Multiple Sources

When multiple sources disagree:

1. Preserve the source values.
2. Identify the conflict.
3. Apply only documented precedence rules.
4. Request user input when the conflict cannot be resolved safely.
5. Record the decision.
6. Preserve the evidence behind the resolution.

# 14. AI Assistance Rules

AI may assist with:

- Classification.
- Naming suggestions.
- Documentation.
- Relationship proposals.
- Rule drafting.
- Reference descriptions.
- Accessibility observations.
- Identifying possible inconsistencies.

AI must not silently:

- Invent source tokens.
- Invent component properties.
- Claim unsupported relationships.
- Overwrite source facts.
- Remove conflicting source information.
- Mark proposals as approved.
- Claim a feature is implemented without evidence.

## 14.1 AI Output States

AI-generated information should be labeled as one of:

- `proposal`
- `inference`
- `approved`
- `rejected`

Approval must be an explicit event.

## 14.2 Human Review

The plugin should request review when:

- Multiple plausible token mappings exist.
- A naming collision cannot be resolved safely.
- Source facts conflict.
- A proposed rule would override existing design system behavior.
- An export would discard important information.
- A destructive sync or replacement is requested.

# 15. Four-Step User Workflow

The interface should remain simple even though the internal architecture is advanced.

The preferred workflow has four primary steps.

## Step 1 — Source

Purpose: Select and inspect source material.

Possible actions:

- Connect to or select a Figma source.
- Select supported pages or scopes.
- Add Markdown or project context where supported.
- Inspect detected source capabilities.
- Display extraction limitations before export.

## Step 2 — References

Purpose: Select or review the information to include.

Possible actions:

- Select tokens.
- Select components.
- Select styles.
- Select reference pages.
- Inspect detected entities.
- Review unresolved mappings.
- See extraction coverage.

## Step 3 — Build

Purpose: Normalize, analyze, generate, and validate the package.

Possible actions:

- Resolve dependencies.
- Apply documented inclusion rules.
- Review conflicts.
- Generate outputs.
- Validate the package.
- Display progress based on real task status.

Progress must reflect actual operations, not an arbitrary timer or simulated percentage.

## Step 4 — Download

Purpose: Review and export the final package.

Possible actions:

- Review package contents.
- Review errors and warnings.
- Download the package.
- Start a new build.
- Return to earlier steps when necessary.

Do not add a permanent sidebar unless a later usability evaluation demonstrates that it is necessary.

# 16. Dependency Handling

When selecting tokens or components, dependencies must be handled through an explicit policy.

Supported policies:

- `auto_include`
- `ask`
- `ignore`

## 16.1 auto_include

Automatically include required dependencies.

Requirements:

- Mark included dependencies.
- Preserve the reason for inclusion.
- Prevent duplicate entities.
- Detect unresolved dependencies.
- Report dependency expansion.

## 16.2 ask

Ask the user whether required dependencies should be included.

Requirements:

- Show the dependency and reason.
- Allow users to make an informed decision.
- Preserve the selected policy.

## 16.3 ignore

Do not automatically add dependencies.

Requirements:

- Preserve the user's selection.
- Report missing dependencies.
- Do not silently claim that the result is complete.
- Explain potential impact.

Missing nested components must always be reported when the package claims to include them.

# 17. Package Versioning and Migration

## 17.1 Version Fields

Maintain separate versions for:

- Package format.
- JSON schemas.
- Plugin implementation.
- Canonical model where necessary.

Do not use one version number to represent all of these independently changing systems.

## 17.2 Migration Rules

When migrating an older package:

1. Read the existing format version.
2. Validate the old structure.
3. Apply an explicit migration.
4. Preserve source data and provenance.
5. Report fields that cannot be migrated.
6. Validate the migrated package.
7. Record the migration path.

## 17.3 Backward Compatibility

A package consumer must not assume that every optional field exists.

Unknown fields should be handled according to documented compatibility rules.

Required fields must remain stable within a supported major version.

# 18. Testing Strategy

## 18.1 Unit Tests

Test:

- Stable ID generation.
- CSS name normalization.
- Collision handling.
- Alias resolution.
- Mode resolution.
- Value conversion.
- Provenance preservation.
- Confidence/status handling.
- Schema validation.
- Path generation.

## 18.2 Integration Tests

Test:

- Figma source extraction.
- Canonical model generation.
- Component relationship extraction.
- Reference generation.
- Asset packaging.
- Manifest generation.
- Full validation.
- ZIP generation.

## 18.3 Fixture Tests

Maintain representative Figma fixtures covering:

- Simple color tokens.
- Multiple variable modes.
- Aliases.
- Typography styles.
- Duplicate or colliding names.
- Regular components.
- Component sets.
- Nested components.
- Component properties.
- Instance overrides.
- Missing assets.
- Unavailable fonts.
- Unsupported node types.

## 18.4 Regression Tests

For each fixture:

1. Run extraction.
2. Compare canonical output.
3. Compare generated token mappings.
4. Compare component relationships.
5. Compare reference output.
6. Compare validation findings.
7. Detect unexpected changes.

## 18.5 Package Round-Trip Test

Verify that:

1. The package can be generated.
2. The ZIP can be opened.
3. All required files exist.
4. All JSON files parse.
5. All schemas validate.
6. Relative paths resolve.
7. Index references resolve.
8. Token references resolve where required.
9. Validation results match actual defects.
10. The package remains usable without access to the original Figma file.

# 19. Implementation Priority

## P0 — Contract and Integrity

Complete these before expanding features:

- Finalize canonical entity contracts.
- Implement stable IDs.
- Finalize package manifest.
- Implement token naming and collision handling.
- Implement token-map output.
- Implement complete validation reporting.
- Implement accurate capability reporting.
- Ensure proposed tokens cannot silently become official tokens.
- Verify package integrity and ZIP output.

## P1 — Extraction Coverage

Implement and verify:

- Component set enumeration.
- Component property extraction.
- Nested component relationships.
- Supported instance overrides.
- Alias and mode edge cases.
- Asset registry.
- Semantic reference mapping.

## P2 — Documentation and Review

Implement and verify:

- AI control documentation.
- Project context preservation.
- Decision review interface.
- Inference and approval metadata.
- Reference index generation.
- Component previews.
- Icon registry.

## P3 — Advanced Enhancements

Consider:

- Richer visual comparisons.
- Improved change detection.
- Cross-source conflict resolution.
- Package migration tools.
- More detailed usage analysis.
- Additional source adapters.

Do not delay P0 integrity requirements to build optional visual enhancements.

# 20. Definition of Done

The Global Design System export is ready only when the following conditions are met.

## Architecture

- All source adapters map into a canonical model.
- Deterministic extraction occurs before AI interpretation.
- Provenance is preserved.
- Facts and inferences are distinguishable.
- Stable identifiers are implemented and tested.

## Tokens

- CSS-mappable tokens are exported.
- Supported aliases are preserved.
- Modes are preserved.
- CSS naming collisions are detected.
- Invalid values are reported.
- Token mappings are traceable to source data.

## Components

- Component metadata follows a documented schema.
- Component sets are enumerated to the supported extent.
- Coverage status is accurate.
- Nested component limitations are reported.
- Unsupported overrides are not represented as extracted facts.

## References

- Reference pages are generated where supported.
- Reference paths resolve.
- Semantic mappings reference actual entities.
- Fallback rendering is distinguishable from confirmed source styling.
- Missing assets are reported.

## Metadata

- Manifest exists.
- Decisions file exists.
- Validation report exists.
- Sources are documented.
- Asset and icon registries exist when applicable.
- All cross-file references resolve.

## Validation

- JSON schemas validate.
- CSS integrity checks run.
- Asset integrity checks run.
- Reference integrity checks run.
- Capability coverage is accurate.
- Validation status reflects actual results.

## Packaging

- ZIP generation succeeds.
- ZIP contents match the manifest inventory.
- No required file is missing.
- The package can be used independently of the source file.
- Known limitations are included in the package.

## User Experience

- The primary workflow has four steps.
- Progress reflects real processing.
- Users can inspect limitations.
- Users can review conflicts.
- Users can review validation findings.
- Download is enabled only when the package reaches the defined export state.

# 21. Final Architectural Decisions

The following decisions are the governing baseline for implementation:

1. The Canonical Design System Model is the semantic center of the architecture.
2. All source adapters normalize into the canonical model.
3. Deterministic extraction precedes AI interpretation.
4. Stable IDs and provenance are mandatory.
5. `tokens.css` is the authoritative CSS-mappable token export.
6. `components.css` contains shared component styles only.
7. `SKILL.md`, `ai-control.md`, and `design.md` remain separate.
8. `metadata/decisions.json` stores proposals, approvals, conflicts, and evidence.
9. `metadata/validation.json` stores the complete validation report.
10. `manifest.json` describes package contents, capabilities, limitations, and validation summary.
11. Component and reference indexes are navigation layers, not substitutes for full data.
12. Reference HTML is visual evidence, not the source of truth for structured entities.
13. Proposed tokens must not silently enter the official token export.
14. Unsupported extraction behavior must be disclosed.
15. Export coverage must reflect verified implementation behavior.
16. Package schemas and format versions must be explicit.
17. The four-step interface remains the preferred workflow.
18. The package must be validated before being described as ready.
19. Reported implementation findings must be checked against the current source code and real Figma fixtures.
20. No feature may be marked `implemented_verified` until its implementation and tests support that status.

# 22. Important Verification Note

This specification consolidates the architecture and decisions described in the available project context. It does not independently prove that the current plugin implements every listed capability.

Before declaring the implementation complete, the engineering team must:

1. Inspect the current plugin source code.
2. Verify each reported implementation finding.
3. Create or update representative Figma fixtures.
4. Run extraction and export tests.
5. Validate all generated schemas.
6. Confirm that the manifest accurately reports capability coverage.
7. Test the final ZIP independently of the source Figma file.
8. Update the capability matrix with evidence-backed statuses.

The specification defines the intended contract. The actual implementation status must be determined through source inspection and reproducible tests.
