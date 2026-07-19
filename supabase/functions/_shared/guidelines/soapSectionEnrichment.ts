import type { GuidelineDefinition } from './types';
import type { AssessmentType } from './facilityTemplateMode';
import { extractClinicalFacts, formatReporterLead } from './clinicalFactExtraction';
import { parseDocumentedEventTime } from './eventTimeParsing';
interface SoapSections {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const SECTION_HEADER_PATTERN = /^(SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN|S|O|A|P):\s*$/i;
const PROMPT_LINE_PATTERN = /^([^:\n]+):\s*(.*)$/;

interface PromptEntry {
  prompt: string;
  value: string;
  promptLineIndex: number;
}

function sectionUsesTemplatePrompts(sectionText: string, prompts: string[]): boolean {
  return prompts.some((prompt) => sectionText.includes(prompt));
}

function capitalizeTerminology(terminology: string): string {
  const term = terminology.trim().toLowerCase();
  if (!term) return 'Resident';
  return term.charAt(0).toUpperCase() + term.slice(1);
}

function extractTemplateSection(template: string, sectionName: 'SUBJECTIVE' | 'OBJECTIVE'): string[] {
  const rows = template.split('\n');
  const startIndex = rows.findIndex((line) => line.trim() === `${sectionName}:`);
  if (startIndex === -1) return [];

  const prompts: string[] = [];
  for (let index = startIndex + 1; index < rows.length; index += 1) {
    const trimmed = rows[index].trim();
    if (!trimmed) continue;
    if (SECTION_HEADER_PATTERN.test(trimmed)) break;
    if (trimmed.endsWith(':') && !SECTION_HEADER_PATTERN.test(trimmed)) {
      prompts.push(trimmed);
    }
  }
  return prompts;
}

function parsePromptEntries(sectionText: string): { lines: string[]; entries: PromptEntry[] } {
  const lines = sectionText.split('\n');
  const entries: PromptEntry[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed || SECTION_HEADER_PATTERN.test(trimmed)) continue;

    const promptMatch = trimmed.match(PROMPT_LINE_PATTERN);
    if (!promptMatch) continue;

    const prompt = `${promptMatch[1].trim()}:`;
    let value = promptMatch[2]?.trim() ?? '';

    if (!value) {
      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const nextTrimmed = lines[nextIndex].trim();
        if (!nextTrimmed) continue;
        if (nextTrimmed.endsWith(':') && !SECTION_HEADER_PATTERN.test(nextTrimmed)) break;
        value = nextTrimmed;
        break;
      }
    }

    entries.push({ prompt, value, promptLineIndex: index });
  }

  return { lines, entries };
}

function getPromptValue(sectionText: string, prompt: string): string | null {
  const entry = parsePromptEntries(sectionText).entries.find((item) => item.prompt === prompt);
  return entry?.value?.trim() ? entry.value.trim() : null;
}

