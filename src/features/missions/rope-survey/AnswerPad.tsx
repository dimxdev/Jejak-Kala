import { type FormEvent, useId, useState } from 'react';
import { isRight, parseAnswer } from '@/core/missions/rope-survey/model';
import { useT } from '@/i18n';
import { buttonClass } from '@/shared/ui/button';

interface AnswerPadProps {
  /** what is asked, e.g. "Luas petak" */
  label: string;
  unit: string;
  expected: number;
  /** called on every real answer (a right one, or a wrong one that counts as a mistake) */
  onAnswer: (outcome: 'right' | 'wrong') => void;
  /** the answer to show after "Lihat solusi" (the field is then filled in and locked) */
  revealed?: number | null;
}

type Status = 'idle' | 'empty' | 'wrong' | 'right';

/** A number box with a "Periksa" button. Text that is not a number is asked again, not counted wrong. */
export function AnswerPad({ label, unit, expected, onAnswer, revealed = null }: AnswerPadProps) {
  const t = useT();
  const id = useId();
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const solved = status === 'right' || revealed !== null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (solved) return;
    const answer = parseAnswer(value);
    if (answer === null) {
      setStatus('empty');
      return;
    }
    if (isRight(answer, expected)) {
      setStatus('right');
      onAnswer('right');
    } else {
      setStatus('wrong');
      onAnswer('wrong');
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          value={revealed !== null ? String(revealed) : value}
          disabled={solved}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={status === 'wrong' || status === 'empty'}
          onChange={(event) => {
            setValue(event.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          className="min-h-11 w-32 rounded-xl border border-line bg-canvas px-3 text-right text-lg font-bold tabular-nums disabled:opacity-70"
        />
        <span className="text-sm text-muted">{unit}</span>
        <button type="submit" disabled={solved} className={buttonClass()}>
          {t.ropeSurvey.area.check}
        </button>
      </div>
      {/* only "write a number first" lives here; right and wrong answers are reported to the mission, which shows them */}
      <p aria-live="polite" className="min-h-5 text-sm font-semibold text-bad">
        {status === 'empty' && t.ropeSurvey.area.empty}
      </p>
    </form>
  );
}
