import type {
  GuidelineId,
  Terminology,
  MissingInfoItem,
  GeneratedDocument,
  GenerationOptions,
  DocumentationQualityCheck,
  DocumentationGenerationMeta,
  NurseStaffEducationConfirmations,
  StaffEducationState,
  TemplateLockClientContext,
} from '../types';
import { GUIDELINES, SOAP_OUTPUT_LABEL, getOptionalOutputLabel } from '../constants';
import { stripMarkdown } from './structuredDocumentation';

const DEFAULT_SUPABASE_URL = 'https://rsdcrgzejnaotpeeauep.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_ISpr5Ztcdx_5kcnGcnaRlA_CISIDfX4';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

function requireSupabaseConfig(): { url: string; anonKey: string } {
  if (!SUPABASE_URL?.trim() || !SUPABASE_ANON_KEY?.trim()) {
    throw new Error(
      'Supabase configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for this deployment.',
    );
  }

  return { url: SUPABASE_URL.trim(), anonKey: SUPABASE_ANON_KEY.trim() };
}

const FUNCTION_PATH = '/functions/v1/generate-documentation';

interface GenerateRequest {
  guideline: string;
  outputType: string;
  additionalOutputs?: string[];
  clinicalInfo: string;
  supplements: { label: string; value: string }[];
  terminology: string;
  autoCompleteStaffEducation?: boolean;
  autoConfirmStaffInstructionFromNursingInterventions?: boolean;
  nurseStaffEducationConfirmations?: NurseStaffEducationConfirmations;
}

interface GenerateResponse {
  documentation: string;
  documents?: GeneratedDocument[];
  qualityCheck?: DocumentationQualityCheck;
  generationMeta?: DocumentationGenerationMeta;
  templateLockContext?: TemplateLockClientContext;
  staffEducation?: StaffEducationState;
  error?: string;
}

function buildAdditionalOutputs(options: GenerationOptions): string[] {
  const outputs: string[] = [];
  if (options.includeProviderNotification) {
    outputs.push(getOptionalOutputLabel('provider_notification_sbar'));
  }
  if (options.includeLarEmail) {
    outputs.push(getOptionalOutputLabel('lar_email'));
  }
  return outputs;
}

function buildSupplementsPayload(supplements: MissingInfoItem[]) {
  return supplements
    .filter((s) => s.value.trim())
    .map((s) => ({ label: s.label, value: s.value.trim() }));
}

async function callGenerateDocumentation(body: GenerateRequest): Promise<GenerateResponse> {
  const { url, anonKey } = requireSupabaseConfig();
  const response = await fetch(`${url}${FUNCTION_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody.error) message = errBody.error;
    } catch {
      // response wasn't JSON
    }
    throw new Error(message);
  }

  const data: GenerateResponse = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

async function fetchOptionalDocument(
  guideline: string,
  outputLabel: string,
  clinicalInfo: string,
  supplements: { label: string; value: string }[],
  terminology: Terminology,
): Promise<GeneratedDocument> {
  const data = await callGenerateDocumentation({
    guideline,
    outputType: outputLabel,
    clinicalInfo,
    supplements,
    terminology,
  });

  if (!data.documentation?.trim()) {
    throw new Error(`No content was returned for ${outputLabel}.`);
  }

  return { label: outputLabel, content: data.documentation.trim() };
}

async function ensureOptionalDocuments(
  guideline: string,
  clinicalInfo: string,
  supplements: { label: string; value: string }[],
  terminology: Terminology,
  requestedOutputs: string[],
  documents: GeneratedDocument[],
): Promise<GeneratedDocument[]> {
  if (requestedOutputs.length === 0) return documents;

  const result = [...documents];
  const existingLabels = new Set(result.map((doc) => doc.label));
  const missingOutputs = requestedOutputs.filter((label) => !existingLabels.has(label));

  if (missingOutputs.length === 0) return result;

  const fetched = await Promise.all(
    missingOutputs.map((outputLabel) =>
      fetchOptionalDocument(guideline, outputLabel, clinicalInfo, supplements, terminology),
    ),
  );

  return [...result, ...fetched];
}

/**
 * Call the server-side edge function to generate documentation via OpenAI.
 * The OPENAI_API_KEY stays server-side — never sent to the browser.
 */
export async function generateDocumentationViaAPI(
  guidelineId: GuidelineId,
  clinicalInfo: string,
  supplements: MissingInfoItem[],
  terminology: Terminology,
  options: GenerationOptions,
): Promise<{
  documentation: string;
  documents: GeneratedDocument[];
  qualityCheck: DocumentationQualityCheck;
  generationMeta?: DocumentationGenerationMeta;
  templateLockContext?: TemplateLockClientContext;
  staffEducation?: StaffEducationState;
}> {
  const guideline = GUIDELINES.find((g) => g.id === guidelineId)?.label ?? guidelineId;
  const additionalOutputs = buildAdditionalOutputs(options);
  const supplementsPayload = buildSupplementsPayload(supplements);

  const body: GenerateRequest = {
    guideline,
    outputType: SOAP_OUTPUT_LABEL,
    additionalOutputs,
    clinicalInfo,
    supplements: supplementsPayload,
    terminology,
    autoCompleteStaffEducation: options.autoCompleteStaffEducation,
    autoConfirmStaffInstructionFromNursingInterventions:
      options.autoConfirmStaffInstructionFromNursingInterventions,
    nurseStaffEducationConfirmations: options.nurseStaffEducationConfirmations,
  };

  const data = await callGenerateDocumentation(body);

  if (!data.documentation) {
    throw new Error('No documentation was returned by the AI.');
  }

  let documents: GeneratedDocument[] = data.documents?.length
    ? data.documents
    : [{ label: SOAP_OUTPUT_LABEL, content: data.documentation }];

  documents = await ensureOptionalDocuments(
    guideline,
    clinicalInfo,
    supplementsPayload,
    terminology,
    additionalOutputs,
    documents,
  );

  const sbarLabel = getOptionalOutputLabel('provider_notification_sbar');

  const validatedDocuments = documents.map((doc) => ({
    ...doc,
    content: doc.label === sbarLabel
      ? stripMarkdown(doc.content)
      : doc.content,
  }));

  const soapDocument = validatedDocuments.find((doc) => doc.label === SOAP_OUTPUT_LABEL) ?? validatedDocuments[0];

  return {
    documentation: soapDocument.content,
    documents: validatedDocuments,
    qualityCheck: data.qualityCheck ?? {
      templateFollowed: true,
      unsupportedStatementsRemoved: [],
      messages: [],
    },
    generationMeta: data.generationMeta,
    templateLockContext: data.templateLockContext,
    staffEducation: data.staffEducation,
  };
}
