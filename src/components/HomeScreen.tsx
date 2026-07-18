import { useState, useCallback } from 'react';
import { ClipboardList, FileText, Mic, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Dropdown } from './Dropdown';
import { VoiceInputButton } from './VoiceInputButton';
import { MissingInfoCard } from './MissingInfoCard';
import { DocumentationOutput } from './DocumentationOutput';
import { PrivacyWarning } from './PrivacyWarning';
import { LoadSampleDevTools } from './LoadSampleDevTools';
import { useSettings } from '../context/SettingsContext';
import { GUIDELINES, OPTIONAL_OUTPUTS } from '../constants';
import { analyzeMissingInfo, resolveDisplayMissingInfo } from '../lib/aiEngine';
import { generateDocumentationViaAPI } from '../lib/api';
import { isDevToolsEnabled } from '../lib/devTools';
import type { ClinicalSample } from '../testData/sampleClinicalInputs';
import type { GuidelineId, GeneratedDocument, MissingInfoItem, DocumentationQualityCheck, DocumentationGenerationMeta } from '../types';

type Phase = 'input' | 'review' | 'result';

export function HomeScreen() {
  const { settings } = useSettings();
  const [guidelineId, setGuidelineId] = useState<GuidelineId | ''>('');
  const [includeProviderNotification, setIncludeProviderNotification] = useState(false);
  const [includeLarEmail, setIncludeLarEmail] = useState(false);
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [missingInfo, setMissingInfo] = useState<MissingInfoItem[]>([]);
  const [resultMissingInfo, setResultMissingInfo] = useState<MissingInfoItem[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [qualityCheck, setQualityCheck] = useState<DocumentationQualityCheck | null>(null);
  const [generationMeta, setGenerationMeta] = useState<DocumentationGenerationMeta | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const devToolsEnabled = isDevToolsEnabled();

  const canGenerate = guidelineId && clinicalInfo.trim().length > 0;

  const handleVoiceResult = useCallback((text: string) => {
    setClinicalInfo((prev) => prev + text);
  }, []);

  const callAPI = useCallback(async (
    gid: GuidelineId,
    info: string,
    supplements: MissingInfoItem[],
  ) => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateDocumentationViaAPI(
        gid,
        info,
        supplements,
        settings.terminology,
        { includeProviderNotification, includeLarEmail, autoCompleteStaffEducation: settings.autoCompleteStaffEducation },
      );
      setDocuments(result.documents);
      setQualityCheck(result.qualityCheck);
      setGenerationMeta(result.generationMeta ?? null);
      setResultMissingInfo(
        resolveDisplayMissingInfo(gid, info, supplements, result.documentation),
      );
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate documentation. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [includeProviderNotification, includeLarEmail, settings.terminology, settings.autoCompleteStaffEducation]);

  const startGeneration = useCallback(() => {
    if (!guidelineId) return;
    setGenerating(true);
    setError(null);
    setTimeout(() => {
      const missing = analyzeMissingInfo(guidelineId, clinicalInfo);
      if (missing.length > 0) {
        setMissingInfo(missing);
        setPhase('review');
        setGenerating(false);
      } else {
        callAPI(guidelineId, clinicalInfo, []);
      }
    }, 400);
  }, [guidelineId, clinicalInfo, callAPI]);

  const updateMissingItem = useCallback((id: string, value: string) => {
    setMissingInfo((prev) => prev.map((m) => (m.id === id ? { ...m, value } : m)));
  }, []);

  const generateWithDetails = useCallback(() => {
    if (!guidelineId) return;
    callAPI(guidelineId, clinicalInfo, missingInfo);
  }, [guidelineId, clinicalInfo, missingInfo, callAPI]);

  const skipMissing = useCallback(() => {
    if (!guidelineId) return;
    callAPI(guidelineId, clinicalInfo, []);
  }, [guidelineId, clinicalInfo, callAPI]);

  const regenerate = useCallback(() => {
    setPhase('input');
    setDocuments([]);
    setQualityCheck(null);
    setGenerationMeta(null);
    setMissingInfo([]);
    setResultMissingInfo([]);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startOver = useCallback(() => {
    setPhase('input');
    setDocuments([]);
    setQualityCheck(null);
    setGenerationMeta(null);
    setMissingInfo([]);
    setResultMissingInfo([]);
    setClinicalInfo('');
    setGuidelineId('');
    setIncludeProviderNotification(false);
    setIncludeLarEmail(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLoadSample = useCallback((sample: ClinicalSample, formattedClinicalInformation: string) => {
    setGuidelineId(sample.guidelineId);
    setClinicalInfo(formattedClinicalInformation);
    setIncludeProviderNotification(sample.generateProviderNotification ?? false);
    setIncludeLarEmail(sample.generateLAREmail ?? false);
    setPhase('input');
    setDocuments([]);
    setQualityCheck(null);
    setGenerationMeta(null);
    setMissingInfo([]);
    setResultMissingInfo([]);
    setError(null);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-4xl bg-gradient-to-br from-pink-100 to-pink-200 text-3xl shadow-soft dark:from-pink-900/30 dark:to-pink-800/30">
          🩺
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-800 dark:text-gray-100 sm:text-3xl">
          Nurse Buddy
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          Your AI Nursing Documentation Assistant
        </p>
      </div>

      <div className="space-y-5">
        <div className="rounded-4xl border-2 border-pink-100 bg-white p-5 shadow-soft dark:border-pink-900/40 dark:bg-gray-800 sm:p-6">
          <Dropdown
            label="Select Guideline"
            icon={<ClipboardList className="h-4 w-4" />}
            value={guidelineId}
            options={GUIDELINES.map((g) => ({ id: g.id, label: g.label, emoji: g.emoji }))}
            onChange={(id) => setGuidelineId(id as GuidelineId)}
            placeholder="Choose a clinical guideline..."
          />
        </div>

        <div className="rounded-4xl border-2 border-pink-100 bg-white p-5 shadow-soft dark:border-pink-900/40 dark:bg-gray-800 sm:p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-pink-700 dark:text-pink-200">
            <FileText className="h-4 w-4" />
            Additional Documents
          </div>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            A SOAP note is always generated. Select any optional documents to include.
          </p>
          <div className="space-y-3">
            {OPTIONAL_OUTPUTS.map((output) => {
              const checked = output.id === 'provider_notification_sbar'
                ? includeProviderNotification
                : includeLarEmail;
              const onChange = output.id === 'provider_notification_sbar'
                ? setIncludeProviderNotification
                : setIncludeLarEmail;

              return (
                <label
                  key={output.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-pink-100 bg-cream-50 p-4 transition-colors hover:border-pink-200 dark:border-pink-900/30 dark:bg-gray-900/50 dark:hover:border-pink-800/50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-400"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {output.emoji} Generate {output.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                      {output.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-4xl border-2 border-pink-100 bg-white p-5 shadow-soft dark:border-pink-900/40 dark:bg-gray-800 sm:p-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-pink-700 dark:text-pink-200">
            <FileText className="h-4 w-4" />
            Clinical Information
          </label>
          {devToolsEnabled && (
            <LoadSampleDevTools
              guidelineId={guidelineId}
              clinicalInfo={clinicalInfo}
              onLoadSample={handleLoadSample}
            />
          )}
          <textarea
            value={clinicalInfo}
            onChange={(e) => setClinicalInfo(e.target.value)}
            placeholder="Describe the resident's condition in English, Korean, or Spanish. Example: The resident was sleeping comfortably. Oxygen saturation was 95% on room air..."
            className="min-h-[160px] w-full resize-y rounded-2xl border-2 border-pink-100 bg-cream-50 p-4 text-sm leading-relaxed text-gray-800 transition-all placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-4 focus:ring-pink-400/10 dark:border-pink-900/30 dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder:text-gray-500"
          />

          <div className="mt-5 flex flex-col items-center border-t border-pink-50 pt-5 dark:border-pink-900/20">
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-pink-700 dark:text-pink-200">
              <Mic className="h-4 w-4" />
              Voice Input
            </label>
            <VoiceInputButton onResult={handleVoiceResult} />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-900/10">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="mt-1 text-xs font-semibold text-red-600 underline dark:text-red-400"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={startGeneration}
          disabled={!canGenerate || generating}
          className={`flex w-full items-center justify-center gap-2.5 rounded-4xl px-6 py-4 text-base font-bold transition-all ${
            canGenerate && !generating
              ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-soft-lg hover:scale-[1.01] active:scale-[0.99]'
              : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
          }`}
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Documentation
            </>
          )}
        </button>

        {!canGenerate && !generating && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Select a guideline and enter clinical information to begin.
          </p>
        )}

        {phase === 'review' && missingInfo.length > 0 && (
          <MissingInfoCard
            items={missingInfo}
            onUpdate={updateMissingItem}
            onSkip={skipMissing}
            onGenerate={generateWithDetails}
          />
        )}

        {phase === 'result' && documents.length > 0 && (
          <>
            <DocumentationOutput
              documents={documents}
              missingInfo={resultMissingInfo}
              qualityCheck={qualityCheck}
              generationMeta={generationMeta}
              showRuntimeDebug={devToolsEnabled}
              onRegenerate={regenerate}
            />
            <button
              type="button"
              onClick={startOver}
              className="mx-auto block rounded-2xl px-5 py-2.5 text-sm font-semibold text-pink-600 transition-all hover:bg-pink-50 active:scale-95 dark:text-pink-300 dark:hover:bg-pink-900/20"
            >
              Start New Documentation
            </button>
          </>
        )}

        <PrivacyWarning />
      </div>
    </main>
  );
}
