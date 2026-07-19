import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Pencil, Save, FileText, AlertCircle } from 'lucide-react';
import type { GeneratedDocument, MissingInfoItem, DocumentationQualityCheck, DocumentationGenerationMeta } from '../types';

interface DocumentationOutputProps {
  documents: GeneratedDocument[];
  missingInfo: MissingInfoItem[];
  qualityCheck: DocumentationQualityCheck | null;
  generationMeta?: DocumentationGenerationMeta | null;
  showRuntimeDebug?: boolean;
  onRegenerate: () => void;
}

export function DocumentationOutput({
  documents,
  missingInfo,
  qualityCheck,
  generationMeta,
  showRuntimeDebug = false,
  onRegenerate,
}: DocumentationOutputProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState(() => documents.map((doc) => doc.content));

  useEffect(() => {
    setDrafts(documents.map((doc) => doc.content));
    setActiveIndex(0);
    setEditing(false);
  }, [documents]);

  const activeDocument = documents[activeIndex] ?? documents[0];
  const activeContent = drafts[activeIndex] ?? activeDocument?.content ?? '';
  const hasMissing = missingInfo.length > 0;
  const hasMultipleDocuments = documents.length > 1;

  const handleCopy = async () => {
    const textToCopy = hasMultipleDocuments
      ? documents
          .map((doc, index) => {
            const separator = '-'.repeat(Math.max(doc.label.length, 20));
            return `${doc.label.toUpperCase()}\n\n${separator}\n\n${drafts[index] ?? doc.content}`;
          })
          .join('\n\n')
      : activeContent;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEdit = () => {
    setDrafts(documents.map((doc) => doc.content));
    setEditing(true);
  };

  const handleSave = () => {
    setEditing(false);
  };

  const handleDraftChange = (value: string) => {
    setDrafts((prev) => prev.map((draft, index) => (index === activeIndex ? value : draft)));
  };

  return (
    <div className="animate-fade-in rounded-4xl border-2 border-pink-100 bg-white p-6 shadow-soft dark:border-pink-900/40 dark:bg-gray-800 sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 dark:bg-pink-900/30">
          <FileText className="h-5 w-5 text-pink-600 dark:text-pink-400" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-gray-800 dark:text-gray-100">
            Generated Documentation
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Review and edit before use in the medical record
          </p>
        </div>
      </div>

      {hasMultipleDocuments && (
        <div className="mb-4 flex flex-wrap gap-2">
          {documents.map((doc, index) => (
            <button
              key={doc.label}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition-all ${
                index === activeIndex
                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {doc.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        {editing ? (
          <textarea
            value={activeContent}
            onChange={(e) => handleDraftChange(e.target.value)}
            className="min-h-[300px] w-full resize-y rounded-2xl border-2 border-pink-200 bg-cream-50 p-4 font-mono text-sm leading-relaxed text-gray-800 focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-400/15 dark:border-pink-900/40 dark:bg-gray-900/50 dark:text-gray-100"
          />
        ) : (
          <pre className="min-h-[300px] w-full overflow-x-auto whitespace-pre-wrap rounded-2xl bg-cream-50 p-4 font-mono text-sm leading-relaxed text-gray-800 dark:bg-gray-900/50 dark:text-gray-100">
            {activeContent}
          </pre>
        )}
      </div>

      {qualityCheck && (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800/40 dark:bg-blue-900/10">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">
              Documentation Quality Check
            </h4>
          </div>

          {qualityCheck.completeness ? (
            <div className="space-y-4">
              {qualityCheck.completeness.provided.length > 0 && (
                <div>
                  <h5 className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">
                    Information documented
                  </h5>
                  <ul className="space-y-1">
                    {qualityCheck.completeness.provided.map((message) => (
                      <li key={message} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400/80">
                        <span className="mt-0.5">✓</span>
                        <span>{message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(qualityCheck.completeness.categorizedMissing?.length ?? qualityCheck.completeness.missing.length) > 0 && (
                <div>
                  <h5 className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">
                    Required information still missing
                  </h5>
                  <ul className="space-y-1">
              {(qualityCheck.completeness.categorizedMissing ?? qualityCheck.completeness.missing.map((label) => ({
                      label,
                      category: 'facility_required' as const,
                    })))
                      .filter((item) => item.category === 'facility_required')
                      .map((item) => (
                      <li key={`required-${item.label}`} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400/80">
                        <span className="mt-0.5">⚠</span>
                        <span>
                          {item.label}
                          {item.reason ? `, ${item.reason}` : ''}
                        </span>
                      </li>
                    ))}

                  {(qualityCheck.completeness.categorizedMissing ?? [])
                    .filter((item) => item.category === 'conditional')
                    .map((item) => (
                      <li key={`conditional-${item.label}`} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400/80">
                        <span className="mt-0.5">⚠</span>
                        <span>
                          {item.label}
                          {item.reason ? `, ${item.reason}` : ''}
                        </span>
                      </li>
                    ))}

                  {(qualityCheck.completeness.categorizedMissing ?? [])
                    .filter((item) => item.category === 'clinically_useful')
                    .map((item) => (
                      <li key={`helpful-${item.label}`} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400/80">
                        <span className="mt-0.5">○</span>
                        <span>{item.label}</span>
                      </li>
                    ))}

                  {!qualityCheck.completeness.categorizedMissing && qualityCheck.completeness.missing.map((message) => (
                      <li key={message} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400/80">
                        <span className="mt-0.5">⚠</span>
                        <span>{message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {typeof qualityCheck.completeness.scorePercent === 'number' && (
                <div>
                  <h5 className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">
                    Documentation completeness
                  </h5>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400/80">
                    {qualityCheck.completeness.scorePercent}% complete
                  </p>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-1">
              {qualityCheck.messages.map((message) => (
                <li key={message} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400/80">
                  <span className="mt-0.5">•</span>
                  <span>{message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showRuntimeDebug && generationMeta && (
        <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
          <div>Template engine: {generationMeta.templateMode}</div>
          <div>Edge function: {generationMeta.edgeFunctionVersion}</div>
        </div>
      )}

      {hasMissing && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Missing or Not Reported Information
            </h4>
          </div>
          <ul className="space-y-1">
            {missingInfo.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400/80">
                <span className="mt-0.5">•</span>
                <span>{item.label} — not reported</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
            copied
              ? 'bg-mint-100 text-mint-700 dark:bg-mint-900/30 dark:text-mint-300'
              : 'bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50'
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : hasMultipleDocuments ? 'Copy All' : 'Copy to Clipboard'}
        </button>

        {editing ? (
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-2xl bg-mint-100 px-4 py-2.5 text-sm font-semibold text-mint-700 transition-all hover:bg-mint-200 active:scale-95 dark:bg-mint-900/30 dark:text-mint-300 dark:hover:bg-mint-900/50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200 active:scale-95 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}

        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200 active:scale-95 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </button>
      </div>
    </div>
  );
}
