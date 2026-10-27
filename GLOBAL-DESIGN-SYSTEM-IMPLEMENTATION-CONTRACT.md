
# Global Design System
# Implementation Contract — v3.1.0

**Document type:** Implementation specification  
**Status:** Approved baseline for implementation, subject to source-code verification  
**Package format target:** 3.0.0  
**Schema contract target:** 1.0.0  
**Primary goal:** Convert the existing Global Design System plugin into a deterministic, validated, portable, AI-agent-ready design system exporter.

---

# 0. Rules for Implementers

This document is the implementation contract.

When implementation behavior conflicts with this contract, do not silently choose one. Record the conflict, identify the affected files, and resolve it through an explicit migration or decision.

The implementation must follow these principles:

1. Deterministic extraction before AI interpretation.
2. Canonical Model as the center of the architecture.
3. Stable entity identity independent of display names.
4. Explicit provenance for source-derived information.
5. Separation of facts, observations, inferences, and proposals.
6. Explicit extraction coverage.
7. Explicit validation status.
8. No fabricated source information.
9. No silent loss of aliases, modes, relationships, or user decisions.
10. No claim of complete extraction without verified implementation and tests.

The implementation must not treat this document as proof that any capability already exists.

Every capability must be classified as:

- `implemented_verified`
- `implemented_unverified`
- `partial`
- `planned`
- `unsupported`
- `not_applicable`

Only reproducible tests can justify `implemented_verified`.

---

# 1. Final Architecture

## 1.1 Processing Pipeline

The required processing pipeline is:

Source Input
→ Source Adapter
→ Deterministic Extraction
→ Normalization
→ Canonical Design System Model
→ Relationship Resolution
→ Rule Evaluation
→ Optional AI Assistance
→ User Review
→ Export Generation
→ Validation
→ ZIP Packaging

Do not implement a direct Figma-to-Markdown pipeline as the primary architecture.

## 1.2 Architectural Layers

### Layer A — Source Adapters

Responsibilities:

- Read available source data.
- Preserve original source identifiers.
- Report unsupported source fields.
- Return structured extraction results.
- Avoid silently inventing unavailable information.

Supported adapters may include:

- Figma.
- Markdown.
- User-provided project context.
- Future source formats.

### Layer B — Canonical Model

Responsibilities:

- Normalize source data.
- Maintain canonical entity IDs.
- Preserve provenance.
- Maintain relationships.
- Distinguish facts from inferences.
- Track extraction coverage.
- Track decisions and conflicts.

### Layer C — Resolvers

Responsibilities:

- Resolve token aliases.
- Resolve component relationships.
- Resolve dependencies.
- Normalize CSS names.
- Detect naming collisions.
- Resolve source conflicts according to explicit precedence rules.

### Layer D — Rule Engine

Responsibilities:

- Evaluate inclusion policies.
- Enforce package requirements.
- Apply deterministic transformations.
- Report missing dependencies.
- Validate decisions against the contract.

### Layer E — Optional AI Assistance

Responsibilities:

- Suggest classifications.
- Draft documentation.
- Propose mappings.
- Explain possible inconsistencies.
- Suggest design rules.

AI must not silently overwrite confirmed source data.

### Layer F — Exporters

Responsibilities:

- Generate JSON metadata.
- Generate CSS files.
- Generate Markdown documents.
- Generate HTML references.
- Copy supported assets.
- Generate the manifest.
- Generate validation output.

### Layer G — Validator and Packager

Responsibilities:

- Validate schemas.
- Validate cross-file relationships.
- Validate CSS.
- Validate HTML references.
- Validate assets.
- Validate manifest inventory.
- Package the validated output.

---

# 2. Final Export Structure

```text
global-design-system/
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
│   │   ├── usage.md
│   │   └── preview.html
│   └── ...
│
├── references/
│   ├── index.json
│   ├── source-evidence/
│   │   └── ...
│   ├── generated-guides/
│   │   └── ...
│   └── ...
│
├── rules/
│   ├── index.json
│   ├── design-rules.json
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
│   ├── token-map.schema.json
│   ├── component.schema.json
│   ├── components-index.schema.json
│   ├── references-index.schema.json
│   ├── decisions.schema.json
│   ├── rules.schema.json
│   ├── validation.schema.json
│   ├── sources.schema.json
│   ├── icons.schema.json
│   ├── assets-index.schema.json
│   └── context.schema.json
│
├── assets/
│   ├── fonts/
│   ├── images/
│   └── icons/
│
└── examples/
    ├── manifest.example.json
    ├── token-map.example.json
    ├── component.example.json
    ├── decisions.example.json
    ├── rules.example.json
    └── validation.example.json
```

## 2.1 Required Package Files

The following are mandatory for a package claiming complete contract compliance:

- `manifest.json`
- `SKILL.md`
- `ai-control.md`
- `design.md`
- `tokens.css`
- `components.css`
- `components/index.json`
- `references/index.json`
- `rules/index.json`
- `metadata/token-map.json`
- `metadata/decisions.json`
- `metadata/validation.json`
- `metadata/sources.json`
- `metadata/context.json`
- All schemas declared in the manifest or package contract.

`content.md` may be omitted when no project-specific prose has been provided.

Component records, reference pages, icon registries, asset registries, and individual rule files may be empty or omitted when the relevant entities do not exist. The manifest must still explain the absence.

The plugin must not create fake entities simply to populate the package.

If a mandatory file cannot be generated, validation must not report complete package compliance.

## 2.2 File Responsibility Rules

