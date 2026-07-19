import type { GuidelineId } from '../types';
import { parseDocumentedEventTime } from './eventTimeParsing';

/**
 * Structured clinical facts extracted deterministically from nurse input.
 * Null means not documented. Booleans are used only when explicitly stated.
 */
export interface ClinicalFacts {
  eventTime: string | null;
  reporterName: string | null;
  reporterTitle: string | null;
  eventType: string | null;
  headImpact: boolean | null;
  headImpactLocation: string | null;
  mechanism: string | null;
  painPresent: boolean | null;
  painDescription: string | null;
  lossOfConsciousness: boolean | null;
  anticoagulantUse: boolean | null;
  medications: string[];
  pupilAssessment: string | null;
  vitalSigns: string | null;
  neurologicalAssessment: string | null;
  visibleInjury: string | null;
  pirCompleted: boolean | null;
  nursingInterventionsCompleted: boolean | null;
  providerNotification: string | null;
  larNotification: string | null;
  staffEducation: string | null;
  location: string | null;
  unwitnessedFall: boolean | null;
  reporterReport: string | null;
}

export const EMPTY_CLINICAL_FACTS: ClinicalFacts = {
  eventTime: null,
  reporterName: null,
  reporterTitle: null,
  eventType: null,
  headImpact: null,
  headImpactLocation: null,
  mechanism: null,
  painPresent: null,
  painDescription: null,
  lossOfConsciousness: null,
  anticoagulantUse: null,
  medications: [],
  pupilAssessment: null,
  vitalSigns: null,
  neurologicalAssessment: null,
  visibleInjury: null,
  pirCompleted: null,
  nursingInterventionsCompleted: null,
  providerNotification: null,
  larNotification: null,
  staffEducation: null,
  location: null,
  unwitnessedFall: null,
  reporterReport: null,
};

const ANTICOAGULANT_MEDICATIONS = [
  'eliquis',
  'apixaban',
  'xarelto',
  'rivaroxaban',
  'warfarin',
  'coumadin',
  'aspirin',
  'plavix',
  'clopidogrel',
  'heparin',
  'lovenox',
  'enoxaparin',
  'pradaxa',
  'dabigatran',
];

const REPORTER_TITLES = ['DSP', 'RN', 'LPN', 'CNA', 'QIDP', 'STAFF'];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function extractEventTime(input: string): string | null {
  return parseDocumentedEventTime(input);
}

function extractReporterName(input: string): string | null {
  const match = input.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*(?:DSP|RN|LPN|CNA|QIDP|staff)\b/);
  return match ? match[1] : null;
}

function extractReporterTitle(input: string): string | null {
  const namedMatch = input.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*(DSP|RN|LPN|CNA|QIDP)\b/i);
  if (namedMatch) return namedMatch[1].toUpperCase();

  const titleMatch = input.match(
    /\b(?:at\s+\d+[,\s]+)?(DSP|RN|LPN|CNA|QIDP|staff)\s+reported\b/i,
  );
  if (titleMatch) return titleMatch[1].toUpperCase();

  return null;
}

function extractHeadImpactLocation(input: string): string | null {
  const sideMatch = input.match(/\b((?:left|right)\s+side of the head)\b/i);
  if (sideMatch) return sideMatch[1].toLowerCase();

  const regionMatch = input.match(/\b((?:left|right|back of the|fore)\s*head|scalp|forehead)\b/i);
  if (regionMatch) return regionMatch[1].toLowerCase();

  if (/\bstruck\s+(?:the\s+)?head\b/i.test(input) || /\bhit\s+(?:the\s+)?head\b/i.test(input)) {
    return 'head';
  }

  return null;
}

function extractMechanism(input: string): string | null {
  const struckMatch = input.match(
    /\bstruck\s+(?:the\s+)?(?:(?:left|right)\s+side of the\s+)?head\s+on\s+([^.,]+)/i,
  );
  if (struckMatch) return normalizeWhitespace(struckMatch[1]);

  const hitMatch = input.match(/\bhit\s+(?:the\s+)?head\s+(?:on|against)\s+([^.,]+)/i);
  if (hitMatch) return normalizeWhitespace(hitMatch[1]);

  const fallMatch = input.match(/\b(?:unwitnessed\s+)?fall[^.,]*/i);
  if (fallMatch) return normalizeWhitespace(fallMatch[0]);

  return null;
}

