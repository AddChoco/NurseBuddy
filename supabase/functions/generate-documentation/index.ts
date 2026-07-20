import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  lookupGuidelineByDisplayName,
  buildGuidelineContextBlock,
  buildGuidelineDocumentationInstructionBlock,
  GUIDELINE_BY_ID,
} from "../_shared/guidelines/index.ts";
import {
  generateAiDocumentationBundle,
  buildAiGenerationContext,
  buildCompleteGuidelineTemplateBlock,
} from "../_shared/aiDocumentationGeneration.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SOAP_NOTE_LABEL = "SOAP Note";
const PROVIDER_NOTIFICATION_SBAR_LABEL = "Provider Notification (SBAR)";
const LAR_EMAIL_LABEL = "LAR Email";

// ---------------------------------------------------------------------------
// Shared RN documentation core
// ---------------------------------------------------------------------------

const PROCESSING_WORKFLOW = `PROCESSING WORKFLOW (follow internally before writing):
1. Extract only supported clinical facts from the input (English, Korean, or Spanish).
2. Organize events in chronological order when times are provided or implied.
3. Remove conversational filler, repetition, and non-clinical background.
4. Write the final documentation in professional English using only those extracted facts.
Do not show your extraction steps. Output only the finished documentation.`;

const CORE_INSTRUCTION = `You are an experienced RN documentation assistant for a State Supported Living Center / long-term care setting.

LANGUAGE:
- All final documentation must be written in professional English, regardless of whether the input is English, Korean, or Spanish.
- Do not produce Korean or Spanish in the output.
- Do not translate the raw input sentence by sentence.
- Do not repeat, paraphrase closely, or mirror the user's original phrasing. Rewrite into appropriate nursing documentation.

ACCURACY:
- Use objective, professional wording. Do not exaggerate.
- Never invent findings, diagnoses, interventions, notifications, medication effects, or resident responses.
- Do not diagnose unless a diagnosis was explicitly provided in the input.
- Document only what is supported by the input or nurse-supplemented missing-area details.
- Do not state that a medication or intervention was effective unless effectiveness was provided.
- Do not state that the individual was stable, returned to baseline, tolerated treatment, improved, worsened, or resolved unless supported by the input.
- Do not insert generic normal findings that were not provided.

MISSING INFORMATION:
- Use the selected guideline's missing-information rules to identify gaps internally.
- Do not block documentation because optional information is absent.
- If information is missing for a colon-ended facility prompt, leave that prompt visible in the SOAP output with no fabricated entry.
- Never remove required facility prompts from the output because data is missing.
- Never invent provider notification, LAR notification, staff education, or follow-up schedules.

PLACEHOLDER PROHIBITIONS:
- Do not write "No subjective complaints were reported."
- Do not write "No objective findings were documented."
- Do not use similar generic negative placeholder statements.
- For colon-ended facility prompts with no information, leave the prompt label in place — do not delete it or omit the section.

AUTOMATIC ADDITIONS — DO NOT unless supported by input or relevant to the selected guideline:
- Provider notification
- LAR notification
- PRN effectiveness monitoring
- Respiratory monitoring
- Emesis monitoring

${PROCESSING_WORKFLOW}`;

// ---------------------------------------------------------------------------
// Output-type instructions (keys match frontend output labels)
// ---------------------------------------------------------------------------