| File | Authoritative responsibility |
|---|---|
| `manifest.json` | Package metadata, inventory, versions, capabilities, validation summary |
| `SKILL.md` | AI-agent discovery and usage instructions |
| `ai-control.md` | Constraints governing AI-generated implementations |
| `design.md` | Human-readable design system documentation |
| `content.md` | Optional project-specific user context |
| `tokens.css` | CSS-mappable design tokens |
| `components.css` | Shared component styles |
| `components/index.json` | Component discovery |
| `components/*/component.json` | Individual component metadata |
| `components/*/usage.md` | Component usage guidance |
| `components/*/preview.html` | Component-specific preview where supported |
| `references/index.json` | Reference discovery |
| `references/source-evidence/` | Source-derived visual evidence |
| `references/generated-guides/` | Generated style guides and demonstrations |
| `rules/index.json` | Rule discovery |
| `rules/design-rules.json` | Structured design rules |
| `metadata/token-map.json` | Source-to-canonical-to-CSS token mapping |
| `metadata/decisions.json` | Decisions, approvals, conflicts, evidence, proposals |
| `metadata/validation.json` | Full validation report |
| `metadata/sources.json` | Source provenance |
| `metadata/context.json` | Structured project context |
| `metadata/icons.json` | Icon registry |
| `metadata/assets.json` | Asset registry |

---

# 3. R-01 — Resolve the Rules Architecture

## Decision

Rules are first-class canonical entities and must not be stored exclusively inside `decisions.json`.

Use two separate concepts:

1. Rules define reusable design constraints.
2. Decisions record choices, approvals, conflicts, and changes affecting those rules.

## 3.1 Rule Storage

Use:

- `rules/index.json`
- `rules/design-rules.json`
- Optional additional rule files for large systems.

`metadata/decisions.json` may refer to rules by stable ID but must not become the authoritative storage for the rule definitions themselves.

## 3.2 Rule Categories

Support the following categories:

- `token_usage`
- `component_usage`
- `layout`
- `spacing`
- `typography`
- `color`
- `responsive`
- `accessibility`
- `interaction`
- `content`
- `naming`
- `asset_usage`
- `implementation`
- `other`

## 3.3 Rule Schema Contract

Every rule must support:

- Stable rule ID.
- Name.
- Category.
- Description.
- Requirement level.
- Status.
- Source or provenance.
- Evidence.
- Applicability.
- Optional affected entities.
- Optional validation behavior.
- Optional examples.

Requirement levels:

- `must`
- `should`
- `may`
- `must_not`

Rule status:

- `confirmed`
- `approved`
- `proposed`
- `deprecated`
- `rejected`

A proposed rule must not be treated as a mandatory constraint.

A rule inferred from visual evidence must be labeled as inferred until reviewed or confirmed.

---

# 4. R-02 — Complete Decisions Contract

`metadata/decisions.json` must support more than a single `decisions[]` array.

## 4.1 Required Top-Level Shape

```json
{
  "schemaVersion": "1.0.0",
  "decisions": [],
  "evidence": [],
  "approvals": [],
  "conflicts": [],
  "overrides": [],
  "proposals": []
}
```

All arrays must exist, even when empty.

## 4.2 Decision Record

Each decision should include:

- `id`
- `type`
- `status`
- `subjectIds`
- `summary`
- `rationale`
- `evidenceIds`
- `createdAt`
- `updatedAt`
- `actor`
- `approvalIds`
- `conflictIds`

Decision types:

- `token_mapping`
- `token_resolution`
- `component_mapping`
- `component_classification`
- `rule_resolution`
- `source_precedence`
- `naming`
- `dependency`
- `reference_mapping`
- `asset_mapping`
- `adherence`
- `freedom`
- `other`

Decision status:

- `proposed`
- `accepted`
- `rejected`
- `superseded`

## 4.3 Evidence Record

Each evidence record should include:

- `id`
- `type`
- `sourceId`
- `entityIds`
- `description`
- `location`
- `capturedAt`
- `confidence`
- `limitations`

Evidence types:

- `structured_source`
- `visual_source`
- `user_input`
- `test_result`
- `documentation`
- `inference`
- `other`

Do not invent source locations or evidence content.

## 4.4 Approval Record

Each approval should include:

- `id`
- `subjectType`
- `subjectId`
- `status`
- `actor`
- `timestamp`
- `comment`

Approval status:

- `approved`
- `rejected`
- `revoked`

An AI-generated proposal is not an approval.

## 4.5 Conflict Record

Each conflict should include:

- `id`
- `type`
- `status`
- `subjectIds`
- `description`
- `sourceValues`
- `resolution`
- `decisionId`
- `createdAt`
- `resolvedAt`

Conflict status:

- `open`
- `resolved`
- `deferred`
- `unresolvable`

## 4.6 Override Record

Each override should include:

- `id`
- `subjectId`
- `fieldPath`
- `originalValue`
- `overrideValue`
- `reason`
- `actor`
- `createdAt`
- `approvalId`
- `status`

Overrides must not destroy the original source value.

The original value and override value must remain independently traceable.

## 4.7 Proposal Record

Each proposal should include:

- `id`
- `type`
- `subjectIds`
- `proposedValue`
- `rationale`
- `evidenceIds`
- `confidence`
- `status`
- `createdAt`

Proposal status:

- `pending`
- `accepted`
- `rejected`
- `expired`

Accepted proposals must generate or reference an explicit decision or approval.

---

# 5. R-03 — Final Mandatory File Policy

The manifest must contain a file inventory.

The inventory must be generated from the actual package contents, not from a hardcoded list of intended files.

Every inventory entry must include:

- `path`
- `role`
- `required`
- `generated`
- `status`

Where available, it may also include:

- `mediaType`
- `sizeBytes`
- `sha256`

The manifest must not include a hash of itself.

Hashing is optional for files unless a specific integrity or reproducibility requirement makes it mandatory.

A package must fail validation when:

- A required file is missing.
- A declared file does not exist.
- A file path escapes the package root.
- Duplicate normalized paths exist.
- The inventory disagrees with the actual package.

---

# 6. R-04 — Independent Versioning

The package must distinguish four versions.

## 6.1 Version Fields

```json
{
  "versions": {
    "packageFormat": "3.0.0",
    "schemaContract": "1.0.0",
    "plugin": "0.0.0",
    "canonicalModel": "1.0.0"
  }
}
```

The plugin version must be read from the actual build configuration.

Do not use `3.0.0` as the plugin version unless that is the real plugin version.

The canonical model version and schema contract version must be maintained independently.

## 6.2 Semantic Versioning

Use semantic versioning for each versioned contract.

