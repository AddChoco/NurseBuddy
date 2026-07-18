import type { GuidelineId } from '../types';
import type { AssessmentType } from './facilityTemplateMode';
import { detectAssessmentType } from './facilityTemplateMode';
import {
  extractClinicalFacts,
  formatReporterLead,
  type ClinicalFacts,
} from './clinicalFactExtraction';
import {
  getGuidelineRequirementConfig,
  type AssessmentFieldKey,
  type GuidelineRequirementConfig,
} from './guidelineRequirementConfigs';
import { lookupGuidelineByDisplayName } from './guidelineDefinitions';
import { GUIDELINE_DEFINITIONS } from './guidelineDefinitions';
import {
  formatSoapDocument,
  formatSbarDocument,
  resolveTerminology,
  type StructuredSoap,
  type StructuredSbar,
} from '../lib/structuredDocumentation';

export interface DocumentationCompletenessCheck {
  provided: string[];
  missing: string[];
}

export interface DeterministicDocumentationResult {
  facts: ClinicalFacts;
  soap: StructuredSoap;
  soapText: string;
  sbar?: StructuredSbar;
  sbarText?: string;
  completeness: DocumentationCompletenessCheck;
  validationErrors: string[];
}

const FIELD_PROVIDED_MESSAGES: Record<AssessmentFieldKey, (facts: ClinicalFacts) => string | null> = {
  eventTime: (facts) => (facts.eventTime ? `Event time provided: ${facts.eventTime}` : null),
  reporterName: (facts) => (facts.reporterName ? `Reporter name provided: ${facts.reporterName}` : null),
  reporterTitle: (facts) => (facts.reporterTitle ? `Reporter title provided: ${facts.reporterTitle}` : null),
  mechanism: (facts) => (facts.mechanism ? 'Mechanism provided' : null),
  headImpact: (facts) => (facts.headImpact ? 'Head impact confirmed' : null),
  headImpactLocation: (facts) => (facts.headImpactLocation ? 'Head-impact location provided' : null),
  painAssessment: (facts) => {
    if (facts.painPresent === true) return `Pain symptom provided${facts.painDescription ? `: ${facts.painDescription}` : ''}`;
    if (facts.painPresent === false) return 'Pain assessment provided: pain denied';
    return null;
  },
  lossOfConsciousness: (facts) => {
    if (facts.lossOfConsciousness === false) return 'Loss-of-consciousness status provided: no loss of consciousness reported';
    if (facts.lossOfConsciousness === true) return 'Loss-of-consciousness status provided: loss of consciousness reported';
    return null;
  },
  vitalSigns: (facts) => (facts.vitalSigns ? `Vital signs provided: ${facts.vitalSigns}` : null),
  neurologicalAssessment: (facts) =>
    facts.neurologicalAssessment ? `Complete neurological assessment provided: ${facts.neurologicalAssessment}` : null,
  pupilAssessment: (facts) => (facts.pupilAssessment ? `Pupil assessment provided: ${facts.pupilAssessment}` : null),
  visibleInjury: (facts) => (facts.visibleInjury ? `Visible injury/skin assessment provided: ${facts.visibleInjury}` : null),
  anticoagulantOrAntiplateletUse: (facts) =>
    facts.anticoagulantUse ? `Anticoagulant use provided: ${facts.medications.join(', ')}` : null,
  providerNotification: (facts) =>
    facts.providerNotification ? `Provider notification status provided: ${facts.providerNotification}` : null,
  LARNotification: (facts) =>
    facts.larNotification ? `LAR notification status provided: ${facts.larNotification}` : null,
  pirStatus: (facts) => (facts.pirCompleted ? 'PIR status provided: completed' : null),
  nursingInterventionStatus: (facts) =>
    facts.nursingInterventionsCompleted ? 'Nursing intervention status provided: completed' : null,
  staffEducation: (facts) => (facts.staffEducation ? `Staff education provided: ${facts.staffEducation}` : null),
};

const FIELD_MISSING_MESSAGES: Record<AssessmentFieldKey, string> = {
  eventTime: 'Event time not provided',
  reporterName: 'Reporter name not provided',
  reporterTitle: 'Reporter title not provided',
  mechanism: 'Mechanism not provided',
  headImpact: 'Head impact status not provided',
  headImpactLocation: 'Head-impact location not provided',
  painAssessment: 'Pain assessment not provided',
  lossOfConsciousness: 'Loss-of-consciousness status not provided',
  vitalSigns: 'Vital signs not provided',
  neurologicalAssessment: 'Complete neurological assessment not provided',
  pupilAssessment: 'Pupil assessment not provided',
  visibleInjury: 'Visible injury/skin assessment not provided',
  anticoagulantOrAntiplateletUse: 'Anticoagulant or antiplatelet use not provided',
  providerNotification: 'Provider notification status not provided',
  LARNotification: 'LAR notification status not provided',
  pirStatus: 'PIR status not provided',
  nursingInterventionStatus: 'Nursing intervention status not provided',
  staffEducation: 'Staff education completion not provided',
};

