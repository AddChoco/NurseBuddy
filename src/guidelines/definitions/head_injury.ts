import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const REPORTED_CAUSE_KEYWORDS = [
  'reported cause', 'cause of injury', 'mechanism', 'how it happened', 'hit head',
  'struck head', 'bumped head', 'fell', 'fall', 'assault', 'struck by', 'motor vehicle',
  'witness report', 'staff report', 'resident report', 'history', '두부', 'head injury',
];

const OBSERVED_CAUSE_KEYWORDS = [
  'observed cause', 'cause of injury', 'mechanism', 'found', 'witnessed', 'staff observed',
  'hit head', 'struck head', 'bumped head', 'fell', 'fall', 'head impact', 'head strike',
  'injury observed', 'observed injury',
];

const ANTICOAGULANT_KEYWORDS = [
  'anticoagulant', 'antiplatelet', 'blood thinner', 'coumadin', 'warfarin', 'eliquis',
  'apixaban', 'xarelto', 'rivaroxaban', 'aspirin', 'plavix', 'clopidogrel', 'heparin',
  'lovenox', 'enoxaparin', 'no blood thinner', 'not on anticoag',
];

const LOC_STATUS_KEYWORDS = [
  'loss of consciousness', 'loc', 'passed out', 'unconscious', 'syncope',
  'no loc', 'without loc', 'did not lose consciousness', 'remained conscious',
  'alert', 'awake', 'not applicable', 'n/a',
];

const LOC_DURATION_KEYWORDS = [
  'duration', 'seconds', 'minutes', 'brief', 'transient', 'prolonged',
  'loc duration', 'unconscious for', 'seconds of loc', 'minutes of loc',
];

const OTHER_ASSESSMENT_KEYWORDS = [
  'assessment finding', 'other finding', 'neuro', 'neurologic', 'pupil', 'gcs',
  'mental status', 'headache', 'nausea', 'vomiting', 'dizziness', 'weakness',
  'speech', 'vision', 'vital', 'blood pressure', 'pulse', 'scalp', 'hematoma',
  'laceration', 'abrasion', 'swelling', 'bleeding', 'baseline',
];

const INJURY_SEVERITY_KEYWORDS = [
  'mild', 'moderate', 'severe', 'severity', 'established severity', 'pcp determined',
  'provider determined', 'injury severity',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'neuro check',
  'monitor', 'ice pack', 'comfort', 'observed', 'completed', 'assisted', 'ems',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'called',
  'contacted', 'notify pcp', 'reported to', 'not notified', 'no notification',
];

const PIR_KEYWORDS = [
  'pir', 'post injury report', 'injury report', 'incident report',
  'completed pir', 'pir completed', 'pir done',
];

const NEURO_MONITORING_PLAN_KEYWORDS = [
  'neurological assessment', 'neuro assessment', 'monitoring schedule', 'every 10 minutes',
  'every 15 minutes', 'every 30 minutes', 'every 2 hours', 'every 4 hours', 'every 8 hours',
  'reassess 1 hour', 'ems transport', 'neurological monitoring', 'neuro schedule',
  'mild head injury', 'moderate head injury', 'severe head injury',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const NEUROLOGICAL_STATUS_KEYWORDS = [
  'neurological status', 'current neuro', 'neuro status', 'mental status', 'alert',
  'oriented', 'confused', 'lethargic', 'pupil', 'gcs', 'speech', 'motor',
  'baseline', 'deteriorat', 'improved', 'unchanged', 'stable',
];

const REASSESSMENT_FINDINGS_KEYWORDS = [
  'reassessment', 'nurse reassessment', 're-evaluated', 'follow-up assessment',
  'neuro check', 'repeat assessment', 'monitoring finding', 'current status',
];

const PCP_DETERIORATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'notified', 'notification', 'deteriorat',
  'worsening', 'declined', 'immediate', 'neurological status deteriorates',
];

const NEUROLOGICAL_MONITORING_SCHEDULE = `NEUROLOGICAL MONITORING SCHEDULE

Preserve these schedules exactly as the facility guideline specifies:

Severe Head Injury
- Neurological assessment every 10 minutes until EMS transport.

Moderate Head Injury
- Every 15 minutes for 1 hour.
- Then every 30 minutes for 4 hours.
- Then every 2 hours for 8 hours.
- Then every 4 hours for 8 hours.
- Then every 8 hours for 48 hours or longer until neurological status is considered stable by the PCP.

Mild Head Injury
- Reassess 1 hour after the initial assessment.
- Then every 4 hours for 24 hours.
- Continue until the PCP determines monitoring is no longer required.`;