const OUTPUT_INSTRUCTIONS: Record<string, string> = {
  [SOAP_NOTE_LABEL]: `OUTPUT FORMAT: SOAP Note — Completed Facility Form

The generated SOAP note MUST preserve the facility template exactly.

DO NOT convert the template into paragraph form.
DO NOT replace facility prompts with bullet lists.
DO NOT remove colon-ended prompts when information is missing — leave the prompt label in place.

The output must look like a nurse completed the facility form, not like a rewritten SOAP note.

Use the facility section labels and prompt order from the selected guideline.
Every prompt ending with ":" must remain visible on its own line.
If no information is available for a prompt, leave the prompt in place with no fabricated entry.

Example form structure (adapt to the selected guideline):

S:
...

O:
See Interactive View Assessment.

Additional findings:
...

A:
...

P:
Nursing interventions completed:
...

Staff verbalized or demonstrated understanding of instructions provided:
...

Fill only with supported user-provided information. Preserve standalone statements ending with "." exactly as written.`,

  [PROVIDER_NOTIFICATION_SBAR_LABEL]: `OUTPUT FORMAT: Provider Notification (SBAR)

This is a single SBAR-formatted provider notification document. Do not produce separate SBAR and Provider Notification sections.

Use these headings exactly:
S — Situation:
B — Background:
A — Assessment:
R — Recommendation:

Write like an experienced RN communicating with a provider — not a one-line summary.

Use ONLY information confirmed in the current user input. Never invent:
- provider orders
- provider recommendations
- medications
- abnormal findings
- notifications that did not occur

S — Situation:
- Expand with supported event details: what happened, when, and key descriptors.
- WRONG: "Resident experienced vomiting."
- CORRECT: "Resident experienced one episode of emesis at approximately 1630 after dinner. Emesis contained undigested food."

B — Background:
- Include relevant history, recent events, guideline context, medication information, or preceding symptoms only when provided.

A — Assessment:
- Expand with supported vital signs, symptoms, objective findings, nursing assessment, interventions, and response.
- Include specific supported details — not generic summaries.

R — Recommendation:
- Use guideline-specific language. Avoid vague "Continue to monitor" without specific detail.
- If provider notification IS clinically indicated based on the documented information, request provider evaluation using safe wording such as:
  "Requesting provider evaluation and further orders."
  or
  "Please advise regarding additional evaluation, treatment, or monitoring orders."
- If provider notification is NOT clinically indicated based on the information provided, state exactly:
  "Provider notification is not indicated based on the information provided."
- Never invent a treatment recommendation, provider order, or clinical scenario requiring notification.
- Do not assume provider notification already occurred unless reported.`,

  [LAR_EMAIL_LABEL]: `OUTPUT FORMAT: LAR Email

Write a concise family update in plain language using ONLY documented facts.

Rules:
- State reported/observed facts only. No speculation or invented causes.
- Include only what the input supports: reason for contact, current status, completed nursing actions, provider contact if reported, and follow-up if provided.
- Do not invent orders, medications, appointments, or notifications.
- Avoid phrases like "it seems", "may have been", or "possibly related to".
- Use a brief greeting and closing.
- End with one short monitoring sentence if appropriate.`,

  // Legacy labels retained for backward compatibility
  "SBAR": `OUTPUT FORMAT: Provider Notification (SBAR)

Use the Provider Notification (SBAR) format with headings:
S — Situation:
B — Background:
A — Assessment:
R — Recommendation:`,

  "Provider Notification": `OUTPUT FORMAT: Provider Notification (SBAR)

Use the Provider Notification (SBAR) format with headings:
S — Situation:
B — Background:
A — Assessment:
R — Recommendation:`,

  "Nursing Progress Note": `OUTPUT FORMAT: Nursing Progress Note

Write a narrative nursing progress note in professional paragraph form.
- Lead with the resident's status relative to the selected guideline.
- Include assessment findings and interventions in chronological order when times are known.
- Use only supported facts. No invented events or responses.
- Do not add provider/LAR notifications or generic monitoring plans unless supported.`,

  "Follow-up Guideline Note": `OUTPUT FORMAT: Follow-up Guideline Note

Document a follow-up assessment per the selected guideline.
- Note whether the condition is improved, unchanged, worsened, or resolved — only if supported by input.
- Include current assessment findings from supported facts.
- Do not assume resolution or stability without evidence.
- Do not add closing language unless supported.`,

  "Closing Guideline Note": `OUTPUT FORMAT: Closing Guideline Note

Document guideline closure per the selected guideline.
- Summarize the course of monitoring based on supported facts only.
- State closure rationale only when supported by the input (e.g., explicitly resolved).
- Do not invent outcomes or resident responses.
- Keep monitoring plans minimal and fact-based.`,
};

const DEFAULT_OUTPUT_INSTRUCTION = `OUTPUT FORMAT: General nursing documentation
Organize under clear professional headings appropriate to the requested format.
Use only supported facts. Do not add generic monitoring or notification language.`;

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function resolveTerminology(terminology?: string): string {
  const term = (terminology ?? "resident").trim().toLowerCase();
  if (term === "patient" || term === "client" || term === "individual" || term === "resident") {
    return term;
  }
  return "resident";
}

function getOutputInstruction(outputType: string): string {
  return OUTPUT_INSTRUCTIONS[outputType] ?? DEFAULT_OUTPUT_INSTRUCTION;
}

function buildGuidelineBlock(guidelineDisplayName: string): string {
  const def = lookupGuidelineByDisplayName(guidelineDisplayName);
  if (!def) {
    return `FACILITY GUIDELINE: ${guidelineDisplayName}

[No facility guideline definition found. Use general nursing documentation standards.]`;
  }

  return buildGuidelineContextBlock(def);
}

function buildGuidelineOutputInstruction(
  guidelineDisplayName: string,
  outputType: string,
  clinicalInfo: string,
  supplementText: string,
): string {
  const def = lookupGuidelineByDisplayName(guidelineDisplayName);
  if (!def) return "";

  const clinicalText = [clinicalInfo, supplementText].filter(Boolean).join("\n");
  return buildGuidelineDocumentationInstructionBlock(
    def,
    outputType,
    clinicalText,
    (id) => GUIDELINE_BY_ID[id],
  );
}

