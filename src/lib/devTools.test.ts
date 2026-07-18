import { describe, expect, it } from 'vitest';
import { isDevToolsEnabled } from './devTools';

describe('isDevToolsEnabled', () => {
  it('requires devtools=1 in the query string', () => {
    expect(isDevToolsEnabled('')).toBe(false);
    expect(isDevToolsEnabled('?foo=bar')).toBe(false);
    expect(isDevToolsEnabled('?devtools=0')).toBe(false);
    expect(isDevToolsEnabled('?devtools=1')).toBe(import.meta.env.DEV);
  });
});