- Major: breaking compatibility change.
- Minor: backward-compatible functionality or schema additions.
- Patch: compatible correction.

A package format migration must be explicit.

A schema contract version change must not automatically imply a plugin version change.

## 6.3 Migration

Migration code must:

1. Identify the source package format.
2. Validate the source package.
3. Apply a documented migration.
4. Preserve unknown fields where safe.
5. Preserve source provenance.
6. Report information that could not be migrated.
7. Validate the migrated package.
8. Record the migration path.

---

# 7. R-05 — Unified Status Matrix

Do not use one status vocabulary for unrelated concepts.

Every status must belong to a named namespace.

## 7.1 Entity Evidence Status

Namespace: `evidenceStatus`

- `confirmed`
- `observed`
- `inferred`
- `proposed`
- `unavailable`
- `unsupported`

Meaning:

- `confirmed`: directly supported by structured source data or explicit approval.
- `observed`: visible in source evidence but not fully structured.
- `inferred`: derived from evidence using heuristics or interpretation.
- `proposed`: a suggestion awaiting review.
- `unavailable`: expected information could not be retrieved.
- `unsupported`: the current adapter does not support this information.

## 7.2 Implementation Capability Status

Namespace: `capabilityStatus`

- `implemented_verified`
- `implemented_unverified`
- `partial`
- `planned`
- `unsupported`
- `not_applicable`

## 7.3 Validation Status

Namespace: `validationStatus`

- `passed`
- `warning`
- `failed`
- `not_run`

## 7.4 Decision Status

Namespace: `decisionStatus`

- `proposed`
- `accepted`
- `rejected`
- `superseded`

## 7.5 Conflict Status

Namespace: `conflictStatus`

- `open`
- `resolved`
- `deferred`
- `unresolvable`

## 7.6 Coverage Status

Namespace: `coverageStatus`

- `complete`
- `partial`
- `metadata_only`
- `visual_only`
- `unsupported`
- `failed`
- `unknown`

## 7.7 Rule Status

Namespace: `ruleStatus`

- `confirmed`
- `approved`
- `proposed`
- `deprecated`
- `rejected`

## 7.8 Status Rules

Do not use `complete` as a validation status.

Do not use `passed` as an extraction coverage status.

Do not use `approved` as an implementation capability status.

Do not use `unsupported` to mean that extraction was attempted and failed. Use the appropriate failure or coverage status.

Every status field must reference the correct namespace.

---

# 8. R-06 — Separate Reference Types

The `references/` directory must distinguish source evidence from generated documentation.

## 8.1 Reference Types

Use `referenceType` with these values:

- `source_evidence`
- `generated_guide`
- `component_preview`
- `token_specimen`
- `interaction_demo`
- `asset_gallery`
- `other`

## 8.2 Source Evidence

Source evidence represents information directly captured from or derived from a specific source.

It may include:

- Screenshots.
- Source-derived HTML captures.
- Visual observations.
- Source node references.
- Evidence metadata.

It must not be described as a generated canonical design system guide.

## 8.3 Generated Guides

Generated guides demonstrate the canonical model.

Examples:

- Colors.
- Typography.
- Spacing.
- Component catalog.
- Icon gallery.
- Theme preview.

Generated guides must link to canonical entity IDs whenever reliable mappings exist.

## 8.4 Reference Index

Each reference entry must include:

- `id`
- `title`
- `path`
- `referenceType`
- `status`
- `sourceIds`
- `entityIds`
- `evidenceIds`
- `limitations`

Use `sourceIds`, `entityIds`, and `evidenceIds` as empty arrays when none exist.

## 8.5 Required Validation

The validator must confirm:

- Every index path exists.
- Every referenced source ID resolves.
- Every canonical entity ID resolves.
- Reference types are valid.
- Unsupported mappings are not represented as confirmed.

---

# 9. R-07 — Component CSS Contract

Every component may optionally declare its CSS mapping.

The component metadata must distinguish:

1. Canonical component identity.
2. Source component identity.
3. CSS class mapping.
4. CSS file location.
5. Preview location.
6. Coverage status.

## 9.1 CSS Mapping

Recommended structure:

```json
{
  "css": {
    "file": "../../components.css",
    "classNames": [
      "ds-button"
    ],
    "status": "confirmed",
    "evidenceIds": []
  }
}
```

`classNames` is an array because a component may require multiple classes.

Do not use `className` as the only field because one canonical component may have multiple selectors or classes.

## 9.2 CSS Mapping Status

Use:

- `confirmed`
- `inferred`
- `proposed`
- `unavailable`

A CSS class mapping must not be marked confirmed merely because the source component name resembles the class name.

## 9.3 Selector Rules

The validator should verify that:

- The declared CSS file exists.
- Declared class selectors exist where required.
- Preview HTML uses the declared selectors.
- CSS references valid exported tokens where mappings are required.

The validator must not assume every class is a standalone CSS rule. Nested selectors and preprocessing may require parsing the actual supported CSS syntax.

---

# 10. R-08 — AI and Offline Policy

The plugin must not require network access merely to perform deterministic extraction and export.

## 10.1 Offline Core

The following operations must work without external AI services:

- Source extraction.
- Canonical model creation.
- Stable ID generation.
- Token normalization.
- CSS naming.
- Alias resolution where source data is available.
- Dependency resolution.
- Manifest generation.
- Reference indexing.
- Validation.
- ZIP packaging.

## 10.2 Optional AI Features

AI may be used for:

- Naming suggestions.
- Rule drafting.
- Classification proposals.
- Documentation generation.
- Conflict explanations.
- Visual interpretation.
- Suggested token mappings.

AI features must be optional and must report when unavailable.

## 10.3 AI Provider Contract

When AI is supported, document:

- Provider.
- Model identifier when available.
- Whether a network request occurs.
- Which source data is sent.
- Whether data is stored externally according to the provider's known behavior.
- Failure behavior.
- Timeout behavior.
- User consent requirements.

Do not claim a provider is private, local, or offline unless that behavior has been verified.

## 10.4 AI Failure

If AI is unavailable:

