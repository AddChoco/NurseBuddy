import type { GuidelineId } from '../types';
import type { GuidelineDefinition, GuidelineUiMeta } from './types';
import {
  fieldsFromLabels,
  getGuidelineByDisplayName,
  getGuidelineDefinition as getGuidelineFromRegistry,
  getRequiredAssessmentAreaLabels,
} from './guidelineEngine';
import {
  placeholderDescription,
  placeholderInstruction,
  placeholderListItem,
} from './placeholders';
import { resolveDocumentationTypeId } from './documentationTypes';
import { VOMITING_GUIDELINE } from './definitions/vomiting';
import { FALL_GUIDELINE } from './definitions/fall';
import { PAIN_GUIDELINE } from './definitions/pain';
import { ELEVATED_TEMPERATURE_GUIDELINE } from './definitions/elevated_temperature';
import { UTI_GUIDELINE } from './definitions/uti';
import { HEAD_INJURY_GUIDELINE } from './definitions/head_injury';
import { SUSPECTED_FRACTURE_DISLOCATION_GUIDELINE } from './definitions/suspected_fracture_dislocation';
import { RESPIRATORY_GUIDELINE } from './definitions/respiratory';
import { ADVENTITIOUS_LUNG_SOUNDS_GUIDELINE } from './definitions/adventitious_lung_sounds';
import { ABDOMINAL_DISTENTION_PAIN_GUIDELINE } from './definitions/abdominal_distention_pain';
import { CONSTIPATION_GUIDELINE } from './definitions/constipation';
import { DIARRHEA_GUIDELINE } from './definitions/diarrhea';
import { ENTERAL_FEEDING_TOLERANCE_GUIDELINE } from './definitions/enteral_feeding_tolerance';
import { ENTERAL_TUBE_INSERTION_GUIDELINE } from './definitions/enteral_tube_insertion';
import { HYPOTHERMIA_GUIDELINE } from './definitions/hypothermia';
import { HYPOGLYCEMIA_GUIDELINE } from './definitions/hypoglycemia';
import { HYPERGLYCEMIA_GUIDELINE } from './definitions/hyperglycemia';
import { MEDICATION_CHANGE_GUIDELINE } from './definitions/medication_change';
import { PICA_GUIDELINE } from './definitions/pica';
import { SEIZURE_GUIDELINE } from './definitions/seizure';
import { TRANSFER_OUT_BACK_GUIDELINE } from './definitions/transfer_out_back';
import { SKIN_IMPAIRMENT_GUIDELINE } from './definitions/skin_impairment';
import { POST_SEDATION_GUIDELINE } from './definitions/post_sedation';
import { POST_ANESTHESIA_GUIDELINE } from './definitions/post_anesthesia';
import { CRISIS_PHYSICAL_RESTRAINT_GUIDELINE } from './definitions/crisis_physical_restraint';
import { CRISIS_CHEMICAL_RESTRAINT_GUIDELINE } from './definitions/crisis_chemical_restraint';
import { CRISIS_MECHANICAL_RESTRAINT_GUIDELINE } from './definitions/crisis_mechanical_restraint';
import { GENERIC_SOAP_NOTE_GUIDELINE } from './definitions/generic_soap_note';

// ---------------------------------------------------------------------------
// Guideline template factory — add new guidelines here
// ---------------------------------------------------------------------------

interface CreateGuidelineOptions {
  id: GuidelineId;
  displayName: string;
  requiredFieldLabels: string[];
  optionalFieldLabels?: string[];
  criticalFieldLabels?: string[];
  resolutionApplicable?: boolean;
}

function docType(
  section: string,
  applicable = true,
): { applicable: boolean; instructions: string } {
  return {
    applicable,
    instructions: placeholderInstruction(section),
  };
}