const SUPPLEMENTAL_TRACKED_FIELDS: AssessmentFieldKey[] = [
  'reporterName',
  'reporterTitle',
  'headImpact',
  'pirStatus',
  'nursingInterventionStatus',
  'staffEducation',
];

export function evaluateGuidelineRequirements(
  facts: ClinicalFacts,
  config: GuidelineRequirementConfig,
): DocumentationCompletenessCheck {
  const provided: string[] = [];
  const missing: string[] = [];
  const fieldsToEvaluate = [...new Set([...config.requiredAssessmentFields, ...SUPPLEMENTAL_TRACKED_FIELDS])];

  for (const field of fieldsToEvaluate) {
    const providedMessage = FIELD_PROVIDED_MESSAGES[field](facts);
    if (providedMessage) {
      if (!provided.includes(providedMessage)) provided.push(providedMessage);
    } else if (config.requiredAssessmentFields.includes(field) || SUPPLEMENTAL_TRACKED_FIELDS.includes(field)) {
      const missingMessage = FIELD_MISSING_MESSAGES[field];
      if (!missing.includes(missingMessage)) missing.push(missingMessage);
    }
  }

  return { provided, missing };
}

function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildHeadInjurySubjective(facts: ClinicalFacts, term: string): string {
  const sentences: string[] = [];
  const lead = formatReporterLead(facts);

  if (lead && facts.headImpactLocation && facts.mechanism) {
    sentences.push(
      `${lead} that the ${term} struck the ${facts.headImpactLocation} on ${facts.mechanism}.`,
    );
  } else if (lead && facts.reporterReport) {
    sentences.push(`${lead} ${facts.reporterReport.replace(/^reported that\s+/i, 'that ')}.`);
  } else if (lead) {
    sentences.push(`${lead} a head injury event.`);
  }

  const symptomParts: string[] = [];
  if (facts.painPresent === true && facts.painDescription) {
    symptomParts.push(`a ${facts.painDescription}`);
  } else if (facts.painPresent === true) {
    symptomParts.push('pain');
  }
  if (facts.lossOfConsciousness === false) {
    symptomParts.push('no loss of consciousness');
  } else if (facts.lossOfConsciousness === true) {
    symptomParts.push('loss of consciousness');
  }

  if (symptomParts.length > 0) {
    sentences.push(`The ${term} reported ${symptomParts.join(' and ')}.`);
  }

  return sentences.join(' ');
}

function buildHeadInjuryObjective(facts: ClinicalFacts, term: string): string {
  const parts: string[] = [];

  if (facts.pupilAssessment) {
    const pupilText = capitalizeFirst(facts.pupilAssessment.replace(/^pupils?\s+/i, 'Pupils were '));
    parts.push(pupilText.endsWith('.') ? pupilText : `${pupilText}.`);
  }

  if (facts.medications.length > 0) {
    parts.push(`The ${term} is currently receiving ${facts.medications.join(' and ')}.`);
  }

  if (facts.vitalSigns) {
    parts.push(capitalizeFirst(facts.vitalSigns) + '.');
  }

  if (facts.visibleInjury) {
    parts.push(capitalizeFirst(facts.visibleInjury) + '.');
  }

  const completedActions: string[] = [];
  if (facts.pirCompleted) completedActions.push('PIR');
  if (facts.nursingInterventionsCompleted) completedActions.push('nursing interventions');

  if (completedActions.length > 0) {
    parts.push(`${completedActions.join(' and ')} were completed.`);
  }

  return parts.join(' ');
}

