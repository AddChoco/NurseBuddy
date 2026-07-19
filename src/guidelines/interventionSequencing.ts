const FOCUSED_ASSESSMENT_PATTERNS: RegExp[] = [
  /\babdominal assessment completed\b/i,
  /\brespiratory assessment completed\b/i,
  /\bneurological assessment completed\b/i,
  /\bskin assessment completed\b/i,
  /\bpain assessment completed\b/i,
  /\bmobility assessment completed\b/i,
  /\btemperature reassessed\b/i,
];

const GENERIC_ASSESSMENT_PATTERNS: RegExp[] = [
  /^Assessment completed\.$/i,
];

const INTERVENTION_SEQUENCE: Array<(text: string) => boolean> = [
  (text) => /nursing assessment completed|follow-up nursing assessment completed/i.test(text),
  (text) => /vital signs obtained/i.test(text),
  (text) => FOCUSED_ASSESSMENT_PATTERNS.some((pattern) => pattern.test(text))
    || /assessments completed/i.test(text)
    || /was assessed/i.test(text),
  (text) => /positioned|repositioned|head of bed|pnmp-recommended positioning|positioning completed/i.test(text),
  (text) => /intake and output reviewed/i.test(text),
  (text) => /hydration encouraged|comfort measures provided|fluids encouraged|dehydration prevention/i.test(text),
  (text) => /medication effectiveness evaluated|prn tylenol administered|oxygen administered|nebulizer treatment provided|suctioning performed|fall follow-up monitoring initiated|resident reassessed/i.test(text),
  (text) => /ongoing monitoring/i.test(text),
];

export function extractDocumentedPositioning(combinedText: string): string | null {
  const text = combinedText;

  if (/\bhead of bed (?:was )?elevated\b|\bhob (?:was )?elevated\b|\belevated head of bed\b/i.test(text)) {
    return 'Head of bed elevated.';
  }

  const sideMatch = text.match(/\b(?:repositioned|positioned|turned|lying|sleeping|sitting)\s+(?:on\s+(?:the\s+)?)?(left|right)\s+side\b/i);
  if (sideMatch) {
    return `Resident repositioned to the ${sideMatch[1].toLowerCase()} side.`;
  }

  if (/\b(?:sitting|positioned|maintained)\s+upright\b|\bupright positioning\b|\bpositioned upright\b|\bsitting upright\b/i.test(text)) {
    return 'Resident positioned upright.';
  }

  if (/\bsemi[- ]?fowler/i.test(text)) {
    return 'Resident positioned in semi-Fowler position.';
  }

  if (/\bfowler/i.test(text)) {
    return 'Resident positioned in Fowler position.';
  }

  if (/\bpnmp\b/i.test(text) && /\bposition/i.test(text)) {
    return 'Resident maintained in PNMP-recommended positioning.';
  }

  if (/\bpositioned per pnmp\b|\bpositioning per pnmp\b/i.test(text)) {
    return 'Resident maintained in PNMP-recommended positioning.';
  }

  return null;
}

function combineFocusedAssessments(interventions: string[]): string[] {
  const respiratory = interventions.find((item) => /respiratory assessment completed/i.test(item));
  const abdominal = interventions.find((item) => /abdominal assessment completed/i.test(item));

  if (!respiratory || !abdominal) return interventions;

  const withoutBoth = interventions.filter(
    (item) => item !== respiratory && item !== abdominal,
  );

  return [...withoutBoth, 'Respiratory and abdominal assessments completed.'];
}

function removeRedundantGenericAssessment(interventions: string[]): string[] {
  const hasSpecificFocused = interventions.some((item) =>
    FOCUSED_ASSESSMENT_PATTERNS.some((pattern) => pattern.test(item))
    || /assessments completed/i.test(item)
    || /was assessed/i.test(item),
  );

  if (!hasSpecificFocused) return interventions;

  return interventions.filter((item) => !GENERIC_ASSESSMENT_PATTERNS.some((pattern) => pattern.test(item)));
}

function replaceGenericMonitoring(interventions: string[], guidelineDisplayName: string): string[] {
  const monitoringSentence = formatGuidelineMonitoringSentence(guidelineDisplayName);
  return interventions.map((item) =>
    /^Ongoing monitoring initiated\.$/i.test(item) ? monitoringSentence : item,
  );
}

export function formatGuidelineMonitoringSentence(guidelineDisplayName: string): string {
  return `Ongoing monitoring continued according to the ${guidelineDisplayName} Guideline.`;
}

function interventionSortIndex(text: string): number {
  const index = INTERVENTION_SEQUENCE.findIndex((matcher) => matcher(text));
  return index === -1 ? INTERVENTION_SEQUENCE.length : index;
}

export function orderNursingInterventions(
  interventions: string[],
  guidelineDisplayName: string,
  combinedText: string,
): string[] {
  const deduped = [...new Set(interventions.filter(Boolean))];
  const positioning = extractDocumentedPositioning(combinedText);
  const withoutGenericPositioning = deduped.filter((item) => !/^Resident positioned appropriately\.$/i.test(item));
  const withPositioning = positioning
    ? [...withoutGenericPositioning.filter((item) => !/^Resident positioned|^Head of bed|^Resident repositioned|^Resident maintained in PNMP/i.test(item)), positioning]
    : withoutGenericPositioning;

  const combined = replaceGenericMonitoring(
    removeRedundantGenericAssessment(combineFocusedAssessments(withPositioning)),
    guidelineDisplayName,
  );

  const monitoringSentence = formatGuidelineMonitoringSentence(guidelineDisplayName);
  const withMonitoring = combined.some((item) => /ongoing monitoring/i.test(item))
    ? combined
    : [...combined, monitoringSentence];

  return withMonitoring.sort((left, right) => interventionSortIndex(left) - interventionSortIndex(right));
}
