import type { GuidelineId } from '../types';
import type { GuidelineDefinition } from './types';
import type { AssessmentType } from './facilityTemplateMode';

export interface GuidelinePlanLibraryEntry {
  /** Category A — document only when supported by the narrative */
  completedPlanElements: string[];
  /** Category B — mandatory prospective plan items from the facility guideline */
  prospectivePlanElements: string[];
  dspMonitoringInstructions: string;
  providerNotificationRequirements: string[];
  larNotificationRequirements: string[];
  followUpActions: string[];
  educationPoints: string[];
}

export interface GuidelinePlanLibraryDefinition {
  shared: GuidelinePlanLibraryEntry;
  initial?: Partial<GuidelinePlanLibraryEntry>;
  follow_up?: Partial<GuidelinePlanLibraryEntry>;
  resolution?: Partial<GuidelinePlanLibraryEntry>;
  procedure?: Partial<GuidelinePlanLibraryEntry>;
  return?: Partial<GuidelinePlanLibraryEntry>;
  other?: Partial<GuidelinePlanLibraryEntry>;
}

function entry(
  completedPlanElements: string[],
  prospectivePlanElements: string[],
  dspMonitoringInstructions: string,
  providerNotificationRequirements: string[],
  larNotificationRequirements: string[],
  followUpActions: string[],
  educationPoints: string[],
): GuidelinePlanLibraryEntry {
  return {
    completedPlanElements,
    prospectivePlanElements,
    dspMonitoringInstructions,
    providerNotificationRequirements,
    larNotificationRequirements,
    followUpActions,
    educationPoints,
  };
}

function mergePlanEntry(
  base: GuidelinePlanLibraryEntry,
  override?: Partial<GuidelinePlanLibraryEntry>,
): GuidelinePlanLibraryEntry {
  if (!override) return base;
  return {
    completedPlanElements: override.completedPlanElements ?? base.completedPlanElements,
    prospectivePlanElements: override.prospectivePlanElements ?? base.prospectivePlanElements,
    dspMonitoringInstructions: override.dspMonitoringInstructions ?? base.dspMonitoringInstructions,
    providerNotificationRequirements:
      override.providerNotificationRequirements ?? base.providerNotificationRequirements,
    larNotificationRequirements:
      override.larNotificationRequirements ?? base.larNotificationRequirements,
    followUpActions: override.followUpActions ?? base.followUpActions,
    educationPoints: override.educationPoints ?? base.educationPoints,
  };
}

