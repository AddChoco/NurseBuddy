import type {
  NurseStaffEducationConfirmations,
  StaffEducationState,
  TemplateLockClientContext,
} from '../types';

interface StaffEducationPanelProps {
  staffEducation?: StaffEducationState | null;
  nurseConfirmations: NurseStaffEducationConfirmations;
  onNurseConfirmationsChange: (next: NurseStaffEducationConfirmations) => void;
  showPreGenerateHints?: boolean;
  postResult?: boolean;
}

function StaffEducationCheckboxes({
  nurseConfirmations,
  onNurseConfirmationsChange,
}: Pick<StaffEducationPanelProps, 'nurseConfirmations' | 'onNurseConfirmationsChange'>) {
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-3 rounded-xl border border-violet-100 bg-white/80 px-3 py-2.5 dark:border-violet-900/30 dark:bg-gray-900/40">
        <input
          type="checkbox"
          checked={nurseConfirmations.instructionProvided}
          onChange={(event) =>
            onNurseConfirmationsChange({
              ...nurseConfirmations,
              instructionProvided: event.target.checked,
            })
          }
          className="mt-1 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-400"
        />
        <span className="text-sm text-gray-800 dark:text-gray-100">
          Staff/DSP instruction provided
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-violet-100 bg-white/80 px-3 py-2.5 dark:border-violet-900/30 dark:bg-gray-900/40">
        <input
          type="checkbox"
          checked={nurseConfirmations.understandingConfirmed}
          onChange={(event) =>
            onNurseConfirmationsChange({
              ...nurseConfirmations,
              understandingConfirmed: event.target.checked,
            })
          }
          className="mt-1 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-400"
        />
        <span className="text-sm text-gray-800 dark:text-gray-100">
          Staff verbalized or demonstrated understanding
        </span>
      </label>
    </div>
  );
}

export function StaffEducationPanel({
  staffEducation,
  nurseConfirmations,
  onNurseConfirmationsChange,
  showPreGenerateHints = false,
  postResult = false,
}: StaffEducationPanelProps) {
  const helperText =
    staffEducation?.instructionHelperDisplay
    || staffEducation?.staffInstructionContent
    || '';

  const bothConfirmed =
    nurseConfirmations.instructionProvided && nurseConfirmations.understandingConfirmed;

  const showHelper = Boolean(helperText) && !bothConfirmed;

  const handleConfirmUnderstanding = () => {
    onNurseConfirmationsChange({
      instructionProvided: true,
      understandingConfirmed: true,
    });
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-800/40 dark:bg-violet-900/10">
      <h4 className="text-sm font-bold text-violet-900 dark:text-violet-200">
        Staff / DSP Education
      </h4>
      {showPreGenerateHints && (
        <p className="mt-1 text-xs text-violet-700 dark:text-violet-300/80">
          Optional before generating. You can also confirm after the SOAP note is created.
        </p>
      )}
      {postResult && (
        <p className="mt-1 text-xs text-violet-700 dark:text-violet-300/80">
          Confirm instruction and understanding to populate the facility SOAP prompt without regenerating the note.
        </p>
      )}

      <div className="mt-3">
        <StaffEducationCheckboxes
          nurseConfirmations={nurseConfirmations}
          onNurseConfirmationsChange={onNurseConfirmationsChange}
        />
      </div>

      {showHelper && (
        <div className="mt-4 rounded-xl border border-violet-100 bg-white/90 p-3 dark:border-violet-900/30 dark:bg-gray-900/50">
          {nurseConfirmations.instructionProvided && !nurseConfirmations.understandingConfirmed ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                Instruction provided
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                {helperText}
              </p>
              <div className="mt-3 border-t border-violet-100 pt-3 dark:border-violet-900/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                  Confirmation needed
                </p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  Did staff verbalize or demonstrate understanding?
                </p>
                <button
                  type="button"
                  onClick={handleConfirmUnderstanding}
                  className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-700 active:scale-[0.98] dark:bg-violet-500 dark:hover:bg-violet-400"
                >
                  Confirm understanding
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                Suggested staff instruction
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                {helperText}
              </p>
              {!nurseConfirmations.instructionProvided && !nurseConfirmations.understandingConfirmed && (
                <p className="mt-3 text-xs text-violet-700 dark:text-violet-300/80">
                  Check the boxes above when instruction was provided and understanding was confirmed.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function StaffEducationPreGeneratePanel(
  props: Pick<StaffEducationPanelProps, 'nurseConfirmations' | 'onNurseConfirmationsChange'>,
) {
  return (
    <StaffEducationPanel
      {...props}
      showPreGenerateHints
    />
  );
}

export function StaffEducationPostResultPanel(
  props: StaffEducationPanelProps & {
    templateLockContext: TemplateLockClientContext | null;
  },
) {
  if (!props.templateLockContext || !props.staffEducation?.staffInstructionContent) return null;
  return <StaffEducationPanel {...props} postResult />;
}
