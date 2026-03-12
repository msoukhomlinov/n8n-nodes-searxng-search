// nodes/Searxng/ai-tools/runtime.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: { (id: string): any; resolve(id: string, options?: any): string };

import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { z as ZodNamespace } from 'zod';

type DynamicStructuredToolCtor = new (fields: {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  func: (params: Record<string, unknown>) => Promise<string>;
}) => DynamicStructuredTool;

export type RuntimeZod = typeof ZodNamespace;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRuntimeRequire(): any {
  // Anchor: @langchain/classic/agents is always in n8n's dependency tree.
  // NOTE: if n8n drops @langchain/classic in a future version, update this
  // anchor to another package in n8n's tree that depends on @langchain/core.
  try {
    const classicAgentsPath = require.resolve('@langchain/classic/agents') as string;
    const { createRequire } = require('module') as {
      createRequire: (filename: string) => NodeRequire;
    };
    return createRequire(classicAgentsPath);
  } catch {
    // @langchain/classic not found — fall back to local require.
    // In this state, instanceof checks may fail across module boundaries (dev/CI environments).
    // In production n8n this should not happen; if it does, the fallback still allows the
    // node to function but MCP Trigger queue mode may silently drop the tool.
    console.warn(
      '[SearxngAiTools] @langchain/classic/agents not found — falling back to local require. ' +
        'instanceof checks may fail in MCP Trigger queue mode.',
    );
    return require;
  }
}

const runtimeRequire = getRuntimeRequire();

// Wrap module-level resolutions so a missing package produces a clear error at
// execution time (via NodeOperationError in supplyData) rather than a cryptic
// module-load crash that prevents node registration entirely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _RuntimeDynamicStructuredTool: DynamicStructuredToolCtor | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _runtimeZod: RuntimeZod | undefined;

try {
  const coreTools = runtimeRequire('@langchain/core/tools') as Record<string, unknown>;
  _RuntimeDynamicStructuredTool = coreTools['DynamicStructuredTool'] as DynamicStructuredToolCtor;
} catch (e) {
  console.warn('[SearxngAiTools] Failed to resolve @langchain/core/tools from runtime require:', e);
}

try {
  _runtimeZod = runtimeRequire('zod') as RuntimeZod;
} catch (e) {
  console.warn('[SearxngAiTools] Failed to resolve zod from runtime require:', e);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RuntimeDynamicStructuredTool: DynamicStructuredToolCtor = new Proxy(
  {} as DynamicStructuredToolCtor,
  {
    construct(_target, args) {
      if (!_RuntimeDynamicStructuredTool) {
        throw new Error(
          'RuntimeDynamicStructuredTool: @langchain/core/tools could not be resolved from n8n\'s module tree. ' +
            'Ensure @langchain/core is installed in the n8n environment.',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (_RuntimeDynamicStructuredTool as any)(...args) as object;
    },
    get(_target, prop) {
      if (_RuntimeDynamicStructuredTool) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (_RuntimeDynamicStructuredTool as any)[prop];
      }
      return undefined;
    },
  },
) as DynamicStructuredToolCtor;

export const runtimeZod: RuntimeZod = new Proxy({} as RuntimeZod, {
  get(_target, prop) {
    if (!_runtimeZod) {
      throw new Error(
        `runtimeZod: zod could not be resolved from n8n's module tree (accessing .${String(prop)}). ` +
          'Ensure zod is installed in the n8n environment.',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_runtimeZod as any)[prop];
  },
});
