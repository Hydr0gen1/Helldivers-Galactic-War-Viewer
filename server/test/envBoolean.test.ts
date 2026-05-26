import { describe, expect, it } from 'vitest';
import { envBoolean } from '../src/config/envBoolean.js';

describe('envBoolean', () => {
  it('parses true/false strings explicitly', () => {
    expect(envBoolean.parse('true')).toBe(true);
    expect(envBoolean.parse('false')).toBe(false);
    expect(envBoolean.parse(' TRUE ')).toBe(true);
    expect(envBoolean.parse(' FALSE ')).toBe(false);
  });

  it('rejects non-boolean strings', () => {
    expect(() => envBoolean.parse('nope')).toThrow();
  });
});
