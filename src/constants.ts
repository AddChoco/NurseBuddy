import type { GuidelineId, OptionalOutputId } from './types';
import {
  GUIDELINE_DEFINITIONS,
  GUIDELINE_UI_META,
  getMissingInformationChecklistLabels,
} from './guidelines';

export interface GuidelineOption {
  id: GuidelineId;
  label: string;
  emoji: string;
  /** Required assessment areas used for missing-info detection */
  reviewAreas: string[];
}

export const GUIDELINES: GuidelineOption[] = GUIDELINE_DEFINITIONS.map((def) => ({
  id: def.id,
  label: def.displayName,
  emoji: GUIDELINE_UI_META[def.id].emoji,
  reviewAreas: getMissingInformationChecklistLabels(def),
}));

export const SOAP_OUTPUT_LABEL = 'SOAP Note';

export interface OptionalOutputOption {
  id: OptionalOutputId;
  label: string;
  emoji: string;
  description: string;
}

/** Optional documents generated in addition to the SOAP note. */
export const OPTIONAL_OUTPUTS: OptionalOutputOption[] = [
  {
    id: 'provider_notification_sbar',
    label: 'Provider Notification (SBAR)',
    emoji: '📞',
    description: 'SBAR-formatted provider notification',
  },
  {
    id: 'lar_email',
    label: 'LAR Email',
    emoji: '✉️',
    description: 'Email to Legally Authorized Representative',
  },
];

export function getOptionalOutputLabel(id: OptionalOutputId): string {
  return OPTIONAL_OUTPUTS.find((output) => output.id === id)?.label ?? id;
}

export const PRIVACY_WARNING =
  'Do not enter patient names, dates of birth, medical record numbers, addresses, Social Security numbers, or other identifying information. Review all AI-generated documentation before entering it into the official medical record.';
