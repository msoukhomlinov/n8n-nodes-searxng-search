export interface StructuredToolError {
  success: false;
  error: string;
  error_type: string;
  suggestion: string;
  query?: string;
}

export function formatToolError(error: unknown, query?: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  let error_type: string;
  let suggestion: string;

  if (lower.includes('401') || lower.includes('forbidden') || lower.includes('unauthorized')) {
    error_type = 'authentication';
    suggestion = 'Check your SearXNG API credentials and ensure the API key is correct.';
  } else if (lower.includes('econnrefused') || lower.includes('network') || lower.includes('enotfound')) {
    error_type = 'network';
    suggestion = 'Check that your SearXNG instance is reachable at the configured URL.';
  } else if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    error_type = 'rate_limit';
    suggestion = 'Too many requests — wait a moment and retry.';
  } else if (lower.includes('404') || lower.includes('not found')) {
    error_type = 'not_found';
    suggestion = 'The SearXNG endpoint was not found. Verify the API URL in credentials.';
  } else {
    error_type = 'search_error';
    suggestion = 'Verify the query and parameters, then retry.';
  }

  return JSON.stringify({
    success: false,
    error: message,
    error_type,
    suggestion,
    ...(query !== undefined ? { query } : {}),
  } as StructuredToolError);
}
