import type { GuidelineDefinition } from './types.ts';
import type { AssessmentType } from './facilityTemplateMode.ts';
import { STAFF_EDUCATION_PROMPT } from './facilityTemplateMode.ts';
import {
  extractPlanStandingInstructions,
  getFacilityFormTemplate,
} from './facilityFormTemplates.ts';

const PROMPT_LINE_PATTERN = /^([^:\n]+):\s*(.*)$/;

export const NEGATIVE_FILLER_VALUE_PATTERNS: RegExp[] = [
  /^staff education not provided\.?$/i,
  /^education not provided\.?$/i,
  /^no staff education\.?$/i,
  /^education not documented\.?$/i,
  /^staff understanding not confirmed\.?$/i,
  /^staff understanding not documented\.?$/i,
  /^nursing interventions? not provided\.?$/i,
  /^nursing interventions? not completed\.?$/i,
  /^nursing interventions? unknown\.?$/i,
  /^nursing interventions? incomplete\.?$/i,
  /^provider not notified\.?$/i,
  /^pcp not notified\.?$/i,
  /^lar not notified\.?$/i,
  /^assessment not performed\.?$/i,
  /^information unavailable\.?$/i,
  /^unable to determine\.?$/i,
  /^not provided\.?$/i,
  /^not documented\.?$/i,
  /^unknown\.?$/i,
  /^n\/a\.?$/i,
  /^none\.?$/i,
  /^not reported\.?$/i,
  /^not identified\.?$/i,
  /^status not provided\.?$/i,
  /^completion not documented\.?$/i,
];

export const PROSPECTIVE_INSTRUCTION_PATTERNS: RegExp[] = [
  /\bdsp instructed to monitor\b/i,
  /\bstaff instructed to monitor\b/i,
  /\bnurse to notify pcp\b/i,
  /\bnotify the oncoming nurse\b/i,
  /\bcontinue .* according to the .* guideline\b/i,
  /\bfluids encouraged as tolerated\b/i,
  /\bassess every shift\b/i,
  /\bimplement strategies to prevent dehydration\b/i,
  /\bimplement comfort measures\b/i,
  /\bnotify pcp immediately\b/i,
  /\bfollow .* guideline\b/i,
  /\bmonitor for and immediately report\b/i,
  /\bwhen continued follow-up is required\b/i,
  /\bwhen follow-up is indicated\b/i,
];

export function isNegativeFillerValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return NEGATIVE_FILLER_VALUE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isProspectiveFacilityInstruction(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (PROSPECTIVE_INSTRUCTION_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  if (/\binstructed to\b/i.test(trimmed) && /\bmonitor\b/i.test(trimmed)) return true;
  if (/\bnotify\b/i.test(trimmed) && /\bpcp\b|\boncoming nurse\b|\bprovider\b/i.test(trimmed)) return true;
  return false;
}

function parsePromptEntries(sectionText: string): Array<{ prompt: string; value: string; lineIndex: number }> {
  const lines = sectionText.split('\n');
  const entries: Array<{ prompt: string; value: string; lineIndex: number }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const promptMatch = trimmed.match(PROMPT_LINE_PATTERN);
    if (!promptMatch) continue;

    const prompt = `${promptMatch[1].trim()}:`;
    let value = promptMatch[2]?.trim() ?? '';

    if (!value) {
      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const nextTrimmed = lines[nextIndex].trim();
        if (!nextTrimmed) continue;
        if (nextTrimmed.endsWith(':')) break;
        value = nextTrimmed;
        break;
      }
    }

    entries.push({ prompt, value, lineIndex: index });
  }

  return entries;
}

