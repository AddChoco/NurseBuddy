import type { GuidelineId, OutputId, Terminology, MissingInfoItem, GenerationResult, GeneratedDocument, DocumentationQualityCheck } from '../types';
import { GUIDELINES } from '../constants';
import { lookupGuidelineDefinition, getFieldMatchKeywords, getReviewAreaLabels, findGuidelineDefForArea } from '../guidelines';
import type { GuidelineDefinition } from '../guidelines/types';
import {
  detectAssessmentType,
  getFieldByLabel,
  inferMissingInfoCategory,
  shouldCheckMissingField,
} from '../guidelines/facilityTemplateMode';
import { validateGeneratedDocumentation } from './documentationValidation';

/**
 * AI generation engine for Nurse Buddy.
 *
 * System instruction (for future OpenAI integration):
 * "You are an experienced RN documentation assistant for a State Supported
 * Living Center / long-term care setting. Convert multilingual, messy spoken
 * notes into clean, professional English nursing documentation. The final
 * output must never repeat the user's raw input. Always rewrite into
 * appropriate nursing documentation format."
 *
 * The current implementation is a rule-based engine that:
 *  1. Extracts structured clinical facts from messy multilingual input.
 *  2. Detects missing assessment areas for the selected guideline.
 *  3. Rewrites the facts into clean professional English documentation.
 *
 * The public API (analyzeMissingInfo / generateDocumentation) is designed so
 * the internals can be swapped for an OpenAI call without touching the UI.
 */

export const SYSTEM_INSTRUCTION = `You are an experienced RN documentation assistant for a State Supported Living Center / long-term care setting. Convert multilingual, messy spoken notes into clean, professional English nursing documentation. The final output must never repeat the user's raw input. Always rewrite into appropriate nursing documentation format. Use "resident" instead of "patient." Use objective wording. Do not exaggerate. Do not diagnose unless the diagnosis was provided. Do not invent information. If information is missing, write "not reported," "not assessed," or omit it if not necessary. Do not include the user's conversational phrases. Do not include irrelevant background details unless clinically important. Organize information under proper headings based on the selected output type.`;

// =========================================================================
// 1. CLINICAL DATA EXTRACTION
// =========================================================================

interface ClinicalData {
  /** Cleaned, professional-English sentences derived from raw input */
  facts: string[];
  /** Structured vital signs found in the input */
  vitals: string[];
  /** Oxygen-related findings */
  oxygen: string[];
  /** Medications / interventions with times */
  interventions: string[];
  /** Emesis / GI findings */
  gi: string[];
  /** Pain / discomfort findings */
  pain: string[];
  /** Neuro / mental status findings */
  neuro: string[];
  /** Skin / wound findings */
  skin: string[];
  /** Respiratory findings */
  respiratory: string[];
  /** Other clinical observations */
  observations: string[];
  /** Times mentioned */
  times: string[];
}

// Time patterns: "2:25", "2:25 AM", "at 2:25", "0258", "14:30"
const TIME_REGEX = /\b(\d{1,2}[:.]\d{2}\s*(?:am|pm|a\.m\.|p\.m\.)?)\b|\b(\d{4})\b/gi;

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

/** Extract a time context near a keyword in the original text */
function findTimeNear(text: string, keyword: string): string | null {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(keyword);
  if (idx === -1) return null;
  // Look within 40 chars before and after
  const window = text.substring(Math.max(0, idx - 40), Math.min(text.length, idx + 60));
  const matches = [...window.matchAll(TIME_REGEX)];
  if (matches.length > 0) {
    return matches[0][0].trim();
  }
  return null;
}

/**
 * Extract structured clinical data from messy multilingual input.
 * Returns clean professional-English facts grouped by category.
 */
function extractClinicalData(rawInfo: string, supplements: MissingInfoItem[]): ClinicalData {
  const data: ClinicalData = {
    facts: [],
    vitals: [],
    oxygen: [],
    interventions: [],
    gi: [],
    pain: [],
    neuro: [],
    skin: [],
    respiratory: [],
    observations: [],
    times: [],
  };

  const text = rawInfo;

  // --- Oxygen saturation ---
  const o2Matches = [...text.matchAll(/(?:spo2|o2\s*sat|oxygen\s*sat(?:uration)?|산소포화도|saturación)[^%]*?(\d{1,3})\s*%/gi)];
  for (const m of o2Matches) {
    data.oxygen.push(`Oxygen saturation was ${m[1]}%.`);
  }
  // Also catch bare "oxygen 85%" or "85% oxygen"
  const bareO2 = [...text.matchAll(/(?:oxygen|o2|spo2|산소)\s*(\d{1,3})\s*%/gi)];
  for (const m of bareO2) {
    const val = `Oxygen saturation was ${m[1]}%.`;
    if (!data.oxygen.includes(val)) data.oxygen.push(val);
  }
  // "improved to 88%"
  const improvedO2 = [...text.matchAll(/(?:improved|increased|rose|up)\s*(?:to)?\s*(\d{1,3})\s*%/gi)];
  for (const m of improvedO2) {
    const val = `Oxygen saturation later improved to ${m[1]}%.`;
    if (!data.oxygen.some((o) => o.includes(m[1]))) data.oxygen.push(val);
  }

  // --- Room air / oxygen device ---
  if (/room air/i.test(text)) {
    data.oxygen.push('Resident was on room air.');
  }
  if (/nasal cannula/i.test(text)) {
    const flow = [...text.matchAll(/(?:nasal cannula|nc)[^]*?(\d{1,2})\s*l/gi)];
    if (flow.length) data.oxygen.push(`Resident was on nasal cannula at ${flow[0][1]} L.`);
    else data.oxygen.push('Resident was on nasal cannula.');
  }

  // --- Emesis ---
  if (/\b(emesis|vomit|vomited|threw up|throwing up|구토|vómito|vómitos)\b/i.test(text)) {
    const mlMatch = [...text.matchAll(/(\d{1,4})\s*(?:ml|cc|mL)\b/gi)];
    const colorMatch = text.match(/\b(green|yellow|brown|clear|bloody|coffee ground|bilious)\b/i);
    let desc = 'Resident had one episode of emesis';
    if (mlMatch.length) desc += ` of approximately ${mlMatch[0][1]} mL`;
    if (colorMatch) desc += ` of ${colorMatch[1].toLowerCase()} fluid`;
    desc += '.';
    data.gi.push(desc);
  }

  // --- G-tube residual ---
  if (/\b(residual|g-?tube\s*residual|잔여)\b/i.test(text)) {
    const resMatch = text.match(/residual[^]*?(\d{1,4})\s*(?:ml|cc|mL)?/i);
    if (resMatch) {
      data.gi.push(`G-tube residual was checked and noted to be ${resMatch[1]} mL.`);
    } else if (/residual\s*(?:was\s*)?(?:0|zero|none)/i.test(text)) {
      data.gi.push('G-tube residual was checked and noted to be 0 mL.');
    }
  }

  // --- Nausea ---
  if (/\b(nausea|nauseous|구역|메스꺼|náusea)\b/i.test(text)) {
    data.gi.push('Resident was noted to have nausea.');
  }

  // --- Pain / discomfort ---
  if (/\b(facial\s*grimacing|grimacing|grimace|wincing)\b/i.test(text)) {
    data.pain.push('Resident was observed with facial grimacing, suggesting possible discomfort.');
  }
  if (/\b(pain|discomfort|ache|통증|아프|dolor)\b/i.test(text) && !/grimac/i.test(text)) {
    data.pain.push('Resident showed signs of possible discomfort.');
  }

  // --- Interventions / medications with times ---
  const medKeywords = ['tylenol', 'acetaminophen', 'albuterol', 'nebulizer', 'prn', 'morphine', 'ibuprofen', 'advil', 'motrin'];
  for (const med of medKeywords) {
    const medRegex = new RegExp(`\\b${med}\\b`, 'i');
    if (medRegex.test(text)) {
      const time = findTimeNear(text, med);
      const medName = med.charAt(0).toUpperCase() + med.slice(1);
      let stmt = `${medName} PRN was administered`;
      if (med === 'nebulizer') stmt = `Nebulizer treatment was administered`;
      if (time) stmt += ` at ${time}`;
      else stmt += ' as ordered';
      stmt += '.';
      if (!data.interventions.includes(stmt)) data.interventions.push(stmt);
    }
  }
  // Generic "given" / "administered"
  if (/\b(given|administered|투여|투약|administrado)\b/i.test(text)) {
    // Already captured by med keywords above in most cases
  }

  // --- Lung sounds ---
  if (/\b(lung sounds|lung|auscultat|폐음|폐|sonidos|pulmón)\b/i.test(text)) {
    if (/\b(clear|청음|claros)\b/i.test(text)) {
      data.respiratory.push('Lung sounds were clear.');
    }
    if (/\b(crackle|crackles|rales)\b/i.test(text)) {
      data.respiratory.push('Lung sounds revealed crackles.');
    }
    if (/\b(wheeze|wheezing)\b/i.test(text)) {
      data.respiratory.push('Lung sounds revealed wheezing.');
    }
    if (/\b(rhonchi)\b/i.test(text)) {
      data.respiratory.push('Lung sounds revealed rhonchi.');
    }
  }

  // --- Cough ---
  if (/\b(cough|coughing|기침|tos)\b/i.test(text)) {
    if (/\b(productive|가래|esputo)\b/i.test(text)) {
      data.respiratory.push('Resident had a productive cough.');
    } else {
      data.respiratory.push('Resident had a cough.');
    }
  }

  // --- Temperature ---
  const tempMatch = text.match(/(?:temp(?:erature)?|체온|temperatura)[^]*?(\d{2,3}(?:\.\d)?)\s*(?:°?\s*f|°?\s*c|degrees?)?/i);
  if (tempMatch) {
    data.vitals.push(`Temperature was ${tempMatch[1]}°F.`);
  }

  // --- Blood pressure ---
  const bpMatch = text.match(/(?:bp|blood pressure|혈압|presión)[^]*?(\d{2,3})\s*\/\s*(\d{2,3})/i);
  if (bpMatch) {
    data.vitals.push(`Blood pressure was ${bpMatch[1]}/${bpMatch[2]} mmHg.`);
  }

  // --- Heart rate / pulse ---
  const hrMatch = text.match(/(?:pulse|heart rate|hr|맥박|pulso)[^]*?(\d{2,3})/i);
  if (hrMatch && !/spo2|o2|oxygen|sat/i.test(text.substring(Math.max(0, text.toLowerCase().indexOf('pulse') - 10), text.toLowerCase().indexOf('pulse') + 30))) {
    data.vitals.push(`Heart rate was ${hrMatch[1]} bpm.`);
  }

  // --- Respiratory rate ---
  const rrMatch = text.match(/(?:respiratory rate|respiration rate|rr|호흡수|frecuencia respiratoria)[^]*?(\d{2,3})/i);
  if (rrMatch) {
    data.vitals.push(`Respiratory rate was ${rrMatch[1]} breaths per minute.`);
  }

  // --- Neuro / LOC ---
  if (/\b(alert|awake|responsive|의식|alerta)\b/i.test(text)) {
    data.neuro.push('Resident was alert and responsive.');
  }
  if (/\b(lethargic|letharg|sleepy|drowsy)\b/i.test(text)) {
    data.neuro.push('Resident was lethargic.');
  }
  if (/\b(oriented|orientación)\b/i.test(text)) {
    const orientMatch = text.match(/oriented\s*(?:x\s*)?(\d)/i);
    if (orientMatch) data.neuro.push(`Resident was oriented x${orientMatch[1]}.`);
    else data.neuro.push('Resident was oriented.');
  }
  if (/\b(confused|confusion|confusión|혼동)\b/i.test(text)) {
    data.neuro.push('Resident was noted to be confused.');
  }
  if (/\b(pupil|pupils|동공|pupilas)\b/i.test(text)) {
    if (/\b(equal|reactive|peerl)\b/i.test(text)) {
      data.neuro.push('Pupils were equal and reactive.');
    }
  }

  // --- Skin ---
  if (/\b(intact|피부\s*온전|piel\s*intacta)\b/i.test(text)) {
    data.skin.push('Skin was intact.');
  }
  if (/\b(bruise|bruising|contusion)\b/i.test(text)) {
    data.skin.push('Bruising was noted.');
  }
  if (/\b(abrasion|scrape)\b/i.test(text)) {
    data.skin.push('Abrasion was noted.');
  }
  if (/\b(laceration|cut)\b/i.test(text)) {
    data.skin.push('Laceration was noted.');
  }
  if (/\b(erythema|redness|적색|eritema)\b/i.test(text)) {
    data.skin.push('Erythema was noted.');
  }
  if (/\b(swelling|edema|부종|hinchazón)\b/i.test(text)) {
    data.skin.push('Swelling was noted.');
  }

  // --- Fall ---
  if (/\b(fell|fall|found on floor|slipped|tripped|낙상|넘어|caída)\b/i.test(text)) {
    data.observations.push('Resident was found to have fallen.');
  }

  // --- Seizure ---
  if (/\b(seizure|convuls|발작|convulsión)\b/i.test(text)) {
    const durMatch = text.match(/(?:duration|lasted|지속|duración)[^]*?(\d{1,3})\s*(?:min|minute|sec|second|분|초|minuto|segundo)/i);
    if (durMatch) {
      data.observations.push(`Resident had a seizure lasting approximately ${durMatch[1]} minutes.`);
    } else {
      data.observations.push('Resident had a seizure.');
    }
  }

  // --- Sleeping / resting ---
  if (/\b(sleeping|sleep comfortably|resting|수면|durmiendo)\b/i.test(text)) {
    data.observations.push('Resident was sleeping comfortably.');
  }

  // --- Incorporate supplemented missing-info values ---
  for (const s of supplements) {
    if (!s.value.trim()) continue;
    const val = s.value.trim();
    // Categorize the supplement
    const labelLower = s.label.toLowerCase();
    if (labelLower.includes('vital')) {
      data.vitals.push(`${s.label}: ${val}.`);
    } else if (labelLower.includes('oxygen') || labelLower.includes('lung') || labelLower.includes('respiratory') || labelLower.includes('cough') || labelLower.includes('sputum')) {
      data.respiratory.push(`${s.label}: ${val}.`);
    } else if (labelLower.includes('emesis') || labelLower.includes('nausea') || labelLower.includes('abdomen') || labelLower.includes('gi') || labelLower.includes('residual') || labelLower.includes('hydration') || labelLower.includes('fluid')) {
      data.gi.push(`${s.label}: ${val}.`);
    } else if (labelLower.includes('pain') || labelLower.includes('discomfort')) {
      data.pain.push(`${s.label}: ${val}.`);
    } else if (labelLower.includes('neuro') || labelLower.includes('pupil') || labelLower.includes('loc') || labelLower.includes('cognitive')) {
      data.neuro.push(`${s.label}: ${val}.`);
    } else if (labelLower.includes('skin') || labelLower.includes('wound') || labelLower.includes('tissue') || labelLower.includes('drainage')) {
      data.skin.push(`${s.label}: ${val}.`);
    } else {
      data.observations.push(`${s.label}: ${val}.`);
    }
  }

  return data;
}

