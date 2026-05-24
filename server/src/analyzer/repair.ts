export function repairJson(raw: string): string {
  let s = raw.trim();

  // Strip code fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // Trim to outermost { ... }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }

  // Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // Replace smart quotes
  s = s.replace(/[""]/g, '"').replace(/['']/g, "'");

  return s;
}
