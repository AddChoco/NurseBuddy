export type AssessmentType =
  | 'initial'
  | 'follow_up'
  | 'resolution'
  | 'procedure'
  | 'return'
  | 'other';

export interface DocumentationQualityCheck {
  templateFollowed: boolean;
  unsupportedStatementsRemoved: string[];
  messages: string[];
}

interface UnsupportedRule {
  pattern: RegExp;
  requiresInput?: RegExp;
  message: string;
}

const UNSUPPORTED_STATEMENT_RULES: UnsupportedRule[] = [
  { pattern: /vital signs are within normal limits/i, requiresInput: /within normal limits|vitals stable|vitals wnl|vss|vital signs/i, message: 'Vital signs not provided' },
  { pattern: /vitals (?:are )?(?:stable|wnl|within normal limits)/i, requiresInput: /within normal limits|vitals stable|vitals wnl|vss|vital signs/i, message: 'Vital signs not provided' },
  { pattern: /neurological status (?:remains )?unchanged/i, requiresInput: /neuro|neurologic|mental status|oriented|pupil|gcs|baseline/i, message: 'Neurological assessment not provided' },
  { pattern: /no skin abnormalities noted/i, requiresInput: /skin|wound|bruise|abrasion|intact|erythema|pressure injury/i, message: 'Skin assessment not provided' },
  { pattern: /skin intact/i, requiresInput: /skin assessment|skin finding|wound|bruise|abrasion|erythema|pressure injury|skin breakdown/i, message: 'Skin assessment not provided' },
  { pattern: /breathing unlabored/i, requiresInput: /breath|respiratory|dyspnea|labored|lung|spo2|oxygen/i, message: 'Respiratory assessment not provided' },
  { pattern: /no acute distress/i, requiresInput: /distress|respiratory|dyspnea|pain|discomfort/i, message: 'Distress assessment not provided' },
  { pattern: /(?:resident|individual|patient|client) (?:is )?stable(?: at this time)?/i, requiresInput: /stable|baseline|unchanged|improved|resolved/i, message: 'Stability not confirmed' },
  { pattern: /returned to baseline/i, requiresInput: /baseline|returned to baseline|back to baseline|at baseline/i, message: 'Baseline return not confirmed' },
  { pattern: /alert and oriented(?: x\d)?/i, requiresInput: /alert|oriented|mental status|neuro|baseline/i, message: 'Mental status not provided' },
  { pattern: /ambulating well/i, requiresInput: /ambulat|walk|mobility|walker|wheelchair/i, message: 'Mobility status not provided' },
  { pattern: /tolerated (?:treatment|medication|intervention) well/i, requiresInput: /tolerated|tolerance|effective|well tolerated/i, message: 'Treatment tolerance not provided' },
  { pattern: /medication was effective/i, requiresInput: /effective|effectiveness|relief|improved|responded|score/i, message: 'Medication effectiveness not reported' },
  { pattern: /continue aspirin/i, requiresInput: /aspirin|antiplatelet|blood thinner|anticoagulant/i, message: 'Aspirin continuation not provided' },
  { pattern: /continue medications as ordered/i, requiresInput: /continue medication|as ordered|mar|emar|medication/i, message: 'Medication continuation not provided' },
  { pattern: /pcp was notified/i, requiresInput: /pcp.*notified|provider.*notified|called pcp|notified pcp|physician notified/i, message: 'PCP notification not confirmed' },
  { pattern: /provider was notified/i, requiresInput: /provider.*notified|pcp.*notified|called provider|notified provider/i, message: 'Provider notification not confirmed' },
  { pattern: /lar was notified/i, requiresInput: /lar.*notified|guardian.*notified|family notified/i, message: 'LAR notification not confirmed' },
  { pattern: /staff verbalized understanding/i, requiresInput: /staff verbalized|staff demonstrated|understanding|instructions provided|education provided/i, message: 'Staff education not provided' },
  { pattern: /(?:diarrhea|constipation|fall|respiratory distress|aspiration|pain|uti|vomiting) resolved(?:\.|$)/i, requiresInput: /resolved|resolution|no longer|issue resolved|condition resolved|resolved\./i, message: 'Resolution not confirmed' },
];

