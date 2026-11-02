import { describe, expect, it } from 'vitest';
describe('basic metrics formatting', () => {
  it('formats a rate', () => expect(`${(1/4*100).toFixed(2)}%`).toBe('25.00%'));
});
