import { SearxngApi } from './SearxngApi.credentials';

describe('SearXNG API credentials', () => {
  it('should use the renamed credential display label', () => {
    const credentials = new SearxngApi();

    expect(credentials.name).toBe('searxngApi');
    expect(credentials.displayName).toBe('SearXNG API');
  });
});