const VAGUE_PLAN_RULES: UnsupportedRule[] = [
  { pattern: /continue to monitor(?: closely)?(?: per facility guideline)?/i, requiresInput: /monitor|monitoring|reassess|follow-up|follow up|q\d|every \d+/i, message: 'Generic monitoring statement removed' },
  { pattern: /maintain safety precautions/i, requiresInput: /safety precaution|bed alarm|supervision|fall precaution/i, message: 'Generic safety statement removed' },
  { pattern: /continue routine care/i, requiresInput: /routine care|resume routine|care resumed/i, message: 'Generic routine care statement removed' },
  { pattern: /follow up as needed/i, requiresInput: /follow up|follow-up|reassess|next assessment/i, message: 'Generic follow-up statement removed' },
  { pattern: /encourage compliance/i, requiresInput: /compliance|encourage/i, message: 'Generic compliance statement removed' },
];

function removeMatchingLines(
  documentation: string,
  input: string,
  rules: UnsupportedRule[],
): { text: string; removed: string[]; messages: string[] } {
  const removed: string[] = [];
  const messages: string[] = [];
  const lines = documentation.split('\n');
  const kept: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      kept.push(line);
      continue;
    }

    let dropLine = false;
    const isProtectedFormLine =
      /^(S|O|A|P):\s*$/i.test(trimmed)
      || /^See Interactive View Assessment\.\s*$/i.test(trimmed)
      || /^[^:]+:\s*$/.test(trimmed);

    if (!isProtectedFormLine) {
      for (const rule of rules) {
        if (!rule.pattern.test(trimmed)) continue;
        if (rule.requiresInput && rule.requiresInput.test(input)) continue;
        dropLine = true;
        removed.push(trimmed);
        if (!messages.includes(rule.message)) messages.push(rule.message);
        break;
      }
    }

    if (!dropLine) kept.push(line);
  }

  return {
    text: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    removed,
    messages,
  };
}

export function validateGeneratedDocumentation(
  input: string,
  documentation: string,
  options: { assessmentType?: AssessmentType } = {},
): { validatedDocumentation: string; qualityCheck: DocumentationQualityCheck } {
  let text = documentation;
  const removed: string[] = [];
  const messages: string[] = [];

  const unsupported = removeMatchingLines(text, input, UNSUPPORTED_STATEMENT_RULES);
  text = unsupported.text;
  removed.push(...unsupported.removed);
  messages.push(...unsupported.messages);

  const vaguePlan = removeMatchingLines(text, input, VAGUE_PLAN_RULES);
  text = vaguePlan.text;
  removed.push(...vaguePlan.removed);
  messages.push(...vaguePlan.messages);

  if (options.assessmentType === 'resolution' && !/\bresolved\b|\bissue resolved\b|\bcondition resolved\b|\bno longer\b/i.test(input)) {
    const resolutionRemoved = removeMatchingLines(text, input, [
      { pattern: /\bresolved\b/i, message: 'Resolution not confirmed' },
    ]);
    text = resolutionRemoved.text;
    removed.push(...resolutionRemoved.removed);
    messages.push(...resolutionRemoved.messages);
  }

  if (!/see interactive view assessment/i.test(text)) {
    messages.push('Interactive View Assessment statement missing');
  } else {
    messages.unshift('Facility template followed');
  }

  if (removed.length === 0) {
    messages.push('No unsupported statements detected');
  }

  if (!/\b(at\s+\d{1,2}:\d{2}|reported that|reported the)/i.test(text) && /\b(reported|staff|dsp)\b/i.test(input)) {
    messages.push('Report time not provided');
  }

  if (/\bdsp\b|\bstaff\b|\breported\b/i.test(input) && !/\b(dsp|rn|lpn|cna|staff member|nurse)\b/i.test(text)) {
    messages.push('Reporter name/title not provided');
  }

  const uniqueMessages = [...new Set(messages)];

  return {
    validatedDocumentation: text,
    qualityCheck: {
      templateFollowed: /see interactive view assessment/i.test(text),
      unsupportedStatementsRemoved: removed,
      messages: uniqueMessages,
    },
  };
}