function setPromptValue(sectionText: string, prompt: string, value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return sectionText;

  const { lines, entries } = parsePromptEntries(sectionText);
  const entry = entries.find((item) => item.prompt === prompt);
  if (!entry) return sectionText;

  const promptLine = lines[entry.promptLineIndex].trim();
  if (promptLine === prompt) {
    const nextLineIndex = entry.promptLineIndex + 1;
    if (nextLineIndex < lines.length && lines[nextLineIndex].trim() && !lines[nextLineIndex].trim().endsWith(':')) {
      if (lines[nextLineIndex].trim() === entry.value.trim()) {
        lines[nextLineIndex] = trimmedValue;
      } else if (!entry.value) {
        lines.splice(nextLineIndex, 0, trimmedValue);
      }
    } else {
      lines.splice(entry.promptLineIndex + 1, 0, trimmedValue);
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  if (promptLine.startsWith(prompt)) {
    lines[entry.promptLineIndex] = `${prompt} ${trimmedValue}`;
    return lines.join('\n').trim();
  }

  return sectionText;
}

function removeEmptySubjectivePrompt(sectionText: string, prompt: string): string {
  const { lines, entries } = parsePromptEntries(sectionText);
  const entry = entries.find((item) => item.prompt === prompt);
  if (!entry || entry.value.trim()) return sectionText;

  const promptLineIndex = entry.promptLineIndex;
  lines.splice(promptLineIndex, 1);
  if (promptLineIndex < lines.length && !lines[promptLineIndex].trim()) {
    lines.splice(promptLineIndex, 1);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function inferSubjectivePromptValue(prompt: string, input: string, terminology: string): string | null {
  const term = capitalizeTerminology(terminology);
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('fatigue')) {
    if (/\b(?:denies|denied|no)\s+fatigue\b/i.test(input)) return `${term} denies fatigue.`;
    const fatigueMatch = input.match(/\b(?:reports?|complains? of|noted)\s+fatigue\b[^.]*\.?/i);
    if (fatigueMatch) return fatigueMatch[0].trim().replace(/\.$/, '') + '.';
    return null;
  }

  if (lowerPrompt.includes('new symptoms')) {
    if (/\b(?:denies|denied|no)\s+(?:chills\s+and\s+)?new symptoms\b/i.test(input)) return null;
    const symptomMatch = input.match(/\b(?:reports?|complains? of|noted)\s+new symptoms[^.]*\.?/i);
    if (symptomMatch) return symptomMatch[0].trim().replace(/\.$/, '') + '.';
    return null;
  }

  if (lowerPrompt.includes('reported symptoms')) {
    return buildSubjectiveNarrative(input, terminology);
  }

  return null;
}

function buildSubjectiveNarrative(input: string, terminology: string): string | null {
  const facts = extractClinicalFacts(input);
  const term = capitalizeTerminology(terminology);
  const sentences: string[] = [];

  const lead = formatReporterLead(facts);
  if (lead && (facts.reporterName || facts.reporterTitle)) {
    if (facts.reporterReport) {
      sentences.push(`${lead} ${facts.reporterReport}.`);
    } else {
      sentences.push(`${lead}.`);
    }
  }

  if (/\b(?:denies|denied)\s+chills\b/i.test(input)) sentences.push(`${term} denies chills.`);
  if (/\b(?:denies|denied)\s+(?:chills\s+and\s+)?new symptoms\b/i.test(input)) {
    sentences.push(`${term} denies new symptoms.`);
  }
  if (/\bno additional fever\b/i.test(input)) sentences.push('No additional fever reported.');
  if (/\b(?:denies|denied)\s+fever\b/i.test(input)) sentences.push(`${term} denies fever.`);
  if (/\bresting comfortably\b/i.test(input)) sentences.push(`${term} resting comfortably.`);

  const symptomMatch = input.match(/\b(?:reports?|complains? of|noted)\s+[^.]+(?:fever|fatigue|pain|symptoms)[^.]*\.?/i);
  if (symptomMatch && !sentences.some((sentence) => sentence.toLowerCase().includes(symptomMatch[0].toLowerCase()))) {
    sentences.push(symptomMatch[0].trim().replace(/\.$/, '') + '.');
  }

  if (sentences.length === 0) return null;
  return sentences.join(' ');
}

function formatTemperatureValue(rawValue: string, route: string | null, input: string, terminology: string): string {
  const numeric = rawValue.match(/(\d+(?:\.\d+)?)/)?.[1] ?? rawValue;
  const routeSuffix = route ? ` (${route})` : '';
  const term = capitalizeTerminology(terminology);

  if (/\bafebrile\b/i.test(input) || (numeric && Number.parseFloat(numeric) < 100.4)) {
    return `${term} afebrile at follow-up with temperature ${numeric}°F${routeSuffix}.`;
  }

  return `${term} temperature ${numeric}°F${routeSuffix} documented at follow-up.`;
}

function formatObjectivePromptValue(
  prompt: string,
  value: string,
  input: string,
  terminology: string,
  objectiveText: string,
): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return trimmedValue;
  if (/^see interactive view assessment\.?$/i.test(trimmedValue)) return trimmedValue;

  const lowerPrompt = prompt.toLowerCase();
  const term = capitalizeTerminology(terminology);
  const numericMatch = trimmedValue.match(/(\d+(?:\.\d+)?)/);
  const inlineRoute = trimmedValue.match(/\b(temporal|oral|axillary|rectal|tympanic)\b/i)?.[1] ?? null;
  const route = inlineRoute ?? getPromptValue(objectiveText, 'Temperature route:');

  if (lowerPrompt.includes('current temperature') && numericMatch) {
    return formatTemperatureValue(numericMatch[1], route, input, terminology);
  }

  const bareNumeric = /^\d+(?:\.\d+)?(?:\s*°?\s*[fc])?$/i.test(trimmedValue);

  if (lowerPrompt.includes('temperature route') && !/[.!?]/.test(trimmedValue)) {
    return `${trimmedValue} route documented.`;
  }

  if (lowerPrompt.includes('assessment time') && /^\d{3,4}$/.test(trimmedValue)) {
    return `Assessment completed at ${trimmedValue}.`;
  }

  if (lowerPrompt.includes('additional findings') || lowerPrompt.includes('interventions completed')) {
    if (/^[a-z0-9 .,-]+$/i.test(trimmedValue) && !/[.!?]/.test(trimmedValue) && trimmedValue.split(/\s+/).length <= 6) {
      return `${term} ${trimmedValue.replace(/\.$/, '')}.`;
    }
  }

  if (!/[.!?]/.test(trimmedValue) && trimmedValue.split(/\s+/).length <= 4 && !lowerPrompt.includes('date and time')) {
    return `${trimmedValue}.`;
  }

  return trimmedValue;
}

function buildAdditionalFindingsNarrative(input: string, objectiveText: string, terminology: string): string | null {
  const term = capitalizeTerminology(terminology);
  const sentences: string[] = [];
  const eventTime = parseDocumentedEventTime(input) ?? getPromptValue(objectiveText, 'Assessment time:');

  if (/\bresting comfortably\b/i.test(input)) {
    sentences.push(`${term} resting comfortably without chills or additional fever.`);
  } else if (/\b(?:denies|denied)\s+chills\b/i.test(input) && /\bno additional fever\b/i.test(input)) {
    sentences.push(`${term} resting comfortably without chills or additional fever.`);
  }

  const prnMatch = input.match(/\b(?:prn\s+)?(?:tylenol|acetaminophen)\b[^.]*(?:administered|given|provided)[^.]*(?:at\s+\d{3,4})?[^.]*/i);
  if (prnMatch) {
    const normalized = prnMatch[0].trim().replace(/\.$/, '');
    sentences.push(/[.!?]$/.test(normalized) ? normalized : `${normalized}.`);
  } else if (/\b(?:tylenol|acetaminophen)\b/i.test(input) && eventTime) {
    sentences.push(`PRN Tylenol administered at ${eventTime.replace(':', '')}.`);
  }

  return sentences.length > 0 ? sentences.join(' ') : null;
}

export function enrichSubjectiveSection(
  subjective: string,
  input: string,
  template: string,
  terminology: string,
): string {
  let enriched = subjective.trim();
  if (!enriched && !input.trim()) return enriched;

  const subjectivePrompts = extractTemplateSection(template, 'SUBJECTIVE');
  if (!sectionUsesTemplatePrompts(enriched, subjectivePrompts)) {
    return enriched;
  }

  const narrative = buildSubjectiveNarrative(input, terminology);
  let filledAny = false;

  for (const prompt of subjectivePrompts) {
    const currentValue = getPromptValue(enriched, prompt);
    if (currentValue) {
      filledAny = true;
      continue;
    }

    if (prompt.toLowerCase().includes('new symptoms') && /\bdenies new symptoms\b/i.test(input)) {
      continue;
    }

    const inferred = inferSubjectivePromptValue(prompt, input, terminology)
      ?? (narrative && prompt.toLowerCase().includes('reported symptoms') ? narrative : null);

    if (inferred) {
      enriched = setPromptValue(enriched, prompt, inferred);
      filledAny = true;
    }
  }

  for (const prompt of subjectivePrompts) {
    if (!getPromptValue(enriched, prompt)) {
      enriched = removeEmptySubjectivePrompt(enriched, prompt);
    }
  }

  if (!filledAny && narrative) return narrative;
  return enriched.trim();
}

export function enrichObjectiveSection(
  objective: string,
  input: string,
  template: string,
  terminology: string,
): string {
  let enriched = objective.trim();
  if (!enriched) return enriched;

  const objectivePrompts = extractTemplateSection(template, 'OBJECTIVE');
  if (!sectionUsesTemplatePrompts(enriched, objectivePrompts)) {
    return enriched;
  }

  const preservedLine = enriched
    .split('\n')
    .find((line) => /^see interactive view assessment\.?$/i.test(line.trim()));

  for (const prompt of objectivePrompts) {
    const currentValue = getPromptValue(enriched, prompt);
    if (!currentValue) continue;

    const formatted = formatObjectivePromptValue(prompt, currentValue, input, terminology, enriched);
    if (formatted !== currentValue) {
      enriched = setPromptValue(enriched, prompt, formatted);
    }
  }

  const additionalFindingsPrompt = objectivePrompts.find((prompt) => /additional findings:/i.test(prompt));
  if (additionalFindingsPrompt) {
    const currentAdditional = getPromptValue(enriched, additionalFindingsPrompt);
    const supplemental = buildAdditionalFindingsNarrative(input, enriched, terminology);
    if (supplemental) {
      const normalizedCurrent = currentAdditional?.replace(/\.$/, '').trim().toLowerCase() ?? '';
      const normalizedSupplement = supplemental.replace(/\.$/, '').trim().toLowerCase();
      const merged = currentAdditional
        ? (normalizedCurrent.includes(normalizedSupplement) || normalizedSupplement.includes(normalizedCurrent)
          ? currentAdditional
          : `${currentAdditional.replace(/\.$/, '')}. ${supplemental}`)
        : supplemental;
      enriched = setPromptValue(enriched, additionalFindingsPrompt, merged);
    }
  }

  if (preservedLine && !/^see interactive view assessment\.?$/im.test(enriched)) {
    enriched = `${preservedLine}\n${enriched}`.trim();
  }

  return enriched.trim();
}

function buildVomitingAssessmentInterpretation(input: string): string | null {
  const sentences: string[] = [];

  if (/vomit|emesis|vomiting/i.test(input)) {
    const modifiers: string[] = [];
    if (/no further (?:vomit|emesis|vomiting)|no nausea|denies nausea|without nausea|no nausea or further vomiting/i.test(input)) {
      modifiers.push('no further emesis or nausea');
    }
    if (/no aspiration|without aspiration|no respiratory distress|respirations even|unlabored/i.test(input)) {
      modifiers.push('no signs of aspiration or respiratory distress');
    }

    sentences.push(
      modifiers.length > 0
        ? `Vomiting episode with ${modifiers.join(' and ')}.`
        : 'Vomiting episode documented.',
    );
  }

  if (/intake|output|void|fluid intake|meals|bowel movement/i.test(input)) {
    sentences.push('Intake and output documented.');
  }

  return sentences.length > 0 ? sentences.join(' ') : null;
}

function buildAssessmentInterpretation(
  input: string,
  def: GuidelineDefinition,
  terminology: string,
): string | null {
  if (def.id === 'vomiting') {
    return buildVomitingAssessmentInterpretation(input);
  }

  const term = capitalizeTerminology(terminology);
  const facts = extractClinicalFacts(input, def.id);
  const parts: string[] = [];

  if (facts.painPresent === false) parts.push(`${term} denies pain`);
  if (facts.painPresent === true && facts.painDescription) parts.push(`${term} reports ${facts.painDescription}`);
  if (facts.visibleInjury) parts.push(facts.visibleInjury);
  if (facts.vitalSigns) parts.push(`vital signs ${facts.vitalSigns}`);

  if (parts.length === 0) return null;
  return `${parts.join('; ')}.`;
}

function assessmentUsesFixedTemplateLabel(assessment: string): boolean {
  const lines = assessment.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  if (lines.length === 1) {
    return /^[A-Za-z][A-Za-z /-]+\.?$/.test(lines[0]) && lines[0].split(/\s+/).length <= 4;
  }
  return /^[A-Za-z][A-Za-z /-]+\.?$/.test(lines[0]);
}

export function enrichAssessmentSection(
  assessment: string,
  input: string,
  def: GuidelineDefinition,
  terminology: string,
): string {
  const enriched = assessment.trim();
  if (!enriched || !input.trim()) return enriched;

  const interpretation = buildAssessmentInterpretation(input, def, terminology);
  if (!interpretation) return enriched;

  const lines = enriched.split('\n').map((line) => line.trim()).filter(Boolean);
  const hasInterpretation = lines.slice(1).some((line) => line.length > 20);
  if (hasInterpretation) return enriched;

  if (assessmentUsesFixedTemplateLabel(enriched)) {
    return `${lines[0].replace(/\.$/, '')}.\n${interpretation}`;
  }

  if (lines.length === 1 && lines[0].split(/\s+/).length === 1) {
    return `${lines[0]}\n${interpretation}`;
  }

  return enriched;
}

export function enrichFacilitySoapSections(
  soap: SoapSections,
  input: string,
  def: GuidelineDefinition,
  _assessmentType: AssessmentType,
  template: string,
  terminology: string,
): SoapSections {
  return {
    ...soap,
    subjective: enrichSubjectiveSection(soap.subjective, input, template, terminology),
    objective: enrichObjectiveSection(soap.objective, input, template, terminology),
    assessment: enrichAssessmentSection(soap.assessment, input, def, terminology),
    plan: soap.plan,
  };
}

export function extractSubjectivePromptsFromTemplate(template: string): string[] {
  return extractTemplateSection(template, 'SUBJECTIVE');
}

export function subjectivePromptHasValue(sectionText: string, prompt: string): boolean {
  return Boolean(getPromptValue(sectionText, prompt));
}