// =========================================================================
// 2. MISSING INFO DETECTION
// =========================================================================

function buildSearchableText(clinicalInfo: string, supplements: MissingInfoItem[] = []): string {
  const parts = [clinicalInfo];
  for (const s of supplements) {
    if (s.label.trim()) parts.push(s.label);
    if (s.value.trim()) parts.push(s.value);
  }
  return normalize(parts.join('\n'));
}

function isReviewAreaPresent(area: string, searchableText: string, def: GuidelineDefinition): boolean {
  const keywords = getFieldMatchKeywords(def, area);
  if (keywords.length > 0 && keywords.some((kw) => searchableText.includes(normalize(kw)))) {
    return true;
  }

  const legacyKeywords = REVIEW_KEYWORDS[area] ?? [];
  return legacyKeywords.some((kw) => searchableText.includes(normalize(kw)));
}

const REVIEW_KEYWORDS: Record<string, string[]> = {
  'Vital signs': ['vital', 'bp', 'blood pressure', 'temp', 'temperature', 'pulse', 'heart rate', 'hr', 'respiration', 'rr', 'spo2', 'o2 sat', 'oxygen saturation', 'within normal', 'normal limits', 'wnl', 'vss', 'vitals stable', 'vitals wnl', '혈압', '체온', '맥박', '호흡', 'signos vitales', 'presión', 'temperatura', 'pulso'],
  'Abdomen assessment': ['abdomen', 'abdominal', 'belly', 'stomach', 'tender', 'distend', 'bowel', '복부', '배', 'abdomen', 'abdominal', 'abdomen'],
  'Nausea description': ['nausea', 'nauseous', 'queasy', 'sick', '구역', '메스꺼', 'náusea', 'náuseas'],
  'Emesis description': ['vomit', 'emesis', 'threw up', 'throwing up', '구토', 'vómito', 'vómitos'],
  'Pain assessment': ['pain', 'discomfort', 'ache', 'sore', 'hurt', 'grimac', '통증', '아프', 'dolor'],
  'Hydration status': ['hydrat', 'fluid', 'intake', 'output', 'iv', 'dry', 'thirst', '수분', 'hydration', 'hidratación'],
  'Temperature reading': ['temp', 'temperature', 'febrile', 'afebrile', '°', '체온', 'temperatura'],
  'Skin / warmth': ['skin', 'warm', 'cool', 'clammy', 'diaphoretic', 'sweat', 'flush', '피부', 'piel'],
  'Symptoms': ['symptom', 'chill', 'rigor', 'fatigue', 'malaise', 'letharg', '증상', 'síntoma'],
  'Fluid intake': ['fluid', 'intake', 'water', 'drink', 'drank', '수분', 'líquido'],
  'Urinary symptoms': ['urin', 'void', 'dysuria', 'frequency', 'urgency', 'incont', 'catheter', 'foley', '소변', '배뇨', 'orina', 'micción'],
  'Urine appearance': ['urine', 'cloudy', 'dark', 'foul', 'odor', 'bloody', 'hematuria', '소변', 'orina'],
  'Cognitive changes': ['confus', 'alert', 'oriented', 'letharg', 'responsive', 'cognit', 'mental', '혼동', 'orientación', 'confusión'],
  'Neuro check': ['neuro', 'pupil', 'gcs', 'glasgow', 'reflex', 'sensation', 'motor', 'neurologic', '신경', 'neurológico'],
  'Skin assessment': ['skin', 'bruise', 'abrasion', 'laceration', 'redness', 'erythema', 'intact', 'wound', '피부', 'piel'],
  'Circumstances of fall': ['fell', 'fall', 'found on floor', 'slipped', 'tripped', '낙상', '넘어', 'caída'],
  'Mobility status': ['ambulat', 'walk', 'transfer', 'wheelchair', 'bed', 'mobility', 'move', '보행', '이동', 'movilidad'],
  'Pupil assessment': ['pupil', 'pupils', 'equal', 'reactive', 'peerl', '동공', 'pupilas'],
  'LOC': ['loc', 'level of consciousness', 'alert', 'responsive', 'awake', 'arousable', '의식', 'conciencia'],
  'Head inspection': ['head', 'scalp', 'bump', 'hematoma', 'laceration', 'swelling', '머리', 'cabeza'],
  'Substance ingested': ['ingest', 'ate', 'swallow', 'consumed', 'pica', 'non-food', '섭취', 'ingerido'],
  'GI assessment': ['gi', 'abdomen', 'bowel', 'nausea', 'vomit', 'stomach', '소화', 'gastrointestinal'],
  'Environmental safety': ['environment', 'hazard', 'access', 'supervision', 'locked', 'secured', '환경', 'seguridad'],
  'Wound location': ['location', 'site', 'sacrum', 'heel', 'hip', 'buttock', 'arm', 'leg', '위치', 'ubicación'],
  'Wound size': ['size', 'cm', 'mm', 'length', 'width', 'depth', 'stage', '크기', 'tamaño'],
  'Tissue type': ['tissue', 'granulation', 'slough', 'eschar', 'epithelial', 'necrotic', '조직', 'tejido'],
  'Drainage': ['drainage', 'exudate', 'purulent', 'serous', 'sanguineous', 'dry', '배액', 'drenaje'],
  'Surrounding skin': ['surrounding', 'peri-wound', 'maceration', 'induration', 'redness', '주변', 'perilesional'],
  'Lung sounds': ['lung', 'lung sounds', 'auscultat', 'crackle', 'wheeze', 'rales', 'rhonchi', 'clear', '폐음', '폐', 'pulmón', 'sonidos'],
  'Respiratory rate': ['respiratory rate', 'rr', 'breathing', 'breath', 'respiration', '호흡수', 'frecuencia respiratoria'],
  'Oxygen saturation': ['spo2', 'o2 sat', 'oxygen saturation', 'room air', 'nasal cannula', 'oxygen', '산소포화도', 'saturación'],
  'Cough': ['cough', 'coughing', '기침', 'tos'],
  'Sputum': ['sputum', 'phlegm', 'mucus', 'productive', '가래', 'esputo'],
  'Seizure description': ['seizure', 'convuls', 'shaking', 'twitch', 'stiff', 'jerking', '발작', 'convulsión'],
  'Duration': ['duration', 'minute', 'second', 'lasted', '지속', 'duración'],
  'Post-ictal state': ['post-ictal', 'postictal', 'confused', 'sleepy', 'tired', 'recovered', '발작 후', 'postictal'],
  'Respiratory status': ['respiratory', 'breathing', 'airway', '호흡', 'respiratorio'],
  'Procedure site': ['procedure', 'site', 'incision', 'dressing', '시술', 'procedimiento'],
  'Relevant assessment': ['assessment', 'exam', 'observation', 'alert', 'oriented', 'neuro', 'neurologic', 'examined', 'assessed', 'finding', 'findings', 'observed', 'presentation', 'status', 'loc', '평가', 'evaluación'],
  'Interventions': ['intervention', 'treatment', 'medication', 'given', 'administered', 'position', 'tylenol', 'acetaminophen', 'albuterol', 'prn', 'dose', 'mg', 'ml', 'med ', 'meds', 'provided', 'placed', '중재', 'intervención'],
  'Response': ['response', 'responded', 'improved', 'unchanged', 'declined', 'no change', 'no improvement', 'tolerated', 'effective', 'ineffective', '반응', 'respuesta', 'mejor', 'sin cambio'],
};

