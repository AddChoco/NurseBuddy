import type { GuidelineId } from '../types';
import type { GuidelineDefinition } from './types';
import type { AssessmentType } from './facilityTemplateMode';
import {
  detectNursingInterventionsCompleted,
  extractClinicalFacts,
  type ClinicalFacts,
} from './clinicalFactExtraction';
import {
  extractPlanStandingInstructions,
  getFacilityFormTemplate,
} from './facilityFormTemplates';
import {
  extractDocumentedPositioning,
  orderNursingInterventions,
} from './interventionSequencing';

export interface PlanEnrichmentInput {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface PlanDocumentationContext {
  input: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  facts: ClinicalFacts;
}

export interface InterventionRule {
  text: string;
  patterns: RegExp[];
}

export interface GuidelinePlanRuleSet {
  interventionRules: InterventionRule[];
  staffUnderstandingText: string;
  completionFallback?: string;
}

export interface PlanRuleEvaluation {
  nursingInterventions: string[];
  nursingInterventionsSummary: string | null;
  staffUnderstandingText: string | null;
  staffEducationApplicable: boolean;
}

const PROMPT_LINE_PATTERN = /^([^:\n]+):\s*(.*)$/;

function intervention(text: string, patterns: RegExp[]): InterventionRule {
  return { text, patterns };
}

const COMMON = {
  nursingAssessmentCompleted: intervention('Nursing assessment completed.', [
    /\bnursing assessment completed\b/i,
    /\bnursing assessment\b/i,
    /\b(?:resident|individual|patient|client) assessed\b/i,
    /\bfollow-up assessment completed\b/i,
    /\bassessment completed\b/i,
  ]),
  vitalSigns: intervention('Vital signs obtained.', [
    /\bvital signs\b/i,
    /\bvitals\b/i,
    /\bblood pressure\b/i,
    /\bheart rate\b/i,
    /\brespiratory rate\b/i,
    /\bspo2\b/i,
  ]),
  neurological: intervention('Neurological assessment completed.', [
    /\bneurological assessment\b/i,
    /\bneurologic(?:al)? status\b/i,
    /\bmental status\b/i,
    /\bgcs\b/i,
  ]),
  skin: intervention('Skin assessment completed.', [
    /\bskin assessment\b/i,
    /\bbruising\b/i,
    /\bvisible injury\b/i,
    /\bskin condition\b/i,
    /\bno visible injury\b/i,
  ]),
  pain: intervention('Pain assessment completed.', [
    /\bpain assessment\b/i,
    /\b(?:denies|denied|reports?|complains? of)\s+pain\b/i,
    /\bpain level\b/i,
    /\bpain scale\b/i,
  ]),
  mobility: intervention('Mobility assessment completed.', [
    /\bmobility assessment\b/i,
    /\bambulat/i,
    /\bwalker\b/i,
    /\bgait\b/i,
    /\btransfer status\b/i,
    /\brange of motion\b/i,
  ]),
  temperatureReassessed: intervention('Temperature reassessed.', [
    /\b(?:temp(?:erature)?|temperature)\s*(?:re)?(?:assess|check|monitor)\b/i,
    /\breassessed(?:\s+temperature)?\b/i,
    /\bcurrent temperature\b/i,
  ]),
  abdominal: intervention('Abdominal assessment completed.', [
    /\babdominal assessment\b/i,
    /\babdomen\b/i,
    /\babdominal distention\b/i,
    /\babdominal pain\b/i,
    /\bsoft and non-tender\b/i,
  ]),
  intakeOutput: intervention('Intake and output reviewed.', [
    /\bintake.?output\b/i,
    /\bi&o\b/i,
    /\bi\/o\b/i,
    /\bintake and output\b/i,
    /\bfluid balance\b/i,
  ]),
  monitoringInitiated: intervention('Ongoing monitoring initiated.', [
    /\bmonitor(?:ing)? initiated\b/i,
    /\bongoing monitoring\b/i,
    /\bcontinue(?:d)? monitoring\b/i,
    /\bmonitor(?:ing)? per guideline\b/i,
  ]),
  hydrationEncouraged: intervention('Hydration encouraged.', [
    /\bhydration encouraged\b/i,
    /\bfluids encouraged\b/i,
    /\bencourage fluids\b/i,
    /\bfluid intake\b/i,
    /\bprevent dehydration\b/i,
  ]),
  medicationEffectiveness: intervention('Medication effectiveness evaluated.', [
    /\bmedication effectiveness\b/i,
    /\b(?:antiemetic|analgesic|tylenol|acetaminophen|pain medication).*(?:effective|relief|response|evaluated)\b/i,
    /\beffectiveness of (?:pain|antiemetic|medication)\b/i,
    /\bresponse to (?:medication|intervention|tylenol|acetaminophen)\b/i,
  ]),
  comfortMeasures: intervention('Comfort measures provided.', [
    /\bcomfort measures\b/i,
    /\bcomfort intervention\b/i,
  ]),
  residentReassessed: intervention('Resident reassessed.', [
    /\b(?:resident|individual|patient|client) reassessed\b/i,
    /\breassessment completed\b/i,
    /\bnurse reassessment\b/i,
  ]),
  respiratory: intervention('Respiratory assessment completed.', [
    /\brespiratory assessment\b/i,
    /\brespiratory status\b/i,
    /\blung sounds\b/i,
    /\brespirations\b/i,
    /\bshortness of breath\b/i,
    /\bsob\b/i,
    /\boxygen saturation\b/i,
  ]),
  infectionMonitoring: intervention('Resident monitored for infection symptoms.', [
    /\binfection symptoms\b/i,
    /\bsigns and symptoms of infection\b/i,
    /\bmonitor(?:ed|ing)? for infection\b/i,
  ]),
  fallFollowUpMonitoring: intervention('Fall follow-up monitoring initiated.', [
    /\bfall follow[- ]?up\b/i,
    /\bfollow[- ]?up monitoring\b/i,
    /\bcontinue assessment each shift\b/i,
  ]),
  prnTylenol: intervention('PRN Tylenol administered.', [
    /\b(?:prn\s+)?(?:tylenol|acetaminophen)\b[^.\n]*(?:administered|given|provided)\b/i,
  ]),
  oxygen: intervention('Oxygen administered.', [
    /\boxygen\b[^.\n]*(?:administered|provided|applied|started|therapy)\b/i,
  ]),
  nebulizer: intervention('Nebulizer treatment provided.', [
    /\bnebulizer\b[^.\n]*(?:administered|provided|treatment)\b/i,
  ]),
  suctioning: intervention('Suctioning performed.', [
    /\bsuction(?:ing)?\s+(?:performed|completed|provided)\b/i,
  ]),
  repositioned: intervention('Resident repositioned.', [
    /\brepositioned\b/i,
    /\bturned\b/i,
    /\bposition changed\b/i,
  ]),
};

const GUIDELINE_RULES: Record<GuidelineId, GuidelinePlanRuleSet> = {
  vomiting: {
    interventionRules: [
      COMMON.nursingAssessmentCompleted,
      COMMON.vitalSigns,
      COMMON.respiratory,
      COMMON.abdominal,
      COMMON.intakeOutput,
      COMMON.hydrationEncouraged,
      COMMON.monitoringInitiated,
      COMMON.medicationEffectiveness,
    ],
    staffUnderstandingText:
      'Staff verbalized understanding of vomiting monitoring, hydration, aspiration precautions, and reporting recurrent emesis.',
    completionFallback: 'Nursing interventions completed according to the Vomiting Guideline.',
  },
  fall: {
    interventionRules: [
      COMMON.neurological,
      COMMON.skin,
      COMMON.pain,
      COMMON.vitalSigns,
      COMMON.mobility,
      COMMON.fallFollowUpMonitoring,
      COMMON.repositioned,
    ],
    staffUnderstandingText:
      'Staff verbalized understanding of neurological monitoring, fall precautions, delayed symptom reporting, and provider notification requirements.',
    completionFallback: 'Nursing interventions completed according to the Fall or Suspected Fall Guideline.',
  },
  elevated_temperature: {
    interventionRules: [
      COMMON.temperatureReassessed,
      COMMON.vitalSigns,
      COMMON.medicationEffectiveness,
      COMMON.hydrationEncouraged,
      COMMON.infectionMonitoring,
      COMMON.prnTylenol,
      COMMON.monitoringInitiated,
    ],
    staffUnderstandingText:
      'Staff verbalized understanding of temperature monitoring, hydration, infection signs, medication response, and when to notify the nurse.',
    completionFallback: 'Nursing interventions completed according to the Elevated Temperature Guideline.',
  },
  pain: {
    interventionRules: [
      COMMON.pain,
      COMMON.medicationEffectiveness,
      COMMON.comfortMeasures,
      COMMON.residentReassessed,
      COMMON.vitalSigns,
      COMMON.monitoringInitiated,
    ],
    staffUnderstandingText:
      'Staff verbalized understanding of pain monitoring, reassessment, medication response, and reporting worsening pain.',
    completionFallback: 'Nursing interventions completed according to the Pain Guideline.',
  },
  respiratory: {
    interventionRules: [
      COMMON.nursingAssessmentCompleted,
      COMMON.vitalSigns,
      COMMON.respiratory,
      COMMON.oxygen,
      COMMON.nebulizer,
      COMMON.suctioning,
      COMMON.monitoringInitiated,
      COMMON.hydrationEncouraged,
    ],
    staffUnderstandingText:
      'Staff verbalized understanding of symptom monitoring, infection precautions, hydration, and provider notification.',
    completionFallback:
      'Nursing interventions completed according to the Respiratory Distress / Aspiration Guideline.',
  },
  head_injury: {
    interventionRules: [
      COMMON.nursingAssessmentCompleted,
      COMMON.neurological,
      COMMON.vitalSigns,
      COMMON.pain,
      COMMON.skin,
      COMMON.monitoringInitiated,
    ],
    staffUnderstandingText:
      'Staff verbalized understanding of neurological monitoring, delayed symptom reporting, fall precautions, and provider notification requirements.',
    completionFallback: 'Nursing interventions completed according to the Head Injury Guideline.',
  },
  uti: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.vitalSigns, COMMON.intakeOutput, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of UTI symptom monitoring, fluid intake, and reporting changes in urination or behavior.',
    completionFallback: 'Nursing interventions completed according to the UTI Guideline.',
  },
  suspected_fracture_dislocation: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.pain, COMMON.mobility, COMMON.vitalSigns, COMMON.skin, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of pain monitoring, neurovascular checks, immobilization precautions, and reporting changes.',
    completionFallback:
      'Nursing interventions completed according to the Suspected Fracture or Dislocation Guideline.',
  },
  skin_impairment: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.skin, COMMON.repositioned, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of skin monitoring, repositioning, wound changes, and reporting breakdown or infection signs.',
    completionFallback: 'Nursing interventions completed according to the Skin Impairment Guideline.',
  },
  adventitious_lung_sounds: {
    interventionRules: [COMMON.respiratory, COMMON.vitalSigns, COMMON.oxygen, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of respiratory monitoring, oxygen needs, and reporting worsening lung sounds or distress.',
    completionFallback:
      'Nursing interventions completed according to the Adventitious Lung Sounds Guideline.',
  },
  abdominal_distention_pain: {
    interventionRules: [COMMON.abdominal, COMMON.vitalSigns, COMMON.pain, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of abdominal symptom monitoring, bowel status, and reporting worsening pain or distention.',
    completionFallback:
      'Nursing interventions completed according to the Abdominal Distention / Pain Guideline.',
  },
  constipation: {
    interventionRules: [COMMON.abdominal, COMMON.intakeOutput, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of bowel monitoring, fluid intake, and reporting absence of bowel movement or abdominal changes.',
    completionFallback: 'Nursing interventions completed according to the Constipation Guideline.',
  },
  diarrhea: {
    interventionRules: [COMMON.abdominal, COMMON.intakeOutput, COMMON.hydrationEncouraged, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of diarrhea monitoring, hydration, skin protection, and reporting increased frequency or dehydration signs.',
    completionFallback: 'Nursing interventions completed according to the Diarrhea Guideline.',
  },
  enteral_feeding_tolerance: {
    interventionRules: [COMMON.abdominal, COMMON.intakeOutput, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of feeding tolerance monitoring, residuals, and reporting emesis, distention, or aspiration signs.',
    completionFallback:
      'Nursing interventions completed according to the Enteral Feeding Tolerance Guideline.',
  },
  enteral_tube_insertion: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.abdominal, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of tube site monitoring, feeding safety, and reporting dislodgement or respiratory changes.',
    completionFallback:
      'Nursing interventions completed according to the Enteral Tube Insertion Guideline.',
  },
  hypothermia: {
    interventionRules: [COMMON.temperatureReassessed, COMMON.vitalSigns, COMMON.monitoringInitiated, COMMON.comfortMeasures],
    staffUnderstandingText:
      'Staff verbalized understanding of temperature monitoring, warming measures, and reporting continued hypothermia or behavior changes.',
    completionFallback: 'Nursing interventions completed according to the Hypothermia Guideline.',
  },
  hypoglycemia: {
    interventionRules: [COMMON.vitalSigns, COMMON.monitoringInitiated, COMMON.medicationEffectiveness],
    staffUnderstandingText:
      'Staff verbalized understanding of blood glucose monitoring, hypoglycemia signs, and reporting recurrent low readings or altered mental status.',
    completionFallback: 'Nursing interventions completed according to the Hypoglycemia Guideline.',
  },
  hyperglycemia: {
    interventionRules: [COMMON.vitalSigns, COMMON.intakeOutput, COMMON.hydrationEncouraged, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of blood glucose monitoring, hydration, and reporting persistent hyperglycemia or ketosis signs.',
    completionFallback: 'Nursing interventions completed according to the Hyperglycemia Guideline.',
  },
  medication_change: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.monitoringInitiated, COMMON.medicationEffectiveness],
    staffUnderstandingText:
      'Staff verbalized understanding of medication monitoring, side effects, and reporting adverse reactions or missed doses.',
    completionFallback: 'Nursing interventions completed according to the Medication Change Guideline.',
  },
  seizure: {
    interventionRules: [COMMON.neurological, COMMON.vitalSigns, COMMON.respiratory, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of postictal monitoring, airway protection, and reporting recurrent seizure activity.',
    completionFallback: 'Nursing interventions completed according to the Seizure Guideline.',
  },
  transfer_out_back: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.vitalSigns, COMMON.skin, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of post-transfer monitoring, new orders, and reporting changes from hospital discharge instructions.',
    completionFallback: 'Nursing interventions completed according to the Transfer Out / Back Guideline.',
  },
  post_sedation: {
    interventionRules: [COMMON.neurological, COMMON.respiratory, COMMON.vitalSigns, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of post-sedation monitoring, airway status, and reporting delayed recovery or respiratory depression.',
    completionFallback: 'Nursing interventions completed according to the Post-Sedation Guideline.',
  },
  post_anesthesia: {
    interventionRules: [COMMON.neurological, COMMON.respiratory, COMMON.vitalSigns, COMMON.pain, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of post-anesthesia monitoring, pain control, and reporting nausea, respiratory changes, or uncontrolled pain.',
    completionFallback: 'Nursing interventions completed according to the Post-Anesthesia Guideline.',
  },
  crisis_physical_restraint: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.neurological, COMMON.respiratory, COMMON.skin, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of restraint monitoring intervals, circulation checks, and reporting agitation or decompensation.',
    completionFallback:
      'Nursing interventions completed according to the Crisis Physical Restraint Guideline.',
  },
  crisis_chemical_restraint: {
    interventionRules: [COMMON.neurological, COMMON.vitalSigns, COMMON.respiratory, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of sedation monitoring, behavior changes, and reporting oversedation or respiratory compromise.',
    completionFallback:
      'Nursing interventions completed according to the Crisis Chemical Restraint Guideline.',
  },
  crisis_mechanical_restraint: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.neurological, COMMON.skin, COMMON.monitoringInitiated],
    staffUnderstandingText:
      'Staff verbalized understanding of mechanical restraint monitoring, release criteria, and reporting injury or behavioral escalation.',
    completionFallback:
      'Nursing interventions completed according to the Crisis Mechanical Restraint Guideline.',
  },
  pica: {
    interventionRules: [COMMON.nursingAssessmentCompleted, COMMON.monitoringInitiated, COMMON.respiratory],
    staffUnderstandingText:
      'Staff verbalized understanding of pica monitoring, environmental safety, and reporting ingestion or choking events.',
    completionFallback: 'Nursing interventions completed according to the Pica Guideline.',
  },
  other: {
    interventionRules: [
      COMMON.nursingAssessmentCompleted,
      COMMON.vitalSigns,
      COMMON.respiratory,
      COMMON.monitoringInitiated,
      COMMON.hydrationEncouraged,
    ],
    staffUnderstandingText:
      'Staff verbalized understanding of symptom monitoring, infection precautions, hydration, and provider notification.',
    completionFallback: 'Nursing interventions completed according to the applicable nursing guideline.',
  },
};

function getCombinedDocumentation(context: PlanDocumentationContext): string {
  return [
    context.input,
    context.subjective,
    context.objective,
    context.assessment,
    context.plan,
  ].join('\n');
}

function getPromptValue(sectionText: string, prompt: string): string | null {
  const lines = sectionText.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const promptMatch = trimmed.match(PROMPT_LINE_PATTERN);
    if (!promptMatch) continue;
    const promptLabel = `${promptMatch[1].trim()}:`;
    if (promptLabel !== prompt) continue;

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
    return value.trim() || null;
  }
  return null;
}

const OBJECTIVE_FIELD_INTERVENTIONS: Array<{ promptPattern: RegExp; intervention: string }> = [
  { promptPattern: /intake.?output|i&o|i\/o/i, intervention: 'Intake and output reviewed.' },
  { promptPattern: /temperature|temp\b/i, intervention: 'Temperature reassessed.' },
  { promptPattern: /respiratory|lung sounds|relevant symptoms/i, intervention: 'Respiratory assessment completed.' },
  { promptPattern: /pain level|pain scale|pain/i, intervention: 'Pain assessment completed.' },
  { promptPattern: /neurolog/i, intervention: 'Neurological assessment completed.' },
  { promptPattern: /vomitus|vomit|nausea|emesis/i, intervention: 'Nursing assessment completed.' },
  {
    promptPattern: /additional findings|other assessment findings|other relevant assessment findings/i,
    intervention: 'Nursing assessment completed.',
  },
  { promptPattern: /interventions completed/i, intervention: 'Ongoing monitoring initiated.' },
];

function inferInterventionsFromObjectiveFields(objective: string): string[] {
  if (!objective.trim()) return [];

  const interventions: string[] = [];
  const lines = objective.split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    if (!line.endsWith(':')) continue;
    const value = getPromptValue(objective, line);
    if (!value) continue;

    for (const mapping of OBJECTIVE_FIELD_INTERVENTIONS) {
      if (mapping.promptPattern.test(line)) {
        interventions.push(mapping.intervention);
      }
    }
  }

  return interventions;
}

function capitalizeFirstWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatAssessedAreas(areas: string[]): string {
  const normalized = areas.map((area) => area.toLowerCase());
  if (normalized.length === 0) return '';
  if (normalized.length === 1) return `${capitalizeFirstWord(normalized[0])} was assessed.`;
  if (normalized.length === 2) {
    return `${capitalizeFirstWord(normalized[0])} and ${normalized[1]} were assessed.`;
  }
  const last = normalized[normalized.length - 1];
  const rest = normalized.slice(0, -1).join(', ');
  return `${capitalizeFirstWord(rest)}, and ${last} were assessed.`;
}

function extractMedicationReviewSentence(input: string, facts: ClinicalFacts): string | null {
  if (/\baspirin\s+81\s*mg\b/i.test(input)) return 'Current aspirin use was reviewed.';

  if (facts.medications.length > 0) {
    return `Current ${facts.medications.join(', ')} use was reviewed.`;
  }

  if (/\b(?:taking|on|uses?)\s+(?:aspirin|eliquis|warfarin|plavix|blood thinner|anticoagulant)\b/i.test(input)) {
    return 'Current anticoagulant or antiplatelet medication use was reviewed.';
  }

  return null;
}

function buildFallFollowUpInterventions(context: PlanDocumentationContext): string[] {
  const combined = getCombinedDocumentation(context);
  const { facts } = context;
  const assessedAreas: string[] = [];

  if (/\bvital signs\b|\bvitals\b/i.test(combined) || facts.vitalSigns) assessedAreas.push('vital signs');
  if (/\bneurological\b|\bmental status\b/i.test(combined) || facts.neurologicalAssessment) {
    assessedAreas.push('neurological and mental status');
  }
  if (/\bpain\b/i.test(combined) || facts.painPresent !== null) assessedAreas.push('pain');
  if (/\bbruising\b|\bskin\b|\bvisible injury\b/i.test(combined) || facts.visibleInjury) {
    assessedAreas.push('skin condition');
  }
  if (/\bmobility\b|\bambulat|\bwalker\b|\bgait\b|\btransfer\b|\brange of motion\b/i.test(combined)) {
    assessedAreas.push('mobility');
  }

  const parts = ['Follow-up nursing assessment completed.'];
  if (assessedAreas.length > 0) parts.push(formatAssessedAreas(assessedAreas));

  const medicationReview = extractMedicationReviewSentence(context.input, facts);
  if (medicationReview) parts.push(medicationReview);

  return parts;
}