export const GUIDELINE_PLAN_LIBRARY: Record<GuidelineId, GuidelinePlanLibraryDefinition> = {
  vomiting: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Antiemetic effectiveness and side effects',
        'Comfort measures provided',
        'PCP notification completed',
        'Enteral/oral feeding hold or adjustment completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Assess every shift for 24 hours after resident is symptom free',
        'Prevent dehydration through continued intake/output monitoring',
        'Nurse reassessment per vomiting guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding vomiting guideline monitoring and reporting requirements',
      ],
      'DSP/staff instructed to monitor for new emesis, nausea, dehydration, gastric bleeding, and changes in intake/output and immediately report any recurrence of vomiting, signs of dehydration, bloody emesis, or other change from baseline.',
      [
        'Notify PCP for dehydration or abnormal intake/output findings',
        'Notify PCP for suspected gastric bleeding or repeated/worsening emesis',
        'Notify PCP for ineffective antiemetic or adverse side effects',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian when significant change in condition is reported or per facility policy',
        'Use plain language; do not auto-notify unless input supports it',
      ],
      [
        'Complete follow-up assessment with required vomiting fields',
        'Document vomiting status and whether resident is symptom free',
        'Continue shift assessments for 24 hours after symptom free',
      ],
      [
        'Resident education or comfort measures related to vomiting when applicable',
        'Staff instructed on vomiting guideline monitoring, intake/output, and reporting requirements',
        'LAR/guardian education in plain language when significant change requires communication',
      ],
    ),
  },

  fall: {
    shared: entry(
      [
        'PIR completed',
        'Nursing interventions completed',
        'PCP notification completed',
        'Provider orders received and implemented',
        'Post Injury Report updated',
        'Staff verbalized understanding of fall precautions',
      ],
      [
        'Continue assessment each shift for the required 24-hour period',
        'Maintain fall precautions per facility fall guideline',
        'Notify oncoming nurse through 24-hour report or nurse-to-nurse report when follow-up is indicated',
        'Staff instructed regarding fall monitoring and reporting requirements',
      ],
      'DSP/staff instructed to monitor for new or worsening pain, neurological or mental status changes, dizziness, headache, weakness, skin injury, delayed post-fall symptoms, mobility changes, and immediately report any change from baseline.',
      [
        'Notify PCP if abnormal findings are noted during assessment',
        'Notify PCP for new or worsening pain, neuro changes, or injury on follow-up',
        'Notify PCP when head impact occurs with anticoagulant use',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant fall-related change is reported',
      ],
      [
        'Nurse to assess each shift for 24 hours after fall or suspected fall',
        'Monitor neurological and mental status, pain, skin findings, mobility, and vital signs when obtained',
        'Do not close fall guideline until 24-hour monitoring is complete and concerns resolved',
      ],
      [
        'Resident education related to fall prevention when applicable',
        'Staff instructed on fall precautions, monitoring, and immediate reporting',
      ],
    ),
  },

  pain: {
    shared: entry(
      [
        'Pain management interventions provided',
        'Pain medication administered',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Nursing follow-up to assess effectiveness of pain medication and monitor for side effects',
        'Notify oncoming nurse through 24-hour report or nurse-to-nurse report when follow-up is indicated',
        'Staff instructed regarding pain reassessment and reporting requirements',
      ],
      'DSP/staff instructed to monitor pain level, pain behaviors, response to intervention, and side effects and immediately report moderate to severe pain, unresolved pain, or worsening symptoms.',
      [
        'Notify PCP for moderate to severe pain (pain score greater than 4) or unresolved pain',
        'Notify PCP if no improvement within 1 hour or abnormal findings during assessment',
        'Notify PCP if pain recurs on follow-up',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant pain-related change is reported',
      ],
      [
        'Reassess pain level and response to intervention per facility pain guideline',
        'Continue follow-up until pain is resolved or provider orders received',
      ],
      [
        'Resident education on reporting pain and comfort measures when applicable',
        'Staff instructed on pain scale use, reassessment intervals, and PCP notification triggers',
      ],
    ),
  },

  elevated_temperature: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Comfort measures implemented',
        'Dehydration prevention strategies implemented',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Document temperature at least every 4 hours until 48 hours after symptoms resolve or 48 consecutive hours without fever per facility guideline',
        'Implement strategies to prevent dehydration per guideline',
        'Notify oncoming nurse through 24-hour report or nurse-to-nurse report when follow-up is indicated',
        'Staff instructed regarding temperature monitoring and infection symptom reporting',
      ],
      'DSP/staff instructed to monitor temperature, signs and symptoms of infection, hydration status, and comfort and immediately report fever recurrence, worsening symptoms, or abnormal findings.',
      [
        'Notify PCP for persistent fever, abnormal findings, or signs of infection',
        'Notify PCP when temperature elevation criteria require provider evaluation',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant temperature-related change is reported',
      ],
      [
        'Continue q4 temperature monitoring per facility elevated temperature guideline',
        'Reassess signs and symptoms of infection and environmental contributing factors',
      ],
      [
        'Resident education on hydration and symptom reporting when applicable',
        'Staff instructed on q4 temperature monitoring and PCP notification triggers',
      ],
    ),
  },

  uti: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Antibiotic or treatment administered',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor intake and output and hydration status per UTI guideline',
        'Nurse reassessment per UTI guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding UTI symptom monitoring and fluid intake support',
      ],
      'DSP/staff instructed to monitor for dysuria, frequency, urgency, fever, changes in urine appearance or odor, hydration, and behavioral changes and immediately report worsening urinary symptoms or systemic signs.',
      [
        'Notify PCP for abnormal urinalysis findings, fever, or worsening UTI symptoms',
        'Notify PCP for ineffective treatment or adverse medication effects',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant UTI-related change is reported',
      ],
      [
        'Complete follow-up UTI assessment with required fields',
        'Monitor response to antibiotic or prescribed treatment',
      ],
      [
        'Resident education on fluid intake and symptom reporting when applicable',
        'Staff instructed on UTI monitoring, intake support, and reporting requirements',
      ],
    ),
  },

  head_injury: {
    shared: entry(
      [
        'PIR completed',
        'Nursing interventions completed',
        'PCP notification of head injury completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Continue neurological assessments according to the facility Head Injury Guideline and established severity',
        'Maintain close observation for bleeding or neurological changes when anticoagulant or antiplatelet medication is in use',
        'Notify oncoming nurse through 24-hour report or nurse-to-nurse report when follow-up is indicated',
        'Staff instructed regarding neurological monitoring and immediate reporting requirements',
      ],
      'DSP instructed to monitor for and immediately report any change in level of consciousness, increased drowsiness, new confusion, worsening headache, nausea or vomiting, dizziness, vision changes, unequal or nonreactive pupils, weakness, seizure activity, bleeding, bruising, swelling, or any other change from baseline.',
      [
        'Notify PCP of the head injury when clinically indicated',
        'Notify PCP immediately if neurological status deteriorates',
        'PCP determines injury severity; do not assign severity unless established',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant head injury change is reported',
      ],
      [
        'Follow severity-based neurological monitoring schedule per facility Head Injury Guideline',
        'Reassess neurological status per established monitoring intervals',
        'Continue follow-up until monitoring requirements are met',
      ],
      [
        'Staff instructed on head injury neurological monitoring schedule and bleeding precautions with anticoagulants',
        'Resident safety precautions and activity restrictions per guideline when applicable',
      ],
    ),
  },

  suspected_fracture_dislocation: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Immobilization or splinting completed',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Maintain immobilization and safety precautions per suspected fracture/dislocation guideline',
        'Nurse reassessment per guideline including neurovascular status of affected extremity',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding immobilization, neurovascular checks, and pain reporting',
      ],
      'DSP/staff instructed to monitor pain, swelling, deformity, neurovascular status, color, warmth, movement, and sensation of the affected area and immediately report increased pain, numbness, tingling, pallor, or other neurovascular compromise.',
      [
        'Notify PCP for suspected fracture or dislocation and abnormal neurovascular findings',
        'Notify PCP for worsening pain or complications',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant injury-related change is reported',
      ],
      [
        'Continue reassessment per facility suspected fracture/dislocation guideline',
        'Monitor for complications and response to immobilization',
      ],
      [
        'Staff instructed on immobilization maintenance and neurovascular monitoring',
        'Resident education on reporting increased pain or sensation changes when applicable',
      ],
    ),
  },

  respiratory: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Positioning interventions completed',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Maintain positioning per PNMP and facility respiratory/aspiration guideline',
        'Continue follow-up assessments until resolution is documented',
        'Nurse reassessment per respiratory guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding respiratory symptom and aspiration monitoring',
      ],
      'DSP/staff instructed to monitor respiratory rate, work of breathing, cough, aspiration signs, oxygen needs, positioning, and changes from baseline and immediately report respiratory distress, aspiration event, or worsening symptoms.',
      [
        'Notify PCP of abnormal respiratory assessment findings',
        'Notify PCP for respiratory distress or aspiration event',
        'Notify PCP for fever during q4 temperature monitoring period when applicable',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant respiratory/aspiration event is reported',
      ],
      [
        'Continue follow-up per facility respiratory guideline until resolution documented',
        'Monitor response to previous interventions and positioning',
      ],
      [
        'Staff instructed on positioning, swallowing safety, and respiratory symptom reporting',
        'Resident education on positioning and symptom reporting when applicable',
      ],
    ),
  },

  adventitious_lung_sounds: {
    shared: entry(
      [
        'Nursing interventions completed',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Continue lung sound and respiratory assessments per facility guideline',
        'Nurse reassessment per adventitious lung sounds guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding lung sound and respiratory monitoring',
      ],
      'DSP/staff instructed to monitor breath sounds, respiratory effort, cough, oxygen saturation when applicable, and changes from baseline and immediately report worsening adventitious sounds, increased work of breathing, or respiratory distress.',
      [
        'Notify PCP for new or worsening adventitious lung sounds or abnormal respiratory findings',
        'Notify PCP for ineffective interventions or complications',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant respiratory change is reported',
      ],
      [
        'Complete follow-up assessment with required lung sound documentation',
        'Monitor response to interventions per facility guideline',
      ],
      [
        'Staff instructed on lung sound monitoring and immediate reporting requirements',
      ],
    ),
  },

  abdominal_distention_pain: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Comfort measures completed',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Continue abdominal assessment and bowel status monitoring per facility guideline',
        'Nurse reassessment per abdominal distention/pain guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding abdominal distention, pain, and bowel changes',
      ],
      'DSP/staff instructed to monitor abdominal distention, pain, bowel movements, vomiting, appetite, and comfort and immediately report worsening distention, severe pain, vomiting, or absence of bowel movement when clinically concerning.',
      [
        'Notify PCP for worsening abdominal distention, pain, or complications',
        'Notify PCP for vomiting, feeding intolerance, or abnormal findings',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant abdominal change is reported',
      ],
      [
        'Continue nursing reassessment per documented plan until symptoms resolve',
        'Monitor bowel status and response to interventions',
      ],
      [
        'Staff instructed on abdominal monitoring and reporting requirements',
      ],
    ),
  },

  constipation: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Suppository or constipation medication administered',
        'Bowel movement result documented',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor response to constipation interventions per facility guideline',
        'Nurse reassessment per constipation guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding bowel monitoring and intervention response',
      ],
      'DSP/staff instructed to monitor bowel movement status, abdominal distention, pain, vomiting, appetite, and enteral feeding tolerance and immediately report no bowel movement after intervention, abdominal distention, pain, or vomiting.',
      [
        'Notify PCP for abdominal distention, pain, vomiting, or enteral feeding intolerance',
        'Notify PCP for emergency transfer criteria or complications',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant constipation change is reported',
      ],
      [
        'Follow facility constipation guideline for follow-up and intervention monitoring',
        'Document constipation status at follow-up',
      ],
      [
        'Staff instructed on bowel monitoring and when to notify nursing',
        'Resident education on bowel management when applicable',
      ],
    ),
  },

  diarrhea: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Anti-diarrheal medication administered',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor intake and output and hydration status per diarrhea guideline',
        'Assess effectiveness of anti-diarrheal medication when administered',
        'Nurse reassessment per diarrhea guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding diarrhea, hydration, and intake/output monitoring',
      ],
      'DSP/staff instructed to monitor stool frequency and consistency, intake and output, hydration, abdominal symptoms, and changes from baseline and immediately report worsening diarrhea, dehydration signs, vomiting, or abdominal pain.',
      [
        'Notify PCP for vomiting, abdominal distention, enteral feeding intolerance, or hypoglycemia related to poor intake',
        'Notify PCP for worsening diarrhea despite intervention or emergency transfer need',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant diarrhea change is reported',
      ],
      [
        'Follow facility diarrhea guideline for follow-up and intervention monitoring',
        'Continue dehydration prevention strategies per guideline',
      ],
      [
        'Staff instructed on intake/output monitoring and diarrhea reporting',
        'Resident education on hydration when applicable',
      ],
    ),
  },

  enteral_feeding_tolerance: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Feeding rate or formula adjustment completed',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor enteral feeding rate, residuals, and tolerance per facility guideline',
        'Nurse reassessment per enteral feeding tolerance guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding feeding tolerance, residuals, and aspiration signs',
      ],
      'DSP/staff instructed to monitor enteral feeding rate, residuals, vomiting, distention, coughing during feeds, and tolerance signs and immediately report feeding intolerance, increased residuals, emesis, or aspiration concerns.',
      [
        'Notify PCP for feeding intolerance, aspiration concerns, or abnormal findings',
        'Notify PCP for complications requiring provider orders',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant feeding change is reported',
      ],
      [
        'Continue follow-up per enteral feeding tolerance guideline',
        'Monitor response to rate or formula adjustments',
      ],
      [
        'Staff instructed on enteral feeding monitoring and hold criteria per facility protocol',
      ],
    ),
  },

  enteral_tube_insertion: {
    shared: entry(
      [
        'G-tube change or insertion procedure completed',
        'Nursing interventions completed',
        'Feeding verification completed',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor tube site, placement, and feeding tolerance per facility G-tube guideline',
        'Nurse reassessment per enteral tube insertion guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding tube site care, feeding verification, and complication signs',
      ],
      'DSP/staff instructed to monitor G-tube site appearance, drainage, pain, feeding tolerance, residuals, and signs of dislodgement or infection and immediately report bleeding, increased drainage, feeding intolerance, or tube displacement.',
      [
        'Notify PCP for tube dislodgement, infection signs, bleeding, or feeding complications',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant tube-related change is reported',
      ],
      [
        'Continue post-procedure monitoring per facility enteral tube guideline',
        'Verify feeding readiness and site stability at follow-up',
      ],
      [
        'Staff instructed on G-tube site care, feeding verification, and emergency reporting',
      ],
    ),
  },

  hypothermia: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Warming measures implemented',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Continue temperature monitoring and warming measures per hypothermia guideline',
        'Nurse reassessment per hypothermia guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding temperature monitoring and warming interventions',
      ],
      'DSP/staff instructed to monitor temperature, shivering, mental status, skin condition, and response to warming measures and immediately report persistent hypothermia, altered mental status, or worsening condition.',
      [
        'Notify PCP for persistent hypothermia or abnormal findings',
        'Notify PCP for complications during rewarming',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant hypothermia-related change is reported',
      ],
      [
        'Continue follow-up temperature monitoring per facility hypothermia guideline',
        'Monitor response to warming interventions',
      ],
      [
        'Staff instructed on hypothermia prevention and temperature monitoring',
      ],
    ),
  },

  hypoglycemia: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Oral glucose or treatment administered',
        'Blood glucose recheck result documented',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Recheck blood glucose per facility hypoglycemia guideline',
        'Monitor for recurrence and response to treatment',
        'Nurse reassessment per hypoglycemia guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding hypoglycemia signs, treatment, and recheck requirements',
      ],
      'DSP/staff instructed to monitor for shakiness, sweating, confusion, weakness, behavior changes, and blood glucose trends and immediately report recurrent hypoglycemia, ineffective treatment, or neuroglycopenic symptoms.',
      [
        'Notify PCP for recurrent hypoglycemia, ineffective treatment, or abnormal findings',
        'Notify PCP when hypoglycemia criteria require provider evaluation',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant hypoglycemia event is reported',
      ],
      [
        'Continue blood glucose monitoring per facility hypoglycemia guideline',
        'Monitor intake and response to treatment',
      ],
      [
        'Staff instructed on hypoglycemia recognition, treatment protocol, and recheck timing',
      ],
    ),
  },

  hyperglycemia: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Blood glucose treatment or insulin administered per orders',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Recheck blood glucose per facility hyperglycemia guideline',
        'Monitor hydration and response to treatment',
        'Nurse reassessment per hyperglycemia guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding hyperglycemia monitoring and fluid intake',
      ],
      'DSP/staff instructed to monitor blood glucose trends, polyuria, polydipsia, behavior changes, and hydration and immediately report persistent hyperglycemia, ketosis signs, or worsening symptoms.',
      [
        'Notify PCP for persistent hyperglycemia or abnormal findings',
        'Notify PCP when hyperglycemia criteria require provider evaluation',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant hyperglycemia change is reported',
      ],
      [
        'Continue blood glucose monitoring per facility hyperglycemia guideline',
        'Monitor response to treatment and hydration status',
      ],
      [
        'Staff instructed on hyperglycemia monitoring and reporting requirements',
      ],
    ),
  },

  medication_change: {
    shared: entry(
      [
        'Medication change implemented as ordered',
        'Nursing interventions completed',
        'PCP or provider notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor for therapeutic effect and adverse effects per medication change guideline',
        'Nurse reassessment per medication change guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding new medication monitoring and side effect reporting',
      ],
      'DSP/staff instructed to monitor for expected therapeutic effects, adverse reactions, behavior changes, and compliance with the new medication and immediately report side effects, allergic symptoms, or concerning changes.',
      [
        'Notify PCP or provider for adverse medication effects or abnormal findings',
        'Notify PCP when medication change requires provider follow-up',
        'Document provider notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant medication-related change is reported',
      ],
      [
        'Continue follow-up monitoring per facility medication change guideline',
        'Document response to medication change at follow-up',
      ],
      [
        'Staff instructed on new medication purpose, monitoring, and side effect reporting',
      ],
    ),
  },

  pica: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Ingested object or substance response documented',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Maintain safety precautions and enhanced monitoring per pica guideline',
        'Nurse reassessment per pica guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding pica behavior monitoring and environmental safety',
      ],
      'DSP/staff instructed to monitor for pica behavior, access to non-food items, choking or aspiration signs, abdominal symptoms, and behavioral triggers and immediately report ingestion events, choking, or behavioral escalation.',
      [
        'Notify PCP for ingestion of harmful objects or substances or complications',
        'Notify PCP for abnormal assessment findings related to pica event',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant pica-related event is reported',
      ],
      [
        'Continue safety monitoring per facility pica guideline',
        'Monitor for complications after ingestion event',
      ],
      [
        'Staff instructed on pica prevention, environmental safety, and immediate reporting',
      ],
    ),
  },

  seizure: {
    shared: entry(
      [
        'Breakthrough, standing, or PRN anti-epileptic medication administered',
        'Nursing interventions completed',
        'PCP notification completed',
        'Seizure notifications to Home Manager, RN Case Manager, BHS, and QIDP when occurred',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Nursing to follow up during the next shift to assess effectiveness of anti-epileptic medication and monitor for side effects',
        'Continue nursing follow-up if additional seizure activity or changes in condition occur',
        'Notify oncoming nurse through 24-hour report or nurse-to-nurse report when follow-up is indicated',
        'Staff instructed regarding post-seizure monitoring and safety precautions',
      ],
      'DSP/staff instructed to monitor for recurrent seizure activity, post-ictal changes, injury from seizure, medication side effects, and vital sign changes and immediately report additional seizures, prolonged post-ictal state, or status epilepticus signs.',
      [
        'Notify PCP if no prior seizure history, extended seizure-free period ended, or different seizure type observed',
        'Notify PCP for significant deviations from baseline vital signs or important seizure-related findings',
        'Follow status epilepticus protocol when applicable; document notification when indicated',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant seizure-related change is reported',
      ],
      [
        'Complete follow-up seizure assessment with required fields',
        'Monitor seizure frequency and pattern changes',
      ],
      [
        'Staff instructed on seizure first aid, post-seizure monitoring, and medication side effects',
      ],
    ),
  },

  transfer_out_back: {
    shared: entry(
      [
        'Transfer documentation completed',
        'Nursing interventions completed',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor resident status compared with baseline after transfer back per facility guideline',
        'Nurse reassessment per transfer out/transfer back guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding post-transfer monitoring and baseline comparison',
      ],
      'DSP/staff instructed to monitor condition, behavior, medications, treatments, and functional status compared with pre-transfer baseline and immediately report decline, new symptoms, or failure to return to baseline.',
      [
        'Notify PCP for abnormal findings or failure to return to baseline after transfer back',
        'Notify PCP for complications related to transfer or hospitalization',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant post-transfer change is reported',
      ],
      [
        'Continue follow-up assessments per facility transfer guideline',
        'Compare status with baseline until stable',
      ],
      [
        'Staff instructed on post-transfer monitoring and baseline comparison reporting',
      ],
    ),
  },

  skin_impairment: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Wound or skin treatment completed',
        'PCP or wound care notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Continue skin and wound assessment per facility skin impairment guideline',
        'Nurse reassessment per skin impairment guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding skin checks, pressure relief, and wound changes',
      ],
      'DSP/staff instructed to monitor skin integrity, wound appearance, drainage, odor, pain, surrounding tissue, and pressure relief measures and immediately report increased redness, breakdown, drainage, odor, or pain.',
      [
        'Notify PCP or wound care provider for worsening skin impairment or infection signs',
        'Notify PCP for abnormal wound findings or ineffective treatment',
        'Document provider notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant skin change is reported',
      ],
      [
        'Continue skin assessments per facility skin impairment guideline',
        'Monitor response to wound care interventions',
      ],
      [
        'Staff instructed on skin checks, repositioning, and wound reporting requirements',
      ],
    ),
  },

  post_sedation: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Medications received during sedation documented',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor mental status and respiratory status per post-sedation guideline',
        'Nurse reassessment per post-sedation guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding post-sedation monitoring and safety precautions',
      ],
      'DSP/staff instructed to monitor level of consciousness, airway, breathing, oxygenation, nausea, and behavior after sedation and immediately report respiratory depression, persistent sedation, altered mental status, or hypoxia.',
      [
        'Notify PCP for altered mental status, respiratory depression, hypoxia, or complications',
        'Notify PCP for emergency transfer criteria',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant post-sedation change is reported',
      ],
      [
        'Continue post-sedation monitoring per facility guideline until baseline recovered',
        'Monitor arrival/recovery milestones as documented',
      ],
      [
        'Staff instructed on post-sedation monitoring intervals and emergency reporting',
      ],
    ),
  },

  post_anesthesia: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Medications received documented',
        'PCP notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor status post anesthesia including mental and respiratory status per facility guideline',
        'Nurse reassessment per post-anesthesia guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding post-anesthesia monitoring requirements',
      ],
      'DSP/staff instructed to monitor mental status, respiratory status, oxygenation, pain, nausea, and recovery from anesthesia and immediately report respiratory depression, altered mental status, hypoxia, seizure activity, or failure to recover as expected.',
      [
        'Notify PCP for altered mental status, respiratory depression, hypoxia, seizure activity, or complications',
        'Notify PCP for emergency transfer criteria or abnormal findings',
        'Document PCP notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant post-anesthesia change is reported',
      ],
      [
        'Follow facility Post Anesthesia Guideline for ongoing monitoring after return',
        'Monitor medications received and response to recovery plan',
      ],
      [
        'Staff instructed on post-anesthesia monitoring and emergency reporting criteria',
      ],
    ),
  },

  crisis_physical_restraint: {
    shared: entry(
      [
        'Physical restraint application and removal times documented',
        'Nursing interventions completed',
        'Provider notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor resident continuously while restraint is in use per facility crisis restraint guideline',
        'Reassess least restrictive alternatives and readiness for release per guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding restraint monitoring, circulation checks, and behavioral support',
      ],
      'DSP/staff instructed to monitor breathing, circulation, skin integrity, behavior, emotional status, and comfort while restraint is in use and immediately report distress, injury, circulation compromise, or behavioral escalation.',
      [
        'Notify provider per crisis restraint protocol for continued need, injury, or complications',
        'Document provider notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy and crisis restraint requirements when indicated',
      ],
      [
        'Complete debrief and documentation per facility crisis physical restraint guideline',
        'Continue behavioral monitoring after restraint release',
      ],
      [
        'Staff instructed on restraint monitoring intervals, release criteria, and debrief requirements',
      ],
    ),
  },

  crisis_chemical_restraint: {
    shared: entry(
      [
        'PRN or chemical restraint medication administered',
        'Nursing interventions completed',
        'Provider notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor medication effectiveness and adverse effects per crisis chemical restraint guideline',
        'Reassess behavior and least restrictive alternatives per guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding post-medication monitoring and behavioral support',
      ],
      'DSP/staff instructed to monitor behavior, sedation level, respiratory status, blood pressure when applicable, and side effects after chemical restraint and immediately report oversedation, respiratory depression, or ineffective de-escalation.',
      [
        'Notify provider per crisis chemical restraint protocol for adverse effects or continued behavioral crisis',
        'Document provider notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy and crisis restraint requirements when indicated',
      ],
      [
        'Complete debrief and follow-up per facility crisis chemical restraint guideline',
        'Monitor for medication side effects during follow-up period',
      ],
      [
        'Staff instructed on chemical restraint monitoring and behavioral support after administration',
      ],
    ),
  },

  crisis_mechanical_restraint: {
    shared: entry(
      [
        'Mechanical restraint application and removal times documented',
        'Nursing interventions completed',
        'Provider notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Monitor resident continuously while mechanical restraint is in use per facility guideline',
        'Reassess least restrictive alternatives and release readiness per guideline',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed regarding mechanical restraint monitoring and circulation checks',
      ],
      'DSP/staff instructed to monitor breathing, circulation, skin integrity, comfort, and behavior while mechanical restraint is in use and immediately report injury, circulation compromise, distress, or behavioral escalation.',
      [
        'Notify provider per crisis mechanical restraint protocol for continued need, injury, or complications',
        'Document provider notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy and crisis restraint requirements when indicated',
      ],
      [
        'Complete debrief and documentation per facility crisis mechanical restraint guideline',
        'Continue behavioral monitoring after restraint release',
      ],
      [
        'Staff instructed on mechanical restraint monitoring intervals and release criteria',
      ],
    ),
  },

  other: {
    shared: entry(
      [
        'Nursing interventions completed',
        'Provider notification completed',
        'Staff verbalized understanding of instructions',
      ],
      [
        'Continue monitoring and reassessment per documented plan and applicable facility guidelines',
        'Notify oncoming nurse when follow-up is needed',
        'Staff instructed to monitor for changes from baseline and report promptly',
      ],
      'DSP/staff instructed to monitor condition, symptoms, and response to interventions and immediately report any worsening or new concerns to nursing staff.',
      [
        'Notify provider when explicitly reported or when applicable facility guideline criteria are met',
        'Document provider notification only when it occurred or is explicitly indicated',
      ],
      [
        'Notify LAR/guardian per facility policy when significant change in condition is reported',
      ],
      [
        'Document follow-up per nurse report and applicable facility guidelines',
        'Reassess when condition changes or follow-up is indicated',
      ],
      [
        'Staff instructed on monitoring and reporting requirements per documented plan',
        'Resident education when applicable and reported',
      ],
    ),
  },
};

