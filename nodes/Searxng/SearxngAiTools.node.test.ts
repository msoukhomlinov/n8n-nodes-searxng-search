// nodes/Searxng/SearxngAiTools.node.test.ts

// Mock runtime.ts — replaces the n8n module-tree resolution with simple stubs.
// Tests only need the node class to instantiate; instanceof checks are not exercised here.
jest.mock('./ai-tools/runtime', () => {
  const z = require('zod') as typeof import('zod');
  return {
    RuntimeDynamicStructuredTool: class RuntimeDynamicStructuredTool {
      name: string;
      description: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema: any;
      func: unknown;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(fields: any) {
        this.name = fields.name as string;
        this.description = fields.description as string;
        this.schema = fields.schema;
        this.func = fields.func;
      }
    },
    runtimeZod: z,
  };
});

import { SearxngAiTools } from './SearxngAiTools.node';

describe('SearXNG Search AI tool node', () => {
  it('should expose AI tool metadata for the add tool picker', () => {
    const node = new SearxngAiTools();

    expect(node.description.name).toBe('searxngAiTools');
    expect(node.description.displayName).toBe('SearXNG Search AI Tool');
    expect(node.description.usableAsTool).toBeUndefined();
    expect(node.description.outputs).toEqual([{ type: 'ai_tool', displayName: 'Tool' }]);
  });
});
