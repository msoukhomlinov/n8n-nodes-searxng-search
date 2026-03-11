/**
 * Trims and deduplicates comma-separated or array values.
 * Returns undefined if the result would be empty.
 */
export function normalizeCommaSeparatedValues(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  const values = Array.isArray(value) ? value : value.split(',');
  const normalized = values.map((v) => `${v}`.trim()).filter((v) => v.length > 0);
  return normalized.length > 0 ? normalized.join(',') : undefined;
}

/**
 * Trims a single string value.
 * Returns undefined if the result would be empty.
 */
export function normalizeSingleValue(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}