const DOCUMENTATION_EVIDENCE: Record<string, RegExp[]> = {
  'Vital signs': [/vital sign/i, /blood pressure/i, /temperature/i, /pulse/i, /heart rate/i, /respiratory rate/i, /mmhg/i, /bpm/i, /within normal limits/i, /afebrile/i],
  'Abdomen assessment': [/abdomen/i, /abdominal/i, /bowel/i, /distend/i, /tender/i],
  'Nausea description': [/nausea/i, /nauseous/i, /queasy/i],
  'Emesis description': [/emesis/i, /vomit/i, /vomiting/i, /threw up/i],
  'Pain assessment': [/pain/i, /discomfort/i, /grimac/i, /ache/i],
  'Hydration status': [/hydrat/i, /fluid intake/i, /dehydrat/i, /dry mucous/i],
  'Temperature reading': [/temperature/i, /temp\b/i, /febrile/i, /afebrile/i, /°f/i, /°c/i],
  'Skin / warmth': [/skin.*warm/i, /warm to touch/i, /cool to touch/i, /diaphoretic/i, /clammy/i],
  'Symptoms': [/symptom/i, /complaint/i, /chill/i, /fatigue/i, /malaise/i],
  'Fluid intake': [/fluid intake/i, /drank/i, /drinking/i, /oral intake/i],
  'Urinary symptoms': [/urin/i, /void/i, /dysuria/i, /incontin/i, /catheter/i, /foley/i],
  'Urine appearance': [/urine.*cloudy/i, /urine.*dark/i, /hematuria/i, /urine appearance/i],
  'Cognitive changes': [/confus/i, /alert/i, /oriented/i, /cognitive/i, /letharg/i],
  'Neuro check': [/neuro/i, /neurologic/i, /pupil/i, /gcs/i, /glasgow/i],
  'Skin assessment': [/skin/i, /bruise/i, /abrasion/i, /laceration/i, /erythema/i, /intact/i, /wound/i],
  'Circumstances of fall': [/fell/i, /fall/i, /found on floor/i, /slipped/i, /tripped/i],
  'Mobility status': [/ambulat/i, /wheelchair/i, /transfer/i, /mobility/i, /bedbound/i],
  'Pupil assessment': [/pupil/i, /peerl/i, /equal and reactive/i],
  'LOC': [/level of consciousness/i, /\bloc\b/i, /alert/i, /responsive/i, /awake/i, /arousable/i],
  'Head inspection': [/head/i, /scalp/i, /hematoma/i, /bump on head/i],
  'Substance ingested': [/ingest/i, /swallowed/i, /consumed/i, /pica/i, /non-food/i],
  'GI assessment': [/gi\b/i, /gastrointestinal/i, /bowel/i, /abdomen/i],
  'Environmental safety': [/environment/i, /supervision/i, /secured/i, /hazard/i],
  'Wound location': [/wound.*(sacrum|heel|hip|buttock|arm|leg)/i, /wound location/i, /wound site/i],
  'Wound size': [/wound.*\d+\s*(cm|mm)/i, /stage\s*\d/i, /wound size/i],
  'Tissue type': [/granulation/i, /slough/i, /eschar/i, /epithelial/i, /necrotic/i],
  'Drainage': [/drainage/i, /exudate/i, /purulent/i, /serous/i, /sanguineous/i],
  'Surrounding skin': [/surrounding skin/i, /peri-wound/i, /periwound/i, /maceration/i],
  'Lung sounds': [/lung sound/i, /auscultat/i, /crackle/i, /wheeze/i, /rales/i, /rhonchi/i, /clear bilaterally/i],
  'Respiratory rate': [/respiratory rate/i, /breaths per minute/i, /respirations/i],
  'Oxygen saturation': [/oxygen saturation/i, /spo2/i, /o2 sat/i, /nasal cannula/i, /room air/i],
  'Cough': [/cough/i, /coughing/i],
  'Sputum': [/sputum/i, /phlegm/i, /productive cough/i],
  'Seizure description': [/seizure/i, /convuls/i, /jerking/i, /postictal/i],
  'Duration': [/lasted.*\d+\s*(minute|second|min|sec)/i, /duration/i],
  'Post-ictal state': [/post-ictal/i, /postictal/i, /post ictal/i],
  'Respiratory status': [/respiratory status/i, /breathing/i, /airway/i, /labored breathing/i],
  'Procedure site': [/procedure site/i, /incision/i, /dressing/i, /surgical site/i],
  'Relevant assessment': [/assessed/i, /assessment/i, /alert/i, /oriented/i, /neuro/i, /observed/i, /finding/i, /examined/i],
  'Interventions': [/administered/i, /given/i, /tylenol/i, /acetaminophen/i, /prn/i, /intervention/i, /medication/i, /treatment/i, /nebulizer/i],
  'Response': [/response to/i, /responded to/i, /improved following/i, /no improvement/i, /unchanged following/i, /declined following/i, /tolerated/i],
  'Date/Time/Description of Vomitus': [/vomit/i, /vomitus/i, /emesis/i, /vomiting/i, /threw up/i],
  'Enteral Feeding Rate': [/enteral/i, /feeding rate/i, /tube feed/i, /g-tube/i, /gtube/i],
  'Analysis of Intake and Output': [/intake/i, /output/i, /i&o/i, /i\/o/i, /fluid balance/i],
  'Presence or Absence of Nausea': [/nausea/i, /no nausea/i, /without nausea/i],
  'Positioning per PNMP': [/position/i, /pnmp/i, /fowler/i, /elevated/i, /side lying/i],
  'Source of vomiting if identified': [/source/i, /cause/i, /identified/i, /reason for vomiting/i],
  'Gastric bleeding if suspected': [/gastric bleeding/i, /hematemesis/i, /coffee ground/i, /blood in vomit/i],
  'Other relevant assessment findings': [/assessment/i, /finding/i, /vital/i, /abdomen/i, /hydration/i],
  'Last vomiting episode': [/last episode/i, /last vomit/i, /symptom free/i, /no further emesis/i],
  'Date and time of fall or suspected fall': [/fall/i, /fell/i, /found on floor/i, /suspected fall/i, /slipped/i, /tripped/i],
  'Witnessed or unwitnessed status, if known': [/witnessed/i, /unwitnessed/i, /not witnessed/i],
  'Location and circumstances, if known': [/location/i, /circumstance/i, /room/i, /hallway/i, /bathroom/i, /wheelchair/i, /transfer/i],
  'Possible head impact': [/head impact/i, /head strike/i, /hit head/i, /bumped head/i],
  'Loss of consciousness, if known': [/loss of consciousness/i, /\bloc\b/i, /passed out/i, /unconscious/i, /no loc/i],
  'Injury or skin findings': [/injury/i, /bruise/i, /swelling/i, /abrasion/i, /laceration/i, /skin assessment/i, /contusion/i],
  'Neurological or mental-status findings': [/neuro/i, /mental status/i, /oriented/i, /alert/i, /confused/i, /baseline/i],
  'Vital signs, if required or obtained': [/vital sign/i, /blood pressure/i, /temperature/i, /pulse/i, /heart rate/i],
  'Anticoagulant or antiplatelet use': [/blood thinner/i, /anticoagulant/i, /antiplatelet/i, /coumadin/i, /warfarin/i, /aspirin/i, /eliquis/i],
  'Nursing interventions': [/intervention/i, /ice pack/i, /monitor/i, /neuro check/i, /comfort measure/i],
  'PCP notification status': [/pcp/i, /provider/i, /physician/i, /notified/i, /notification/i],
  'PIR completion': [/pir/i, /post injury report/i, /injury report/i, /incident report/i],
  'Follow-up handoff status': [/handoff/i, /oncoming nurse/i, /nurse to nurse/i, /24-hour report/i, /shift report/i],
  'Staff instruction status': [/staff verbalized/i, /understanding/i, /instructions/i, /demonstrated/i],
  'Pain score': [/pain score/i, /pain level/i, /\/10/i, /out of 10/i, /rates pain/i],
  'Pain scale used': [/pain scale/i, /flacc/i, /pacslac/i, /wong-baker/i, /numeric scale/i, /0-10/i],
  'Pain location (if known)': [/pain location/i, /location of pain/i, /left/i, /right/i, /back/i, /knee/i, /abdomen/i],
  'Pain management intervention': [/tylenol/i, /acetaminophen/i, /analgesic/i, /pain management/i, /morphine/i, /ibuprofen/i],
  'PCP notification when indicated': [/pcp/i, /provider/i, /notified/i, /pain score >4/i, /moderate pain/i, /severe pain/i, /unresolved pain/i],
  'Follow-up plan': [/follow up/i, /follow-up/i, /reassess/i, /monitor pain/i, /nursing follow-up/i],
  'Staff instruction documentation': [/staff verbalized/i, /understanding/i, /instructions provided/i, /demonstrated/i],
  'Pain score before medication': [/before medication/i, /prior to medication/i, /pre-medication/i, /pain score before/i],
  'Pain score after medication': [/after medication/i, /post medication/i, /pain score after/i, /decreased to/i, /improved to/i],
  'Medication effectiveness': [/medication effectiveness/i, /effectiveness/i, /score change/i, /effective/i, /ineffective/i],
  'Pain management results': [/pain management results/i, /management results/i, /pain relief/i, /pain resolved/i],
  'Nurse-to-nurse handoff': [/handoff/i, /oncoming nurse/i, /nurse to nurse/i, /nurse-to-nurse/i, /24-hour report/i],
  'Pain level / pain scale': [/pain score/i, /pain level/i, /pain scale/i, /\/10/i],
  'Location or suspected location of pain, if known': [/pain location/i, /location of pain/i, /suspected location/i],
  'Response to intervention': [/response to intervention/i, /responded to/i, /after medication/i, /relief/i, /effective/i],
  'Current temperature': [/temperature/i, /temp\b/i, /febrile/i, /afebrile/i, /°f/i, /°c/i, /fever/i, /elevated temperature/i],
  'Signs or symptoms of infection': [/infection/i, /signs of infection/i, /symptom/i, /chills/i, /cough/i, /dysuria/i, /purulent/i],
  'Environmental contributing factors': [/environmental/i, /contributing factor/i, /room temperature/i, /overheated/i, /physical activity/i, /blankets/i],
  'Hydration strategies': [/hydration/i, /dehydrat/i, /prevent dehydration/i, /encouraged fluids/i, /fluid intake/i, /oral fluids/i],
  'Comfort measures': [/comfort measure/i, /cool cloth/i, /fan/i, /lukewarm/i, /cooling/i, /rest/i],
  'Follow-up monitoring plan': [/every 4 hours/i, /q4/i, /48 hours/i, /48 consecutive/i, /monitor temperature/i, /fever-free/i],
  'Date/time of last elevated temperature': [/last elevated/i, /last fever/i, /last documented temperature/i, /last febrile/i, /last temp/i],
  'Fever-free status': [/fever-free/i, /fever free/i, /afebrile/i, /without fever/i, /no fever/i, /remained afebrile/i],
  'Signs and symptoms of infection': [/infection/i, /signs of infection/i, /symptom/i, /chills/i, /cough/i, /dysuria/i],
  'Environmental factors that may have contributed to the elevated temperature': [/environmental/i, /contributing factor/i, /room temperature/i, /overheated/i, /physical activity/i],
  'Signs or symptoms of UTI': [/uti/i, /urinary/i, /dysuria/i, /frequency/i, /urgency/i, /incontinence/i, /cloudy urine/i, /hematuria/i, /burning/i],
  'Care Tracker intake/output analysis': [/care tracker/i, /intake and output/i, /i&o/i, /i\/o/i, /fluid balance/i, /urine output/i],
  'Fluid encouragement interventions': [/encourage fluids/i, /fluid intake/i, /promote fluid/i, /oral fluids/i, /hydration/i, /fluid encouragement/i],
  'PCP notification status': [/pcp/i, /provider/i, /physician/i, /notified/i, /notification/i, /ineffective/i, /abnormal findings/i],
  'PCP notification when indicated': [/pcp/i, /provider/i, /notified/i, /ineffective/i, /abnormal findings/i, /notification/i],
  'Staff education documentation': [/staff verbalized/i, /staff demonstrated/i, /understanding/i, /staff education/i, /instructions provided/i],
  'DSP instruction regarding UTI symptoms': [/dsp/i, /staff\/dsp/i, /uti symptoms/i, /symptom instruction/i, /signs to report/i],
  'DSP instruction regarding fluid promotion': [/dsp/i, /staff\/dsp/i, /fluid promotion/i, /promote fluid/i, /fluid instruction/i],
  'Reassessment of UTI signs/symptoms': [/reassessment/i, /evaluation of signs/i, /uti/i, /urinary/i, /symptoms/i, /improved/i, /worsening/i, /resolved/i],
  'Effectiveness of increased fluids': [/effectiveness of fluid/i, /fluid effectiveness/i, /increased fluid/i, /fluid intake effective/i, /output improved/i],
  'Effectiveness of pain medication (if applicable)': [/pain medication/i, /analgesic/i, /tylenol/i, /acetaminophen/i, /pain relief/i, /pain effective/i, /pain ineffective/i],
  'PCP orders (if applicable)': [/pcp order/i, /provider order/i, /physician order/i, /follow pcp/i, /antibiotic/i, /as ordered/i],
  'Signs and symptoms indicating UTI': [/uti/i, /urinary/i, /dysuria/i, /frequency/i, /urgency/i, /incontinence/i, /cloudy urine/i, /burning/i],
  'Analysis of Care Tracker intake and output': [/care tracker/i, /intake and output/i, /i&o/i, /i\/o/i, /fluid balance/i, /urine output/i],
  'Reported cause of injury': [/reported cause/i, /cause of injury/i, /mechanism/i, /how it happened/i, /hit head/i, /witness report/i, /staff report/i],
  'Observed cause of injury': [/observed cause/i, /cause of injury/i, /head impact/i, /head strike/i, /hit head/i, /fell/i, /fall/i],
  'Anticoagulant or antiplatelet use': [/anticoagulant/i, /antiplatelet/i, /blood thinner/i, /coumadin/i, /warfarin/i, /aspirin/i, /eliquis/i],
  'Loss of consciousness status': [/loss of consciousness/i, /\bloc\b/i, /passed out/i, /unconscious/i, /no loc/i, /remained conscious/i],
  'Duration of loss of consciousness (if applicable)': [/duration/i, /seconds/i, /minutes/i, /loc duration/i, /unconscious for/i],
  'Other assessment findings': [/assessment finding/i, /neuro/i, /pupil/i, /gcs/i, /headache/i, /nausea/i, /vital/i, /hematoma/i, /scalp/i],
  'Injury severity': [/\bmild\b/i, /\bmoderate\b/i, /\bsevere\b/i, /severity/i, /established severity/i],
  'PIR completion': [/pir/i, /post injury report/i, /injury report/i, /incident report/i, /pir completed/i],
  'Neurological monitoring plan': [/neurological assessment/i, /every 10 minutes/i, /every 15 minutes/i, /every 30 minutes/i, /every 2 hours/i, /every 4 hours/i, /every 8 hours/i, /monitoring schedule/i],
  'Neurological status': [/neurological status/i, /neuro status/i, /mental status/i, /alert/i, /oriented/i, /confused/i, /pupil/i, /gcs/i, /baseline/i],
  'Reassessment findings': [/reassessment/i, /nurse reassessment/i, /re-evaluated/i, /neuro check/i, /repeat assessment/i],
  'PCP notification if deterioration occurred': [/pcp/i, /provider/i, /notified/i, /deteriorat/i, /worsening/i, /neurological status deteriorates/i],
  'PCP notification': [/pcp/i, /provider/i, /physician/i, /notified/i, /notification/i, /notify pcp/i],
  'Current use of anticoagulant or antiplatelet medication': [/anticoagulant/i, /antiplatelet/i, /blood thinner/i, /coumadin/i, /warfarin/i],
  'Loss of consciousness and duration (if applicable)': [/loss of consciousness/i, /\bloc\b/i, /duration/i, /passed out/i, /unconscious/i],
  'Resident positioning': [/positioning/i, /positioned/i, /fowler/i, /semi-fowler/i, /upright/i, /side lying/i, /head of bed/i],
  'Relevant respiratory symptoms': [/respiratory distress/i, /shortness of breath/i, /dyspnea/i, /wheezing/i, /crackles/i, /cough/i, /labored breathing/i],
  'Aspiration-related symptoms (if applicable)': [/aspiration/i, /choking/i, /during meal/i, /enteral feeding/i, /vomiting/i, /gagging/i, /dysphagia/i],
  'Gastric residual assessment (if applicable)': [/gastric residual/i, /residual volume/i, /grv/i, /tube feed residual/i],
  'Temperature monitoring plan': [/every 4 hours/i, /q4 temp/i, /48 hours without fever/i, /monitor temperature/i, /temp monitoring/i],
  'Suctioning status': [/suctioning/i, /suction/i, /suctioned/i, /no suction/i, /not suctioned/i],
  'Oxygen therapy status': [/oxygen therapy/i, /oxygen provided/i, /nasal cannula/i, /room air/i, /no oxygen/i, /spo2/i],
  'Breathing treatment status': [/breathing treatment/i, /nebulizer/i, /albuterol/i, /nebulized/i, /no breathing treatment/i],
  'Respiratory Therapy notification': [/respiratory therapy/i, /rt notified/i, /rt called/i, /rt consult/i, /rt not notified/i],
  'Reassessment of respiratory symptoms': [/reassessment/i, /continuing symptoms/i, /respiratory/i, /dyspnea/i, /cough/i, /improved/i, /worsening/i],
  'Next nursing assessment': [/next scheduled/i, /next assessment/i, /next nursing assessment/i, /follow-up assessment/i, /reassess at/i],
  'Next nursing assessment due': [/next nursing assessment due/i, /next scheduled/i, /next assessment due/i, /next assessment/i, /reassess at/i],
  'PCP notification (when abnormal findings are present)': [/pcp/i, /provider/i, /physician/i, /notified/i, /notification/i, /notify pcp/i, /abnormal findings/i],
  'Nurse-to-nurse / 24-hour report communication (when follow-up is indicated)': [/handoff/i, /oncoming nurse/i, /nurse to nurse/i, /nurse-to-nurse/i, /24-hour report/i, /24 hour report/i, /shift report/i, /follow-up indicated/i],
  "Individual's positioning": [/positioning/i, /positioned/i, /fowler/i, /upright/i, /side lying/i],
  'Lung assessment findings': [/lung assessment/i, /lung sounds/i, /breath sounds/i, /auscultation/i, /adventitious/i, /interactive view/i],
  'Medications/feedings held (if applicable)': [/medications held/i, /feedings held/i, /meds held/i, /held feedings/i, /npo/i, /not held/i],
  'RN notification time': [/rn notified/i, /nurse notified/i, /notification time/i, /notified at/i, /charge nurse/i],
  'Reassessment plan': [/reassessment planned/i, /nurse reassessment/i, /plan to reassess/i, /scheduled reassessment/i],
  'Routine care resumed (if applicable)': [/routine care resumed/i, /care resumed/i, /feeds resumed/i, /medications resumed/i, /resumed per rn/i],
  'Lung reassessment frequency': [/reassessment frequency/i, /lung sound reassessment/i, /frequency of lung/i, /assessment frequency/i],
  'Current lung assessment findings': [/lung assessment/i, /lung sounds/i, /breath sounds/i, /current lung/i, /auscultation/i],
  'Resolution status': [/resolution status/i, /resolved/i, /unresolved/i, /ongoing/i, /monitoring complete/i],
  'Current lung sounds compared with baseline': [/baseline/i, /expected for this individual/i, /compared with baseline/i, /at baseline/i, /typical for/i],
  'Lung assessment findings documented in the Interactive View Assessment': [/lung assessment/i, /lung sounds/i, /breath sounds/i, /interactive view/i, /adventitious/i],
  'Abdominal circumference comparison': [/abdominal circumference/i, /girth/i, /compared to last/i, /last documented/i, /circumference comparison/i],
  'Bowel pattern changes': [/bowel pattern/i, /bowel movement/i, /constipation/i, /diarrhea/i, /changed pattern/i, /last bm/i],
  'Meal refusals within the previous 48 hours': [/meal refusal/i, /refused meals/i, /48 hours/i, /poor intake/i, /declined food/i, /not eating/i],
  'Rectal examination results (if performed)': [/rectal examination/i, /rectal exam/i, /digital rectal/i, /dre/i, /not performed/i],
  'Medication side effects': [/side effects/i, /adverse effect/i, /monitor for side effects/i, /no side effects/i, /tolerated/i],
  'Digital rectal assessment consideration (when applicable)': [/digital rectal assessment/i, /pcp order for rectal/i, /consider obtaining/i, /rectal assessment when indicated/i],
  'Current abdominal assessment findings': [/abdominal assessment/i, /distention/i, /distension/i, /tenderness/i, /abdominal exam/i],
  'Abdominal circumference changes': [/abdominal circumference/i, /girth/i, /increased circumference/i, /circumference change/i],
  'Bowel sound status': [/bowel sounds/i, /absent bowel/i, /diminished bowel/i, /hypoactive/i, /hyperactive/i, /no bowel sounds/i],
  'Comparison of abdominal circumference to the last documented measurement': [/abdominal circumference/i, /girth/i, /compared to last/i, /last documented measurement/i],
  'Changes in bowel pattern': [/bowel pattern/i, /bowel movement/i, /constipation/i, /diarrhea/i],
  'Meal refusals during the previous 48 hours': [/meal refusal/i, /refused meals/i, /48 hours/i, /poor intake/i],
  'Results of rectal examination (if performed)': [/rectal examination/i, /rectal exam/i, /digital rectal/i, /results of rectal/i],
  'Enteral feeding complication': [/enteral feeding complication/i, /feeding complication/i, /feeding intolerance/i, /tube feed complication/i, /noted complication/i],
  'Provider orders (if indicated)': [/provider order/i, /physician order/i, /pcp order/i, /orders obtained/i, /venting order/i, /draining order/i],
  'Venting/draining status (if applicable)': [/venting/i, /draining/i, /drain gastric/i, /gastric tube contents/i, /not vented/i, /not drained/i],
  'Follow-up plan': [/follow up/i, /follow-up/i, /next shift/i, /intervention effectiveness/i, /follow up plan/i],
  'Current complication status': [/current status/i, /complication status/i, /ongoing/i, /resolved/i, /improving/i, /worsening/i],
  'Intervention effectiveness': [/intervention effectiveness/i, /effectiveness of intervention/i, /effective/i, /ineffective/i, /no improvement/i],
  'Noted enteral feeding complication': [/enteral feeding complication/i, /feeding complication/i, /feeding intolerance/i, /noted complication/i],
  'Rectal temperature verification (unless contraindicated)': [/rectal verification/i, /rectal temperature/i, /rectal temp/i, /contraindicated/i, /verified rectally/i],
  'Warming measures': [/warming measures/i, /warming blanket/i, /bair hugger/i, /rewarming/i, /warm blankets/i, /warming implemented/i],
  'Confirmation that warming measures were discontinued when 97°F (36.1°C) was reached': [/discontinued warming/i, /warming discontinued/i, /reached 97/i, /97°f/i, /36.1°c/i],
  'One-hour reassessment': [/reassess in 1 hour/i, /one hour reassessment/i, /1 hour reassessment/i, /1-hour reassessment/i],
  'Every-4-hour temperature monitoring plan for 24 hours': [/every 4 hours for 24/i, /every 4 hours for the next 24/i, /q4 for 24/i, /4 hours for 24 hours/i],
  'Reinitiation criteria if temperature drops below 96°F (35°C)': [/reinitiate/i, /drops below 96/i, /below 96°f/i, /below 35°c/i, /96°f/i, /35°c/i],
  'Rectal verification of temperature (unless contraindicated)': [/rectal verification/i, /rectal temperature/i, /rectal temp/i, /contraindicated/i],
  'Pica item ingested': [/pica item/i, /item ingested/i, /substance ingested/i, /ingested/i, /swallowed/i, /non-food/i, /foreign object/i],
  'PIR completion (if applicable)': [/pir/i, /post injury report/i, /injury report/i, /pir completed/i, /not applicable/i],
  'Q4 x 72 hour follow-up plan': [/q4/i, /q 4/i, /every 4 hours/i, /72 hours/i, /gastrointestinal/i, /respiratory findings/i],
  'Staff stool monitoring instructions': [/monitor stools/i, /blood and foreign bodies/i, /stool monitoring/i, /report to nurse/i],
  'Stool description (blood/foreign bodies)': [/stool description/i, /blood in stool/i, /foreign bod/i, /no blood/i, /no foreign/i],
  'Stool description including whether or not blood or foreign bodies identified': [/stool description/i, /blood in stool/i, /foreign bod/i, /identified in stool/i],
  'Date/time of seizure': [/date and time of seizure/i, /time of seizure/i, /seizure at/i, /occurred at/i, /seizure episode/i],
  'Breakthrough/standing/PRN medication': [/breakthrough/i, /standing order/i, /prn medication/i, /prn seizure/i, /anti-epileptic/i, /antiepileptic/i, /administered/i, /not administered/i],
  'Anti-epileptic medication follow-up plan': [/anti-epileptic/i, /follow up next shift/i, /next shift/i, /monitor for side effects/i, /aed follow-up/i],
  'PCP notification (when indicated)': [/pcp/i, /provider/i, /notified/i, /notify pcp/i, /no prior seizure history/i, /seizure-free/i, /different seizure type/i, /significant deviation/i],
  'Status Epilepticus criteria (when applicable)': [/status epilepticus/i, /repetitive/i, /continuous/i, /rapid succession/i, /3-5 minutes/i, /3 to 5 minutes/i, /prn seizure medication/i],
  'Vital-sign monitoring schedule (if PRN medication given)': [/every 30 minutes/i, /30 minutes x2/i, /every 2 hours/i, /2 hours x2/i, /every 4 hours/i, /24 hours/i, /spo2/i, /breakthrough medication/i],
  'Notification of Home Manager': [/home manager/i, /hm notified/i, /notified home manager/i],
  'Notification of RN Case Manager': [/rn case manager/i, /case manager/i, /rcm notified/i, /notified case manager/i],
  'Notification of Behavioral Health Specialist': [/behavioral health specialist/i, /\bbhs\b/i, /bhs notified/i, /notified bhs/i],
  'Notification of QIDP': [/\bqidp\b/i, /qidp notified/i, /notified qidp/i],
  'Change in seizure frequency or pattern': [/seizure frequency/i, /seizure pattern/i, /change in frequency/i, /change in pattern/i, /increased seizures/i],
  'Medication side effects': [/medication side effects/i, /side effects/i, /adverse effect/i, /sedated/i, /ataxia/i, /drowsiness/i],
  'Additional seizure activity': [/additional seizure/i, /recurrent seizure/i, /another seizure/i, /no additional seizure/i, /no further seizures/i],
  'Vital-sign monitoring schedule (if breakthrough medication administered)': [/every 30 minutes/i, /30 minutes x2/i, /every 2 hours/i, /2 hours x2/i, /every 4 hours/i, /24 hours/i, /spo2/i, /breakthrough medication/i],
  'Transfer reason': [/transfer reason/i, /reason for transfer/i, /sent to er/i, /sent to hospital/i, /emergency room/i, /ambulance/i],
  'Pre-transfer assessment findings': [/pre-transfer/i, /prior to transfer/i, /assessment prior/i, /findings prior/i, /additional assessment/i],
  'Anticoagulant/antiplatelet status': [/anticoagulant/i, /antiplatelet/i, /blood thinner/i, /coumadin/i, /warfarin/i, /aspirin/i, /eliquis/i],
  'Emergency Response notification time': [/emergency response/i, /ems notified/i, /911 called/i, /ambulance notified/i, /time ems/i],
  'Monitoring frequency before transport': [/monitor at/i, /ordered frequency/i, /until transport/i, /every 15 minutes/i, /every 30 minutes/i, /q15/i, /q30/i],
  'PCP orders': [/pcp order/i, /provider order/i, /physician order/i, /follow pcp/i, /as ordered/i, /orders obtained/i],
  'Nurse report recipient': [/nurse report given/i, /report given to/i, /receiving er nurse/i, /report provided to/i],
  'Braden Score': [/braden score/i, /\bbraden\b/i, /pressure injury risk score/i],
  'Family notification': [/family notified/i, /family notification/i, /lar notified/i, /guardian notified/i, /notified family/i],
  'Campus Coordinator notification': [/campus coordinator/i, /coordinator notified/i, /notified campus coordinator/i],
  'Medical Transfer Screen completion': [/medical transfer screen/i, /transfer screen/i, /mts completed/i, /screen completed/i],
  'Transfer-back diagnosis': [/transfer back diagnosis/i, /transfer-back diagnosis/i, /diagnosis from hospital/i, /er diagnosis/i, /discharge diagnosis/i],
  'Weight upon return': [/weight upon return/i, /weight on return/i, /returned weighing/i, /current weight/i],
  'Skin assessment': [/skin assessment/i, /skin intact/i, /pressure injury/i, /skin finding/i, /no skin breakdown/i],
  'Monitoring plan': [/monitoring parameter/i, /monitoring frequency/i, /monitoring plan/i, /parameters and frequency/i],
  'Source of nursing report': [/report received from/i, /nursing report received/i, /report from er/i, /report from hospital/i, /transferring facility/i],
  'Initial blood glucose level': [/blood glucose/i, /glucose level/i, /current blood glucose/i, /bg level/i, /mg\/dl/i, /hypoglycemia/i, /low blood sugar/i],
  '15–20 g glucose administration (if performed)': [/15-20 grams/i, /15 to 20 grams/i, /15–20 grams/i, /glucose administered/i, /glucose given/i, /orange juice/i, /glucose gel/i],
  'Time glucose was administered': [/time given/i, /time glucose/i, /administered at/i, /given at/i, /glucose at/i],
  'Glucagon administration (if performed)': [/glucagon/i, /1 mg glucagon/i, /glucagon administered/i, /glucagon given/i],
  'Emergency Response initiation time (if applicable)': [/emergency response initiated/i, /emergency response/i, /911 called/i, /911 initiated/i],
  'EMS arrival time (if applicable)': [/ems arrival/i, /ambulance arrived/i, /ems arrived/i, /arrival time/i],
  '15-minute follow-up plan': [/follow up in 15 minutes/i, /15 minute follow-up/i, /15-minute follow-up/i, /reassess 15 minutes/i],
  'Repeat blood glucose plan': [/repeat blood glucose/i, /recheck glucose/i, /15 minutes after intervention/i, /repeat bg/i],
  'PCP notification threshold': [/provider-specified threshold/i, /pcp threshold/i, /provider threshold/i, /glucose threshold/i, /below threshold/i],
  'Follow-up blood glucose level': [/follow-up blood glucose/i, /follow up blood glucose/i, /repeat blood glucose/i, /recheck glucose/i, /post intervention glucose/i],
  'PCP glucose monitoring plan': [/glucose monitoring plan/i, /monitoring plan ordered/i, /pcp ordered monitoring/i, /monitor blood glucose/i],
  'PCP notification time': [/pcp notified/i, /provider notified/i, /time pcp notified/i, /notification time/i, /notified at/i, /pcp called/i],
  'Blood glucose level after intervention': [/blood glucose after intervention/i, /glucose after intervention/i, /post intervention glucose/i, /glucose after insulin/i, /bg after/i],
  'PCP-directed follow-up plan': [/pcp-directed follow-up/i, /follow up according to pcp/i, /continue follow-up per pcp/i, /follow pcp orders/i, /intervention effectiveness/i],
  'Location of suspected fracture/dislocation': [/location of suspected/i, /fracture location/i, /dislocation location/i, /injury location/i, /suspected fracture/i, /suspected dislocation/i],
  'Signs and symptoms': [/signs and symptoms/i, /signs or symptoms/i, /deformity/i, /swelling/i, /bruising/i, /crepitus/i, /tenderness/i],
  'Osteoporosis/osteopenia history': [/osteoporosis/i, /osteopenia/i, /bone density/i, /low bone density/i],
  'PIR completion': [/pir/i, /post injury report/i, /injury report/i, /pir completed/i],
  'Every-shift reassessment plan': [/every shift/i, /each shift/i, /assess the injury every shift/i, /until evaluated by pcp/i],
  'Pain medication effectiveness reassessment plan': [/pain medication effectiveness/i, /reassessment interval/i, /monitor for side effects/i, /ordered reassessment/i],
  'Pain management interventions': [/pain management/i, /pain intervention/i, /analgesic/i, /tylenol/i, /acetaminophen/i, /morphine/i],
  'Response to interventions': [/response to intervention/i, /response to interventions/i, /responded to/i, /pain relief/i, /resident response/i],
  'ER transport status': [/transport to er/i, /transport to emergency room/i, /sent to er/i, /emergency room transport/i, /not transported/i],
  'Current injury location': [/current injury location/i, /injury location/i, /fracture location/i, /dislocation location/i],
  'Current signs and symptoms': [/current signs/i, /continuing symptoms/i, /signs and symptoms/i, /deformity/i, /swelling/i],
  'Ongoing pain management': [/ongoing pain management/i, /pain management intervention/i, /continued analgesic/i, /pain medication/i],
  'ER transport time (if applicable)': [/time of emergency room transfer/i, /er transfer time/i, /transported at/i, /left for er/i],
  'Removed tube type': [/removed tube/i, /tube removed/i, /foley removed/i, /g-tube removed/i, /mickey removed/i, /previous tube/i],
  'Removed tube French size': [/removed french/i, /removed size/i, /french removed/i, /french size/i, /\d+\s*fr/i],
  'Confirmation that the tube tip was intact': [/tube tip intact/i, /tip intact/i, /removed tube tip/i, /intact tip/i],
  'Inserted tube type': [/inserted tube/i, /tube inserted/i, /new tube/i, /g-tube inserted/i, /mickey inserted/i],
  'Inserted tube French size': [/inserted french/i, /inserted size/i, /french inserted/i, /new french/i, /\d+\s*fr/i],
  'Balloon inflation volume (mL)': [/balloon inflation/i, /sterile water/i, /ml sterile/i, /inflated balloon/i, /balloon volume/i],
  'Tube placement verification method': [/placement verification/i, /tube placement/i, /auscultation/i, /10 ml air bolus/i, /gastric contents/i, /visualization of gastric/i],
  'Procedure tolerance': [/tolerated the procedure/i, /tolerated well/i, /tolerated procedure/i, /did not tolerate/i, /procedure tolerance/i],
  'DSP education': [/dsp informed/i, /dsp instructed/i, /report redness/i, /report swelling/i, /report drainage/i, /g-tube was changed/i],
  'Skin impairment description/location': [/skin impairment/i, /wound/i, /pressure injury/i, /ulcer/i, /breakdown/i, /description/i, /location/i, /sacrum/i, /heel/i],
  'Wound measurements (Length × Width × Depth)': [/length/i, /width/i, /depth/i, /l x w x d/i, /lxwxd/i, /wound size/i, /size of injury/i, /cm/i, /mm/i],
  'PIR completion (when applicable)': [/pir/i, /post injury report/i, /injury report/i, /pir completed/i, /not applicable/i],
  'Follow-up interval': [/follow up at/i, /ordered interval/i, /reassess/i, /assess skin status/i, /q shift/i, /every shift/i],
  'Evaluation of intervention effectiveness': [/effectiveness/i, /evaluate the effectiveness/i, /nursing plan/i, /intervention effectiveness/i, /effective/i, /ineffective/i],
  'Updated wound measurements': [/current wound size/i, /updated wound/i, /wound size/i, /length/i, /width/i, /depth/i, /lxwxd/i],
  'Wound care interventions': [/wound care/i, /dressing change/i, /cleansed/i, /applied dressing/i, /wound care intervention/i],
  'eMAR medication documentation': [/emar/i, /e-mar/i, /medication administered/i, /medications administered/i, /see emar/i, /sedation medication/i, /premedication/i],
  'Every-30-minute monitoring plan': [/every 30 minutes/i, /every thirty minutes/i, /q30/i, /30 minutes/i, /until departure/i, /until monitoring complete/i, /monitoring period/i],
  'Altered mental status assessment': [/altered mental status/i, /mental status/i, /level of consciousness/i, /loc/i, /confused/i, /lethargic/i, /somnolent/i, /disoriented/i, /drowsy/i, /alert/i, /oriented/i],
  '24-hour report communication': [/24-hour report/i, /24 hour report/i, /communicate through/i, /shift report/i],
  'Staff instructions': [/staff instructions/i, /instructions provided/i, /staff verbalized/i, /staff demonstrated/i, /instructed staff/i],
  'Return location': [/return from/i, /returned from/i, /dental office/i, /medical office/i, /clinic/i, /returned to facility/i],
  'Return home time': [/return home time/i, /returned at/i, /time of return/i, /arrival time/i, /return time/i],
  'Appointment/procedure success': [/appointment successful/i, /procedure successful/i, /appointment\/procedure successful/i, /unsuccessful/i, /procedure completed/i],
  'Status post anesthesia': [/status post anesthesia/i, /s\/p anesthesia/i, /post anesthesia/i, /after anesthesia/i, /returned from anesthesia/i, /postoperative/i],
  'Arrival home time': [/time arrived home/i, /arrived home/i, /arrival home time/i, /arrival time/i, /returned at/i, /time of return/i],
  'Medication(s) received': [/medication received/i, /medications received/i, /anesthesia medication/i, /propofol/i, /fentanyl/i, /general anesthesia/i],
  'Confirmation that the Post Anesthesia Guideline is being followed': [/post anesthesia guideline/i, /follow the facility post anesthesia/i, /following post anesthesia/i, /guideline followed/i],
  'Individual cooperation status': [/cooperation/i, /cooperative/i, /lack of cooperation/i, /uncooperative/i, /refused/i, /willing/i, /unwilling/i, /participated/i],
  'Initial assessment timing': [/initial nursing assessment/i, /immediately/i, /within 30 minutes/i, /restraint initiation/i, /initial assessment/i],
  'Every-30-minute monitoring during restraint': [/every 30 minutes while/i, /while restraint/i, /restraint in progress/i, /during restraint/i, /restraint remains/i],
  'Every-30-minute monitoring after release until stable': [/after release/i, /release from restraint/i, /until stable/i, /deemed stable/i, /every 30 minutes after release/i],
  'Ongoing every-30-minute monitoring': [/ongoing every 30/i, /continue nursing assessment/i, /every 30 minutes/i, /continue assessment every 30/i, /q30/i],
  'Post-release monitoring until stable': [/after release/i, /release from restraint/i, /until stable/i, /restraint discontinued/i, /restraint released/i],
  'Staff education documentation': [/staff verbalized/i, /staff demonstrated/i, /understanding/i, /staff education/i, /instructions provided/i],
  'Individual cooperation level': [/cooperation level/i, /cooperation/i, /cooperative/i, /lack of cooperation/i, /uncooperative/i, /refused/i, /willing/i, /unwilling/i],
  'Injection site assessment': [/injection site/i, /injection site assessment/i, /im injection/i, /intramuscular/i, /deltoid/i, /gluteal/i, /site assessed/i],
  'Confirmation that the Crisis Chemical Restraint Guideline is being followed': [/crisis chemical restraint guideline/i, /follow the facility crisis chemical restraint/i, /following crisis chemical restraint/i, /guideline followed/i],
  'Altered mental status assessment (when monitoring is complete)': [/altered mental status/i, /mental status/i, /level of consciousness/i, /end of the monitoring period/i, /monitoring complete/i, /confused/i, /lethargic/i, /somnolent/i],
  'Assessment type': [/initial assessment/i, /follow-up assessment/i, /follow up assessment/i, /resolution assessment/i, /initial constipation/i, /follow-up constipation/i, /constipation resolved/i, /resolution/i],
  'Additional assessment findings': [/additional assessment/i, /assessment findings/i, /abdominal/i, /abdomen/i, /bowel sounds/i, /last bm/i, /last bowel movement/i, /no bm/i],
  'Results of suppository or constipation medication (if administered)': [/suppository/i, /dulcolax/i, /bisacodyl/i, /enema/i, /miralax/i, /senna/i, /colace/i, /constipation medication/i, /laxative/i, /medication result/i, /not administered/i],
  'Intake and output assessment for the past 24 hours': [/intake and output/i, /i&o/i, /i and o/i, /past 24 hours/i, /24 hours/i, /fluid intake/i, /urine output/i, /stool output/i],
  'Effectiveness of anti-diarrheal medication (if administered)': [/anti-diarrheal/i, /antidiarrheal/i, /loperamide/i, /imodium/i, /kaopectate/i, /pepto/i, /effectiveness/i, /medication effective/i, /not administered/i],
  'Dehydration prevention strategies': [/dehydration prevention/i, /prevent dehydration/i, /hydration/i, /encourage fluids/i, /oral rehydration/i, /fluid replacement/i, /strategies implemented/i],
  'Medication change details, when available': [/medication change/i, /med changed/i, /new medication/i, /discontinued/i, /dose increased/i, /dose decreased/i, /held medication/i, /started medication/i, /emar/i, /mar/i, /provider order/i],
  'Nursing interventions completed': [/nursing intervention/i, /interventions completed/i, /intervention/i, /monitor/i, /assessed/i, /completed/i, /provided/i],
  'Staff instruction or education documentation': [/staff verbalized/i, /staff demonstrated/i, /understanding/i, /staff instruction/i, /staff education/i, /instructions provided/i],
  'Current response to the medication change': [/current response/i, /response to medication/i, /response to the medication change/i, /effective/i, /tolerated/i, /not tolerated/i, /improved/i],
  'Reported or observed side effects': [/side effect/i, /adverse effect/i, /adverse reaction/i, /reported side/i, /observed side/i, /nausea/i, /dizziness/i, /rash/i],
  'Change from baseline': [/change from baseline/i, /compared to baseline/i, /baseline/i, /prior to change/i, /before medication change/i],
  'Ongoing monitoring or follow-up plan': [/ongoing monitoring/i, /follow-up plan/i, /continue to monitor/i, /reassess/i, /monitoring plan/i, /continue monitoring/i],
  'Explicit resolution or completion status': [/resolution/i, /resolved/i, /monitoring complete/i, /completion status/i, /explicitly documented/i, /medication change complete/i],
  'Final response to the medication change': [/final response/i, /final assessment/i, /overall response/i, /final status/i],
  'Any remaining monitoring or follow-up needs': [/remaining monitoring/i, /follow-up needs/i, /ongoing needs/i, /continued monitoring needed/i, /further follow-up/i],
  'Assessment time': [/assessed at/i, /assessment time/i, /time assessed/i, /assessment at/i, /evaluated at/i],
  'Assessment statement': [/assessment statement/i, /clinical assessment/i, /nursing assessment/i, /nurse assessment/i, /evaluation findings/i],
  'Appropriate guideline followed (when applicable)': [/facility guideline/i, /appropriate guideline/i, /following guideline/i, /guideline followed/i, /per facility guideline/i],
  'Staff instruction/education documentation': [/staff verbalized/i, /staff demonstrated/i, /understanding/i, /staff instruction/i, /staff education/i, /instructions provided/i],
};

