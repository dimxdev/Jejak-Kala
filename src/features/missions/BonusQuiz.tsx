import { useState } from 'react';
import type { Quiz } from '@/core/story/schema';
import { format, useT } from '@/i18n';
import { buttonClass } from '@/shared/ui/button';
import { CheckIcon, CloseIcon } from '@/shared/ui/icons';

interface BonusQuizProps {
  quiz: Quiz;
  /** called when the player leaves the bonus, with whether enough answers were right */
  onFinish: (result: { passed: boolean; correct: number }) => void;
}

type Step = { kind: 'intro' } | { kind: 'question'; index: number } | { kind: 'summary' };

/** The optional knowledge quiz at the end of a mission. Reaching `passAt` right answers earns the bonus. */
export function BonusQuiz({ quiz, onFinish }: BonusQuizProps) {
  const t = useT();
  const [step, setStep] = useState<Step>({ kind: 'intro' });
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  const restart = () => {
    setCorrect(0);
    setPicked(null);
    setStep({ kind: 'question', index: 0 });
  };

  const frame = 'relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 p-4';

  if (step.kind === 'intro') {
    return (
      <div className={frame}>
        <section className="animate-rise flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5 shadow">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            {t.mission.bonusTitle}
          </p>
          <h2 className="font-display text-2xl">{quiz.title}</h2>
          <p className="text-muted">{quiz.intro}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={buttonClass('ghost')}
              onClick={() => onFinish({ passed: false, correct: 0 })}
            >
              {t.mission.bonusSkip}
            </button>
            <button type="button" className={buttonClass()} onClick={restart}>
              {t.mission.bonusStart}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (step.kind === 'summary') {
    const passed = correct >= quiz.passAt;
    return (
      <div className={frame}>
        <section
          className="animate-rise flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5 shadow"
          aria-live="polite"
        >
          <h2 className="font-display text-2xl">{quiz.title}</h2>
          <p className={passed ? 'font-semibold text-good' : 'text-muted'}>
            {format(passed ? t.mission.bonusPassed : t.mission.bonusFailed, {
              correct,
              total: quiz.questions.length,
              need: quiz.passAt,
            })}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {!passed && (
              <button type="button" className={buttonClass('ghost')} onClick={restart}>
                {t.mission.bonusRetry}
              </button>
            )}
            <button
              type="button"
              className={buttonClass()}
              onClick={() => onFinish({ passed, correct })}
            >
              {t.scene.next}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const question = quiz.questions[step.index];
  if (!question) return null;
  const answered = picked !== null;
  const lastQuestion = step.index === quiz.questions.length - 1;

  const choose = (option: number) => {
    if (answered) return;
    setPicked(option);
    if (option === question.answer) setCorrect((n) => n + 1);
  };

  const next = () => {
    setPicked(null);
    setStep(lastQuestion ? { kind: 'summary' } : { kind: 'question', index: step.index + 1 });
  };

  return (
    <div className={frame}>
      <section
        key={step.index}
        className="animate-rise flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5 shadow"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          {format(t.mission.bonusQuestion, { n: step.index + 1, total: quiz.questions.length })}
        </p>
        <h2 className="font-display text-xl leading-snug">{question.question}</h2>

        <ul className="flex flex-col gap-2">
          {question.options.map((option, i) => {
            const isRight = i === question.answer;
            const isPicked = i === picked;
            const state = !answered
              ? 'border-line bg-panel hover:border-accent'
              : isRight
                ? 'border-good bg-good-soft text-good'
                : isPicked
                  ? 'border-bad bg-bad-soft text-bad'
                  : 'border-line bg-panel opacity-60';
            return (
              <li key={option}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => choose(i)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-4 py-2 text-left font-medium transition disabled:cursor-default ${state}`}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-current text-xs font-bold"
                  >
                    {answered && isRight ? (
                      <CheckIcon className="size-4" />
                    ) : answered && isPicked ? (
                      <CloseIcon className="size-4" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span>{option}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {answered && (
          <div className="animate-rise flex flex-col gap-3" role="status">
            <p className={`font-semibold ${picked === question.answer ? 'text-good' : 'text-bad'}`}>
              {picked === question.answer ? t.mission.bonusCorrect : t.mission.bonusWrong}
            </p>
            <p className="text-sm text-muted">{question.explanation}</p>
            <div className="flex justify-end">
              <button type="button" className={buttonClass()} onClick={next}>
                {lastQuestion ? t.mission.bonusFinish : t.mission.bonusNext}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
