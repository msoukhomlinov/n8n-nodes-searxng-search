# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.7.2 (2026-04-02)

### Changed

- **Unified operation enum** — Schema now includes a required `operation` field (`z.enum(['search'])`) following the MCP list-operations pattern. Establishes the convention for future multi-operation expansion.
- **n8n 2.14.x execute() compatibility** — `execute()` now detects tool calls via `item.json.operation` (n8n 2.14+) OR `item.json.tool` (older n8n). Previously only checked `tool`, causing 2.14+ tool calls to be misclassified as "Test step" clicks.
- **Operation validation** — Both `func()` and `execute()` validate the `operation` field against `SEARXNG_OPERATIONS` and return `INVALID_OPERATION` error envelope for unknown operations.
- **MCP tool annotations** — Added `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` annotations to the tool definition.
- **Tool description** — Updated to list operations explicitly and document the `operation` field requirement.

## 0.7.1 (2026-04-01)

### Fixed

- **`runtime.ts` Proxy target** — Changed `RuntimeDynamicStructuredTool` Proxy target from `{}` to `function () {}`. Per ECMAScript spec §10.5.13, a Proxy only has `[[Construct]]` if its target does — plain objects lack it, causing `TypeError: RuntimeDynamicStructuredTool is not a constructor` before the `construct` trap fires. Reproduced on n8n 2.14.2.

## 0.7.0 (2026-04-01)

### Changed

- **Structured response envelope format** — All tool responses (success and error) now use a versioned envelope: `{ schemaVersion: "1", success, resource, operation, result?, errorType?, message?, nextAction?, context? }`. Replaces the previous ad-hoc `{ success, query, results, total_available }` success format and `{ success, error, error_type, suggestion }` error format.
- **`error-formatter.ts` rewritten** — Introduced `SuccessEnvelope` / `ErrorEnvelope` interfaces, `wrapSuccess()` / `wrapError()` factory functions, typed `ERROR_TYPES` constant, and `MISSING_QUERY` error type. `formatToolError()` now delegates to `wrapError()` internally.
- **`tool-executor.ts` uses envelope factories** — Success path returns `wrapSuccess()` with `{ items, count, totalAvailable, query }` payload. Missing-query error uses `wrapError()` with `MISSING_QUERY` type instead of generic `formatToolError()`.
- **Tool description includes response schema** — `TOOL_DESCRIPTION` now documents the envelope format so LLMs can parse responses without guessing.
- **Unknown-tool error in `execute()` path** — `SearxngAiTools.node.ts` now returns a structured `wrapError()` envelope instead of a bare `{ error }` object when the AI Agent dispatches an unrecognized tool name.

### Improved

- **`runtime.ts` multi-anchor resolution** — `getRuntimeRequire()` now iterates over multiple anchor candidates (`@langchain/classic/agents`, `langchain/agents`) instead of trying a single anchor with a silent fallback to local `require`. When all anchors fail, returns `null` with a diagnostic string that is included in Proxy error messages for debugging. No more silent fallback to local `require`.
- **Proxy error diagnostics** — `RuntimeDynamicStructuredTool` and `runtimeZod` Proxy error messages now include per-candidate failure details when the runtime anchor is missing.

### Added

- **`error-formatter.test.ts`** — Unit tests for `ERROR_TYPES`, `wrapSuccess()`, `wrapError()`, and `formatToolError()` covering all error classifications, context handling, and non-Error inputs.

### Refactored

- Streamlined `require` declaration in `runtime.ts` to a single `declare const` statement.
- Added `// falls through` comment in `schema-generator.ts` for the v4→v3 case fallthrough.

## 0.6.0 (2026-03-13)

### Fixed

- **MCP Trigger queue mode compatibility** — `SearxngAiTools` now works correctly in both AI Agent and MCP Trigger (including queue mode) execution paths.
- **`instanceof` checks across module boundaries** — Added `runtime.ts` that resolves `DynamicStructuredTool` and `zod` from n8n's own module tree via `createRequire` (anchored to `@langchain/classic/agents`), so `instanceof` checks pass when n8n's bundled copies differ from this package's copies.
- **MCP Trigger schema validation** — Compile-time Zod schemas are now converted to runtime Zod instances at module load using `getRuntimeSchemaBuilders`. This ensures `schema.parseAsync()` in MCP Trigger's queue worker uses n8n's Zod instance, not this package's bundled copy. The converter handles both Zod v3 and v4 internal structures.
- **`operation` field leaking into API requests** — Added `'operation'` to `N8N_METADATA_FIELDS` in `tool-executor.ts` so n8n's unified tool routing field is stripped before parameters reach the SearXNG API.
- **`SearxngToolkit` wrapper removed** — `supplyData()` now returns a bare `DynamicStructuredTool` directly (`{ response: tool }`). The toolkit wrapper was causing silent drops in MCP Trigger queue mode and is no longer required by n8n's AI Agent.
- **`runtime.ts` load failure hardening** — Module-level resolution failures now produce clear error messages at execution time rather than a cryptic crash at node registration. A `console.warn` fires when the `@langchain/classic` anchor is absent.

### Changed

- `DynamicStructuredTool` is no longer a value import in `SearxngAiTools.node.ts` — only `import type` is used; the live class comes from `runtime.ts`.

## 0.5.0 (2026-03-11)

### Changed

- Renamed the dedicated node to **SearXNG Search AI Tool** for clearer AI-specific identification in the tool picker.
- Removed the redundant `usableAsTool` flag from the dedicated AI tool node to avoid duplicate tool-style listings.

## 0.4.0 (2026-03-11)

### Changed

- Renamed the main node UI and docs consistently to **SearXNG Search** while keeping internal node and credential identifiers unchanged for compatibility.

## 0.3.0 (2026-03-10)

Initial forked version.

### Features (continued)

- **SearXNG Search Tool node** (`SearxngAiTools`): dedicated AI Tools node exposing SearXNG web search as a structured LangChain tool for the n8n AI Agent. Supports `query`, `categories`, `language`, `time_range`, `safesearch`, `pageno`, and `engines` parameters via a Zod schema. Configurable `maxResults` (1–50, default 10). Returns structured JSON `{ success, query, results, total_available }`. All errors returned as structured JSON with `error_type` and `suggestion` — never thrown — so the agent can self-correct. Implements n8n toolkit compatibility probe (`n8n-core` StructuredToolkit → `@langchain/classic` Toolkit fallback).

### Features

- **Dynamic option loaders**: Categories, Engines, Language, Enabled Plugins, and Disabled Plugins now populate dynamically from the connected SearXNG instance via `/config` endpoint
- **Autocomplete dropdown**: Replaced free-text autocomplete field with a fixed dropdown of documented backends (DBpedia, DuckDuckGo, Google, Mwmbl, Qwant, Startpage, Swisscows, Wikipedia)

### Bug Fixes

- `time_range`: sentinel value `'all'` is no longer sent to the API; only documented values (`day`, `month`, `year`) are forwarded
- `language`: sentinel value `'all'` is no longer sent to the API

### Breaking Changes

- `theme` field removed — only affects HTML rendering pipeline, not search results
- `time_range` option `'week'` removed — undocumented in SearXNG API
- `engines`, `enabled_plugins`, `disabled_plugins` changed from comma-separated strings to multi-select dropdowns
