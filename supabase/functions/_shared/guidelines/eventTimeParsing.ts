/**
 * Parse documented assessment/event times from clinical input.
 * Avoids false positives from temperatures (e.g. 101.2°F → 101).
 */

function isValidMilitaryTime(value: string): boolean {
  if (!/^\d{4}$/.test(value)) return false;
  const hours = Number.parseInt(value.slice(0, 2), 10);
  const minutes = Number.parseInt(value.slice(2, 4), 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function isValidThreeDigitTime(value: string): boolean {
  if (!/^\d{3}$/.test(value)) return false;
  const hours = Number.parseInt(value.slice(0, 1), 10);
  const minutes = Number.parseInt(value.slice(1, 3), 10);
  return hours >= 0 && hours <= 9 && minutes >= 0 && minutes <= 59;
}

function isTemperatureContext(input: string, matchIndex: number, matchLength: number): boolean {
  const after = input.slice(matchIndex + matchLength, matchIndex + matchLength + 8);
  const before = input.slice(Math.max(0, matchIndex - 24), matchIndex);

  if (/^\.\d/.test(after)) return true;
  if (/^°|^\s*degrees?\b|^\s*[fc]\b/i.test(after)) return true;
  if (/\btemp(?:erature)?\s*[:=]?\s*$/i.test(before)) return true;
  if (/\b(?:temp|temperature)\s+(?:is|was|of)\s*$/i.test(before)) return true;
  return false;
}

function isPlausibleEventTimeToken(token: string): boolean {
  if (/^\d{1,2}:\d{2}$/.test(token)) {
    const [hours, minutes] = token.split(':').map((part) => Number.parseInt(part, 10));
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }
  if (isValidMilitaryTime(token)) return true;
  if (isValidThreeDigitTime(token)) return true;
  return false;
}

function findTimeMatches(input: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  for (const match of input.matchAll(pattern)) {
    const token = match[1];
    const index = match.index ?? 0;
    if (!token || !isPlausibleEventTimeToken(token)) continue;
    if (isTemperatureContext(input, index, match[0].length)) continue;
    matches.push(token);
  }
  return matches;
}

function timeTokenPattern(source: string): RegExp {
  return new RegExp(source, 'gi');
}

export function parseDocumentedEventTime(input: string): string | null {
  const allTimes = parseAllDocumentedEventTimes(input);
  return allTimes[0] ?? null;
}

export function parseAllDocumentedEventTimes(input: string): string[] {
  if (!input.trim()) return [];

  const prioritizedPatterns = [
    timeTokenPattern(String.raw`\bat\s+(\d{1,2}:\d{2}|\d{3,4})(?!\d)`),
    timeTokenPattern(String.raw`\bassessment time[:\s]+(\d{1,2}:\d{2}|\d{3,4})(?!\d)`),
    timeTokenPattern(String.raw`\bevent time[:\s]+(\d{1,2}:\d{2}|\d{3,4})(?!\d)`),
    timeTokenPattern(String.raw`\b(?:report(?:ed)?|occurred|noted)\s+(?:at\s+)?(\d{1,2}:\d{2}|\d{3,4})(?!\d)`),
    timeTokenPattern(String.raw`\b(?:administered|given|provided)\s+(?:at\s+)?(\d{1,2}:\d{2}|\d{3,4})(?!\d)`),
    timeTokenPattern(String.raw`\b(\d{1,2}:\d{2})(?!\d)`),
    timeTokenPattern(String.raw`\b(\d{4})(?!\d)`),
    timeTokenPattern(String.raw`\b(\d{3})(?!\d)`),
  ];

  const seen = new Set<string>();
  const results: string[] = [];

  for (const pattern of prioritizedPatterns) {
    for (const token of findTimeMatches(input, pattern)) {
      const normalized = token.toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      results.push(token);
    }
  }

  return results;
}

export function inputDocumentsEventTime(input: string): boolean {
  return parseDocumentedEventTime(input) !== null;
}

export function outputIncludesDocumentedEventTime(input: string, output: string): boolean {
  const eventTimes = parseAllDocumentedEventTimes(input);
  if (eventTimes.length === 0) return true;

  const normalizedOutput = output.replace(/\s+/g, '').toLowerCase();

  return eventTimes.some((eventTime) => {
    const normalizedTime = eventTime.replace(/\s+/g, '').toLowerCase();
    if (normalizedOutput.includes(normalizedTime)) return true;
    if (normalizedTime.includes(':')) {
      return normalizedOutput.includes(normalizedTime.replace(':', ''));
    }
    return false;
  });
}
