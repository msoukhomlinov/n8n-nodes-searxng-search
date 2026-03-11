import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  IDataObject,
} from 'n8n-workflow';
import { CREDENTIAL_NAME } from './constants';
import { searchOperations, searchFields } from './description/search.operation';
import { normalizeCommaSeparatedValues, normalizeSingleValue } from './lib/helpers';
import {
  searxngRequest,
  searxngConfigRequest,
  type SearxngSearchResponse,
  type SearxngSearchResult,
} from './lib/transport';

export class Searxng implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'SearXNG Search',
    name: 'searxng',
    icon: 'file:searxng.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Search the web with SearXNG',
    defaults: {
      name: 'SearXNG Search',
    },
    inputs: [
      {
        type: NodeConnectionType.Main,
      },
    ],
    outputs: [
      {
        type: NodeConnectionType.Main,
      },
    ],
    usableAsTool: true,
    credentials: [
      {
        name: CREDENTIAL_NAME,
        required: true,
      },
    ],
    codex: {
      categories: ['Search', 'Web'],
      alias: ['web-search', 'searxng', 'search-engine'],
      subcategories: {
        search: ['Web Search', 'Metasearch'],
      },
    },
    properties: [...searchOperations, ...searchFields],
  };

  methods = {
    loadOptions: {
      async getCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const config = await searxngConfigRequest(this);
        const categories: string[] = config.categories ?? [];
        return categories
          .map((c) => ({ name: c.charAt(0).toUpperCase() + c.slice(1), value: c }))
          .sort((a, b) => a.name.localeCompare(b.name));
      },

      async getLanguages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const config = await searxngConfigRequest(this);
        const locales: Record<string, string> = config.locales ?? {};
        const options: INodePropertyOptions[] = Object.entries(locales)
          .map(([value, name]) => ({ name: name as string, value }))
          .sort((a, b) => a.name.localeCompare(b.name));
        return [{ name: 'All Languages', value: 'all' }, ...options];
      },

      async getEngines(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const config = await searxngConfigRequest(this);
        const engines: Array<{ name: string; categories?: string[] }> = config.engines ?? [];
        return engines
          .map((e) => ({
            name: e.name,
            value: e.name,
            description: (e.categories ?? []).join(', '),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      },

      async getPlugins(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const config = await searxngConfigRequest(this);
        const plugins: Array<{ name: string }> = config.plugins ?? [];
        return plugins
          .map((p) => ({ name: p.name, value: p.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    try {
      for (let i = 0; i < items.length; i++) {
        let query: string;
        const item = items[i].json as IDataObject;

        if (item) {
          if (typeof item.query === 'string') {
            query = item.query;
          } else if (typeof item.input === 'string') {
            query = item.input;
          } else if (typeof item.prompt === 'string') {
            query = item.prompt;
          } else {
            query = this.getNodeParameter('query', i) as string;
          }
        } else {
          query = this.getNodeParameter('query', i) as string;
        }

        const categories = this.getNodeParameter('categories', i) as string[];
        const customCategories = this.getNodeParameter('customCategories', i) as string;
        const singleResponse = this.getNodeParameter('singleResponse', i) as boolean;
        const additionalFields = this.getNodeParameter('additionalFields', i) as {
          language?: string;
          time_range?: string;
          safesearch?: string;
          pageno?: number;
          format?: string;
          engines?: string[];
          enabled_plugins?: string[];
          disabled_plugins?: string[];
          image_proxy?: boolean;
          autocomplete?: string;
        };

        const format = additionalFields.format || 'json';
        const normalizedCategories = normalizeCommaSeparatedValues([
          ...categories,
          ...(customCategories ? customCategories.split(',') : []),
        ]);

        const queryParameters: Record<string, string | number | boolean> = {
          q: query,
          format,
        };

        if (normalizedCategories) {
          queryParameters.categories = normalizedCategories;
        }

        const normalizedLanguage = normalizeSingleValue(additionalFields.language);
        if (normalizedLanguage && normalizedLanguage !== 'all') {
          queryParameters.language = normalizedLanguage;
        }
        if (additionalFields.time_range && additionalFields.time_range !== 'all') {
          queryParameters.time_range = additionalFields.time_range;
        }
        if (additionalFields.safesearch) {
          queryParameters.safesearch = additionalFields.safesearch;
        }
        if (additionalFields.pageno) {
          queryParameters.pageno = additionalFields.pageno;
        }
        const normalizedAutocomplete = normalizeSingleValue(additionalFields.autocomplete);
        if (normalizedAutocomplete) {
          queryParameters.autocomplete = normalizedAutocomplete;
        }

        const engines = normalizeCommaSeparatedValues(additionalFields.engines);
        if (engines) {
          queryParameters.engines = engines;
        }

        const enabledPlugins = normalizeCommaSeparatedValues(additionalFields.enabled_plugins);
        if (enabledPlugins) {
          queryParameters.enabled_plugins = enabledPlugins;
        }

        const disabledPlugins = normalizeCommaSeparatedValues(additionalFields.disabled_plugins);
        if (disabledPlugins) {
          queryParameters.disabled_plugins = disabledPlugins;
        }

        if (Object.prototype.hasOwnProperty.call(additionalFields, 'image_proxy')) {
          queryParameters.image_proxy = additionalFields.image_proxy as boolean;
        }

        try {
          const response = await searxngRequest(this, queryParameters, format);

          if (format === 'json') {
            const jsonResponse = response as SearxngSearchResponse;
            const results = jsonResponse.results ?? [];
            const formattedResults = Array.isArray(results)
              ? results.map((result: SearxngSearchResult) => ({
                  title: result.title,
                  url: result.url,
                  content: result.content,
                  snippet: result.snippet || result.content,
                }))
              : [];

            if (singleResponse && formattedResults.length > 0) {
              returnData.push({
                json: {
                  success: true,
                  query,
                  answer: formattedResults[0].content || formattedResults[0].snippet,
                },
              });
            } else {
              returnData.push({
                json: {
                  success: true,
                  query,
                  results: formattedResults,
                  metadata: {
                    format,
                    total: jsonResponse.number_of_results,
                    time: jsonResponse.search_time,
                    engine: jsonResponse.engine,
                  },
                  raw: jsonResponse,
                },
              });
            }
          } else {
            returnData.push({
              json: {
                success: true,
                query,
                metadata: {
                  format,
                },
                rawResponse: response,
              },
            });
          }
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({
              json: {
                success: false,
                error: error.message,
                query,
              },
            });
            continue;
          }
          throw error;
        }
      }

      return [returnData];
    } catch (error) {
      if (this.continueOnFail()) {
        return [returnData];
      }
      throw error;
    }
  }
}