1. Continue deterministic operations.
2. Mark AI-dependent fields as unavailable or proposed as appropriate.
3. Do not block unrelated exports.
4. Do not silently substitute fabricated results.
5. Record relevant limitations.

## 10.5 AI Approval

AI-generated results remain proposals until accepted through an explicit user action or documented approval mechanism.

---

# 11. R-09 — Canonical Model and Provenance Contract

The Canonical Model must be source-independent but must preserve source identity.

## 11.1 Canonical Entity

Every entity must support, where applicable:

- `id`
- `entityType`
- `name`
- `evidenceStatus`
- `sourceRefs`
- `evidenceIds`
- `createdAt`
- `updatedAt`

Type-specific fields may be added through entity-specific schemas.

Optional fields may be omitted only when the contract permits omission.

Required collection fields must use empty arrays rather than null values.

## 11.2 Source Reference

A source reference must identify the source and original entity where possible.

```json
{
  "sourceId": "source_figma_main",
  "sourceType": "figma",
  "fileId": "actual-file-id",
  "nodeId": "actual-node-id",
  "fieldPath": "name"
}
```

This is a structural example. Actual identifiers must come from real source data.

Do not fabricate IDs for unavailable source entities.

## 11.3 Provenance Requirements

Preserve:

- Source identifier.
- Original source name.
- Extraction method.
- Extraction timestamp.
- Available source location.
- Transformation history when relevant.
- Evidence links.
- Known limitations.

---

# 12. R-10 — Stable ID Grammar

Canonical IDs must not depend on display names.

Do not generate canonical component IDs exclusively using:

`component.` + `slug(name)`

Do not generate canonical token IDs exclusively using:

`token.` + `slug(name)`

Names can change, collide, or differ only in punctuation and casing.

## 12.1 Canonical ID Format

Use this grammar:

`<entity-type>_<opaque-id>`

Examples:

- `token_01hxyz...`
- `component_01hxyz...`
- `rule_01hxyz...`
- `reference_01hxyz...`
- `asset_01hxyz...`

The opaque portion must use a documented stable ID strategy.

## 12.2 Preferred Strategy

When a stable source identifier exists, derive the canonical ID deterministically from:

- Entity type.
- Source type.
- Source namespace.
- Stable source entity identifier.

A namespaced UUID or a deterministic hash of this tuple may be used.

The exact algorithm must be documented and covered by tests.

## 12.3 Fallback Strategy

If a source entity has no stable identifier:

1. Use available stable parent/source information.
2. Use a deterministic fallback key.
3. Record that fallback identity was used.
4. Detect collisions.
5. Do not silently treat a name-only ID as permanently stable.

If a reliable deterministic identity cannot be established, mark the entity identity as uncertain and require review where identity stability is critical.

## 12.4 Rename Stability

Changing a component display name must not change its canonical ID when the underlying source entity identity remains unchanged.

## 12.5 Collision Handling

If two source entities resolve to the same canonical ID:

- Stop the affected export operation or mark the package failed.
- Record the collision.
- Preserve source identifiers.
- Do not overwrite one entity with another.

---

# 13. R-11 — Derived Tokens and Nearest-Match Policy

Derived tokens must be separate from source tokens.

## 13.1 Token Origins

Use `origin` values:

- `source`
- `user_defined`
- `derived`
- `inferred`
- `proposed`

## 13.2 Official Tokens

`tokens.css` may contain:

- Confirmed source tokens.
- Explicitly user-defined tokens approved for export.
- Approved derived tokens, if the export policy permits them.

Unapproved inferred or proposed tokens must not enter the official token file.

## 13.3 Derived Token Record

A derived token must include:

- Stable token ID.
- Derived value.
- Derivation method.
- Input token IDs.
- Rationale.
- Evidence IDs.
- Approval status.
- Provenance.

## 13.4 Nearest-Match

Nearest-match suggestions must be advisory.

Examples:

- A requested color may be closest to an existing color token.
- A requested spacing value may be closest to an existing spacing token.
- A requested font size may be closest to an existing typography token.

The algorithm must document:

- The comparison method.
- The accepted distance metric.
- The threshold.
- Tie-breaking rules.
- The confidence interpretation.

Do not claim perceptual color similarity if the implementation uses only basic RGB distance.

Do not automatically replace requested values with nearest-match tokens unless the policy explicitly permits it.

## 13.5 No Suitable Match

When no suitable token exists:

- Return no match.
- Optionally create a proposal.
- Do not silently invent an official token.
- Record the unresolved requirement.

---

# 14. R-12 — Component Extraction Coverage

Component coverage must reflect the actual extraction performed.

## 14.1 Coverage Dimensions

Track coverage independently for:

- Metadata.
- Variants.
- Properties.
- Nested components.
- Instance overrides.
- Token relationships.
- CSS mapping.
- Reference mapping.

## 14.2 Coverage Values

Use:

- `complete`
- `partial`
- `metadata_only`
- `visual_only`
- `unsupported`
- `failed`
- `unknown`

## 14.3 Coverage Calculation

Do not infer complete coverage from the presence of one component record.

A component set is not complete when only its first child or default variant has been extracted.

A nested hierarchy is not complete when only root-level data has been collected.

Coverage must be based on the extractor's recorded operations and results.

## 14.4 Limits

If the implementation limits the number of text nodes, variants, or traversal depth:

- Record the limit.
- Record the number extracted.
- Record the number omitted where known.
- Emit a warning.
- Do not label the affected coverage complete.

---

# 15. R-13 — Deterministic Export and Reproducibility

Equivalent source data and equivalent configuration should produce equivalent canonical data and equivalent exports, except for explicitly variable metadata.

## 15.1 Deterministic Operations

Use deterministic ordering for:

- Token exports.
- Component exports.
- Reference indexes.
- Asset indexes.
- Rules.
- Decisions where ordering is not semantically meaningful.
- File inventories.

## 15.2 Timestamps

Timestamps may differ between export runs.

They must not be used as the sole source of stable entity identity.

## 15.3 Stable Serialization

Use consistent:

- JSON indentation.
- Key ordering where supported.
- Newline conventions.
- CSS declaration ordering.
- Relative path formatting.
- Filename normalization.

## 15.4 Reproducibility Test

Given the same source fixture and configuration:

- Canonical entity IDs must remain stable.
- Token mappings must remain stable.
- Entity ordering must remain deterministic.
- No duplicate files may be produced.
- No unrelated entity may change identity.
- Meaningful differences must be traceable to source or configuration changes.

---

# 16. R-14 — Conflict Precedence and Resolution

Source conflicts must be resolved using a documented precedence system.

No source may automatically override another merely because it was processed later.

## 16.1 Precedence Order

Use the following default precedence, from highest to lowest:

1. Explicit user-approved override.
2. Explicit user-provided project requirement.
3. Confirmed structured source data from the selected authoritative source.
4. Confirmed structured data from another selected source.
5. Observed visual evidence.
6. Approved inference.
7. Unapproved inference.
8. AI proposal.
9. Generic default or fallback.

This order is a default. A project may define an explicit alternative precedence policy.

A lower-priority source must not silently overwrite a higher-priority source.

## 16.2 Conflict Detection

Create a conflict when:

- Two authoritative sources disagree.
- A user requirement conflicts with a source value.
- A token alias cannot be resolved.
- A component mapping is ambiguous.
- Two entities claim the same canonical identity.
- A CSS name collision cannot be safely resolved.
- A proposed rule contradicts a confirmed rule.

## 16.3 Conflict Resolution

Resolution options:

- `use_higher_precedence`
- `user_decision`
- `keep_both`
- `defer`
- `unresolvable`

## 16.4 Preserve All Values

Resolving a conflict must not erase the original values.

The conflict record must preserve the conflicting source references and the selected resolution.

## 16.5 No Safe Resolution

When no safe resolution exists:

- Keep the conflict open or mark it unresolvable.
- Do not silently select a value.
- Report the conflict in validation.
- Request user review when it blocks a required output.

---

# 17. Canonical Token Contract

## 17.1 Token Fields

Each token should support:

- `id`
- `name`
- `tokenType`
- `origin`
- `evidenceStatus`
- `rawValue`
- `resolvedValue`
- `cssName`
- `collection`
- `modeValues`
- `aliasTargetId`
- `sourceRefs`
- `evidenceIds`
- `description`
- `resolutionStatus`
- `limitations`

Only fields applicable to the token type need to be populated.

## 17.2 Token Types

Supported token types must be explicitly defined.

Initial target types:

- `color`
- `number`
- `dimension`
- `spacing`
- `typography`
- `font_family`
- `font_size`
- `font_weight`
- `line_height`
- `letter_spacing`
- `border_radius`
- `border_width`
- `shadow`
- `opacity`
- `duration`
- `easing`
- `string`
- `boolean`
- `other`

Do not assign a token type based only on a name when the source type is available.

## 17.3 Alias Resolution

Alias resolution must:

- Preserve the original alias target.
- Resolve the target when available.
- Detect missing targets.
- Detect cycles.
- Preserve mode-specific behavior.
- Record unresolved aliases.
- Avoid malformed CSS output.

## 17.4 CSS Name Collisions

If multiple tokens normalize to the same CSS custom property:

1. Detect the collision.
2. Apply deterministic disambiguation.
3. Preserve original names.
4. Record the mapping.
5. Emit a validation warning.
6. Never silently overwrite a token.

## 17.5 Invalid Values

Invalid or unresolved token values must not be emitted as malformed CSS.

The source value should remain available in metadata when possible.

---

# 18. Component Contract

Each `component.json` must use a documented schema.

## 18.1 Required Fields

- `schemaVersion`
- `id`
- `name`
- `sourceRefs`
- `evidenceStatus`
- `coverage`
- `properties`
- `variants`
- `relationships`
- `css`
- `preview`
- `limitations`

## 18.2 Component Properties

Each property must preserve supported source information:

- Stable property ID where available.
- Name.
- Type.
- Default value where available.
- Allowed values where available.
- Source reference.
- Evidence status.
- Limitations.

## 18.3 Variants

Each variant must preserve supported source identity and property values.

Variant enumeration must be complete before variant coverage can be `complete`.

## 18.4 Relationships

Relationships may include:

- Parent component.
- Child component.
- Nested instance.
- Token usage.
- Component-set membership.
- Variant membership.
- Instance-swap target.

Only supported relationships may be exported as confirmed.

## 18.5 Usage Guidance

`usage.md` is required when the component has meaningful usage documentation.

It should cover:

- Purpose.
- Appropriate use.
- Inappropriate use.
- Variants.
- Properties.
- Token relationships.
- Accessibility.
- Interaction.
- Responsive behavior.
- Limitations.
- Examples.

AI-generated usage recommendations must be labeled as proposed until approved.

---

# 19. Context and Adherence Model

The package must distinguish source facts, design adherence, and implementation freedom.

These are separate dimensions and must not be combined into one ambiguous confidence value.

## 19.1 Fact Dimension

Represents how well an assertion is supported by evidence.

Possible values:

- `confirmed`
- `observed`
- `inferred`
- `proposed`
- `unknown`

## 19.2 Adherence Dimension

Represents how strictly a design constraint must be followed.

Possible values:

- `strict`
- `high`
- `moderate`
- `flexible`
- `unspecified`

## 19.3 Freedom Dimension

Represents how much creative variation is permitted.

Possible values:

- `none`
- `low`
- `moderate`
- `high`
- `unspecified`

## 19.4 Interpretation

These dimensions are independent.

A confirmed fact may still have flexible adherence.

An inferred rule may be proposed with strict adherence only after explicit approval.

High creative freedom does not authorize violating accessibility or explicit user constraints.

## 19.5 Context Record

`metadata/context.json` should support:

- Project identity.
- Product purpose.
- Audience.
- Platforms.
- Goals.
- Constraints.
- Brand context.
- Fact/adherence/freedom defaults.
- Source references.
- User-provided content.
- Unresolved questions.

Unknown values must remain unknown.

---

# 20. Formal JSON Schema Requirements