function headInjuryField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `HEAD INJURY — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document the reported cause of the head injury.
- If the resident is unable to provide history, document available information from staff or witnesses.
- Do not invent a mechanism of injury.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Observed cause of injury
- Current use of anticoagulant or antiplatelet medication
- Loss of consciousness and duration (if applicable)
- Other assessment findings

ASSESSMENT:
Head Injury
Document the established severity only if provided or established by provider/facility workflow:
- Mild
- Moderate
- Severe

Do not determine severity unless it has been established by the provider or according to the facility workflow.

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Notify PCP of the head injury (only if notification occurred or is explicitly indicated).
- PCP will determine injury severity based on assessment findings (do not assign severity unless established).
- Follow neurological assessment schedule according to the established severity (see monitoring schedule below — do not invent completion).
- Post Injury Report (PIR) completed (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

${NEUROLOGICAL_MONITORING_SCHEDULE}

Never determine severity unless documented. Never assume loss of consciousness or normal neurological status. Never diagnose intracranial injury.`;

const FOLLOW_UP_RESOLUTION_INSTRUCTIONS = `HEAD INJURY — FOLLOW-UP / RESOLUTION ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new symptoms or concerns reported by the resident or staff.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

ASSESSMENT:
Head Injury
Document established severity only if provided or established by provider/facility workflow:
- Mild
- Moderate
- Severe

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Current neurological status (only if assessed and reported).
- Nurse reassessment (only if reported).
- Notify PCP immediately if neurological status deteriorates (only if deterioration occurred and notification is reported or indicated).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if additional follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

${NEUROLOGICAL_MONITORING_SCHEDULE}

Never fabricate neurological findings. Never assume neurological status is normal unless documented.`;