function extractPain(input: string): { present: boolean | null; description: string | null } {
  if (/\b(?:denied|denies)\s+pain\b/i.test(input)) {
    return { present: false, description: 'pain denied' };
  }

  const headacheMatch = input.match(/\b((?:mild|moderate|severe)\s+headache)\b/i);
  if (headacheMatch) {
    return { present: true, description: headacheMatch[1].toLowerCase() };
  }

  const reportedPainMatch = input.match(/\breported\s+((?:mild|moderate|severe)\s+headache)\b/i);
  if (reportedPainMatch) {
    return { present: true, description: reportedPainMatch[1].toLowerCase() };
  }

  const painMatch = input.match(/\b(?:pain|headache|discomfort)\b/i);
  if (painMatch && !/\bno\s+(?:pain|headache)\b/i.test(input)) {
    const detail = input.match(/\b((?:mild|moderate|severe)?\s*(?:pain|headache|discomfort))\b/i);
    return { present: true, description: detail ? detail[1].toLowerCase() : 'pain reported' };
  }

  return { present: null, description: null };
}

function extractLossOfConsciousness(input: string): boolean | null {
  if (/\bno loss of consciousness\b/i.test(input) || /\bwithout loss of consciousness\b/i.test(input)) {
    return false;
  }
  if (/\b(?:denies|denied)\s+(?:loc|loss of consciousness)\b/i.test(input)) {
    return false;
  }
  if (/\bloss of consciousness\b/i.test(input) || /\b(?:was|became)\s+unconscious\b/i.test(input)) {
    return true;
  }
  return null;
}

function extractMedications(input: string): string[] {
  const lower = input.toLowerCase();
  const found = ANTICOAGULANT_MEDICATIONS.filter((med) => lower.includes(med));
  return [...new Set(found.map((med) => med.charAt(0).toUpperCase() + med.slice(1)))];
}

function extractPupilAssessment(input: string): string | null {
  const match = input.match(/\bpupils?\s+(equal and reactive|unequal|nonreactive|non-reactive|[^.,]+)/i);
  if (!match) return null;
  return normalizeWhitespace(match[0]);
}

function extractVitalSigns(input: string): string | null {
  const match = input.match(
    /\b(?:vital signs|vitals|bp|blood pressure|heart rate|respiratory rate|temp|temperature|spo2)[^.,]*/i,
  );
  return match ? normalizeWhitespace(match[0]) : null;
}

function extractNeurologicalAssessment(input: string): string | null {
  if (extractPupilAssessment(input)) return null;
  const match = input.match(
    /\b(?:neuro(?:logical)? assessment|neurologic(?:al)? status|gcs|mental status)[^.,]*/i,
  );
  return match ? normalizeWhitespace(match[0]) : null;
}

function extractVisibleInjury(input: string): string | null {
  const noInjury = input.match(/\bno visible injury(?: noted)?\b/i);
  if (noInjury) return noInjury[0];

  const injuryMatch = input.match(
    /\b(?:visible injury|bruise|bruising|laceration|abrasion|swelling|hematoma|contusion|skin (?:tear|breakdown))[^.,]*/i,
  );
  return injuryMatch ? normalizeWhitespace(injuryMatch[0]) : null;
}

function extractProviderNotification(input: string): string | null {
  if (/\b(?:pcp|provider|physician|doctor)\s+(?:was\s+)?notified\b/i.test(input)) {
    const match = input.match(/\b(?:pcp|provider|physician|doctor)\s+(?:was\s+)?notified[^.,]*/i);
    return match ? normalizeWhitespace(match[0]) : 'notified';
  }
  if (/\bnot notified\b/i.test(input) || /\bno (?:pcp|provider) notification\b/i.test(input)) {
    return 'not notified';
  }
  return null;
}

function extractLarNotification(input: string): string | null {
  if (/\b(?:lar|guardian|family)\s+(?:was\s+)?notified\b/i.test(input)) {
    return 'notified';
  }
  if (/\b(?:lar|guardian|family)\s+not notified\b/i.test(input)) {
    return 'not notified';
  }
  return null;
}

const NURSING_INTERVENTIONS_COMPLETED_PATTERNS = [
  /\bnursing interventions completed\b/i,
  /\bnursing interventions were completed\b/i,
  /\binterventions completed\b/i,
  /간호\s*중재\s*완료/i,
  /(?:널싱|nursing)\s*인터벤션\s*완료/i,
  /\bnursing intervention(?:s)?\s+(?:completed|했음|완료)\b/i,
];

const STAFF_UNDERSTANDING_CONFIRMED_PATTERNS = [
  /\bstaff verbalized\b/i,
  /\bstaff demonstrated\b/i,
  /\bdsp verbalized\b/i,
  /\bstaff verbalized understanding\b/i,
  /직원이\s*이해(?:했다|함)/i,
  /직원(?:이|은)\s*.*이해(?:했다|함)/i,
];

