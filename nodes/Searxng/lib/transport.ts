import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { CREDENTIAL_NAME, ACCEPT_HEADER_BY_FORMAT } from '../constants';

export async function searxngRequest(
  context: IExecuteFunctions,
  queryParameters: Record<string, string | number | boolean>,
  format: string,
): Promise<any> {
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

export async function searxngConfigRequest(context: ILoadOptionsFunctions): Promise<any> {
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
