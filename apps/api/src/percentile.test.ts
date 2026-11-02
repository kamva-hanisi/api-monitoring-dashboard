import { describe, expect, it } from 'vitest';
import { percentile } from './percentile.js';
describe('percentile', () => {
  it('returns zero for no requests', () => expect(percentile([], .95)).toBe(0));
  it('calculates nearest-rank p95', () => expect(percentile([10,20,30,40,50,60,70,80,90,100],.95)).toBe(100));
});
