import { describe, it, expect } from 'vitest';
import { repairJson } from '../src/analyzer/repair.js';

describe('promptRepair', () => {
  it('strips json code fences and parses', () => {
    const raw = '```json\n{"foo": "bar"}\n```';
    const repaired = repairJson(raw);
    expect(JSON.parse(repaired)).toEqual({ foo: 'bar' });
  });

  it('trims to outermost braces when there is trailing prose', () => {
    const raw = 'Here is your analysis:\n{"foo": "bar"}\n\nHope that helps!';
    const repaired = repairJson(raw);
    expect(JSON.parse(repaired)).toEqual({ foo: 'bar' });
  });

  it('removes trailing commas', () => {
    const raw = '{"foo": "bar",}';
    const repaired = repairJson(raw);
    expect(JSON.parse(repaired)).toEqual({ foo: 'bar' });
  });
});