function isDocumentedInOutput(area: string, documentation: string): boolean {
  const patterns = DOCUMENTATION_EVIDENCE[area];
  if (!patterns) return false;
  return patterns.some((re) => re.test(documentation));
}

/**
 * Analyze the clinical narrative against the guideline's review areas
 * and return the ones that appear to be missing.
 */
export function analyzeMissingInfo(
  guidelineId: GuidelineId,
  clinicalInfo: string,
  supplements: MissingInfoItem[] = [],
): MissingInfoItem[] {
  let def;
  try {
    def = lookupGuidelineDefinition(guidelineId);
  } catch {
    return [];
  }

  const searchableText = buildSearchableText(clinicalInfo, supplements);
  const assessmentType = detectAssessmentType(searchableText);
  const reviewAreas = getReviewAreaLabels(def, searchableText, lookupGuidelineDefinition);

  if (!searchableText.trim()) {
    return reviewAreas.map((area) => {
      const field = getFieldByLabel(def, area);
      return {
        id: area.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        label: area,
        value: '',
        category: field ? inferMissingInfoCategory(field) : 'facility_required',
        critical: field?.critical,
      };
    });
  }

  const missing: MissingInfoItem[] = [];
  for (const area of reviewAreas) {
    const areaDef = findGuidelineDefForArea(def, area, searchableText, lookupGuidelineDefinition);
    const field = getFieldByLabel(areaDef, area);
    if (field && !shouldCheckMissingField(field, searchableText, assessmentType)) {
      continue;
    }
    if (!isReviewAreaPresent(area, searchableText, areaDef)) {
      missing.push({
        id: area.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        label: area,
        value: supplements.find((s) => s.label === area)?.value ?? '',
        category: field ? inferMissingInfoCategory(field) : 'facility_required',
        critical: field?.critical,
      });
    }
  }
  return missing;
}