function createGuidelineDefinition(options: CreateGuidelineOptions): GuidelineDefinition {
  const {
    id,
    displayName,
    requiredFieldLabels,
    optionalFieldLabels = [],
    criticalFieldLabels = [],
    resolutionApplicable = true,
  } = options;

  const requiredFields = fieldsFromLabels(requiredFieldLabels);
  const optionalFields = fieldsFromLabels(optionalFieldLabels);
  const criticalSet = new Set(criticalFieldLabels);

  const missingInformationChecklist = [
    ...requiredFields.map((field) => ({
      ...field,
      critical: field.critical ?? criticalSet.has(field.label),
    })),
    ...optionalFields
      .filter((field) => criticalSet.has(field.label))
      .map((field) => ({ ...field, critical: true })),
  ];

  return {
    id,
    displayName,
    description: placeholderDescription(displayName),
    assessment: {
      requiredFields,
      optionalFields,
    },
    missingInformationChecklist,
    documentation: {
      initialAssessment: docType(`${displayName} — Initial Assessment`),
      followUpAssessment: docType(`${displayName} — Follow-up Assessment`),
      resolutionAssessment: docType(`${displayName} — Resolution Assessment`, resolutionApplicable),
      soapNote: docType(`${displayName} — SOAP Note`),
      sbar: docType(`${displayName} — SBAR`),
      larGuardianEmail: docType(`${displayName} — LAR/Guardian Email`),
      providerNotification: docType(`${displayName} — Provider Notification`),
    },
    followUpRequirements: {
      frequency: placeholderInstruction(`${displayName} — Follow-up Frequency`),
      monitoringPoints: [placeholderListItem()],
      reassessmentCriteria: [placeholderListItem()],
      instructions: placeholderInstruction(`${displayName} — Follow-up Requirements`),
    },
    resolutionCriteria: {
      applicable: resolutionApplicable,
      criteria: resolutionApplicable ? [placeholderListItem()] : [],
      instructions: placeholderInstruction(`${displayName} — Resolution Criteria`),
    },
    notificationRules: {
      providerNotification: placeholderInstruction(`${displayName} — Provider Notification Rules`),
      larGuardianNotification: placeholderInstruction(`${displayName} — LAR/Guardian Notification Rules`),
      triggers: [placeholderListItem()],
      prohibitedAutoNotifications: [
        `${placeholderListItem()} Do not notify provider or LAR unless input or facility trigger criteria support it.`,
      ],
    },
    educationRequirements: {
      residentInstructions: placeholderInstruction(`${displayName} — Resident Education`),
      staffInstructions: placeholderInstruction(`${displayName} — Staff Education`),
      larGuardianInstructions: placeholderInstruction(`${displayName} — LAR/Guardian Education`),
    },
    prohibitedAssumptions: [
      `${placeholderListItem()} Do not assume clinical findings, responses, or outcomes for ${displayName} without reported evidence.`,
    ],
    terminologyRules: placeholderInstruction(`${displayName} — Terminology Rules`),
  };
}

export const GUIDELINE_UI_META: Record<GuidelineId, GuidelineUiMeta> = {
  vomiting: { emoji: '🤢' },
  elevated_temperature: { emoji: '🌡️' },
  uti: { emoji: '🚽' },
  fall: { emoji: '🩹' },
  head_injury: { emoji: '🧠' },
  suspected_fracture_dislocation: { emoji: '🦴' },
  pica: { emoji: '🍽️' },
  skin_impairment: { emoji: '🩹' },
  respiratory: { emoji: '🫁' },
  adventitious_lung_sounds: { emoji: '🩺' },
  abdominal_distention_pain: { emoji: '💢' },
  constipation: { emoji: '🧻' },
  diarrhea: { emoji: '💧' },
  enteral_feeding_tolerance: { emoji: '🍼' },
  enteral_tube_insertion: { emoji: '🔧' },
  hypothermia: { emoji: '🥶' },
  hypoglycemia: { emoji: '📉' },
  hyperglycemia: { emoji: '📈' },
  medication_change: { emoji: '🔄' },
  seizure: { emoji: '⚡' },
  transfer_out_back: { emoji: '🚑' },
  post_sedation: { emoji: '😴' },
  post_anesthesia: { emoji: '💉' },
  crisis_physical_restraint: { emoji: '🔒' },
  crisis_chemical_restraint: { emoji: '💊' },
  crisis_mechanical_restraint: { emoji: '⛓️' },
  pain: { emoji: '😣' },
  other: { emoji: '📋' },
};