export function detectNursingInterventionsCompleted(input: string): boolean {
  return NURSING_INTERVENTIONS_COMPLETED_PATTERNS.some((pattern) => pattern.test(input));
}

export function detectStaffUnderstandingConfirmed(input: string): boolean {
  return STAFF_UNDERSTANDING_CONFIRMED_PATTERNS.some((pattern) => pattern.test(input));
}

function extractStaffEducation(input: string): string | null {
  const match = input.match(
    /\bstaff (?:verbalized|demonstrated)[^.,]*|(?:staff|dsp)[^.,]*understanding[^.,]*/i,
  );
  if (match) return normalizeWhitespace(match[0]);

  if (/직원에게\s*교육(?:함|했)/i.test(input) || /dsp(?:에게|한테)\s*.*(?:설명|교육)(?:함|했)/i.test(input)) {
    return 'Staff education provided';
  }

  return null;
}

function extractLocation(input: string): string | null {
  const match = input.match(/\b(?:in the|on the|at the)\s+(bedroom|bathroom|hallway|dining room|room|floor)[^.,]*/i);
  return match ? normalizeWhitespace(match[0]) : null;
}

function inferEventType(input: string, guidelineId?: GuidelineId): string | null {
  if (guidelineId === 'head_injury' || /\bhead (?:injury|impact|strike)\b/i.test(input) || /\bstruck\s+(?:the\s+)?(?:left|right)?\s*(?:side of the\s+)?head\b/i.test(input)) {
    return 'head injury';
  }
  if (guidelineId === 'fall' || /\bfall\b|\bfell\b/i.test(input)) {
    return 'fall';
  }
  return null;
}

function extractReporterReport(input: string): string | null {
  const match = input.match(/\breported that\b[^.]+\./i);
  return match ? normalizeWhitespace(match[0].replace(/\.$/, '')) : null;
}

/**
 * Deterministically extract structured clinical facts from free-text input.
 * Does not infer undocumented findings.
 */
export function extractClinicalFacts(input: string, guidelineId?: GuidelineId): ClinicalFacts {
  const text = normalizeWhitespace(input);
  if (!text) return { ...EMPTY_CLINICAL_FACTS };

  const pain = extractPain(text);
  const medications = extractMedications(text);
  const headImpactLocation = extractHeadImpactLocation(text);
  const headImpact =
    headImpactLocation !== null
    || /\b(struck|hit|bumped)\s+(?:the\s+)?(?:left|right|side of the\s+)?head\b/i.test(text)
    || /\bhead (?:strike|impact|injury)\b/i.test(text)
      ? true
      : null;

  return {
    eventTime: extractEventTime(text),
    reporterName: extractReporterName(text),
    reporterTitle: extractReporterTitle(text),
    eventType: inferEventType(text, guidelineId),
    headImpact,
    headImpactLocation,
    mechanism: extractMechanism(text),
    painPresent: pain.present,
    painDescription: pain.description,
    lossOfConsciousness: extractLossOfConsciousness(text),
    anticoagulantUse: medications.length > 0 ? true : null,
    medications,
    pupilAssessment: extractPupilAssessment(text),
    vitalSigns: extractVitalSigns(text),
    neurologicalAssessment: extractNeurologicalAssessment(text),
    visibleInjury: extractVisibleInjury(text),
    pirCompleted: /\bpir completed\b/i.test(text) ? true : /\bpir\b/i.test(text) ? null : null,
    nursingInterventionsCompleted: detectNursingInterventionsCompleted(text) ? true : null,
    providerNotification: extractProviderNotification(text),
    larNotification: extractLarNotification(text),
    staffEducation: extractStaffEducation(text),
    location: extractLocation(text),
    unwitnessedFall: /\bunwitnessed fall\b/i.test(text) ? true : null,
    reporterReport: extractReporterReport(text),
  };
}

export function formatReporterLead(facts: ClinicalFacts): string {
  const parts: string[] = [];
  if (facts.eventTime) parts.push(`At ${facts.eventTime}`);
  if (facts.reporterName && facts.reporterTitle) {
    parts.push(`${facts.reporterName}, ${facts.reporterTitle}, reported`);
  } else if (facts.reporterTitle) {
    parts.push(`${facts.reporterTitle} reported`);
  } else if (facts.reporterName) {
    parts.push(`${facts.reporterName} reported`);
  }
  return parts.join(', ');
}

export function hasReporterTitle(facts: ClinicalFacts): boolean {
  return Boolean(facts.reporterTitle && REPORTER_TITLES.includes(facts.reporterTitle.toUpperCase()));
}
