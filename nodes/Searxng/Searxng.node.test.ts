import { Searxng } from './Searxng.node';

describe('Searxng node', () => {
  it('should have correct node type description', () => {
    const node = new Searxng();
    expect(node.description.name).toBe('searxng');
    expect(node.description.displayName).toBe('Searxng');
    expect(node.description.credentials).toHaveLength(1);
  });

  it('should have search operation defined', () => {
    const node = new Searxng();
    expect(node.description.properties).toBeDefined();
    expect(node.description.properties.length).toBeGreaterThan(0);
  });
});
