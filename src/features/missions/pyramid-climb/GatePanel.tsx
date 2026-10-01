import { useEffect, useId, useRef, useState } from 'react';
import type { Gate } from '@/core/missions/pyramid-climb/schema';
import {
  cornerGap,
  GAUGE_MAX,
  GAUGE_MIN,
  GAUGE_STEP,
  gaugeOf,
  gaugeValue,
  isRightSeked,
  sekedOf,
  sekedSteps,
} from '@/core/missions/pyramid-climb/seked';
import { format, useT } from '@/i18n';
import { buttonClass } from '@/shared/ui/button';
import { MinusIcon, PlusIcon, SparkleIcon } from '@/shared/ui/icons';
import { SekedDiagram } from './SekedDiagram';

interface GatePanelProps {
  /** 0, 1 or 2 */
  index: number;
  gate: Gate;
  /** Santai: the trial face is drawn live and hints are available */
  relaxed: boolean;
  solutionAfter: number;
  /** "Nanti dulu" is offered while the player is on the slope (not on the calculation-only route) */
  canPostpone: boolean;
  /** a wrong "Periksa" */
  onWrong: () => void;
  /** "Lihat solusi" was pressed */
  onSolution: () => void;
  /** the "Lanjutkan" button after the gate is open */
  onSolved: () => void;
  onLater: () => void;
}

type Phase = 'asking' | 'right' | 'revealed';

/** 5.04 -> "5,04", 0.72 -> "0,72", 7 -> "7" */
const fmt = (n: number) => String(Number(n.toFixed(2))).replace('.', ',');

/**
 * A measuring gate: the pyramid, a gauge in palms and fingers, and the question "what is its seked?".
 * Built on the native <dialog>, so the focus stays inside it and Esc steps back.
 */