function buildHeadInjuryAssessment(
  facts: ClinicalFacts,
  config: GuidelineRequirementConfig,
  completeness: DocumentationCompletenessCheck,
): string {
  const parts: string[] = [];

  if (facts.headImpactLocation) {
    let sentence = `${config.assessmentLabel} involving the ${facts.headImpactLocation}`;
    if (facts.painDescription) {
      sentence += ` with reported ${facts.painDescription}`;
    }
    if (facts.lossOfConsciousness === false) {
      sentence += ' and no reported loss of consciousness';
    }
    parts.push(`${sentence}.`);
  } else {
    parts.push(`${config.assessmentLabel} documented per reported event.`);
  }

  if (facts.medications.length > 0) {
    parts.push(`Current ${facts.medications.join(' and ')} use increases concern for bleeding complications.`);
  }

  const missingAssessmentNotes = completeness.missing.filter((message) =>
    [
      'Vital signs not provided',
      'Complete neurological assessment not provided',
      'Visible injury/skin assessment not provided',
    ].includes(message),
  );

  if (missingAssessmentNotes.length > 0) {
    const readable = missingAssessmentNotes
      .map((message) => message.replace(' not provided', '').toLowerCase())
      .join(', ');
    parts.push(`${capitalizeFirst(readable)} were not provided.`);
  }

  return parts.join(' ');
}

function buildHeadInjuryPlan(
  facts: ClinicalFacts,
  config: GuidelineRequirementConfig,
): string {
  const parts: string[] = [];

  if (facts.pirCompleted) {
    parts.push('PIR completed.');
  }

  if (facts.nursingInterventionsCompleted) {
    parts.push(`Nursing interventions completed per ${config.guidelineNameInPlan}.`);
  }

  parts.push(config.monitoringScheduleFallback);

  if (facts.medications.length > 0 && config.anticoagulantPlanNote) {
    parts.push(
      config.anticoagulantPlanNote.replace('{medication}', facts.medications.join(' and ')),
    );
  }

  if (config.staffMonitoringInstructions) {
    parts.push(config.staffMonitoringInstructions);
  }

  if (!facts.providerNotification && !facts.larNotification) {
    parts.push('Provider and LAR notification status were not provided.');
  } else {
    if (!facts.providerNotification) parts.push('Provider notification status was not provided.');
    if (!facts.larNotification) parts.push('LAR notification status was not provided.');
  }

  return parts.join(' ');
}

function buildFallSubjective(facts: ClinicalFacts, term: string): string {
  const lead = formatReporterLead(facts);
  const sentences: string[] = [];

  if (lead && facts.location) {
    sentences.push(
      `${lead} that the ${term} was found ${facts.location.replace(/^in the |^on the /i, '')} following an unwitnessed fall.`,
    );
  } else if (lead && facts.unwitnessedFall) {
    sentences.push(`${lead} an unwitnessed fall involving the ${term}.`);
  } else if (lead) {
    sentences.push(`${lead} a fall event involving the ${term}.`);
  }

  if (facts.painPresent === false) {
    sentences.push(`The ${term} denied pain.`);
  } else if (facts.painPresent === true && facts.painDescription) {
    sentences.push(`The ${term} reported ${facts.painDescription}.`);
  }

  return sentences.join(' ');
}

function buildFallObjective(facts: ClinicalFacts, term: string): string {
  const parts: string[] = ['The individual was observed after the reported fall.'];

  if (facts.visibleInjury) {
    parts.push(capitalizeFirst(facts.visibleInjury) + '.');
  }

  if (facts.medications.length > 0) {
    parts.push(`The ${term} is currently receiving ${facts.medications.join(' and ')}.`);
  }

  return parts.join(' ');
}

function buildFallAssessment(facts: ClinicalFacts, completeness: DocumentationCompletenessCheck): string {
  let assessment = 'Unwitnessed fall';
  if (facts.painPresent === false) assessment += ' without reported pain';
  if (facts.visibleInjury?.toLowerCase().includes('no visible injury')) {
    assessment += ' or visible injury';
  }
  assessment += ' at the time of assessment.';

  const missingNotes = completeness.missing.filter((message) =>
    ['Vital signs not provided', 'Complete neurological assessment not provided'].includes(message),
  );
  if (missingNotes.length > 0) {
    return `${assessment.replace(/\.$/, '')}. ${capitalizeFirst(missingNotes.map((m) => m.replace(' not provided', '')).join(' and '))} were not provided.`;
  }

  return assessment;
}

function buildFallPlan(facts: ClinicalFacts, config: GuidelineRequirementConfig): string {
  const parts: string[] = [];

  if (facts.pirCompleted) parts.push('PIR completed.');
  if (facts.nursingInterventionsCompleted) {
    parts.push(`Nursing interventions completed per ${config.guidelineNameInPlan}.`);
  }
  if (facts.staffEducation) {
    parts.push(`${capitalizeFirst(facts.staffEducation)}.`);
  } else {
    parts.push('Fall precautions reviewed with staff as applicable.');
  }
  parts.push(config.monitoringScheduleFallback);

  if (!facts.providerNotification && !facts.larNotification) {
    parts.push('Provider and LAR notification status were not provided.');
  }

  return parts.join(' ');
}