export const GUIDELINE_DEFINITIONS: GuidelineDefinition[] = [
  VOMITING_GUIDELINE,
  FALL_GUIDELINE,
  PAIN_GUIDELINE,
  ELEVATED_TEMPERATURE_GUIDELINE,
  UTI_GUIDELINE,
  HEAD_INJURY_GUIDELINE,
  SUSPECTED_FRACTURE_DISLOCATION_GUIDELINE,
  RESPIRATORY_GUIDELINE,
  ADVENTITIOUS_LUNG_SOUNDS_GUIDELINE,
  ABDOMINAL_DISTENTION_PAIN_GUIDELINE,
  CONSTIPATION_GUIDELINE,
  DIARRHEA_GUIDELINE,
  ENTERAL_FEEDING_TOLERANCE_GUIDELINE,
  ENTERAL_TUBE_INSERTION_GUIDELINE,
  HYPOTHERMIA_GUIDELINE,
  HYPOGLYCEMIA_GUIDELINE,
  HYPERGLYCEMIA_GUIDELINE,
  MEDICATION_CHANGE_GUIDELINE,
  PICA_GUIDELINE,
  SEIZURE_GUIDELINE,
  TRANSFER_OUT_BACK_GUIDELINE,
  SKIN_IMPAIRMENT_GUIDELINE,
  POST_SEDATION_GUIDELINE,
  POST_ANESTHESIA_GUIDELINE,
  CRISIS_PHYSICAL_RESTRAINT_GUIDELINE,
  CRISIS_CHEMICAL_RESTRAINT_GUIDELINE,
  CRISIS_MECHANICAL_RESTRAINT_GUIDELINE,
  GENERIC_SOAP_NOTE_GUIDELINE,
];

export const GUIDELINE_BY_ID = Object.fromEntries(
  GUIDELINE_DEFINITIONS.map((def) => [def.id, def]),
) as Record<GuidelineId, GuidelineDefinition>;

export function lookupGuidelineDefinition(id: GuidelineId): GuidelineDefinition {
  return getGuidelineFromRegistry(id, GUIDELINE_BY_ID);
}

export function lookupGuidelineByDisplayName(name: string): GuidelineDefinition | undefined {
  return getGuidelineByDisplayName(name, GUIDELINE_DEFINITIONS);
}

/** @deprecated Legacy name — use lookupGuidelineDefinition */
export { lookupGuidelineDefinition as getGuidelineDefinition };

/** @deprecated Legacy name — use lookupGuidelineByDisplayName */
export { lookupGuidelineByDisplayName as getGuidelineByDisplayName };

/** Backward compatibility for edge function during UI label migration. */
export function getOutputInstructionField(outputLabel: string): keyof GuidelineDefinition['documentation'] | undefined {
  const docTypeId = resolveDocumentationTypeId(outputLabel);
  if (!docTypeId) return undefined;
  const map: Record<string, keyof GuidelineDefinition['documentation']> = {
    initial_assessment: 'initialAssessment',
    follow_up_assessment: 'followUpAssessment',
    resolution_assessment: 'resolutionAssessment',
    soap_note: 'soapNote',
    sbar: 'sbar',
    lar_guardian_email: 'larGuardianEmail',
    provider_notification: 'providerNotification',
  };
  return map[docTypeId];
}

// Legacy flat accessors used by constants.ts
export function getLegacyRequiredAssessmentAreas(def: GuidelineDefinition): string[] {
  return getRequiredAssessmentAreaLabels(def);
}
