# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