export function validateSoapDocumentation(
  clinicalInfo: string,
  documentation: string,
): { validatedDocumentation: string; qualityCheck: DocumentationQualityCheck } {
  const assessmentType = detectAssessmentType(clinicalInfo);
  return validateGeneratedDocumentation(clinicalInfo, documentation, { assessmentType });
}

/**
 * Determine which items are genuinely missing for the result screen.
 * Re-evaluates input + supplements, then removes items evidenced in the generated doc.
 */
export function resolveDisplayMissingInfo(
  guidelineId: GuidelineId,
  clinicalInfo: string,
  supplements: MissingInfoItem[],
  documentation: string,
): MissingInfoItem[] {
  const stillMissingFromInput = analyzeMissingInfo(guidelineId, clinicalInfo, supplements);
  return stillMissingFromInput.filter(
    (item) => !isDocumentedInOutput(item.label, documentation),
  );
}

// =========================================================================
// 3. DOCUMENTATION GENERATION (clean professional English)
// =========================================================================

function guidelineLabel(guidelineId: GuidelineId): string {
  return GUIDELINES.find((g) => g.id === guidelineId)?.label ?? 'the reported condition';
}

function guidelineLabelLower(guidelineId: GuidelineId): string {
  return guidelineLabel(guidelineId).toLowerCase();
}