function buildDeterministicSoap(
  facts: ClinicalFacts,
  config: GuidelineRequirementConfig,
  completeness: DocumentationCompletenessCheck,
  terminology: string,
): StructuredSoap {
  const term = resolveTerminology(terminology);

  if (config.guidelineId === 'head_injury') {
    return {
      subjective: buildHeadInjurySubjective(facts, term),
      objective: buildHeadInjuryObjective(facts, term),
      assessment: buildHeadInjuryAssessment(facts, config, completeness),
      plan: buildHeadInjuryPlan(facts, config),
    };
  }

  if (config.guidelineId === 'fall') {
    return {
      subjective: buildFallSubjective(facts, term),
      objective: buildFallObjective(facts, term),
      assessment: buildFallAssessment(facts, completeness),
      plan: buildFallPlan(facts, config),
    };
  }

  return {
    subjective: formatReporterLead(facts) || 'Event reported.',
    objective: facts.pupilAssessment || facts.visibleInjury || 'See Interactive View Assessment.',
    assessment: config.assessmentLabel,
    plan: config.monitoringScheduleFallback,
  };
}

function buildDeterministicSbar(
  facts: ClinicalFacts,
  config: GuidelineRequirementConfig,
  soap: StructuredSoap,
  terminology: string,
): StructuredSbar {
  const term = resolveTerminology(terminology);

  if (config.guidelineId === 'head_injury') {
    return {
      situation: soap.subjective.split('.')[0] + '.',
      background: facts.medications.length > 0
        ? `The ${term} is currently receiving ${facts.medications.join(' and ')}.`
        : 'No additional background provided.',
      assessment: [
        facts.pupilAssessment ? capitalizeFirst(facts.pupilAssessment) + '.' : null,
        facts.painDescription ? `Reported ${facts.painDescription}.` : null,
        facts.lossOfConsciousness === false ? 'No loss of consciousness reported.' : null,
        facts.pirCompleted && facts.nursingInterventionsCompleted
          ? 'PIR and nursing interventions were completed.'
          : null,
        !facts.vitalSigns ? 'Vital signs were not provided.' : capitalizeFirst(facts.vitalSigns) + '.',
      ].filter(Boolean).join(' '),
      recommendation: [
        config.monitoringScheduleFallback,
        facts.medications.length > 0 && config.anticoagulantPlanNote
          ? config.anticoagulantPlanNote.replace('{medication}', facts.medications.join(' and '))
          : null,
        config.staffMonitoringInstructions,
        !facts.providerNotification ? 'Provider notification status was not provided.' : null,
      ].filter(Boolean).join(' '),
    };
  }

  return {
    situation: soap.subjective.split('.')[0] + '.',
    background: facts.medications.length > 0
      ? `The ${term} is currently receiving ${facts.medications.join(' and ')}.`
      : 'No additional background provided.',
    assessment: soap.assessment,
    recommendation: soap.plan,
  };
}

const UNSUPPORTED_FREQUENCY_PATTERN =
  /\bevery\s+(?:10|15|30)\s+minutes\b|\bevery\s+(?:1|2|4|8)\s+hours\b|\bq\d+h\b|\bq\d+\b/i;