function buildSystemInstructions(
  outputType: string,
  guideline: string,
  terminology: string | undefined,
  clinicalInfo: string,
  supplementText: string,
): string {
  const term = resolveTerminology(terminology);
  const termRule = term === "resident"
    ? `TERMINOLOGY: Use "resident" when referring to the person receiving care.`
    : `TERMINOLOGY: Use "${term}" when referring to the person receiving care (per nurse preference). Do not use other terms.`;

  return [
    CORE_INSTRUCTION,
    termRule,
    buildGuidelineBlock(guideline),
    getOutputInstruction(outputType),
    buildGuidelineOutputInstruction(guideline, outputType, clinicalInfo, supplementText),
    "Return only the finished documentation. No preamble, explanation, or markdown fences.",
  ].filter(Boolean).join("\n\n");
}

function buildUserPrompt(
  guideline: string,
  outputType: string,
  clinicalInfo: string,
  supplementText: string,
): string {
  const formReminder = outputType === SOAP_NOTE_LABEL
    ? ' Preserve the facility template exactly as a completed form. Leave every colon-ended prompt visible even when blank. Do not convert to paragraph form or bullet lists.'
    : '';

  return `Generate a ${outputType} for the ${guideline} guideline.${formReminder}

INPUT (may be English, Korean, or Spanish — extract facts only; write output in professional English):
${clinicalInfo}

Nurse-supplemented details for previously missing areas:
${supplementText}

Write the final ${outputType} now. Extract clinical facts, organize the timeline, remove filler, and produce professional English documentation. Do not repeat or translate the raw input sentence by sentence. Use only confirmed information from the input and supplements.`;
}

function normalizeAdditionalOutputs(additionalOutputs?: string[]): string[] {
  if (!additionalOutputs?.length) return [];

  const allowedLabels = new Set([PROVIDER_NOTIFICATION_SBAR_LABEL, LAR_EMAIL_LABEL]);
  const idToLabel: Record<string, string> = {
    provider_notification_sbar: PROVIDER_NOTIFICATION_SBAR_LABEL,
    sbar: PROVIDER_NOTIFICATION_SBAR_LABEL,
    provider_notification: PROVIDER_NOTIFICATION_SBAR_LABEL,
    lar_email: LAR_EMAIL_LABEL,
    lar_guardian_email: LAR_EMAIL_LABEL,
  };
  const normalized: string[] = [];

  for (const output of additionalOutputs) {
    const trimmed = output.trim();
    if (!trimmed) continue;

    const mapped = idToLabel[trimmed] ?? trimmed;
    if (mapped === "SBAR" || mapped === "Provider Notification") {
      if (!normalized.includes(PROVIDER_NOTIFICATION_SBAR_LABEL)) {
        normalized.push(PROVIDER_NOTIFICATION_SBAR_LABEL);
      }
      continue;
    }
    if (allowedLabels.has(mapped) && !normalized.includes(mapped)) {
      normalized.push(mapped);
    }
  }

  return normalized;
}

async function callOpenAI(
  apiKey: string,
  instructions: string,
  input: string,
  temperature = 0.3,
): Promise<string> {
  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      instructions,
      input,
      temperature,
      max_output_tokens: 4096,
    }),
  });

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text();
    console.error("OpenAI API error:", openaiResponse.status, errorText);
    throw new Error(`OpenAI request failed (${openaiResponse.status}).`);
  }

  const data = await openaiResponse.json();

  let documentation = "";
  if (data.output && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === "message" && item.content && Array.isArray(item.content)) {
        for (const part of item.content) {
          if (part.type === "output_text" && part.text) {
            documentation += part.text;
          }
        }
      }
    }
  }

  if (!documentation && data.output_text) {
    documentation = data.output_text;
  }

  if (!documentation.trim()) {
    throw new Error("No documentation was returned by the AI.");
  }

  return documentation.trim();
}

async function generateDocument(
  apiKey: string,
  outputType: string,
  guideline: string,
  clinicalInfo: string,
  supplementText: string,
  terminology?: string,
): Promise<string> {
  const instructions = buildSystemInstructions(
    outputType,
    guideline,
    terminology,
    clinicalInfo,
    supplementText,
  );
  const input = buildUserPrompt(guideline, outputType, clinicalInfo, supplementText);
  const content = await callOpenAI(apiKey, instructions, input);
  if (outputType !== LAR_EMAIL_LABEL) return content;
  return appendLarGuidelineFollowUp(content, guideline);
}

