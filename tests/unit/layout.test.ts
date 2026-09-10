import { describe, expect, it } from 'vitest';
import { resolveLayout, urlFlag } from '../../src/config/layout';

describe('resolveLayout', () => {
  it('parametr URL wygrywa z wartością domyślną z builda', () => {
    expect(resolveLayout('?layout=stack', 'side')).toBe('stack');
    expect(resolveLayout('?layout=side', 'stack')).toBe('side');
  });

  it('bez parametru używa VITE_LAYOUT, a bez niego side (decyzja Arka)', () => {
    expect(resolveLayout('', 'stack')).toBe('stack');
    expect(resolveLayout('', undefined)).toBe('side');
    expect(resolveLayout('?layout=cokolwiek', undefined)).toBe('side');
  });

  it('flagi URL', () => {
    expect(urlFlag('?debug=1', 'debug')).toBe(true);
    expect(urlFlag('?debug=true', 'debug')).toBe(true);
    expect(urlFlag('?debug=0', 'debug')).toBe(false);
    expect(urlFlag('', 'debug')).toBe(false);
  });
});