function matchInterventionRules(rules: InterventionRule[], combined: string): string[] {
  return rules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(combined)))
    .map((rule) => rule.text);
}

export function createPlanDocumentationContext(
  input: string,
  def: GuidelineDefinition,
  enrichmentInput?: PlanEnrichmentInput,
): PlanDocumentationContext {
  return {
    input,
    subjective: enrichmentInput?.subjective ?? '',
    objective: enrichmentInput?.objective ?? '',
    assessment: enrichmentInput?.assessment ?? '',
    plan: enrichmentInput?.plan ?? '',
    facts: extractClinicalFacts(input, def.id),
  };
}

export function getGuidelinePlanRuleSet(
  def: GuidelineDefinition,
  _assessmentType: AssessmentType,
): GuidelinePlanRuleSet {
  return GUIDELINE_RULES[def.id];
}

export function evaluateGuidelinePlanRules(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  context: PlanDocumentationContext,
  templateHasStaffMonitoringInstruction: boolean,
  explicitStaffMonitoringInstructions: string | null,
  autoCompleteStaffEducation: boolean,
): PlanRuleEvaluation {
  const ruleSet = getGuidelinePlanRuleSet(def, assessmentType);
  const combined = getCombinedDocumentation(context);
  const matched = new Set<string>([
    ...matchInterventionRules(ruleSet.interventionRules, combined),
    ...inferInterventionsFromObjectiveFields(context.objective),
  ]);

  if (def.id === 'fall' && (assessmentType === 'follow_up' || assessmentType === 'resolution' || /\bfollow[- ]?up\b/i.test(context.input))) {
    const fallSummaryParts = buildFallFollowUpInterventions(context);
    if (fallSummaryParts.length > 1) {
      return {
        nursingInterventions: fallSummaryParts,
        nursingInterventionsSummary: fallSummaryParts.join(' '),
        staffUnderstandingText: ruleSet.staffUnderstandingText,
        staffEducationApplicable:
          autoCompleteStaffEducation
          || Boolean(explicitStaffMonitoringInstructions)
          || templateHasStaffMonitoringInstruction,
      };
    }
  }

  let nursingInterventions = [...matched];

  const positioning = extractDocumentedPositioning(combined);
  if (positioning) {
    nursingInterventions.push(positioning);
  }

  if (
    nursingInterventions.length > 0
    && !nursingInterventions.some((item) => /nursing assessment completed|follow-up nursing assessment completed/i.test(item))
  ) {
    nursingInterventions.unshift('Nursing assessment completed.');
  }

  if (nursingInterventions.length === 0 && detectNursingInterventionsCompleted(context.input)) {
    nursingInterventions = [ruleSet.completionFallback ?? `Nursing interventions completed according to the ${def.displayName} Guideline.`];
  } else if (nursingInterventions.length > 0) {
    nursingInterventions = orderNursingInterventions(nursingInterventions, def.displayName, combined);
  }

  const nursingInterventionsSummary = nursingInterventions.length > 0
    ? nursingInterventions.join(' ')
    : null;

  return {
    nursingInterventions: [...matched],
    nursingInterventionsSummary,
    staffUnderstandingText: ruleSet.staffUnderstandingText,
    staffEducationApplicable:
      autoCompleteStaffEducation
      || Boolean(explicitStaffMonitoringInstructions)
      || templateHasStaffMonitoringInstruction,
  };
}

export function shouldPopulateNursingInterventionsFromRules(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  context: PlanDocumentationContext,
): boolean {
  if (detectNursingInterventionsCompleted(context.input)) return true;

  const combined = getCombinedDocumentation(context);
  if (/\binterventions completed:/i.test(combined)) return true;

  const ruleSet = getGuidelinePlanRuleSet(def, assessmentType);
  if (matchInterventionRules(ruleSet.interventionRules, combined).length > 0) return true;
  if (inferInterventionsFromObjectiveFields(context.objective).length > 0) return true;

  return false;
}

export function deriveStaffUnderstandingFromTemplate(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string {
  const template = getFacilityFormTemplate(def, assessmentType);
  const standingInstructions = extractPlanStandingInstructions(template);
  const dspLine = standingInstructions.find((line) => /dsp|staff instructed/i.test(line));
  if (dspLine) {
    return `Staff verbalized understanding of monitoring and reporting requirements documented in the ${def.displayName} Guideline.`;
  }
  return getGuidelinePlanRuleSet(def, assessmentType).staffUnderstandingText;
}
