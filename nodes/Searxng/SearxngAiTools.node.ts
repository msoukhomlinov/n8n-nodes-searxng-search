// nodes/Searxng/SearxngAiTools.node.ts
import { NodeOperationError } from 'n8n-workflow';
import type {
  NodeConnectionType,
  IDataObject,
  IExecuteFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  ISupplyDataFunctions,
  SupplyData,
} from 'n8n-workflow';
import { CREDENTIAL_NAME } from './constants';
import { getRuntimeSchemaBuilders, SEARXNG_OPERATIONS } from './ai-tools/schema-generator';
import type { SearxngOperation } from './ai-tools/schema-generator';
import { TOOL_NAME, TOOL_DESCRIPTION } from './ai-tools/description-builders';
import { executeSearchTool } from './ai-tools/tool-executor';
import { wrapError, ERROR_TYPES } from './ai-tools/error-formatter';
import { RuntimeDynamicStructuredTool, runtimeZod } from './ai-tools/runtime';

// Resolve runtime schemas once at module load.
// getRuntimeSchemaBuilders converts compile-time Zod schemas to runtime-Zod
// instances so schema instanceof ZodType passes in n8n's MCP Trigger (queue mode).
const runtimeSchemas = getRuntimeSchemaBuilders(runtimeZod);

export class SearxngAiTools implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'SearXNG Search AI Tool',
    name: 'searxngAiTools',
    icon: 'file:searxng.svg',
    group: ['output'],
    version: 1,
    description: 'Expose SearXNG web search as a structured AI tool for use with the AI Agent node',
    defaults: { name: 'SearXNG Search AI Tool' },
    inputs: [],
    outputs: [{ type: 'ai_tool' as NodeConnectionType, displayName: 'Tool' }],
    credentials: [
      {
        name: CREDENTIAL_NAME,
        required: true,
      },
    ],
    codex: {
      categories: ['AI', 'Search'],
      alias: ['searxng', 'search', 'web-search', 'ai-tool'],
      subcategories: {
        ai: ['Tools'],
      },
    },
    properties: [
      {
        displayName: 'Max Results',
        name: 'maxResults',
        type: 'number',
        default: 10,
        typeOptions: { minValue: 1, maxValue: 50 },
        description: 'Maximum number of search results to return to the AI agent (1–50)',
      },
    ],
  };

  async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
    const maxResults = this.getNodeParameter('maxResults', itemIndex, 10) as number;

    if (maxResults < 1 || maxResults > 50) {
      throw new NodeOperationError(this.getNode(), 'Max Results must be between 1 and 50');
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const supplyDataContext = this;

    // RuntimeDynamicStructuredTool resolves DynamicStructuredTool from n8n's module
    // tree so instanceof checks pass in both execution paths:
    //   - AI Agent (pre-2.14): supplyData() → func() called
    //   - AI Agent (2.14+): supplyData() → extract definition → execute() called
    //   - MCP Trigger (including queue mode): supplyData() → tool.invoke(args) → func() called
    const tool = new RuntimeDynamicStructuredTool({
      name: TOOL_NAME,
      description: TOOL_DESCRIPTION,
      // Runtime-converted Zod schema — ensures schema.parseAsync() in MCP Trigger's
      // queue worker uses n8n's Zod instance, not this package's bundled copy.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema: runtimeSchemas.getSearchSchema() as any,
      // MCP tool annotations — search is read-only and idempotent
      annotations: {
        title: 'SearXNG Web Search',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      // func() is called by MCP Trigger (direct and queue mode)
      // and AI Agent (pre-2.14). AI Agent 2.14+ dispatches via execute().
      func: async (params: Record<string, unknown>) => {
        const operation = params.operation as SearxngOperation | undefined;

        // Validate operation
        if (!operation || !SEARXNG_OPERATIONS.includes(operation)) {
          return JSON.stringify(wrapError(
            'search', String(operation ?? 'unknown'), ERROR_TYPES.INVALID_OPERATION,
            `Unknown operation: ${String(operation)}. Valid: ${SEARXNG_OPERATIONS.join(', ')}`,
            `Call this tool with operation set to one of: ${SEARXNG_OPERATIONS.join(', ')}.`,
          ));
        }

        return executeSearchTool(supplyDataContext, params, maxResults);
      },
    });

    // Return bare tool — no Toolkit wrapper needed.
    // AI Agent and MCP Trigger both consume a single DynamicStructuredTool directly.
    return { response: tool };
  }

  /**
   * execute() is called by n8n's AI Agent for real tool invocations and "Test step" clicks.
   * MCP Trigger does NOT use this path — it calls func() on the tool directly.
   *
   * n8n 2.14+: tool params arrive in item.json with 'operation' but WITHOUT 'tool'.
   * Older n8n: item.json contains 'tool' field.
   * Test step: neither 'operation' nor 'tool' is present.
   */
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const firstItem = items[0]?.json ?? {};
    const requestedOp = firstItem['operation'] as string | undefined;
    const toolField = firstItem['tool'] as string | undefined;

    // No operation AND no tool field → "Test step" click in editor
    if (!requestedOp && !toolField) {
      return [
        [
          {
            json: {
              message: 'This is an AI Tool node. Connect it to an AI Agent node to use it.',
              tool: TOOL_NAME,
              operations: [...SEARXNG_OPERATIONS],
            } as IDataObject,
            pairedItem: { item: 0 },
          },
        ],
      ];
    }

    // If tool field is present (older n8n) and doesn't match, reject
    if (toolField && toolField !== TOOL_NAME) {
      return [
        [
          {
            json: wrapError(
              'search', 'search', ERROR_TYPES.SEARCH_ERROR,
              `Unknown tool: ${toolField}`,
              `Use the tool name "${TOOL_NAME}" for search requests.`,
            ) as unknown as IDataObject,
            pairedItem: { item: 0 },
          },
        ],
      ];
    }

    const maxResults = this.getNodeParameter('maxResults', 0, 10) as number;
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const rawParams = items[i].json as Record<string, unknown>;
      const itemOp = rawParams['operation'] as string | undefined;

      // Validate operation if present (n8n 2.14+ always sends it)
      if (itemOp && !SEARXNG_OPERATIONS.includes(itemOp as SearxngOperation)) {
        const errorEnvelope = wrapError(
          'search', String(itemOp), ERROR_TYPES.INVALID_OPERATION,
          `Unknown operation: ${itemOp}. Valid: ${SEARXNG_OPERATIONS.join(', ')}`,
          `Call this tool with operation set to one of: ${SEARXNG_OPERATIONS.join(', ')}.`,
        );
        returnData.push({
          json: errorEnvelope as unknown as IDataObject,
          pairedItem: { item: i },
        });
        continue;
      }

      try {
        // Safe cast: IExecuteFunctions has all methods ISupplyDataFunctions requires.
        const resultStr = await executeSearchTool(
          this as unknown as ISupplyDataFunctions,
          rawParams,
          maxResults,
        );
        returnData.push({
          json: JSON.parse(resultStr) as IDataObject,
          pairedItem: { item: i },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          const msg = error instanceof Error ? error.message : String(error);
          returnData.push({ json: { error: msg } as IDataObject, pairedItem: { item: i } });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
