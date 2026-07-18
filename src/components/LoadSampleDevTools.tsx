import { useEffect, useMemo, useState } from 'react';
import {
  clinicalSamples,
  formatSampleClinicalInformation,
  getSamplesForGuideline,
  type ClinicalSample,
} from '../testData/sampleClinicalInputs';
import type { GuidelineId } from '../types';

interface LoadSampleDevToolsProps {
  guidelineId: GuidelineId | '';
  clinicalInfo: string;
  onLoadSample: (sample: ClinicalSample, clinicalInformation: string) => void;
}

export function LoadSampleDevTools({
  guidelineId,
  clinicalInfo,
  onLoadSample,
}: LoadSampleDevToolsProps) {
  const availableSamples = useMemo(
    () => getSamplesForGuideline(guidelineId),
    [guidelineId],
  );

  const [selectedSampleId, setSelectedSampleId] = useState(availableSamples[0]?.id ?? '');

  useEffect(() => {
    if (!availableSamples.some((sample) => sample.id === selectedSampleId)) {
      setSelectedSampleId(availableSamples[0]?.id ?? '');
    }
  }, [availableSamples, selectedSampleId]);

  const selectedSample = availableSamples.find((sample) => sample.id === selectedSampleId)
    ?? availableSamples[0];

  const handleLoadSample = () => {
    if (!selectedSample) return;

    if (clinicalInfo.trim()) {
      const confirmed = window.confirm(
        'Replace the current clinical information with the selected sample?',
      );
      if (!confirmed) return;
    }

    onLoadSample(selectedSample, formatSampleClinicalInformation(selectedSample));
  };

  if (clinicalSamples.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-3 dark:border-gray-600 dark:bg-gray-900/40">
      <label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400">
        🧪 Load Sample
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={selectedSample?.id ?? ''}
          onChange={(e) => setSelectedSampleId(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {availableSamples.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={!selectedSample}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Load Sample
        </button>
      </div>
      {guidelineId && availableSamples.length < clinicalSamples.length && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Showing samples for the selected guideline.
        </p>
      )}
    </div>
  );
}
