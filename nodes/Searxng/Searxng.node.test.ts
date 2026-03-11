import { Searxng } from './Searxng.node';

describe('SearXNG Search node', () => {
  it('should have correct node type description', () => {
    const node = new Searxng();
    expect(node.description.name).toBe('searxng');
    expect(node.description.displayName).toBe('SearXNG Search');
    expect(node.description.description).toBe('Search the web with SearXNG');
    expect(node.description.credentials).toHaveLength(1);
  });

  it('should have search operation defined', () => {
    const node = new Searxng();
    expect(node.description.properties).toBeDefined();
    expect(node.description.properties.length).toBeGreaterThan(0);
  });
});