/** Collect all objective findings from the extracted data */
/**
 * Collect subjective findings: what was reported by staff, resident,
 * or observed complaints — rewritten into professional English.
 * Never includes raw user input.
 */
function subjectiveFindings(data: ClinicalData): string[] {
  const findings: string[] = [];
  // Reported complaints / staff observations (not measurable data)
  if (data.gi.length) {
    // Emesis / nausea as a reported event
    for (const g of data.gi) {
      if (/emesis|vomit|nausea/i.test(g)) findings.push(g);
    }
  }
  if (data.pain.length) findings.push(...data.pain);
  // General observations reported by staff (e.g. "resident was sleeping")
  for (const o of data.observations) {
    if (/sleeping|resting|found to have fallen|seizure/i.test(o)) findings.push(o);
  }
  return findings.filter(Boolean);
}

/**
 * Collect objective findings: measurable and observed data —
 * rewritten into professional English. Never includes raw user input.
 */
function objectiveFindings(data: ClinicalData): string[] {
  const findings: string[] = [];
  // Measurable data first
  findings.push(...data.vitals);
  findings.push(...data.oxygen);
  findings.push(...data.respiratory);
  // G-tube residual is objective; emesis amount is objective
  for (const g of data.gi) {
    if (/residual|ml/i.test(g)) findings.push(g);
  }
  findings.push(...data.neuro);
  findings.push(...data.skin);
  // Interventions with times are objective
  findings.push(...data.interventions);
  return findings.filter(Boolean);
}