export function getGuidelinePlanLibraryEntry(
  guidelineId: GuidelineId,
  assessmentType: AssessmentType,
): GuidelinePlanLibraryEntry {
  const definition = GUIDELINE_PLAN_LIBRARY[guidelineId];
  const override = definition[assessmentType as keyof Omit<GuidelinePlanLibraryDefinition, 'shared'>];
  return mergePlanEntry(definition.shared, override);
}

function formatPlanList(title: string, items: string[]): string {
  if (items.length === 0) return `${title}:\n- None specified.`;
  return `${title}:\n${items.map((item) => `- ${item}`).join('\n')}`;
}

export function buildGuidelinePlanLibraryBlock(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string {
  const plan = getGuidelinePlanLibraryEntry(def.id, assessmentType);

  return `=== FACILITY GUIDELINE PLAN LIBRARY (mandatory Plan assembly source) ===
Guideline: ${def.displayName}
Assessment type: ${assessmentType}

Use this library to assemble the SOAP Plan (and SBAR Recommendation when requested).
Write Subjective, Objective, and Assessment naturally from the nurse narrative.
For Plan, include every supported Category A item and every Category B item below using prospective language.

${formatPlanList('CATEGORY A — COMPLETED PLAN ELEMENTS (narrative only; omit if not reported)', plan.completedPlanElements)}

${formatPlanList('CATEGORY B — PROSPECTIVE PLAN ELEMENTS (mandatory; include using forward-looking language)', plan.prospectivePlanElements)}

ROUTINE DSP MONITORING INSTRUCTIONS (mandatory Category B):
${plan.dspMonitoringInstructions}

${formatPlanList('PROVIDER NOTIFICATION REQUIREMENTS', plan.providerNotificationRequirements)}

${formatPlanList('LAR/GUARDIAN NOTIFICATION REQUIREMENTS', plan.larNotificationRequirements)}

${formatPlanList('FOLLOW-UP ACTIONS', plan.followUpActions)}

${formatPlanList('EDUCATION POINTS', plan.educationPoints)}

Plan assembly rule: weave Category A and Category B items into professional nursing Plan prose. Category B must not be skipped because the nurse narrative omitted them.`;
}

export function validatePlanAgainstLibrary(
  planText: string,
  guidelineId: GuidelineId,
  assessmentType: AssessmentType,
): string[] {
  const plan = getGuidelinePlanLibraryEntry(guidelineId, assessmentType);
  const lower = planText.toLowerCase();
  const errors: string[] = [];

  if (!/\bmonitor/i.test(lower) || !/\breport/i.test(lower)) {
    errors.push('Guideline-required DSP monitoring and reporting instructions are missing from the Plan');
  }

  const missingProspective = plan.prospectivePlanElements.filter((element) => {
    const tokens = element
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 4);
    const matchCount = tokens.filter((token) => lower.includes(token)).length;
    return matchCount < Math.min(2, tokens.length);
  });

  if (missingProspective.length > 0) {
    errors.push(
      `Guideline Plan library prospective elements appear incomplete: ${missingProspective.slice(0, 3).join('; ')}`,
    );
  }

  return errors;
}

export function listGuidelinePlanLibraryIds(): GuidelineId[] {
  return Object.keys(GUIDELINE_PLAN_LIBRARY) as GuidelineId[];
}