The package must contain actual JSON Schema files, not merely prose descriptions.

Use JSON Schema Draft 2020-12 unless a documented technical constraint requires another version.

Every schema must define:

- `$schema`
- `$id`
- `title`
- `description`
- `type`
- `properties`
- `required`
- Valid status enumerations
- Array item schemas
- Reference constraints where expressible
- Version compatibility

Use shared definitions to avoid duplicating status enumerations and common structures.

## 20.1 Required Schema Files

- `common-definitions.schema.json`
- `manifest.schema.json`
- `token-map.schema.json`
- `component.schema.json`
- `components-index.schema.json`
- `references-index.schema.json`
- `decisions.schema.json`
- `rules.schema.json`
- `validation.schema.json`
- `sources.schema.json`
- `icons.schema.json`
- `assets-index.schema.json`
- `context.schema.json`

## 20.2 Cross-File Validation

JSON Schema alone is insufficient for all package-level constraints.

Implement a separate cross-file validator for:

- Unique IDs.
- Relative path resolution.
- Token alias resolution.
- Component relationships.
- Reference entity links.
- Asset paths.
- Manifest inventory.
- CSS selectors.
- Source references.
- Decision/evidence references.

## 20.3 Schema Compatibility

Do not make every object closed to unknown fields if doing so would prevent safe forward compatibility.

Use `additionalProperties` and related JSON Schema features intentionally.

Document which records allow extensions and which require strict field control.

---

# 21. Manifest Contract

The manifest must identify the package format and all important generated content.

## 21.1 Required Manifest Fields

- `formatVersion`
- `schemaContractVersion`
- `pluginVersion`
- `canonicalModelVersion`
- `packageType`
- `generatedAt`
- `sourceIds`
- `scope`
- `inventory`
- `capabilities`
- `limitations`
- `validation`

## 21.2 Inventory

Each file entry must include:

- `path`
- `role`
- `required`
- `generated`
- `status`

Optional:

- `mediaType`
- `sizeBytes`
- `sha256`

## 21.3 Capability Record

Each capability record must include:

- `status`
- `coverage`
- `limitations`
- `lastVerifiedAt` when available.

The manifest must not claim a capability is verified unless tests support it.

## 21.4 Manifest Integrity

The manifest must not include its own hash.

If package hashes are generated, calculate them after the corresponding file content has been finalized.

---

# 22. Validation Contract

## 22.1 Validation Stages

### Stage 1 — File Structure

- Required files exist.
- JSON files parse.
- File paths are safe.
- No duplicate normalized paths exist.
- Manifest inventory matches actual files.

### Stage 2 — Schema Validation

Validate every structured file against its declared schema.

### Stage 3 — Entity Integrity

- IDs are unique.
- Required references resolve.
- Entity types are valid.
- Aliases resolve where required.
- Relationships resolve.
- Unsupported relationships are labeled accurately.

### Stage 4 — CSS Validation

- CSS parses.
- CSS names are valid.
- Duplicate custom properties are detected.
- Invalid values are reported.
- Required token references resolve.
- Component selectors resolve where required.

### Stage 5 — Reference Validation

- Reference files exist.
- Relative links resolve.
- Assets resolve.
- Reference IDs resolve.
- Entity IDs resolve.
- Reference types are valid.

### Stage 6 — Asset Validation

- Asset registry entries resolve.
- File types match declarations.
- Missing assets are reported.
- External assets are explicitly marked.
- Licensing status is not fabricated.

### Stage 7 — Coverage Validation

- Declared coverage matches actual extraction.
- Truncation limits are reported.
- Unresolved aliases are reported.
- Partial component extraction is not labeled complete.
- Unverified semantic mappings are not labeled confirmed.

### Stage 8 — ZIP Validation

- ZIP can be opened.
- All expected files are included.
- No path escapes the package root.
- ZIP inventory matches manifest inventory.
- The package is usable without access to the original Figma file where the exported content is expected to be portable.

## 22.2 Validation Finding

Each finding must include:

- `id`
- `severity`
- `code`
- `message`
- `filePaths`
- `entityIds`
- `evidenceIds`
- `suggestedAction`

Severity:

- `error`
- `warning`
- `info`

## 22.3 Overall Status

- `passed`: all required checks ran and no blocking errors exist.
- `warning`: the package is usable but has warnings or partial coverage.
- `failed`: blocking errors exist.
- `not_run`: validation has not been executed.

A package cannot be `passed` if a required validation stage was skipped.

## 22.4 Validator Regression

The current reported `lintPackage` / `validation.md` mismatch must be checked and corrected if still present.

The validator must read the actual generated validation artifact.

The exporter must generate that artifact before attempting to validate it, or the validator must validate an in-memory result before serialization.

Do not make the validator depend on a file that is never generated.

The authoritative full validation output is `metadata/validation.json`.

---

# 23. Figma Capability Contract

## 23.1 Capability Audit

Inspect the current plugin implementation and create a capability matrix for:

- Variables.
- Variable collections.
- Modes.
- Aliases.
- Styles.
- Typography.
- Components.
- Component sets.
- Variants.
- Component properties.
- Nested components.
- Instance overrides.
- Assets.
- Icons.
- Fonts.
- References.
- Validation.
- Provenance.

## 23.2 Evidence Required for Verified Status

A capability can be `implemented_verified` only if:

1. The code path exists.
2. The code path is reachable.
3. Relevant source data is available.
4. Representative fixtures exist.
5. Tests pass.
6. Output matches the contract.
7. Failure cases are covered.

## 23.3 Reported Existing-Code Findings

The previous audit reported these potential issues. Verify each against the current repository:

- Canonical component IDs may be generated from names.
- Canonical token IDs may be generated from names.
- Component extraction may only cover root-level data.
- Component Set extraction may inspect only the first child.
- Text extraction may be capped at four items.
- Variant extraction may be capped at thirty dimensions.
- Nested components may not be extracted recursively.
- Instance overrides may not be fully extracted.
- Semantic reference mapping may rely on component names.
- The validator may read `validation.md` without that file being generated.
- `manifest.json` may contain only a minimal entity structure.
- `metadata/decisions.json` may not be generated.
- `metadata/sources.json` may not be generated.
- `metadata/token-map.json` may not be generated.
- `references/index.json` may not be generated.