function appendLarGuidelineFollowUp(content: string, guidelineDisplayName: string): string {
  const followUp =
    `Staff will continue monitoring per the ${guidelineDisplayName} Guideline and report any changes.`;
  const normalized = content.trim();
  if (/continue monitoring according to the facility/i.test(normalized)) {
    return normalized;
  }
  return `${normalized}\n\n${followUp}`;
}

async function generateDocumentationBundle(
  apiKey: string,
  guidelineDisplayName: string,
  clinicalInfo: string,
  supplementText: string,
  terminology?: string,
  includeSbar = false,
  autoCompleteStaffEducation = true,
  autoConfirmStaffInstructionFromNursingInterventions = false,
  nurseStaffEducationConfirmations?: { instructionProvided?: boolean; understandingConfirmed?: boolean },
) {
  return generateAiDocumentationBundle(
    (instructions, input, temperature) => callOpenAI(apiKey, instructions, input, temperature),
    guidelineDisplayName,
    clinicalInfo,
    supplementText,
    terminology,
    includeSbar,
    undefined,
    { autoCompleteStaffEducation, autoConfirmStaffInstructionFromNursingInterventions },
    nurseStaffEducationConfirmations,
  );
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

interface GeneratedDocument {
  label: string;
  content: string;
}

interface DocumentationQualityCheck {
  templateFollowed: boolean;
  unsupportedStatementsRemoved: string[];
  messages: string[];
  completeness?: {
    provided: string[];
    missing: string[];
  };
}

interface DocumentationGenerationMeta {
  templateMode: string;
  edgeFunctionVersion: string;
  guideline: string;
  assessmentType: string;
  facilityInstructionsIncluded: boolean;
  pass2Ran?: boolean;
  fillableTemplateIncluded?: boolean;
}

interface RequestBody {
  guideline: string;
  outputType?: string;
  additionalOutputs?: string[];
  clinicalInfo: string;
  supplements?: { label: string; value: string }[];
  terminology?: string;
  autoCompleteStaffEducation?: boolean;
  autoConfirmStaffInstructionFromNursingInterventions?: boolean;
  nurseStaffEducationConfirmations?: {
    instructionProvided?: boolean;
    understandingConfirmed?: boolean;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const {
      guideline,
      outputType = SOAP_NOTE_LABEL,
      additionalOutputs,
      clinicalInfo,
      supplements,
      terminology,
      autoCompleteStaffEducation = true,
      autoConfirmStaffInstructionFromNursingInterventions = false,
      nurseStaffEducationConfirmations,
    } = body;

    if (!guideline || !clinicalInfo) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: guideline or clinicalInfo." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const supplementText = supplements && supplements.length > 0
      ? supplements
          .filter((s) => s.value.trim())
          .map((s) => `- ${s.label}: ${s.value.trim()}`)
          .join("\n")
      : "None provided.";

    const primaryOutputType = outputType === SOAP_NOTE_LABEL ? SOAP_NOTE_LABEL : outputType;
    const extraOutputs = normalizeAdditionalOutputs(additionalOutputs);
    const includeSbar = extraOutputs.includes(PROVIDER_NOTIFICATION_SBAR_LABEL);
    const includeLarEmail = extraOutputs.includes(LAR_EMAIL_LABEL);

    // Backward compatibility: if a legacy single output was requested, generate only that document.
    const legacySingleOutput = primaryOutputType !== SOAP_NOTE_LABEL && extraOutputs.length === 0;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured on the server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (legacySingleOutput) {
      const documentation = await generateDocument(
        apiKey,
        primaryOutputType,
        guideline,
        clinicalInfo,
        supplementText,
        terminology,
      );

      return new Response(
        JSON.stringify({ documentation }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const documents: GeneratedDocument[] = [];

    const { validated, qualityCheck, generationMeta, templateLockClientBundle } = await generateDocumentationBundle(
      apiKey,
      guideline,
      clinicalInfo,
      supplementText,
      terminology,
      includeSbar,
      autoCompleteStaffEducation,
      autoConfirmStaffInstructionFromNursingInterventions,
      nurseStaffEducationConfirmations,
    );

    documents.push({ label: SOAP_NOTE_LABEL, content: validated.soapText });

    if (includeSbar && validated.sbarText) {
      documents.push({ label: PROVIDER_NOTIFICATION_SBAR_LABEL, content: validated.sbarText });
    }

    if (includeLarEmail) {
      documents.push({
        label: LAR_EMAIL_LABEL,
        content: await generateDocument(
          apiKey,
          LAR_EMAIL_LABEL,
          guideline,
          clinicalInfo,
          supplementText,
          terminology,
        ),
      });
    }

    return new Response(
      JSON.stringify({
        documentation: validated.soapText,
        documents,
        qualityCheck,
        generationMeta,
        templateLockContext: templateLockClientBundle?.templateLockContext,
        staffEducation: templateLockClientBundle?.staffEducation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred while generating documentation.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