export const HEAD_INJURY_GUIDELINE: GuidelineDefinition = {
  id: 'head_injury',
  displayName: 'Head Injury',
  description:
    'Head Injury facility guideline. Document cause, anticoagulant use, LOC, assessment findings, established severity, PCP notification, PIR, and severity-based neurological monitoring schedule. Never determine severity or diagnose intracranial injury unless established/documented.',

  assessment: {
    requiredFields: [
      headInjuryField('Observed cause of injury', OBSERVED_CAUSE_KEYWORDS),
      headInjuryField('Current use of anticoagulant or antiplatelet medication', ANTICOAGULANT_KEYWORDS),
      headInjuryField('Loss of consciousness and duration (if applicable)', [...LOC_STATUS_KEYWORDS, ...LOC_DURATION_KEYWORDS], false),
      headInjuryField('Other assessment findings', OTHER_ASSESSMENT_KEYWORDS, false),
    ],
    optionalFields: [
      fieldFromLabel('Reported cause of head injury', {
        matchKeywords: REPORTED_CAUSE_KEYWORDS,
        description: 'Subjective history when available.',
      }),
      fieldFromLabel('Established injury severity (Mild / Moderate / Severe)', {
        matchKeywords: INJURY_SEVERITY_KEYWORDS,
        description: 'Only when established by provider or facility workflow.',
      }),
    ],
  },

  missingInformationChecklist: [
    headInjuryField('Reported cause of injury', REPORTED_CAUSE_KEYWORDS, false),
    headInjuryField('Observed cause of injury', OBSERVED_CAUSE_KEYWORDS),
    headInjuryField('Anticoagulant or antiplatelet use', ANTICOAGULANT_KEYWORDS),
    headInjuryField('Loss of consciousness status', LOC_STATUS_KEYWORDS, false),
    headInjuryField('Duration of loss of consciousness (if applicable)', LOC_DURATION_KEYWORDS, false),
    headInjuryField('Other assessment findings', OTHER_ASSESSMENT_KEYWORDS, false),
    headInjuryField('Injury severity', INJURY_SEVERITY_KEYWORDS, false),
    headInjuryField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    headInjuryField('PCP notification', PCP_NOTIFICATION_KEYWORDS, false),
    headInjuryField('PIR completion', PIR_KEYWORDS, false),
    headInjuryField('Neurological monitoring plan', NEURO_MONITORING_PLAN_KEYWORDS, false),
    headInjuryField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    headInjuryField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    headInjuryField('Neurological status', NEUROLOGICAL_STATUS_KEYWORDS, false),
    headInjuryField('Reassessment findings', REASSESSMENT_FINDINGS_KEYWORDS, false),
    headInjuryField('PCP notification if deterioration occurred', PCP_DETERIORATION_KEYWORDS, false),
  ],

  documentation: {
    initialAssessment: {
      applicable: true,
      instructions: INITIAL_ASSESSMENT_INSTRUCTIONS,
    },

    followUpAssessment: {
      applicable: true,
      instructions: FOLLOW_UP_RESOLUTION_INSTRUCTIONS,
    },

    resolutionAssessment: {
      applicable: true,
      instructions: `RESOLUTION ASSESSMENT — Head Injury

Document guideline closure only when input supports:
- PCP has determined monitoring is no longer required (mild) or neurological status stable per PCP (moderate/severe)
- Required neurological monitoring period complete as reported
- No unresolved neurological concerns

Do not mark head injury guideline resolved unless supported by provided information and established severity workflow.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Head Injury

SUBJECTIVE: reported cause from resident, staff, or witnesses; do not invent mechanism.
OBJECTIVE: Interactive View Assessment; observed cause, anticoagulant use, LOC/duration, other findings — only if provided. Never fabricate neuro findings.
ASSESSMENT: Head Injury; document established severity (Mild/Moderate/Severe) only if provider/facility established.
PLAN: interventions, PCP notification, PIR, neuro monitoring per severity schedule, handoff, staff understanding — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Head Injury

SITUATION: head injury event per guideline.
BACKGROUND: reported/observed cause, anticoagulant use, LOC if reported, established severity if provided.
ASSESSMENT: objective neuro and other findings provided only; do not assume normal neuro status.
RECOMMENDATION: PCP notification, PIR, neurological monitoring per severity schedule, immediate PCP contact if deterioration — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Head Injury

Plain-language summary of supported facts: head injury occurred, monitoring steps staff are taking, follow-up plan if reported.
Do not include clinical neuro details or severity beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Head Injury

Notify PCP of the head injury on initial assessment; notify immediately if neurological status deteriorates on follow-up.
Document notification only if it occurred or is explicitly indicated.
Include supported cause, anticoagulant use, LOC, findings, and established severity if provided. PCP determines severity — do not assign unless established.`,
    },
  },

  followUpRequirements: {
    frequency: 'Follow neurological assessment schedule according to established severity (Mild, Moderate, or Severe).',
    monitoringPoints: [
      'Current neurological status on each reassessment',
      'Nurse reassessment per severity schedule',
      'Signs of neurological deterioration',
      'Compliance with monitoring intervals',
      'PCP determination of stability or monitoring discontinuation',
    ],
    reassessmentCriteria: [
      'Neurological status deterioration',
      'New or worsening headache, nausea, vomiting, confusion, or weakness',
      'Change from baseline mental status',
      'Failure to meet scheduled neuro assessment intervals when reported',
    ],
    instructions: NEUROLOGICAL_MONITORING_SCHEDULE,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'PCP determines monitoring no longer required (mild) or neurological status stable (moderate/severe)',
      'Required neurological monitoring period complete as documented',
      'No unresolved neurological concerns reported',
    ],
    instructions:
      'Do not mark head injury guideline resolved unless monitoring completion and PCP determination are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP of head injury on initial assessment. Notify PCP immediately if neurological status deteriorates. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant head injury event is reported. Do not auto-notify unless supported.',
    triggers: [
      'Head injury initial assessment',
      'Neurological status deterioration',
      'Severe head injury requiring EMS transport',
      'Abnormal or worsening neurological findings',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless head injury report, deterioration, or explicit notification is reported.',
      'Do not assign injury severity unless established by provider or facility workflow.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident education or symptom monitoring instructions only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about head injury monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never determine the severity of a head injury unless documented or provided by the user.',
    'Never diagnose intracranial injury.',
    'Never assume loss of consciousness.',
    'Never fabricate neurological findings.',
    'Never assume neurological status is normal unless documented.',
    'Preserve the facility neurological monitoring schedule exactly as written.',
    'Do not invent a mechanism of injury.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