export function validateDeterministicOutput(
  facts: ClinicalFacts,
  soap: StructuredSoap,
  config: GuidelineRequirementConfig,
  completeness: DocumentationCompletenessCheck,
  sbar?: StructuredSbar,
): string[] {
  const errors: string[] = [];
  const combinedOutput = [soap.subjective, soap.objective, soap.assessment, soap.plan, sbar?.recommendation]
    .filter(Boolean)
    .join('\n');

  if (facts.eventTime && !combinedOutput.includes(facts.eventTime)) {
    errors.push('Event time supplied in the source is missing from the final note');
  }

  for (const medication of facts.medications) {
    if (!combinedOutput.toLowerCase().includes(medication.toLowerCase())) {
      errors.push(`Medication supplied in the source is missing: ${medication}`);
    }
  }

  if (facts.pirCompleted && !/\bpir completed\b/i.test(soap.plan)) {
    errors.push('PIR completed was omitted from the Plan');
  }

  if (facts.nursingInterventionsCompleted && !/nursing interventions completed/i.test(soap.plan)) {
    errors.push('Nursing interventions completed were omitted from the Plan');
  }

  for (const providedMessage of completeness.provided) {
    const contradictoryMissing = completeness.missing.find((missingMessage) => {
      if (providedMessage.startsWith('Event time provided') && missingMessage === 'Event time not provided') return true;
      if (providedMessage.startsWith('Reporter title provided') && missingMessage === 'Reporter title not provided') return true;
      if (providedMessage.startsWith('Reporter name provided') && missingMessage === 'Reporter name not provided') return true;
      if (providedMessage === 'Head impact confirmed' && missingMessage === 'Head impact status not provided') return true;
      if (providedMessage === 'Head-impact location provided' && missingMessage === 'Head-impact location not provided') return true;
      if (providedMessage.startsWith('Pain symptom provided') && missingMessage === 'Pain assessment not provided') return true;
      if (providedMessage.startsWith('Loss-of-consciousness status provided') && missingMessage === 'Loss-of-consciousness status not provided') return true;
      if (providedMessage.startsWith('Anticoagulant use provided') && missingMessage === 'Anticoagulant or antiplatelet use not provided') return true;
      if (providedMessage.startsWith('Pupil assessment provided') && missingMessage === 'Pupil assessment not provided') return true;
      if (providedMessage.startsWith('PIR status provided') && missingMessage === 'PIR status not provided') return true;
      if (providedMessage.startsWith('Nursing intervention status provided') && missingMessage === 'Nursing intervention status not provided') return true;
      return false;
    });
    if (contradictoryMissing) {
      errors.push(`Quality check contradicts source input: ${contradictoryMissing}`);
    }
  }

  if (!facts.providerNotification && /\b(?:pcp|provider|lar).{0,20}notified\b/i.test(soap.plan)) {
    errors.push('Provider or LAR notification documented as completed without source support');
  }

  if (!soap.subjective.trim() || !soap.objective.trim() || !soap.assessment.trim() || !soap.plan.trim()) {
    errors.push('A required SOAP section is empty');
  }

  if (config.staffMonitoringInstructions && !soap.plan.includes(config.staffMonitoringInstructions.slice(0, 40))) {
    errors.push('Required staff monitoring/reporting instructions are absent from the Plan');
  }

  if (UNSUPPORTED_FREQUENCY_PATTERN.test(combinedOutput) && !/\bevery\s+(?:10|15|30)\s+minutes\b|\bevery\s+(?:1|2|4|8)\s+hours\b/i.test(config.monitoringScheduleFallback)) {
    errors.push('Unsupported monitoring frequency was added');
  }

  if (facts.reporterTitle && combinedOutput.includes('Reporter name/title not provided')) {
    errors.push('Reporter title incorrectly marked missing');
  }

  return errors;
}

export function generateDeterministicDocumentation(
  input: string,
  guidelineId: GuidelineId,
  assessmentType: AssessmentType,
  terminology: string,
  includeSbar = false,
): DeterministicDocumentationResult | null {
  const config = getGuidelineRequirementConfig(guidelineId, assessmentType);
  if (!config) return null;

  const facts = extractClinicalFacts(input, guidelineId);
  const completeness = evaluateGuidelineRequirements(facts, config);
  const soap = buildDeterministicSoap(facts, config, completeness, terminology);
  const soapText = formatSoapDocument(soap);
  const sbar = includeSbar ? buildDeterministicSbar(facts, config, soap, terminology) : undefined;
  const sbarText = sbar ? formatSbarDocument(sbar) : undefined;
  const validationErrors = validateDeterministicOutput(facts, soap, config, completeness, sbar);

  return {
    facts,
    soap,
    soapText,
    sbar,
    sbarText,
    completeness,
    validationErrors,
  };
}

export function generateDeterministicDocumentationFromDisplayName(
  guidelineDisplayName: string,
  clinicalInfo: string,
  supplementText: string,
  terminology: string,
  includeSbar = false,
): DeterministicDocumentationResult | null {
  const def = lookupGuidelineByDisplayName(guidelineDisplayName);
  if (!def) return null;

  const combinedInput = [clinicalInfo, supplementText !== 'None provided.' ? supplementText : '']
    .filter(Boolean)
    .join('\n');
  const assessmentType = detectAssessmentType(combinedInput);

  return generateDeterministicDocumentation(
    combinedInput,
    def.id,
    assessmentType,
    terminology,
    includeSbar,
  );
}

export function toDeterministicQualityCheck(result: DeterministicDocumentationResult) {
  return {
    templateFollowed: result.validationErrors.length === 0,
    unsupportedStatementsRemoved: result.validationErrors,
    messages: [...result.completeness.provided, ...result.completeness.missing],
    completeness: result.completeness,
  };
}

export function resolveGuidelineIdFromDisplayName(displayName: string): GuidelineId | undefined {
  return GUIDELINE_DEFINITIONS.find((def) => def.displayName === displayName)?.id;
}
