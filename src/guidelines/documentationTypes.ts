import type { DocumentationTypeId, DocumentationTypeMeta } from './types';

/** Registry of all documentation types the guideline engine supports. */
export const DOCUMENTATION_TYPES: DocumentationTypeMeta[] = [
  {
    id: 'initial_assessment',
    label: 'Initial Assessment',
    legacyLabels: ['Nursing Progress Note'],
  },
  {
    id: 'follow_up_assessment',
    label: 'Follow-up Assessment',
    legacyLabels: ['Follow-up Guideline Note'],
  },
  {
    id: 'resolution_assessment',
    label: 'Resolution Assessment',
    legacyLabels: ['Closing Guideline Note'],
  },
  {
    id: 'soap_note',
    label: 'SOAP Note',
    legacyLabels: ['SOAP Note'],
  },
  {
    id: 'sbar',
    label: 'SBAR',
    legacyLabels: ['SBAR'],
  },
  {
    id: 'lar_guardian_email',
    label: 'LAR/Guardian Email',
    legacyLabels: ['LAR Email'],
  },
  {
    id: 'provider_notification',
    label: 'Provider Notification',
    legacyLabels: ['Provider Notification'],
  },
  {
    id: 'provider_notification_sbar',
    label: 'Provider Notification (SBAR)',
    legacyLabels: ['Provider Notification (SBAR)'],
  },
];

export const DOCUMENTATION_TYPE_BY_ID: Record<DocumentationTypeId, DocumentationTypeMeta> =
  Object.fromEntries(DOCUMENTATION_TYPES.map((type) => [type.id, type])) as Record<
    DocumentationTypeId,
    DocumentationTypeMeta
  >;

/** Maps current UI output labels to canonical documentation type IDs. */
export const LEGACY_OUTPUT_LABEL_TO_DOC_TYPE: Record<string, DocumentationTypeId> =
  Object.fromEntries(
    DOCUMENTATION_TYPES.flatMap((type) =>
      type.legacyLabels.map((label) => [label, type.id]),
    ),
  ) as Record<string, DocumentationTypeId>;

export function resolveDocumentationTypeId(outputLabel: string): DocumentationTypeId | undefined {
  return LEGACY_OUTPUT_LABEL_TO_DOC_TYPE[outputLabel];
}

export function getDocumentationTypeLabel(id: DocumentationTypeId): string {
  return DOCUMENTATION_TYPE_BY_ID[id].label;
}