export function GatePanel({
  index,
  gate,
  relaxed,
  solutionAfter,
  canPostpone,
  onWrong,
  onSolution,
  onSolved,
  onLater,
}: GatePanelProps) {
  const t = useT();
  const text = t.pyramidClimb.gate;
  const dialog = useRef<HTMLDialogElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const gaugeId = useId();

  const [value, setValue] = useState(6);
  const [phase, setPhase] = useState<Phase>('asking');
  const [tries, setTries] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [missed, setMissed] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  useEffect(() => {
    if (phase !== 'asking') continueButton.current?.focus();
  }, [phase]);

  const answer = sekedOf(gate);
  const asking = phase === 'asking';
  const matches = isRightSeked(value, gate);
  const gap = cornerGap(gate, value);

  const gauge = gaugeOf(value);
  const reading =
    gauge.fingers === 0
      ? format(text.readingPalms, { palms: gauge.palms })
      : format(text.reading, { palms: gauge.palms, fingers: gauge.fingers });

  const setSafely = (next: number) => {
    setValue(Math.min(GAUGE_MAX, Math.max(GAUGE_MIN, next)));
    setMissed(false);
  };

  const check = () => {
    if (matches) {
      setPhase('right');
      setMissed(false);
    } else {
      setMissed(true);
      setTries((n) => n + 1);
      onWrong();
    }
  };

  const showSolution = () => {
    setValue(gaugeValue(gaugeOf(answer)));
    setPhase('revealed');
    setMissed(false);
    onSolution();
  };

  const steps = sekedSteps(gate);
  const solutionAvailable = asking && tries >= solutionAfter;
  const hints = gate.hints.slice(0, hintLevel);

  const previewText = matches
    ? text.preview.exact
    : gap < 0
      ? format(text.preview.steep, { n: fmt(Math.abs(gap)) })
      : format(text.preview.flat, { n: fmt(gap) });

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!asking) onSolved();
        else if (canPostpone) onLater();
      }}
      className="m-auto max-h-[96dvh] w-[min(96vw,46rem)] flex-col overflow-hidden rounded-2xl border border-line bg-panel p-0 text-fg shadow-xl backdrop:bg-fg/50 open:flex"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5 [@media(max-height:480px)]:gap-2 [@media(max-height:480px)]:p-3">
        <header className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 id={titleId} className="font-display text-xl">
            {format(text.title, { n: index + 1 })}
          </h2>
          <span className="rounded-full bg-accent-soft px-3 py-0.5 text-xs font-semibold text-fg">
            {text.sources[gate.source]}
          </span>
        </header>

        <div className="grid gap-4 landscape:grid-cols-2 sm:grid-cols-2">
          <SekedDiagram
            base={gate.base}
            height={gate.height}
            trial={relaxed || !asking ? value : null}
            matches={matches}
            description={format(text.figureLabel, { base: gate.base, height: gate.height })}
            labels={{
              base: format(text.figureBase, { base: gate.base }),
              height: format(text.figureHeight, { height: gate.height }),
              corner: text.figureCorner,
            }}
          />

          <div className="flex flex-col gap-3">
            <p className="font-semibold">
              {format(text.problem, { base: gate.base, height: gate.height })}
            </p>
            <p className="text-sm text-muted">{text.question}</p>

            <fieldset className="flex flex-col gap-1" disabled={!asking}>
              <legend className="text-sm font-semibold">{text.gaugeLabel}</legend>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={text.gaugeLess}
                  className={buttonClass('ghost')}
                  onClick={() => setSafely(value - GAUGE_STEP)}
                  disabled={value <= GAUGE_MIN}
                >
                  <MinusIcon className="size-4" />
                </button>
                <input
                  id={gaugeId}
                  type="range"
                  className="gauge-range"
                  min={GAUGE_MIN}
                  max={GAUGE_MAX}
                  step={GAUGE_STEP}
                  value={value}
                  aria-label={text.gaugeLabel}
                  aria-valuetext={reading}
                  onChange={(event) => setSafely(Number(event.target.value))}
                />
                <button
                  type="button"
                  aria-label={text.gaugeMore}
                  className={buttonClass('ghost')}
                  onClick={() => setSafely(value + GAUGE_STEP)}
                  disabled={value >= GAUGE_MAX}
                >
                  <PlusIcon className="size-4" />
                </button>
              </div>
              <output
                htmlFor={gaugeId}
                data-testid="gauge-reading"
                className="font-display text-2xl"
              >
                {reading}
              </output>
            </fieldset>

            <div role="status" className="flex flex-col gap-1 text-sm">
              {asking && relaxed && <p className="text-muted">{previewText}</p>}
              {asking && missed && <p className="font-semibold text-bad">{text.wrong}</p>}
              {phase === 'right' && <p className="font-semibold text-good">{text.right}</p>}
              {phase === 'revealed' && (
                <p className="font-semibold text-accent">{text.solutionShown}</p>
              )}
            </div>

            {relaxed && hints.length > 0 && asking && (
              <ul
                aria-label={text.hintTitle}
                className="flex flex-col gap-1 rounded-xl bg-panel-2 px-3 py-2 text-sm"
              >
                {hints.map((hint) => (
                  <li key={hint} className="flex items-start gap-2">
                    <SparkleIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            )}

            {!asking && (
              <div className="flex flex-col gap-2 rounded-xl bg-good-soft px-3 py-2 text-sm text-good">
                <p>
                  {format(text.work, {
                    base: gate.base,
                    half: fmt(steps.halfBase),
                    height: gate.height,
                    ratio: fmt(steps.ratio),
                    value: fmt(steps.palms),
                  })}
                </p>
                <p>{format(text.workRounded, { reading })}</p>
                <p>{gate.explain}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-panel px-4 py-3 sm:px-5">
        {asking && canPostpone && (
          <button type="button" className={buttonClass('ghost')} onClick={onLater}>
            {text.later}
          </button>
        )}
        {asking && relaxed && hintLevel < gate.hints.length && (
          <button
            type="button"
            className={buttonClass('ghost')}
            onClick={() => setHintLevel((n) => n + 1)}
          >
            <SparkleIcon className="size-4" />
            {text.hint}
          </button>
        )}
        {solutionAvailable && (
          <button type="button" className={buttonClass('ghost')} onClick={showSolution}>
            {text.showSolution}
          </button>
        )}
        {asking ? (
          <button type="button" className={buttonClass()} onClick={check}>
            {text.check}
          </button>
        ) : (
          <button ref={continueButton} type="button" className={buttonClass()} onClick={onSolved}>
            {text.continue}
          </button>
        )}
      </footer>
    </dialog>
  );
}
