import { type ReactNode, useState } from 'react';
import { starsFor } from '@/core/missions/pyramid-climb/model';
import { format, useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { buttonClass } from '@/shared/ui/button';
import { ScenePlayer } from '@/shared/ui/ScenePlayer';
import { Stars } from '@/shared/ui/Stars';
import type { EngineProps } from '../types';
import { GatePanel } from './GatePanel';

/** Where the player is: the story before a gate, the gate itself, the story at the summit, the summary. */
type Step = 'gate-scene' | 'gate-panel' | 'summit-scene' | 'summary';

const GATE_SCENES = ['gate1', 'gate2', 'gate3'] as const;

/**
 * Mission 4 of Mesir, "Lereng Sempurna": a climb up the Great Pyramid's building site with three
 * measuring gates. This is the calculation-only route: it goes straight from gate to gate. The platform
 * climb itself (src/game/pyramid-climb) is not wired into the page yet, so no golden cubit rods can be
 * collected and the best result is two stars.
 */
export default function PyramidClimbMission({
  mission,
  mode,
  onFinish,
}: EngineProps<'pyramid-climb'>) {
  const t = useT();
  const text = t.pyramidClimb;
  const { params, scenes } = mission;
  const relaxed = mode === 'relaxed';

  const [gate, setGate] = useState(0);
  const [step, setStep] = useState<Step>('gate-scene');
  const [mistakes, setMistakes] = useState(0);
  const [assisted, setAssisted] = useState(false);

  const stars = starsFor(params, { mistakes, assisted, rods: 0 });
  const current = params.gates[gate];
  const sceneName = GATE_SCENES[gate] ?? 'gate1';

  const solved = () => {
    if (gate < params.gates.length - 1) {
      setGate(gate + 1);
      setStep('gate-scene');
    } else {
      setStep('summit-scene');
    }
  };

  const card = (children: ReactNode) => (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-end gap-3 p-3 sm:p-6">
      <section className="animate-rise flex flex-col gap-3 rounded-2xl border border-line bg-panel/95 p-4 shadow-lg backdrop-blur-sm">
        {children}
      </section>
    </div>
  );

  return (
    <div className="relative flex flex-1 flex-col">
      <img
        src={assetUrl(params.art.background)}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />

      <nav
        aria-label={text.stepsLabel}
        className="relative z-10 flex flex-wrap justify-center gap-2 p-2"
      >
        {params.gates.map((chipGate, index) => {
          const active = step !== 'summit-scene' && step !== 'summary' && index === gate;
          return (
            <span
              key={chipGate.x}
              aria-current={active ? 'step' : undefined}
              className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${
                active
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-line bg-panel/90 text-muted'
              }`}
            >
              {format(text.gateChip, { n: index + 1 })}
            </span>
          );
        })}
        <span
          aria-current={step === 'summit-scene' || step === 'summary' ? 'step' : undefined}
          className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${
            step === 'summit-scene' || step === 'summary'
              ? 'border-accent bg-accent text-on-accent'
              : 'border-line bg-panel/90 text-muted'
          }`}
        >
          {text.summitChip}
        </span>
      </nav>

      <div className="relative flex flex-1 flex-col">
        {step === 'gate-scene' && (
          <ScenePlayer
            key={sceneName}
            scene={scenes[sceneName] ?? mission.intro}
            withBackground={false}
            onDone={() => setStep('gate-panel')}
          />
        )}

        {step === 'gate-panel' && current && (
          <GatePanel
            key={gate}
            index={gate}
            gate={current}
            relaxed={relaxed}
            solutionAfter={params.solutionAfter}
            canPostpone={false}
            onWrong={() => setMistakes((n) => n + 1)}
            onSolution={() => setAssisted(true)}
            onSolved={solved}
            onLater={() => {}}
          />
        )}

        {step === 'summit-scene' && (
          <ScenePlayer
            scene={scenes.summit ?? mission.intro}
            withBackground={false}
            onDone={() => setStep('summary')}
          />
        )}

        {step === 'summary' &&
          card(
            <>
              <h2 className="font-display text-xl">{text.summary.title}</h2>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="animate-pop">
                  <Stars value={stars} className="size-10" />
                </div>
                <ul className="flex flex-col gap-1 text-sm text-muted">
                  <li>{format(text.summary.mistakes, { n: mistakes })}</li>
                  {assisted ? (
                    <li className="font-semibold text-accent">{text.summary.assisted}</li>
                  ) : (
                    mistakes <= params.mistakesForTwoStars && <li>{text.summary.cleanRun}</li>
                  )}
                  <li>{text.summary.noRods}</li>
                </ul>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className={buttonClass()}
                  onClick={() => onFinish({ stars, bonus: false })}
                >
                  {text.summary.finish}
                </button>
              </div>
            </>,
          )}
      </div>
    </div>
  );
}
