import type { GuidelineId } from '../types';

export type SampleAssessmentType =
  | 'Initial'
  | 'Follow-up'
  | 'Resolution'
  | 'Procedure'
  | 'Return';

export interface ClinicalSample {
  id: string;
  label: string;
  guidelineId: GuidelineId;
  assessmentType?: SampleAssessmentType;
  clinicalInformation: string;
  generateProviderNotification?: boolean;
  generateLAREmail?: boolean;
}

const ASSESSMENT_PREFIX_AT_START =
  /^(initial|follow-up|follow up|resolution|procedure|return) assessment|^(transfer back)/i;

function sample(
  partial: ClinicalSample,
): ClinicalSample {
  return {
    generateProviderNotification: false,
    generateLAREmail: false,
    ...partial,
  };
}

export const clinicalSamples: ClinicalSample[] = [
  // ---------------------------------------------------------------------------
  // Generic SOAP Note
  // ---------------------------------------------------------------------------
  sample({
    id: 'generic-initial',
    label: 'Generic SOAP — Initial',
    guidelineId: 'other',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0900, Maria Lopez, DSP, reported that the individual complained of mild fatigue after breakfast and declined the morning activity. Assessed at 0915. Temporal temperature 98.4°F. Individual alert and cooperative. Nursing interventions completed. Staff verbalized understanding to monitor and report changes.',
  }),
  sample({
    id: 'generic-follow-up',
    label: 'Generic SOAP — Follow-up',
    guidelineId: 'other',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment at 1400. Individual participated in afternoon programming without reported fatigue. No new concerns reported by staff. Additional findings: appetite improved at lunch.',
  }),
  sample({
    id: 'generic-resolution',
    label: 'Generic SOAP — Resolution',
    guidelineId: 'other',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Individual returned to usual activity level. No further fatigue reported during the monitoring period. Issue resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // Fall
  // ---------------------------------------------------------------------------
  sample({
    id: 'fall-initial',
    label: 'Fall — Initial',
    guidelineId: 'fall',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 2030, Chris Nguyen, DSP, reported that the individual was found sitting on the floor in the bedroom after an unwitnessed fall. Individual denied pain. No visible injury noted. Current use of aspirin 81 mg daily. PIR completed. Nursing interventions completed. Staff verbalized understanding of fall precautions.',
  }),
  sample({
    id: 'fall-follow-up',
    label: 'Fall — Follow-up',
    guidelineId: 'fall',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'At 2015, DSP reported that the individual was found face down on the ground outside after an unwitnessed fall. Individual denied pain. No visible injury or bruising noted. Vital signs obtained and within normal limits. Individual ambulated with walker without difficulty.',
  }),
  sample({
    id: 'fall-resolution',
    label: 'Fall — Resolution',
    guidelineId: 'fall',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment after 24-hour fall monitoring. No delayed injury, pain, neuro change, or functional decline reported. Required shift assessments completed. No unresolved concerns documented.',
  }),
  sample({
    id: 'fall-missing-report-time',
    label: 'Fall — Missing Report Time',
    guidelineId: 'fall',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'DSP reported that the individual was found on the floor beside the bed after an unwitnessed fall. Individual denied pain. No visible injury noted.',
  }),
  sample({
    id: 'fall-with-provider-notification',
    label: 'Fall — Provider Notification Selected',
    guidelineId: 'fall',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'At 0815, Jane Smith, DSP, reported that the individual fell in the bathroom. Individual complained of headache. PCP was notified at 0830. Nursing interventions completed. Staff verbalized understanding of fall precautions.',
    generateProviderNotification: true,
  }),

  // ---------------------------------------------------------------------------
  // Head Injury
  // ---------------------------------------------------------------------------
  sample({
    id: 'head-injury-initial',
    label: 'Head Injury — Initial',
    guidelineId: 'head_injury',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1545, DSP reported the individual struck the left side of the head on a door frame while ambulating. Individual reported mild headache. No loss of consciousness reported. Current use of Eliquis. Pupils equal and reactive. PIR completed. Nursing interventions completed.',
  }),
  sample({
    id: 'head-injury-follow-up',
    label: 'Head Injury — Follow-up',
    guidelineId: 'head_injury',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment at 0800. Individual denies headache. No vomiting, dizziness, or behavior change reported. Neuro assessment unchanged from baseline. Continue q4 neuro checks per guideline.',
  }),
  sample({
    id: 'head-injury-resolution',
    label: 'Head Injury — Resolution',
    guidelineId: 'head_injury',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Required neuro monitoring completed without delayed symptoms. Individual at baseline. Head injury guideline monitoring complete.',
  }),

  // ---------------------------------------------------------------------------
  // Vomiting
  // ---------------------------------------------------------------------------
  sample({
    id: 'vomiting-initial',
    label: 'Vomiting — Initial',
    guidelineId: 'vomiting',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1200, Taylor Reed, DSP, reported one episode of emesis after lunch containing undigested food. Enteral feeding rate 60 mL/hr. Intake and output reviewed for past 24 hours: intake 48 oz, output 5 voids and 1 BM. Individual denies nausea. Positioning per PNMP maintained. Nursing interventions completed.',
  }),
  sample({
    id: 'vomiting-follow-up',
    label: 'Vomiting — Follow-up',
    guidelineId: 'vomiting',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'One emesis episode yesterday at 1730 after dinner. Emesis contained undigested food. DSP reported the individual ate too fast. Currently sleeping in bed. Respirations even and unlabored. No aspiration or respiratory distress. Abdomen soft and non-tender. No pain. Vital signs within normal limits. 100% meals. 52 oz fluid intake. 5 voids. 1 bowel movement. No nausea or further vomiting. Sitting upright.',
  }),
  sample({
    id: 'vomiting-resolution',
    label: 'Vomiting — Resolution',
    guidelineId: 'vomiting',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. No emesis for 24 hours. Individual tolerating meals. Vomiting resolved per nurse documentation.',
  }),
  sample({
    id: 'vomiting-missing-reporter',
    label: 'Vomiting — Missing Reporter Name/Title',
    guidelineId: 'vomiting',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'At 1400, staff reported one episode of emesis after lunch. Emesis contained undigested food. Individual denies nausea at this time. Abdomen soft and non-tender.',
  }),
  sample({
    id: 'vomiting-with-lar-email',
    label: 'Vomiting — LAR Email Selected',
    guidelineId: 'vomiting',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'At 1900, DSP reported two episodes of vomiting after dinner. Individual denies nausea now. Intake for the past 24 hours was approximately 40 oz. Nursing monitored individual closely.',
    generateLAREmail: true,
  }),

  // ---------------------------------------------------------------------------
  // Diarrhea
  // ---------------------------------------------------------------------------
  sample({
    id: 'diarrhea-initial',
    label: 'Diarrhea — Initial',
    guidelineId: 'diarrhea',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0600, DSP reported three loose stools overnight. Intake for the past 24 hours approximately 50 oz. Six voids documented. Individual denied abdominal pain. Strategies implemented to prevent dehydration. Nursing interventions completed.',
  }),
  sample({
    id: 'diarrhea-follow-up',
    label: 'Diarrhea — Follow-up',
    guidelineId: 'diarrhea',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'DSP reported two loose stools overnight. No loose stool occurred during this shift. Intake for the past 24 hours was approximately 60 oz. Six voids documented. Individual denied abdominal pain. No anti-diarrheal medication was administered.',
  }),
  sample({
    id: 'diarrhea-resolution',
    label: 'Diarrhea — Resolution',
    guidelineId: 'diarrhea',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. No loose stool for 24 hours. Stool pattern returned to baseline. Diarrhea resolved per nurse documentation.',
  }),
  sample({
    id: 'diarrhea-medication-no-effectiveness',
    label: 'Diarrhea — Medication Given, Effectiveness Unknown',
    guidelineId: 'diarrhea',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Imodium 2 mg was administered at 0600 per PRN order. One loose stool reported at 0500. Intake for the past 24 hours was approximately 48 oz. Individual denied abdominal pain.',
  }),
  sample({
    id: 'diarrhea-resolution-not-confirmed',
    label: 'Diarrhea — Resolution Not Confirmed',
    guidelineId: 'diarrhea',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'No loose stool during this shift. Intake for the past 24 hours was approximately 55 oz. Six voids documented. Individual denied abdominal pain.',
  }),

  // ---------------------------------------------------------------------------
  // Constipation
  // ---------------------------------------------------------------------------
  sample({
    id: 'constipation-initial',
    label: 'Constipation — Initial',
    guidelineId: 'constipation',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0700, DSP reported no bowel movement for two days. Abdomen mildly distended. Individual denied pain. Additional assessment findings: decreased appetite at breakfast. Nursing interventions completed.',
  }),
  sample({
    id: 'constipation-follow-up',
    label: 'Constipation — Follow-up',
    guidelineId: 'constipation',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. No bowel movement for two days. Abdomen mildly distended. Individual denied pain. Increased fluids encouraged.',
  }),
  sample({
    id: 'constipation-resolution',
    label: 'Constipation — Resolution',
    guidelineId: 'constipation',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Individual had no bowel movement for three days. Dulcolax suppository was administered at 0830 per PRN order; see eMAR. A large bowel movement occurred at 1015. Individual denied abdominal pain or nausea and reported relief after the bowel movement.',
  }),

  // ---------------------------------------------------------------------------
  // Pain
  // ---------------------------------------------------------------------------
  sample({
    id: 'pain-initial',
    label: 'Pain — Initial',
    guidelineId: 'pain',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1100, individual reported right knee pain 6/10. Additional assessment findings: mild swelling noted. Tylenol 650 mg administered at 1115 per PRN order. Nursing interventions completed. Staff verbalized understanding to report unrelieved pain.',
  }),
  sample({
    id: 'pain-follow-up',
    label: 'Pain — Follow-up',
    guidelineId: 'pain',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment at 1500. Individual reports pain 3/10 after morning PRN dose. No new swelling or redness. Additional assessment findings: ambulating with walker without difficulty.',
  }),
  sample({
    id: 'pain-resolution',
    label: 'Pain — Resolution',
    guidelineId: 'pain',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Individual denies pain. No PRN analgesic required for 24 hours. Pain resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // Elevated Temperature
  // ---------------------------------------------------------------------------
  sample({
    id: 'elevated-temperature-initial',
    label: 'Elevated Temperature — Initial',
    guidelineId: 'elevated_temperature',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0800, temporal temperature 101.2°F. Individual reports mild fatigue. Additional assessment findings: lungs clear, no cough reported. Tylenol 650 mg given at 0815 per PRN order. Nursing interventions completed.',
  }),
  sample({
    id: 'elevated-temperature-follow-up',
    label: 'Elevated Temperature — Follow-up',
    guidelineId: 'elevated_temperature',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment at 1200. Temporal temperature 99.1°F. Individual denies fatigue. Encouraged fluids. No new symptoms reported.',
  }),
  sample({
    id: 'elevated-temperature-resolution',
    label: 'Elevated Temperature — Resolution',
    guidelineId: 'elevated_temperature',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Temporal temperature 98.6°F x 24 hours without antipyretic. Fever resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // UTI
  // ---------------------------------------------------------------------------
  sample({
    id: 'uti-initial',
    label: 'UTI — Initial',
    guidelineId: 'uti',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1400, DSP reported increased frequency of urination and foul-smelling urine. Individual denied dysuria. Additional assessment findings: temporal temperature 99.8°F. Urine specimen collected per order. Nursing interventions completed.',
  }),
  sample({
    id: 'uti-follow-up',
    label: 'UTI — Follow-up',
    guidelineId: 'uti',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Individual started on antibiotic yesterday per PCP order. Reports improved urinary symptoms. Encouraged fluids. No fever reported today.',
  }),
  sample({
    id: 'uti-resolution',
    label: 'UTI — Resolution',
    guidelineId: 'uti',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Urinary symptoms resolved. Antibiotic course completed as ordered. UTI resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // Respiratory Distress / Aspiration
  // ---------------------------------------------------------------------------
  sample({
    id: 'respiratory-initial',
    label: 'Respiratory Distress — Initial',
    guidelineId: 'respiratory',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0730, DSP reported coughing during breakfast and increased work of breathing. Individual positioned with head of bed elevated 45 degrees. Relevant symptoms: mild dyspnea, SpO2 91% on room air. Oxygen 2 L/min applied; SpO2 improved to 95%. Nursing interventions completed.',
  }),
  sample({
    id: 'respiratory-follow-up',
    label: 'Respiratory Distress — Follow-up',
    guidelineId: 'respiratory',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Individual was assessed resting in bed with the head of bed elevated. No respiratory distress noted during this shift. Respirations were even and unlabored. Oxygen saturation was 96% on room air. PRN albuterol had been administered during the previous shift.',
  }),
  sample({
    id: 'respiratory-resolution',
    label: 'Respiratory Distress — Resolution',
    guidelineId: 'respiratory',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. No respiratory distress for 48 hours. SpO2 stable on room air. Respiratory guideline monitoring complete.',
  }),
  sample({
    id: 'respiratory-both-optional-docs',
    label: 'Respiratory — Both Optional Documents',
    guidelineId: 'respiratory',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Individual with increased work of breathing noted at 0700. Oxygen saturation 89% on room air. Oxygen applied at 2 L/min via nasal cannula; saturation improved to 94%. PCP notified at 0730. Relevant respiratory symptoms include mild dyspnea.',
    generateProviderNotification: true,
    generateLAREmail: true,
  }),

  // ---------------------------------------------------------------------------
  // Adventitious Lung Sounds
  // ---------------------------------------------------------------------------
  sample({
    id: 'adventitious-lung-sounds-initial',
    label: 'Adventitious Lung Sounds — Initial',
    guidelineId: 'adventitious_lung_sounds',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1000, nurse auscultated coarse crackles in bilateral lower lobes. Individual denies shortness of breath. SpO2 94% on room air. Head of bed elevated. PCP notified. Nursing interventions completed.',
  }),
  sample({
    id: 'adventitious-lung-sounds-follow-up',
    label: 'Adventitious Lung Sounds — Follow-up',
    guidelineId: 'adventitious_lung_sounds',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Crackles decreased compared to prior assessment. SpO2 96% on room air. Individual denies cough or dyspnea.',
  }),
  sample({
    id: 'adventitious-lung-sounds-resolution',
    label: 'Adventitious Lung Sounds — Resolution',
    guidelineId: 'adventitious_lung_sounds',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Lungs clear to auscultation bilaterally. Adventitious lung sounds resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // Abdominal Distention / Pain
  // ---------------------------------------------------------------------------
  sample({
    id: 'abdominal-distention-initial',
    label: 'Abdominal Distention / Pain — Initial',
    guidelineId: 'abdominal_distention_pain',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1600, individual reported abdominal bloating and discomfort 4/10. Abdomen distended compared to baseline. Last BM two days ago. Individual denies nausea. Nursing interventions completed. PCP notified.',
  }),
  sample({
    id: 'abdominal-distention-follow-up',
    label: 'Abdominal Distention / Pain — Follow-up',
    guidelineId: 'abdominal_distention_pain',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Abdominal girth unchanged. Pain 2/10. Individual had small bowel movement this morning. Encouraged fluids and mobility.',
  }),
  sample({
    id: 'abdominal-distention-resolution',
    label: 'Abdominal Distention / Pain — Resolution',
    guidelineId: 'abdominal_distention_pain',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Abdomen soft, non-distended. Individual denies pain. Abdominal distention resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // Enteral Feeding Tolerance
  // ---------------------------------------------------------------------------
  sample({
    id: 'enteral-feeding-initial',
    label: 'Enteral Feeding Tolerance — Initial',
    guidelineId: 'enteral_feeding_tolerance',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0800, DSP reported residual 120 mL during scheduled check before breakfast feeding. Feeding held per protocol. Abdomen soft. Individual denies nausea. Residual reassessment planned. Nursing interventions completed.',
  }),
  sample({
    id: 'enteral-feeding-follow-up',
    label: 'Enteral Feeding Tolerance — Follow-up',
    guidelineId: 'enteral_feeding_tolerance',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Residual 40 mL at 1200. Feedings resumed at ordered rate 60 mL/hr. No emesis reported. Abdomen soft, non-tender.',
  }),
  sample({
    id: 'enteral-feeding-resolution',
    label: 'Enteral Feeding Tolerance — Resolution',
    guidelineId: 'enteral_feeding_tolerance',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Residuals within acceptable range x 24 hours. Feedings tolerated at goal rate. Enteral feeding tolerance issue resolved.',
  }),

  // ---------------------------------------------------------------------------
  // Enteral Tube Insertion / G-Tube Change (includes G-Tube site care context)
  // ---------------------------------------------------------------------------
  sample({
    id: 'enteral-tube-procedure',
    label: 'G-Tube Change — Procedure',
    guidelineId: 'enteral_tube_insertion',
    assessmentType: 'Procedure',
    clinicalInformation:
      'Procedure assessment. G-tube changed at 1000 by nurse. Removed 16 Fr MIC-KEY; tip intact. Inserted new 16 Fr MIC-KEY; balloon inflated with 5 mL sterile water. Placement verified by 10 mL air bolus and visualization of gastric contents. Insertion site clean, dry, intact without redness or drainage. Individual tolerated procedure well. DSP instructed to report redness, swelling, or drainage.',
  }),
  sample({
    id: 'enteral-tube-follow-up',
    label: 'G-Tube Site — Follow-up',
    guidelineId: 'enteral_tube_insertion',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment after g-tube change yesterday. Insertion site clean without erythema, swelling, or drainage. Feedings infusing without difficulty. DSP verbalized understanding of site monitoring.',
  }),

  // ---------------------------------------------------------------------------
  // Skin Impairment
  // ---------------------------------------------------------------------------
  sample({
    id: 'skin-impairment-initial',
    label: 'Skin Impairment — Initial',
    guidelineId: 'skin_impairment',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1300, DSP reported open area on sacrum discovered during bath. Stage 2 pressure injury approximately 2 cm x 1.5 cm, partial thickness, no slough. Individual denies pain at site. Wound cleansed and dressing applied per protocol. Braden score 14. Nursing interventions completed.',
  }),
  sample({
    id: 'skin-impairment-follow-up',
    label: 'Skin Impairment — Follow-up',
    guidelineId: 'skin_impairment',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Sacral wound unchanged in size. No erythema or drainage. Repositioning every 2 hours continued. Off-loading cushion in use.',
  }),
  sample({
    id: 'skin-impairment-resolution',
    label: 'Skin Impairment — Resolution',
    guidelineId: 'skin_impairment',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Sacral area healed with intact skin. Pressure injury resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // Seizure Activity
  // ---------------------------------------------------------------------------
  sample({
    id: 'seizure-initial',
    label: 'Seizure Activity — Initial',
    guidelineId: 'seizure',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0215, DSP witnessed generalized tonic-clonic activity lasting approximately 90 seconds. Individual placed on side during event. Postictal afterward, oriented x2 within 15 minutes. No injury noted. Seizure log completed. PCP notified. Nursing interventions completed.',
  }),
  sample({
    id: 'seizure-follow-up',
    label: 'Seizure Activity — Follow-up',
    guidelineId: 'seizure',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment at 0800. Individual alert and oriented x3. Denies headache or muscle soreness. Ate breakfast without difficulty. No further seizure activity reported.',
  }),
  sample({
    id: 'seizure-resolution',
    label: 'Seizure Activity — Resolution',
    guidelineId: 'seizure',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. No recurrent seizure activity during required monitoring period. Individual at baseline. Seizure follow-up complete.',
  }),

  // ---------------------------------------------------------------------------
  // Hypoglycemia
  // ---------------------------------------------------------------------------
  sample({
    id: 'hypoglycemia-initial',
    label: 'Hypoglycemia — Initial',
    guidelineId: 'hypoglycemia',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0700, individual reported shakiness and diaphoresis. Fingerstick glucose 58 mg/dL. Four oz apple juice given per protocol. Repeat glucose 15 minutes later 78 mg/dL. Individual symptoms resolved. PCP notified per threshold. Nursing interventions completed.',
  }),
  sample({
    id: 'hypoglycemia-follow-up',
    label: 'Hypoglycemia — Follow-up',
    guidelineId: 'hypoglycemia',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Glucose checks qAC today 95-110 mg/dL. No hypoglycemia symptoms reported. Meals consumed as ordered.',
  }),
  sample({
    id: 'hypoglycemia-resolution',
    label: 'Hypoglycemia — Resolution',
    guidelineId: 'hypoglycemia',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. No hypoglycemic episodes for 48 hours. Glucose stable within ordered parameters. Hypoglycemia event resolved.',
  }),

  // ---------------------------------------------------------------------------
  // Hyperglycemia
  // ---------------------------------------------------------------------------
  sample({
    id: 'hyperglycemia-initial',
    label: 'Hyperglycemia — Initial',
    guidelineId: 'hyperglycemia',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1400, fingerstick glucose 312 mg/dL. Individual denies polyuria or blurred vision. PCP notified at 1415. Additional insulin administered per sliding scale order. Repeat glucose 2 hours later 198 mg/dL. Nursing interventions completed.',
  }),
  sample({
    id: 'hyperglycemia-follow-up',
    label: 'Hyperglycemia — Follow-up',
    guidelineId: 'hyperglycemia',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Glucose readings today 140-180 mg/dL. Individual tolerating meals. No hyperglycemia symptoms reported.',
  }),
  sample({
    id: 'hyperglycemia-resolution',
    label: 'Hyperglycemia — Resolution',
    guidelineId: 'hyperglycemia',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Glucose within target range x 24 hours. Hyperglycemia resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // Hypothermia
  // ---------------------------------------------------------------------------
  sample({
    id: 'hypothermia-initial',
    label: 'Hypothermia — Initial',
    guidelineId: 'hypothermia',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 0600, temporal temperature 95.8°F after individual found without blanket. Warm blankets applied. Repeat temperature 96.8°F at 0630. Individual alert, denies chills. Nursing interventions completed.',
  }),
  sample({
    id: 'hypothermia-follow-up',
    label: 'Hypothermia — Follow-up',
    guidelineId: 'hypothermia',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Temporal temperature 97.6°F. Individual dressed appropriately for environment. No further hypothermia episodes.',
  }),
  sample({
    id: 'hypothermia-resolution',
    label: 'Hypothermia — Resolution',
    guidelineId: 'hypothermia',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Temperature maintained within normal limits x 24 hours. Hypothermia resolved per nurse documentation.',
  }),

  // ---------------------------------------------------------------------------
  // Medication Change
  // ---------------------------------------------------------------------------
  sample({
    id: 'medication-change-initial',
    label: 'Medication Change — Initial',
    guidelineId: 'medication_change',
    assessmentType: 'Initial',
    clinicalInformation:
      'Initial assessment after new Depakote dose increase per PCP order effective today. Individual denies nausea or dizziness. Additional findings related to medication change: steady gait observed. Nursing interventions completed.',
  }),
  sample({
    id: 'medication-change-follow-up',
    label: 'Medication Change — Follow-up',
    guidelineId: 'medication_change',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment day 3 after dose change. Individual reports mild morning drowsiness, resolved by afternoon. No falls or behavior changes reported.',
  }),
  sample({
    id: 'medication-change-resolution',
    label: 'Medication Change — Resolution',
    guidelineId: 'medication_change',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Individual tolerating new medication dose without adverse effects. Medication change monitoring complete.',
  }),

  // ---------------------------------------------------------------------------
  // Transfer Out / Transfer Back
  // ---------------------------------------------------------------------------
  sample({
    id: 'transfer-out-initial',
    label: 'Transfer Out — Initial',
    guidelineId: 'transfer_out_back',
    assessmentType: 'Initial',
    clinicalInformation:
      'Initial assessment for emergency transfer out. At 2200, individual with acute chest pain and shortness of breath. PCP ordered transfer to acute care. Pre-transfer vitals obtained. Not on anticoagulant. EMS notified at 2210. Family notified. Campus Coordinator notified. Medical Transfer Screen completed. Braden score 16. Nurse report given to EMS.',
  }),
  sample({
    id: 'transfer-back-return',
    label: 'Transfer Back — Return',
    guidelineId: 'transfer_out_back',
    assessmentType: 'Return',
    clinicalInformation:
      'Individual returned from hospital at 1500 after observation for chest pain. Diagnosis upon return: musculoskeletal chest wall pain. Weight upon return 142 lbs. Skin assessment intact without new breakdown. Report received from hospital nurse. PCP notified of return. Nursing interventions completed.',
  }),
  sample({
    id: 'transfer-resolution',
    label: 'Transfer Out/Back — Resolution',
    guidelineId: 'transfer_out_back',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Individual stable after return from hospital. Transfer follow-up monitoring complete. No unresolved transfer-related concerns documented.',
  }),

  // ---------------------------------------------------------------------------
  // Post Sedation (Medical/Dental Chemical Sedation)
  // ---------------------------------------------------------------------------
  sample({
    id: 'post-sedation-follow-up',
    label: 'Medical/Dental Sedation — Follow-up',
    guidelineId: 'post_sedation',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment after dental procedure with IV sedation at 0900. Individual returned to residence at 1130. Alert and oriented x3. Vital signs stable. Individual tolerated clear liquids. DSP instructed to monitor for drowsiness, nausea, or bleeding.',
  }),
  sample({
    id: 'post-sedation-resolution',
    label: 'Medical/Dental Sedation — Resolution',
    guidelineId: 'post_sedation',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. No sedation-related complications. Individual at baseline activity level. Post-sedation monitoring complete.',
  }),

  // ---------------------------------------------------------------------------
  // Post Anesthesia Care
  // ---------------------------------------------------------------------------
  sample({
    id: 'post-anesthesia-follow-up',
    label: 'Post Anesthesia — Follow-up',
    guidelineId: 'post_anesthesia',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment after outpatient surgery with general anesthesia. Individual returned home to facility at 1400. Status post appendectomy. Mild nausea reported; Zofran 4 mg given per discharge instructions at 1430. Arrival vitals stable. DSP instructed on post-anesthesia monitoring.',
  }),
  sample({
    id: 'post-anesthesia-resolution',
    label: 'Post Anesthesia — Resolution',
    guidelineId: 'post_anesthesia',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Individual returned to baseline without nausea or complications. Post-anesthesia monitoring period complete.',
  }),

  // ---------------------------------------------------------------------------
  // Crisis Physical Restraint
  // ---------------------------------------------------------------------------
  sample({
    id: 'crisis-physical-initial',
    label: 'Crisis Physical Restraint — Initial',
    guidelineId: 'crisis_physical_restraint',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1815, individual engaged in self-injurious behavior toward staff. Crisis physical restraint implemented per protocol for 8 minutes until individual regained control. No injury noted during restraint. Circulation and breathing checked q2 minutes during hold. PCP notified at end of monitoring period. Nursing interventions completed.',
  }),
  sample({
    id: 'crisis-physical-follow-up',
    label: 'Crisis Physical Restraint — Follow-up',
    guidelineId: 'crisis_physical_restraint',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment one hour after restraint. Individual calm and cooperative. Denies pain. No skin marks or abrasions noted. Behavior support plan reviewed with staff.',
  }),
  sample({
    id: 'crisis-physical-resolution',
    label: 'Crisis Physical Restraint — Resolution',
    guidelineId: 'crisis_physical_restraint',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Required post-restraint monitoring completed. No complications. Individual at baseline. Crisis event follow-up complete.',
  }),

  // ---------------------------------------------------------------------------
  // Crisis Chemical Restraint
  // ---------------------------------------------------------------------------
  sample({
    id: 'crisis-chemical-initial',
    label: 'Crisis Chemical Restraint — Initial',
    guidelineId: 'crisis_chemical_restraint',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 2000, individual with escalating aggression toward peers. IM Geodon 20 mg administered per PRN crisis order at 2010 after less restrictive interventions ineffective. Individual cooperative within 30 minutes. Injection site left deltoid without redness or swelling. PCP notified at end of monitoring period. Nursing interventions completed.',
  }),
  sample({
    id: 'crisis-chemical-follow-up',
    label: 'Crisis Chemical Restraint — Follow-up',
    guidelineId: 'crisis_chemical_restraint',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment at 0600. Individual slept 6 hours without incident. Alert and oriented. Denies sedation side effects. Injection site without tenderness.',
  }),
  sample({
    id: 'crisis-chemical-resolution',
    label: 'Crisis Chemical Restraint — Resolution',
    guidelineId: 'crisis_chemical_restraint',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Required monitoring after chemical restraint completed. No adverse effects. Crisis follow-up complete.',
  }),

  // ---------------------------------------------------------------------------
  // Crisis Mechanical Restraint
  // ---------------------------------------------------------------------------
  sample({
    id: 'crisis-mechanical-initial',
    label: 'Crisis Mechanical Restraint — Initial',
    guidelineId: 'crisis_mechanical_restraint',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1930, individual attempted to harm self with furniture. Soft wrist restraints applied per crisis protocol after less restrictive measures failed. Restraints discontinued at 2015 when individual calm. Circulation checks completed q15 minutes while restrained. No skin breakdown noted. PCP notified. Nursing interventions completed.',
  }),
  sample({
    id: 'crisis-mechanical-follow-up',
    label: 'Crisis Mechanical Restraint — Follow-up',
    guidelineId: 'crisis_mechanical_restraint',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. Individual calm and engaged in structured activity. Wrists without erythema or marks. Staff debrief completed.',
  }),
  sample({
    id: 'crisis-mechanical-resolution',
    label: 'Crisis Mechanical Restraint — Resolution',
    guidelineId: 'crisis_mechanical_restraint',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Post-restraint monitoring complete without complications. Crisis mechanical restraint follow-up resolved.',
  }),

  // ---------------------------------------------------------------------------
  // PICA
  // ---------------------------------------------------------------------------
  sample({
    id: 'pica-initial',
    label: 'PICA — Initial',
    guidelineId: 'pica',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1500, DSP reported individual ingested small piece of plastic from activity room floor. Individual asymptomatic. Mouth inspected, no remaining foreign material. Abdomen soft, non-tender. PCP notified. Increased supervision implemented. Nursing interventions completed.',
  }),
  sample({
    id: 'pica-follow-up',
    label: 'PICA — Follow-up',
    guidelineId: 'pica',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment. No abdominal pain, vomiting, or behavior changes reported. Bowel movement today without visible foreign material. Continued 1:1 supervision during community access.',
  }),
  sample({
    id: 'pica-resolution',
    label: 'PICA — Resolution',
    guidelineId: 'pica',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. No complications from ingestion event. Required monitoring complete. PICA event resolved.',
  }),

  // ---------------------------------------------------------------------------
  // Suspected Fracture / Dislocation
  // ---------------------------------------------------------------------------
  sample({
    id: 'fracture-initial',
    label: 'Suspected Fracture — Initial',
    guidelineId: 'suspected_fracture_dislocation',
    assessmentType: 'Initial',
    clinicalInformation:
      'At 1100, individual fell from wheelchair and complained of right wrist pain 8/10. Swelling and limited range of motion noted. EMS notified for transfer to ER. Splint applied per protocol. Right upper extremity neurovascular intact. PCP notified. Nursing interventions completed.',
  }),
  sample({
    id: 'fracture-follow-up',
    label: 'Suspected Fracture — Follow-up',
    guidelineId: 'suspected_fracture_dislocation',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'Follow-up assessment after return from ER with cast to right wrist. Diagnosis: closed wrist fracture. Individual reports pain 4/10 managed with PRN Tylenol. Cast clean, dry, intact.',
  }),
  sample({
    id: 'fracture-resolution',
    label: 'Suspected Fracture — Resolution',
    guidelineId: 'suspected_fracture_dislocation',
    assessmentType: 'Resolution',
    clinicalInformation:
      'Resolution assessment. Cast removed per orthopedics. Individual regained functional use of wrist. Fracture follow-up complete.',
  }),

  // ---------------------------------------------------------------------------
  // Cross-cutting optional document test samples
  // ---------------------------------------------------------------------------
  sample({
    id: 'constipation-no-optional-docs',
    label: 'Constipation — No Optional Documents',
    guidelineId: 'constipation',
    assessmentType: 'Follow-up',
    clinicalInformation:
      'No bowel movement for two days. Abdomen mildly distended. Individual denied pain. Increased fluids encouraged.',
  }),
];

const GUIDELINE_IDS: GuidelineId[] = [
  'other',
  'fall',
  'head_injury',
  'vomiting',
  'diarrhea',
  'constipation',
  'pain',
  'elevated_temperature',
  'uti',
  'respiratory',
  'adventitious_lung_sounds',
  'abdominal_distention_pain',
  'enteral_feeding_tolerance',
  'enteral_tube_insertion',
  'skin_impairment',
  'seizure',
  'hypoglycemia',
  'hyperglycemia',
  'hypothermia',
  'medication_change',
  'transfer_out_back',
  'post_sedation',
  'post_anesthesia',
  'crisis_physical_restraint',
  'crisis_chemical_restraint',
  'crisis_mechanical_restraint',
  'pica',
  'suspected_fracture_dislocation',
];

/** Ensures every supported guideline has at least one sample (dev-time sanity check). */
export function getGuidelinesWithoutSamples(): GuidelineId[] {
  const covered = new Set(clinicalSamples.map((entry) => entry.guidelineId));
  return GUIDELINE_IDS.filter((id) => !covered.has(id));
}

export function formatSampleClinicalInformation(sample: ClinicalSample): string {
  const text = sample.clinicalInformation.trim();
  if (!sample.assessmentType) return text;

  if (ASSESSMENT_PREFIX_AT_START.test(text)) {
    return text;
  }

  if (sample.assessmentType === 'Return') {
    return `Return assessment.\n\n${text}`;
  }

  return `${sample.assessmentType} assessment.\n\n${text}`;
}

export function getSamplesForGuideline(guidelineId: GuidelineId | ''): ClinicalSample[] {
  if (!guidelineId) return clinicalSamples;
  const filtered = clinicalSamples.filter((sample) => sample.guidelineId === guidelineId);
  return filtered.length > 0 ? filtered : clinicalSamples;
}
