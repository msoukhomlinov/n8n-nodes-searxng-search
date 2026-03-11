import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { CREDENTIAL_NAME, ACCEPT_HEADER_BY_FORMAT } from '../constants';

export interface SearxngSearchResult {
  title?: string;
  url?: string;
  content?: string;
  snippet?: string;
  [key: string]: unknown;
}

export interface SearxngSearchResponse {
  results?: SearxngSearchResult[];
  number_of_results?: number;
  search_time?: number;
  engine?: string;
  [key: string]: unknown;
}

export interface SearxngConfigResponse {
  categories?: string[];
  locales?: Record<string, string>;
  engines?: Array<{ name: string; categories?: string[] }>;
  plugins?: Array<{ name: string }>;
  [key: string]: unknown;
}

export async function searxngRequest(
  context: IExecuteFunctions,
  queryParameters: Record<string, string | number | boolean>,
  format: string,
): Promise<SearxngSearchResponse | string> {
  const credentials = await context.getCredentials(CREDENTIAL_NAME);
  if (!credentials) {
    throw new NodeOperationError(context.getNode(), 'No credentials got returned!');
  }
  return context.helpers.httpRequest({
    method: 'GET' as const,
    url: `${credentials.apiUrl}/search`,
    qs: queryParameters,
    headers: {
      ...(ACCEPT_HEADER_BY_FORMAT[format] ? { Accept: ACCEPT_HEADER_BY_FORMAT[format] } : {}),
      Authorization: `Bearer ${credentials.apiKey}`,
    },
  });
}

export async function searxngConfigRequest(context: ILoadOptionsFunctions): Promise<SearxngConfigResponse> {
  const credentials = await context.getCredentials(CREDENTIAL_NAME);
  return context.helpers.httpRequest({
    method: 'GET' as const,
    url: `${credentials.apiUrl}/config`,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${credentials.apiKey}`,
    },
  });
}