function sanitizeSectionPromptValues(sectionText: string): string {
  const lines = sectionText.split('\n');
  const entries = parsePromptEntries(sectionText);

  for (const entry of entries) {
    if (!entry.value || !isNegativeFillerValue(entry.value)) continue;

    const promptLine = lines[entry.lineIndex].trim();
    if (promptLine.startsWith(entry.prompt)) {
      lines[entry.lineIndex] = entry.prompt;
      const nextIndex = entry.lineIndex + 1;
      if (nextIndex < lines.length && lines[nextIndex].trim() === entry.value) {
        lines.splice(nextIndex, 1);
      }
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function sanitizeStandaloneNegativeLines(sectionText: string, standingInstructions: ReadonlySet<string>): string {
  return sectionText
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (standingInstructions.has(trimmed)) return true;
      if (trimmed === STAFF_EDUCATION_PROMPT) return true;
      if (trimmed.endsWith(':') && !trimmed.slice(0, -1).includes(':')) return true;
      if (isProspectiveFacilityInstruction(trimmed)) return true;
      return !isNegativeFillerValue(trimmed);
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface FacilityTemplateSections {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

function clearPromptValue(sectionText: string, prompt: string): string {
  const lines = sectionText.split('\n');
  const promptIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return trimmed === prompt || trimmed.startsWith(`${prompt} `);
  });
  if (promptIndex === -1) return sectionText;

  lines[promptIndex] = prompt;
  const nextIndex = promptIndex + 1;
  if (nextIndex < lines.length) {
    const nextTrimmed = lines[nextIndex].trim();
    if (nextTrimmed && !nextTrimmed.endsWith(':')) {
      lines.splice(nextIndex, 1);
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function clearUnsupportedStaffUnderstanding(plan: string, input: string): string {
  const confirmed = /\bstaff verbalized\b|\bstaff demonstrated\b|\bunderstanding of instructions\b|\bunderstanding of the instructions\b/i.test(input);
  if (confirmed) return plan;

  const valuePattern = /staff verbalized understanding|staff demonstrated understanding|staff verbalized or demonstrated understanding/i;
  const lines = plan.split('\n');
  const promptIndex = lines.findIndex((line) => line.trim() === STAFF_EDUCATION_PROMPT || line.trim().startsWith(`${STAFF_EDUCATION_PROMPT} `));
  if (promptIndex === -1) return plan;

  const sameLineValue = lines[promptIndex].trim().slice(STAFF_EDUCATION_PROMPT.length).trim();
  const nextLineValue = lines[promptIndex + 1]?.trim() ?? '';
  const candidate = sameLineValue || nextLineValue;
  if (!candidate || !valuePattern.test(candidate)) return plan;

  return clearPromptValue(plan, STAFF_EDUCATION_PROMPT);
}

export function sanitizeFacilityTemplateSections(
  sections: FacilityTemplateSections,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  input = '',
): FacilityTemplateSections {
  const standingInstructions = new Set(extractPlanStandingInstructions(getFacilityFormTemplate(def, assessmentType)));

  const sanitize = (text: string) =>
    sanitizeStandaloneNegativeLines(
      sanitizeSectionPromptValues(text),
      standingInstructions,
    );

  return {
    subjective: sanitize(sections.subjective),
    objective: sanitize(sections.objective),
    assessment: sanitize(sections.assessment),
    plan: clearUnsupportedStaffUnderstanding(sanitize(sections.plan), input),
  };
}

export function buildValidationScanText(
  sections: FacilityTemplateSections,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  extraSections: string[] = [],
): string {
  const standingInstructions = new Set(extractPlanStandingInstructions(getFacilityFormTemplate(def, assessmentType)));
  const combined = [
    sections.subjective,
    sections.objective,
    sections.assessment,
    sections.plan,
    ...extraSections,
  ].join('\n');

  return combined
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (standingInstructions.has(trimmed)) return false;
      if (trimmed === STAFF_EDUCATION_PROMPT) return false;
      if (/^[^:]+:\s*$/.test(trimmed) && !trimmed.startsWith(STAFF_EDUCATION_PROMPT)) return false;
      if (isProspectiveFacilityInstruction(trimmed)) return false;
      return true;
    })
    .join('\n');
}

export function detectNegativeFillerClaims(text: string): string[] {
  const errors: string[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || isProspectiveFacilityInstruction(trimmed)) continue;

    const promptMatch = trimmed.match(PROMPT_LINE_PATTERN);
    const value = promptMatch?.[2]?.trim() ?? trimmed;
    if (!isNegativeFillerValue(value)) continue;

    errors.push(`Unsupported negative status inserted into clinical documentation: ${value}`);
  }
  return errors;
}

export function buildNegativeFillerProhibitionBlock(): string {
  return `MISSING-INFORMATION STATUS (Quality Check only — never in SOAP/SBAR/LAR):
Do NOT insert negative filler text into prompt values or narrative, including:
- Staff education not provided / Education not documented / No staff education
- Provider not notified / LAR not notified
- Nursing interventions not provided / not completed / unknown / incomplete
- Assessment not performed / Information unavailable / Unable to determine / Unknown / Not provided

When a colon-ended prompt has no supported value:
- preserve the prompt label
- leave the value blank
- report the missing item only in qualityCheck.missing

PROSPECTIVE FACILITY INSTRUCTIONS (allowed in Plan):
Standing guideline instructions such as DSP monitoring, PCP notification thresholds, oncoming nurse handoff, and continue assessments according to the guideline are NOT completed actions. Preserve them exactly even when absent from the nurse narrative.

STAFF EDUCATION RULES:
- Generate DSP/staff monitoring instructions when required by the guideline.
- Do NOT complete "${STAFF_EDUCATION_PROMPT}" unless the narrative explicitly confirms staff verbalized or demonstrated understanding.
- Leave that prompt blank when understanding is not documented.`;
}