These are reported findings, not independently verified current facts.

## 23.4 Implementation Rule

For every confirmed issue:

1. Add a failing regression test.
2. Implement the correction.
3. Run the test.
4. Update capability status.
5. Update validation coverage.
6. Update the changelog or implementation record.

---

# 24. Offline Export and Packaging

## 24.1 Core Export

Core export must not require AI or external network access after the source data has been obtained.

## 24.2 ZIP Safety

Before packaging:

- Normalize all paths.
- Reject absolute paths.
- Reject `..` traversal.
- Detect duplicate normalized paths.
- Apply documented package size limits.
- Exclude secrets.
- Exclude temporary files.
- Include required metadata.
- Validate the file inventory.

## 24.3 Asset Policy

Assets may be:

- `embedded`
- `copied`
- `external`
- `unavailable`

The status must reflect what actually happened.

External assets must not be described as self-contained.

## 24.4 Fonts

If a font cannot be redistributed:

- Preserve available font metadata.
- Do not copy it illegally.
- Record the limitation.
- Use a documented fallback only when permitted.
- Do not claim visual fidelity equivalent to the original font.

---

# 25. Four-Step UI Contract

The primary user workflow remains four steps.

## Step 1 — Source

- Select source.
- Select pages or scope.
- Inspect available capabilities.
- Add context if supported.
- Show source limitations.

## Step 2 — References

- Select tokens.
- Select components.
- Select references.
- Review detected entities.
- Review dependencies.
- Review unresolved mappings.

## Step 3 — Build

- Normalize.
- Resolve relationships.
- Apply inclusion policy.
- Run optional AI assistance.
- Generate outputs.
- Validate package.
- Display real progress.

## Step 4 — Download

- Review manifest summary.
- Review validation results.
- Review limitations.
- Download validated package.
- Start another build.

Progress must be based on actual completed work.

Do not use a simulated timer or arbitrary progress value.

The interface must not enable a successful download state when a blocking validation error exists, unless an explicit diagnostic-export mode is offered and the output is labeled invalid or incomplete.

---

# 26. Implementation Plan

## Phase 0 — Baseline and Audit

1. Identify the current source files.
2. Identify the actual plugin version.
3. Run the existing tests.
4. Record the current export structure.
5. Verify the reported validator mismatch.
6. Verify the current ID-generation strategy.
7. Verify component extraction limits.
8. Verify generated manifest contents.
9. Record actual capabilities.
10. Do not refactor before a baseline has been captured.

Deliverable: `IMPLEMENTATION-BASELINE.md`.

## Phase 1 — Contracts

1. Create the schema directory.
2. Implement common definitions.
3. Implement manifest schema.
4. Implement token-map schema.
5. Implement component schema.
6. Implement decisions schema.
7. Implement rules schema.
8. Implement reference index schema.
9. Implement validation schema.
10. Implement sources, assets, icons, and context schemas.
11. Add valid and invalid fixtures.
12. Validate the schema files themselves.

Deliverable: all formal JSON Schemas and contract tests.

## Phase 2 — Canonical IDs and Provenance

1. Introduce canonical entity IDs.
2. Preserve source IDs.
3. Implement rename-stability tests.
4. Implement collision detection.
5. Add provenance fields.
6. Migrate name-based relationships.
7. Maintain a mapping from legacy IDs to canonical IDs where possible.
8. Test repeated exports.

Deliverable: stable canonical identity.

## Phase 3 — Token Pipeline

1. Normalize token types.
2. Preserve modes.
3. Preserve aliases.
4. Resolve supported aliases.
5. Detect alias cycles.
6. Normalize CSS names.
7. Detect collisions.
8. Generate `tokens.css`.
9. Generate `metadata/token-map.json`.
10. Validate all mappings.

Deliverable: deterministic token export.

## Phase 4 — Decisions and Rules

1. Implement `metadata/decisions.json`.
2. Implement `rules/index.json`.
3. Implement `rules/design-rules.json`.
4. Implement evidence records.
5. Implement approvals.
6. Implement conflicts.
7. Implement overrides.
8. Implement proposals.
9. Implement precedence handling.
10. Test that proposals do not silently become official rules or tokens.

Deliverable: auditable decision and rule system.

## Phase 5 — Component Pipeline

1. Implement the component schema.
2. Generate individual component files.
3. Generate `components/index.json`.
4. Implement CSS mapping.
5. Implement usage documentation.
6. Enumerate supported variants.
7. Traverse supported nested component relationships.
8. Extract supported properties.
9. Report unsupported overrides.
10. Generate component previews.
11. Test coverage reporting.

Deliverable: honest, structured component export.

## Phase 6 — Reference Pipeline

1. Implement `references/index.json`.
2. Introduce `referenceType`.
3. Separate source evidence from generated guides.
4. Generate token specimens.
5. Generate component previews.
6. Add semantic mappings where verified.
7. Validate asset paths.
8. Validate entity links.
9. Report fallback styles and limitations.

Deliverable: navigable, traceable references.

## Phase 7 — Validation and Packaging

1. Fix validator artifact mismatch.
2. Generate `metadata/validation.json`.
3. Implement cross-file validation.
4. Validate schemas.
5. Validate CSS.
6. Validate references.
7. Validate assets.
8. Validate capability claims.
9. Validate manifest inventory.
10. Validate ZIP contents.
11. Run the full regression suite.

Deliverable: reliable validation and packaging.

## Phase 8 — UI Integration

1. Connect the four-step interface to real operations.
2. Replace simulated progress with actual progress.
3. Display warnings and errors.
4. Display capability coverage.
5. Allow review of conflicts and proposals.
6. Gate successful export on validation.
7. Test retry and failure states.
8. Test large exports.

Deliverable: end-to-end working plugin.

---

# 27. Required Acceptance Tests

The following tests are release blockers where applicable.

## ID-001 — Rename Stability

Given a source component with a stable source identifier:

- Export the component.
- Rename the component without changing its source identity.
- Export again.

Expected:

- Canonical ID remains unchanged.
- Display name updates.
- Source identity remains traceable.

## ID-002 — Collision Safety

Given two entities that normalize to the same CSS name:

Expected:

- Collision is detected.
- Both tokens remain represented.
- CSS names are disambiguated deterministically.
- A validation warning is emitted.

## TOK-001 — Alias Resolution

Given a valid alias:

Expected:

- Alias target is preserved.
- Resolved value is correct.
- Token mapping is traceable.

## TOK-002 — Alias Cycle

Given a cyclic alias relationship:

Expected:

- Cycle is detected.
- Export does not hang.
- Invalid CSS is not emitted.
- Validation reports the cycle.

## TOK-003 — Proposed Token Isolation

Given an unapproved proposed token:

Expected:

- It does not silently enter official `tokens.css`.
- Proposal remains available in decision metadata.
- Validation and documentation reflect its proposed status.

## CMP-001 — Multiple Variants

Given a component set with multiple variants:

Expected:

- All supported variants are enumerated.
- Truncation is reported if a limit applies.
- Coverage is not falsely labeled complete.

## CMP-002 — Nested Components

Given nested components:

Expected:

- Supported nested relationships are exported.
- Unsupported relationships are reported.
- Canonical IDs are used for relationships.

## CMP-003 — Component CSS Mapping

Given a component with a confirmed CSS mapping:

Expected:

- `component.json` references the CSS file.
- `classNames` are declared.
- Selectors resolve.
- Preview uses the declared classes.

## REF-001 — Reference Types

Given source evidence and generated guides:

Expected:

- Each reference has the correct `referenceType`.
- The two categories remain distinguishable.
- Index paths resolve.

## DEC-001 — Conflict Preservation

Given two conflicting source values:

Expected:

- Both values remain traceable.
- A conflict record is created.
- Precedence is applied deterministically or user review is requested.
- The losing source value is not silently deleted.

## VAL-001 — Missing Required File

Given a package missing a required file:

Expected:

- Validation fails.
- The missing file is identified.
- Manifest inventory does not claim success.

## VAL-002 — Broken Reference

Given a reference pointing to a missing asset:

Expected:

- Validation reports the broken path.
- Package status is warning or failed according to severity.

## VAL-003 — Validator Artifact

Given a generated package:

Expected:

- `metadata/validation.json` exists.
- The validator reads or validates the actual generated result.
- Validation does not depend on a file that was never generated.

## PKG-001 — ZIP Integrity

Given a valid package:

Expected:

- ZIP opens.
- Required files exist.
- Manifest inventory matches ZIP contents.
- No unsafe path exists.
- All required schema checks pass.

## OFF-001 — AI Unavailable

Given AI is disabled or unavailable:

Expected:

- Deterministic extraction continues.
- Export and validation remain available.
- AI-dependent results are not fabricated.

## REP-001 — Reproducibility

Given identical source fixtures and configuration:

Expected:

- Stable IDs remain unchanged.
- Entity ordering is deterministic.
- Token mappings are stable.
- No unexplained entity identity changes occur.

---

# 28. Definition of Done

Implementation is ready for release only when:

- [ ] Canonical Model is used by all supported source adapters.
- [ ] Stable IDs are implemented and tested.
- [ ] Provenance is preserved.
- [ ] Token extraction and CSS export are deterministic.
- [ ] Token aliases and modes are preserved where supported.
- [ ] Derived tokens are separated from official source tokens.
- [ ] Component coverage reflects actual extraction.
- [ ] CSS mapping is represented explicitly.
- [ ] Rules and decisions have separate contracts.
- [ ] Evidence, approvals, conflicts, overrides, and proposals are represented.
- [ ] References have explicit types.
- [ ] Source evidence and generated guides are distinguishable.
- [ ] AI assistance is optional.
- [ ] Core export works without AI.
- [ ] Manifest uses independent version fields.
- [ ] Required JSON Schemas exist and validate.
- [ ] Cross-file validation exists.
- [ ] Validator output is generated and read correctly.
- [ ] Capability claims are evidence-backed.
- [ ] ZIP integrity tests pass.
- [ ] The four-step interface uses real processing state.
- [ ] All release-blocking acceptance tests pass.
- [ ] Known limitations are documented in the package.

---

# 29. Final Decisions Register

| ID | Decision | Required implementation |
|---|---|---|
| R-01 | Rules are first-class entities | `rules/` and rules schema |
| R-02 | Decisions are structured records | Decisions, evidence, approvals, conflicts, overrides, proposals |
| R-03 | Required file policy is explicit | Manifest inventory and structural validation |
| R-04 | Versions are independent | Package, schema, plugin, canonical model |
| R-05 | Statuses use separate namespaces | Shared status definitions |
| R-06 | References have explicit types | `referenceType` and separate evidence/guide locations |
| R-07 | Components declare CSS mappings | `css.file`, `css.classNames`, `css.status` |
| R-08 | AI is optional | Offline core and explicit provider contract |
| R-09 | Canonical model preserves provenance | Canonical entities and source references |
| R-10 | IDs are stable | Deterministic source-based IDs and collision handling |
| R-11 | Derived tokens are separated | Origin, derivation, approval, nearest-match policy |
| R-12 | Component coverage is explicit | Per-dimension coverage and honest limits |
| R-13 | Export is deterministic | Stable ordering and reproducibility tests |
| R-14 | Conflicts follow precedence rules | Explicit precedence, conflict records, safe resolution |

---

# 30. Final Engineering Instruction

Do not begin by rewriting the entire plugin.

First establish a baseline and verify the reported defects. Then implement the contract in dependency order.

The recommended first milestone is:

1. `IMPLEMENTATION-BASELINE.md`
2. Canonical ID strategy.
3. Common status definitions.
4. Manifest schema.
5. Decisions schema.
6. Token-map schema.
7. Validator regression tests.

After that, implement the token pipeline, then component extraction, references, packaging, and finally UI integration.

A feature is complete only when its contract, implementation, validation, and acceptance test agree.