function generateSOAP(
  data: ClinicalData,
  guidelineId: GuidelineId,
  missing: MissingInfoItem[],
): string {
  const subj = subjectiveFindings(data);
  const obj = objectiveFindings(data);

  const subjectiveText = subj.length
    ? subj.join(' ')
    : '';

  const objectiveText = obj.length
    ? obj.join(' ')
    : 'See Interactive View Assessment.';

  const assessmentParts: string[] = [];
  if (data.gi.length) {
    assessmentParts.push('Findings related to gastrointestinal symptoms as documented.');
  }
  if (data.oxygen.length || data.respiratory.length) {
    assessmentParts.push('Respiratory findings as documented.');
  }
  if (data.pain.length) {
    assessmentParts.push('Pain-related findings as documented.');
  }
  if (data.neuro.length) {
    assessmentParts.push('Neurologic findings as documented.');
  }
  if (data.skin.length) {
    assessmentParts.push('Skin findings as documented.');
  }
  if (assessmentParts.length === 0) {
    assessmentParts.push(`${guidelineLabel(guidelineId)} assessment findings as documented.`);
  }

  const planItems: string[] = [];
  if (data.interventions.length) {
    planItems.push(data.interventions.join(' '));
  }
  for (const item of missing) {
    if (item.value.trim()) {
      planItems.push(`${item.label}: ${item.value.trim()}.`);
    }
  }

  const planText = planItems.length
    ? planItems.join(' ')
    : 'Follow facility guideline using only supported information.';

  const sections = [
    'SUBJECTIVE:',
    subjectiveText,
    '',
    'OBJECTIVE:',
    objectiveText,
    '',
    'ASSESSMENT:',
    assessmentParts.join(' '),
    '',
    'PLAN:',
    planText,
  ];

  if (!subjectiveText) {
    return sections.filter((_, index) => index !== 0 && index !== 1 && index !== 2).join('\n');
  }

  return sections.join('\n');
}

