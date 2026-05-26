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

export function extractFirstJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      continue;
    }

    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, i + 1);
      }
    }
  }

  return null;
}
