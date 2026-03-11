export const CREDENTIAL_NAME = 'searxngApi';

export const TIME_RANGES = [
  { name: 'Any Time (No Filter)', value: 'all' },
  { name: 'Day', value: 'day' },
  { name: 'Month', value: 'month' },
  { name: 'Year', value: 'year' },
] as const;

export const AUTOCOMPLETE_OPTIONS = [
  { name: 'None', value: '' },
  { name: 'DBpedia', value: 'dbpedia' },
  { name: 'DuckDuckGo', value: 'duckduckgo' },
  { name: 'Google', value: 'google' },
  { name: 'Mwmbl', value: 'mwmbl' },
  { name: 'Qwant', value: 'qwant' },
  { name: 'Startpage', value: 'startpage' },
  { name: 'Swisscows', value: 'swisscows' },
  { name: 'Wikipedia', value: 'wikipedia' },
] as const;

export const SAFE_SEARCH_LEVELS = [
  { name: 'Off', value: '0' },
  { name: 'Moderate', value: '1' },
  { name: 'Strict', value: '2' },
] as const;

export const FORMATS = [
  { name: 'CSV', value: 'csv' },
  { name: 'HTML', value: 'html' },
  { name: 'JSON', value: 'json' },
  { name: 'RSS', value: 'rss' },
] as const;

export const ACCEPT_HEADER_BY_FORMAT: Record<string, string> = {
  json: 'application/json',
  csv: 'text/csv',
  rss: 'application/rss+xml, application/xml',
  html: 'text/html',
};