function generateProviderNotificationSBAR(
  data: ClinicalData,
  guidelineId: GuidelineId,
  missing: MissingInfoItem[],
): string {
  const obj = objectiveFindings(data);

  const situation = `Reason for contact: ${guidelineLabel(guidelineId)} assessment findings requiring provider review.`;

  const backgroundParts: string[] = [];
  if (data.observations.length) backgroundParts.push(...data.observations);
  for (const item of missing) {
    if (item.value.trim()) backgroundParts.push(`${item.label}: ${item.value.trim()}.`);
  }
  const background = backgroundParts.length ? backgroundParts.join(' ') : 'Relevant background as documented.';

  const assessmentParts: string[] = [];
  if (obj.length) assessmentParts.push(obj.join(' '));
  if (data.interventions.length) assessmentParts.push(data.interventions.join(' '));
  const assessment = assessmentParts.length ? assessmentParts.join(' ') : 'Assessment findings as documented.';

  const recommendation = 'Requesting provider evaluation and further orders.';

  return [
    'S — Situation:',
    situation,
    '',
    'B — Background:',
    background,
    '',
    'A — Assessment:',
    assessment,
    '',
    'R — Recommendation:',
    recommendation,
  ].join('\n');
}

function generateProgressNote(
  data: ClinicalData,
  guidelineId: GuidelineId,
  missing: MissingInfoItem[],
): string {
  const obj = objectiveFindings(data);
  const missingLabels = missing.filter((m) => !m.value.trim()).map((m) => m.label);

  const lines: string[] = [
    `Resident was assessed on this shift regarding ${guidelineLabelLower(guidelineId)}.`,
    '',
  ];
  if (obj.length) {
    lines.push(obj.join(' '));
    lines.push('');
  } else {
    lines.push('No specific findings were documented at this time.');
    lines.push('');
  }
  if (missingLabels.length) {
    lines.push(`The following were not assessed: ${missingLabels.join(', ')}.`);
    lines.push('');
  }
  lines.push('Resident was monitored during the shift. Will continue to monitor and report any changes to the provider.');

  return lines.join('\n');
}

function generateLAREmail(
  data: ClinicalData,
  guidelineId: GuidelineId,
): string {
  const summaryParts: string[] = [];
  if (data.gi.length) summaryParts.push('a gastrointestinal concern');
  if (data.oxygen.length || data.respiratory.length) summaryParts.push('respiratory findings');
  if (data.pain.length) summaryParts.push('signs of discomfort');
  if (data.observations.length && summaryParts.length === 0) {
    summaryParts.push('a change in condition');
  }

  const summary = summaryParts.length ? summaryParts.join(' and ') : 'an assessment finding';
  const interventionNote = data.interventions.length
    ? ' Nursing interventions were completed as documented.'
    : '';

  return [
    'Hello,',
    '',
    `I wanted to inform you that the resident had ${summary} during the shift.${interventionNote}`,
    '',
    'Please contact the facility if you have any questions or concerns.',
    '',
    'Sincerely,',
    'Nursing Staff',
  ].join('\n');
}

function generateProviderNotification(
  data: ClinicalData,
  guidelineId: GuidelineId,
  missing: MissingInfoItem[],
): string {
  return generateProviderNotificationSBAR(data, guidelineId, missing);
}

function generateFollowupNote(
  data: ClinicalData,
  guidelineId: GuidelineId,
): string {
  const obj = objectiveFindings(data);

  const lines: string[] = [
    `FOLLOW-UP NOTE — ${guidelineLabel(guidelineId).toUpperCase()}`,
    '',
    'Resident was re-assessed for the reported condition.',
    '',
  ];
  if (obj.length) {
    lines.push(obj.join(' '));
  } else {
    lines.push('No new findings were documented at this follow-up.');
  }
  lines.push('');
  lines.push('Resident will continue to be monitored. Any changes in condition will be reported to the provider.');

  return lines.join('\n');
}

function generateClosingNote(
  data: ClinicalData,
  guidelineId: GuidelineId,
): string {
  const obj = objectiveFindings(data);

  const lines: string[] = [
    `CLOSING NOTE — ${guidelineLabel(guidelineId).toUpperCase()}`,
    '',
    'Resident has been monitored and re-assessed regarding the reported condition.',
    '',
  ];
  if (obj.length) {
    lines.push(obj.join(' '));
  } else {
    lines.push('No additional findings were documented at closing.');
  }
  lines.push('');
  lines.push('Resident is stable at this time. The guideline is closed. Resident will continue to be monitored as part of routine care.');

  return lines.join('\n');
}

// =========================================================================
// PUBLIC API
// =========================================================================

/**
 * Generate the final documentation. Never invents findings —
 * missing areas are marked "not assessed" / "not reported".
 * Raw user input is never copied; all facts are rewritten into
 * clean professional English.
 */
export function generateDocumentation(
  guidelineId: GuidelineId,
  outputId: OutputId,
  clinicalInfo: string,
  supplements: MissingInfoItem[],
  _terminology: Terminology,
): string {
  const data = extractClinicalData(clinicalInfo, supplements);
  const stillMissing = supplements.filter((s) => !s.value.trim());

  switch (outputId) {
    case 'soap_note':
      return generateSOAP(data, guidelineId, stillMissing);
    case 'provider_notification_sbar':
    case 'sbar':
    case 'provider_notification':
      return generateProviderNotificationSBAR(data, guidelineId, stillMissing);
    case 'lar_email':
      return generateLAREmail(data, guidelineId);
    case 'nursing_progress_note':
      return generateProgressNote(data, guidelineId, stillMissing);
    case 'followup_guideline_note':
      return generateFollowupNote(data, guidelineId);
    case 'closing_guideline_note':
      return generateClosingNote(data, guidelineId);
    default:
      return generateSOAP(data, guidelineId, stillMissing);
  }
}

export function generateDocumentationBundle(
  guidelineId: GuidelineId,
  clinicalInfo: string,
  supplements: MissingInfoItem[],
  terminology: Terminology,
  options: { includeProviderNotification: boolean; includeLarEmail: boolean },
): GeneratedDocument[] {
  const documents: GeneratedDocument[] = [
    {
      label: 'SOAP Note',
      content: generateDocumentation(guidelineId, 'soap_note', clinicalInfo, supplements, terminology),
    },
  ];

  if (options.includeProviderNotification) {
    documents.push({
      label: 'Provider Notification (SBAR)',
      content: generateDocumentation(
        guidelineId,
        'provider_notification_sbar',
        clinicalInfo,
        supplements,
        terminology,
      ),
    });
  }

  if (options.includeLarEmail) {
    documents.push({
      label: 'LAR Email',
      content: generateDocumentation(guidelineId, 'lar_email', clinicalInfo, supplements, terminology),
    });
  }

  return documents;
}

/**
 * Full pipeline: analyze then generate.
 * Returns the documentation plus the list of missing items
 * (for the "Missing or Not Reported Information" section).
 */
export function runGeneration(
  guidelineId: GuidelineId,
  outputId: OutputId,
  clinicalInfo: string,
  supplements: MissingInfoItem[],
  terminology: Terminology,
): GenerationResult {
  const documentation = generateDocumentation(guidelineId, outputId, clinicalInfo, supplements, terminology);
  const missingInfo = supplements.filter((s) => !s.value.trim());
  return {
    documentation,
    documents: [{ label: 'SOAP Note', content: documentation }],
    missingInfo,
  };
}
