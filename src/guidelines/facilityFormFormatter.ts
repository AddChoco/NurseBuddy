import type { ClinicalExtraction } from './clinicalExtraction';
import { buildSubjectiveText } from './clinicalExtraction';

const SECTION_HEADERS = /^(S|O|A|P|SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN):\s*$/i;
const SUBJECTIVE_SECTION = /^(S|SUBJECTIVE):\s*$/i;

function normalizePromptKey(prompt: string): string {
  return prompt.replace(/:\s*$/, '').trim().toLowerCase();
}

function resolveFieldValue(prompt: string, extraction: ClinicalExtraction): string | null {
  const key = normalizePromptKey(prompt);
  const promptValues = extraction.promptValues;

  for (const [label, value] of Object.entries(promptValues)) {
    if (normalizePromptKey(label) === key) return value;
  }

  const aliases: Record<string, string | null | undefined> = {
    'additional findings': extraction.additionalFindings ?? extraction.objective,
    'assessed at': extraction.reportTime,
    'date and time of follow-up assessment': extraction.reportTime,
    'nursing interventions completed': extraction.nursingInterventions,
    'staff verbalized or demonstrated understanding of instructions provided':
      extraction.staffInstructions ?? extraction.education,
    'notify pcp if abnormal findings are noted during assessment': extraction.providerNotification,
    'notify the pcp of abnormal findings noted during the assessment': extraction.providerNotification,
    'notify pcp of abnormal findings noted during assessment': extraction.providerNotification,
    'notify pcp of new, worsening, or abnormal findings': extraction.providerNotification,
    'current use of blood thinners, including anticoagulants or antiplatelet medications':
      extraction.medication,
    'current use of anticoagulant or antiplatelet medication': extraction.medication,
    'post injury report (pir) completed': promptValues['Post Injury Report (PIR) completed']
      ?? promptValues['PIR completion'],
    'assessment of intake and output for the past 24 hours': promptValues['Assessment of intake and output for the past 24 hours']
      ?? promptValues['Intake and output assessment for the past 24 hours'],
    'effectiveness of anti-diarrheal medication, if administered':
      promptValues['Effectiveness of anti-diarrheal medication, if administered']
      ?? promptValues['Effectiveness of anti-diarrheal medication (if administered)'],
    'strategies implemented to prevent dehydration':
      promptValues['Strategies implemented to prevent dehydration']
      ?? promptValues['Dehydration prevention strategies'],
    'results of suppository and/or constipation medication, if administered':
      promptValues['Results of suppository and/or constipation medication, if administered']
      ?? promptValues['Results of suppository or constipation medication (if administered)'],
    "individual's positioning": promptValues["Individual's positioning"],
    'relevant symptoms': promptValues['Relevant symptoms']
      ?? promptValues['Relevant respiratory symptoms'],
    'relevant respiratory symptoms': promptValues['Relevant respiratory symptoms'],
    'analysis of gastric residuals (when applicable)':
      promptValues['Analysis of gastric residuals (when applicable)']
      ?? promptValues['Gastric residual assessment (if applicable)'],
    'document whether follow-up monitoring remains open or is complete':
      promptValues['Document whether follow-up monitoring remains open or is complete'],
    'follow any provider orders received': promptValues['Follow any provider orders received'],
    'update the post injury report or related documentation if required':
      promptValues['Update the Post Injury Report or related documentation if required'],
    'document the next nursing assessment due':
      promptValues['Document the next nursing assessment due']
      ?? promptValues['Next nursing assessment due'],
    'suctioning performed (if applicable)': promptValues['Suctioning performed (if applicable)']
      ?? promptValues['Suctioning status'],
    'oxygen therapy provided (if applicable)': promptValues['Oxygen therapy provided (if applicable)']
      ?? promptValues['Oxygen therapy status'],
    'breathing treatment administered (if applicable)':
      promptValues['Breathing treatment administered (if applicable)']
      ?? promptValues['Breathing treatment status'],
    'respiratory therapy (rt) notified (if applicable)':
      promptValues['Respiratory Therapy (RT) notified (if applicable)']
      ?? promptValues['Respiratory Therapy notification'],
    'notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated':
      promptValues['Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated']
      ?? promptValues['Nurse-to-nurse / 24-hour report communication (when follow-up is indicated)'],
    'notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if further follow-up is indicated':
      promptValues['Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if further follow-up is indicated'],
    'notify the oncoming nurse through the 24-hour report or nurse-to-nurse handoff if additional follow-up is indicated':
      promptValues['Notify the oncoming nurse through the 24-hour report or nurse-to-nurse handoff if additional follow-up is indicated'],
  };

  const aliasValue = aliases[key];
  if (aliasValue === null || aliasValue === undefined) return null;
  if (typeof aliasValue === 'string' && aliasValue.trim()) return aliasValue.trim();

  return null;
}

function isFieldPrompt(line: string): boolean {
  return line.endsWith(':') && !SECTION_HEADERS.test(line);
}

function isFixedInstruction(line: string): boolean {
  return line.endsWith('.') && !line.endsWith(':');
}

/**
 * Stage 2 — deterministic facility form formatter.
 * Preserves every template line; inserts extracted values after colon prompts only.
 */
export function formatFacilityForm(
  template: string,
  extraction: ClinicalExtraction,
): string {
  const lines = template.split('\n');
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      output.push('');
      continue;
    }

    if (SECTION_HEADERS.test(trimmed)) {
      output.push(trimmed);

      if (SUBJECTIVE_SECTION.test(trimmed)) {
        const subjective = buildSubjectiveText(extraction);
        if (subjective) output.push(subjective);
      }

      if (/^A:\s*$/i.test(trimmed) || /^ASSESSMENT:\s*$/i.test(trimmed)) {
        const nextLine = lines.slice(index + 1).find((line) => line.trim().length > 0)?.trim() ?? '';
        const nextIsLabel = nextLine.length > 0
          && !SECTION_HEADERS.test(nextLine)
          && !isFieldPrompt(nextLine)
          && !isFixedInstruction(nextLine);

        if (!nextIsLabel && extraction.assessment) {
          output.push(extraction.assessment);
        }
      }

      continue;
    }

    if (isFieldPrompt(trimmed)) {
      output.push(trimmed);
      const value = resolveFieldValue(trimmed, extraction);
      if (value) output.push(value);
      continue;
    }

    if (isFixedInstruction(trimmed)) {
      output.push(trimmed);
      continue;
    }

    output.push(extraction.assessmentLabel ?? trimmed);
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}
