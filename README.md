# Nurse Buddy

Nurse Buddy is an AI-assisted clinical documentation workspace for nurses in State Supported Living Center and long-term-care settings. It turns nurse-provided clinical facts into professional English documentation while preserving facility-specific SOAP templates and keeping missing information visible for human review.

## What makes it different

- Guideline-aware documentation for 25+ clinical scenarios
- Deterministic template locking that preserves facility labels and standing instructions
- Missing-information review before generation
- Structured quality checks after generation
- Optional provider SBAR and LAR email outputs
- English, Korean, and Spanish voice/text input with professional English output
- Explicit nurse confirmation for staff/DSP instruction and understanding
- A review-and-edit step before anything is copied to the medical record

Nurse Buddy is a documentation aid, not a diagnostic system. Generated content must be reviewed by a qualified clinician before use. Do not enter direct patient identifiers or protected health information unless the deployment has completed the required privacy, security, and compliance review.

## Architecture

The React and TypeScript client collects clinical facts, identifies missing guideline information, and renders structured documentation for review. A Supabase Edge Function keeps the OpenAI API key server-side, applies facility guideline instructions, invokes the model, validates the generated content, and returns template-locked documents plus quality metadata.

The same guideline rules are mirrored under `src/guidelines` and `supabase/functions/_shared/guidelines`. Changes to shared clinical behavior should be applied and tested in both locations until those packages are consolidated.

## Local development

Requirements:

- Node.js 20 or newer
- npm
- A Supabase project with the `generate-documentation` Edge Function deployed
- `OPENAI_API_KEY` configured as an Edge Function secret

Copy `.env.example` to `.env.local` and provide:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase-publishable-key
```

Then run:

```bash
npm ci
npm run dev
```

The client intentionally has no built-in deployment credentials. Missing configuration produces a clear runtime error instead of silently connecting to another environment.

## Quality checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Focused tests cover guideline rules, deterministic documentation, template locking, validation, sample clinical inputs, voice error handling, and subjective trigger safety.

## Clinical safety principles

- Use only facts supplied by the nurse or confirmed supplements.
- Never fabricate diagnoses, findings, interventions, notifications, orders, or outcomes.
- Keep unsupported facility fields visible and blank.
- Separate deterministic template rendering from model-generated field extraction.
- Surface missing and removed information for nurse review.
- Never write directly to an electronic health record.



## Production checklist

Before handling real clinical data:

- Add authenticated access and server-side authorization.
- Restrict CORS to approved deployment origins.
- Add rate limiting, abuse monitoring, and request-size limits.
- Complete privacy, security, HIPAA, and organizational compliance reviews.
- Establish retention and logging rules that prevent clinical text from entering general-purpose logs.
- Pin and evaluate the selected model against a versioned clinical test set.
- Resolve the repository-wide TypeScript and lint baseline and enforce checks in CI.
- Consolidate duplicated client/Edge guideline modules to prevent rule drift.



## Hackathon contribution

Codex reviewed Nurse Buddy as a production-oriented clinical AI application and strengthened its reliability, accessibility, deployment hygiene, voice-input failure handling, template-lock integrity, automated tests, and project documentation while preserving the existing clinical workflow and visual design.

## How I Collaborated with Codex and GPT-5.6

Codex reviewed Nurse Buddy as a production-oriented clinical AI application and strengthened its reliability, accessibility, deployment hygiene, voice-input failure handling, template-lock integrity, automated tests, and project documentation while preserving the existing clinical workflow and visual design.

I made the core clinical and product decisions based on my experience as a registered nurse. I defined the documentation workflow, guideline requirements, note structure, missing-information logic, family/LAR communication needs, and the overall user experience.

Codex accelerated code review, debugging, reliability improvements, test creation, and production-readiness checks. It improved voice-input error handling, listening-state recovery, accessibility, deployment configuration, and automated test coverage without changing the intended clinical behavior.

GPT-5.6 powers the guideline-aware documentation generation in Nurse Buddy, including SOAP notes, SBAR communication, LAR or family emails, missing-information prompts, and documentation quality review.

Together, Codex and GPT-5.6 helped turn my clinical workflow and product decisions into a more reliable, testable, and submission-ready application.