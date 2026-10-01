import { type ReactNode, useState } from 'react';
import {
  circleError,
  circleSteps,
  egyptianCircleArea,
  isCornerC,
  isCornerD,
  modernCircleArea,
  plotArea,
  plotStakes,
  readRope,
  starsFor,
  triangleArea,
} from '@/core/missions/rope-survey/model';
import type { Point } from '@/core/missions/rope-survey/schema';
import { format, useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { buttonClass } from '@/shared/ui/button';
import { SparkleIcon } from '@/shared/ui/icons';
import { ScenePlayer } from '@/shared/ui/ScenePlayer';
import { Stars } from '@/shared/ui/Stars';
import type { EngineProps } from '../types';
import { AnswerPad } from './AnswerPad';
import { CircleFigure, TriangleFigure } from './Figures';
import { RopeMeter } from './RopeMeter';
import { SurveyField } from './SurveyField';

type Step =
  | 'scene-rope'
  | 'rope'
  | 'corner'
  | 'scene-area'
  | 'area'
  | 'scene-triangle'
  | 'triangle'
  | 'scene-circle'
  | 'circle'
  | 'summary';

type Chip = 'rope' | 'corner' | 'triangle' | 'circle';
const CHIP_OF: Record<Step, Chip> = {
  'scene-rope': 'rope',
  rope: 'rope',
  corner: 'corner',
  'scene-area': 'corner',
  area: 'corner',
  'scene-triangle': 'triangle',
  triangle: 'triangle',
  'scene-circle': 'circle',
  circle: 'circle',
  summary: 'circle',
};

interface Feedback {
  tone: 'good' | 'bad';
  text: string;
}

const decimal = (n: number, places = 1) => n.toFixed(places).replace('.', ',');

/** Mission 2 of Mesir: restore a flooded plot with a knotted rope and work out areas, as the Rhind papyrus does. */
export default function RopeSurveyMission({ mission, mode, onFinish }: EngineProps<'rope-survey'>) {
  const t = useT();
  const text = t.ropeSurvey;
  const { params, scenes } = mission;
  const relaxed = mode === 'relaxed';
  const stakes = plotStakes(params);

  const [step, setStep] = useState<Step>('scene-rope');
  const [c, setC] = useState<Point | null>(null);
  const [d, setD] = useState<Point | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [taskMistakes, setTaskMistakes] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [assisted, setAssisted] = useState(false);
  const [solved, setSolved] = useState(false); // the current task is done
  const [revealed, setRevealed] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [circleSolved, setCircleSolved] = useState(false);
  const [circleStep, setCircleStep] = useState<0 | 1 | 2>(0);

  const background = scenes.rope?.background;
  const chip = CHIP_OF[step];
  const reading = c ? readRope(params, c) : null;
  const circle = circleSteps(params.circle.diameter);
  const stars = starsFor(params, { mistakes, assisted, circleSolved });

  const begin = (next: Step) => {
    setStep(next);
    setTaskMistakes(0);
    setHintLevel(0);
    setSolved(false);
    setRevealed(null);
    setFeedback(null);
    setCircleStep(0);
  };

  /** A wrong try in the main tasks: it costs stars and brings "Lihat solusi" closer. */
  const miss = (message: string, counted = true) => {
    if (counted) setMistakes((n) => n + 1);
    setTaskMistakes((n) => n + 1);
    setFeedback({ tone: 'bad', text: message });
  };

  const showSolution = () => {
    setAssisted(true);
    setSolved(true);
    setFeedback({ tone: 'good', text: text.solutionShown });
  };

  // ---- the stakes ----
  const checkC = () => {
    if (!c) {
      setFeedback({ tone: 'bad', text: text.rope.noStake });
      return;
    }
    if (isCornerC(params, c)) {
      setSolved(true);
      setFeedback({
        tone: 'good',
        text: format(text.rope.right, {
          ab: params.plot.width,
          ac: params.plot.height,
          bc: params.rope.sides[2],
        }),
      });
      return;
    }
    const now = readRope(params, c);
    if (now.used !== params.rope.knots)
      miss(format(text.rope.wrongKnots, { knots: params.rope.knots }));
    else if (!now.rightAtA) miss(text.rope.wrongAngle);
    else miss(text.rope.wrong);
  };

  const checkD = () => {
    if (!d) {
      setFeedback({ tone: 'bad', text: text.corner.noStake });
      return;
    }
    if (isCornerD(params, d)) {
      setSolved(true);
      setFeedback({
        tone: 'good',
        text: format(text.corner.right, { w: params.plot.width, h: params.plot.height }),
      });
    } else {
      miss(text.corner.wrong);
    }
  };

  // ---- the numbers ----
  const answered = (outcome: 'right' | 'wrong', rightText: string, countMistake = true) => {
    if (outcome === 'right') {
      setSolved(true);
      setFeedback({ tone: 'good', text: rightText });
    } else {
      miss(text.area.wrong, countMistake);
    }
  };

  const hintsFor = (key: keyof typeof params.hints) => params.hints[key];
  const solutionAvailable = !solved && taskMistakes >= params.solutionAfter;

  const hintBox = (key: keyof typeof params.hints): ReactNode =>
    relaxed ? (
      <div className="flex flex-col gap-2">
        {hintLevel > 0 && (
          <ul className="flex flex-col gap-1 rounded-xl bg-panel-2 px-3 py-2 text-sm">
            {hintsFor(key)
              .slice(0, hintLevel)
              .map((hint) => (
                <li key={hint} className="flex items-start gap-2">
                  <SparkleIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>{hint}</span>
                </li>
              ))}
          </ul>
        )}
        {!solved && hintLevel < hintsFor(key).length && (
          <button
            type="button"
            className={buttonClass('ghost')}
            onClick={() => setHintLevel((n) => n + 1)}
          >
            <SparkleIcon className="size-4" />
            {text.hint}
          </button>
        )}
      </div>
    ) : null;

  const feedbackLine = feedback && (
    <p
      role="status"
      className={`text-sm font-semibold ${feedback.tone === 'good' ? 'text-good' : 'text-bad'}`}
    >
      {feedback.text}
    </p>
  );

  const solutionButton = solutionAvailable && (
    <button type="button" className={buttonClass('ghost')} onClick={showSolutionFor}>
      {text.showSolution}
    </button>
  );

  /** "Lihat solusi": fills in what the current task asks for. */
  function showSolutionFor() {
    if (step === 'rope') setC(stakes.c);
    else if (step === 'corner') setD(stakes.d);
    else if (step === 'area') setRevealed(plotArea(params));
    else if (step === 'triangle') setRevealed(triangleArea(params));
    else if (step === 'circle') {
      // the circle is a bonus: seeing the answer is fine, it just does not earn the star
      setRevealed(circle.area);
      setSolved(true);
      setFeedback({ tone: 'good', text: format(text.solutionAnswer, { n: circle.area }) });
      return;
    }
    showSolution();
  }

  const card = (children: ReactNode) => (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-3 sm:p-6">
      <section className="animate-rise flex flex-col gap-3 rounded-2xl border border-line bg-panel/95 p-4 shadow-lg backdrop-blur-sm">
        {children}
      </section>
    </div>
  );

  const nextButton = (label: string, onClick: () => void) =>
    solved && (
      <button type="button" className={buttonClass()} onClick={onClick}>
        {label}
      </button>
    );

  const sceneOf = (name: 'rope' | 'area' | 'triangle' | 'circle', next: Step) => (
    <ScenePlayer
      scene={scenes[name] ?? mission.intro}
      withBackground={false}
      onDone={() => begin(next)}
    />
  );

  return (
    <div className="relative flex flex-1 flex-col">
      {background && (
        <img
          src={assetUrl(background)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
      )}

      <nav
        aria-label={text.stepsLabel}
        className="relative z-10 flex flex-wrap justify-center gap-2 p-2"
      >
        {(['rope', 'corner', 'triangle', 'circle'] as const).map((id) => (
          <span
            key={id}
            aria-current={id === chip ? 'step' : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${
              id === chip
                ? 'border-accent bg-accent text-on-accent'
                : 'border-line bg-panel/90 text-muted'
            }`}
          >
            {text.steps[id]}
            {id === 'circle' ? ' ★' : ''}
          </span>
        ))}
      </nav>

      <div className="relative flex flex-1 flex-col">
        {step === 'scene-rope' && sceneOf('rope', 'rope')}
        {step === 'scene-area' && sceneOf('area', 'area')}
        {step === 'scene-triangle' && sceneOf('triangle', 'triangle')}
        {step === 'scene-circle' && sceneOf('circle', 'circle')}

        {step === 'rope' &&
          card(
            <>
              <h2 className="font-display text-xl">{text.rope.title}</h2>
              <p className="text-sm text-muted">{text.rope.instruction}</p>
              <SurveyField
                grid={params.grid}
                a={stakes.a}
                b={stakes.b}
                c={c}
                d={null}
                showRope
                rightAngle={solved}
                restored={false}
                settable={solved ? null : 'c'}
                onSet={(point) => {
                  setC(point);
                  setFeedback(null);
                }}
              />
              <RopeMeter knots={params.rope.knots} reading={reading} />
              {feedbackLine}
              {hintBox('rope')}
              <div className="flex flex-wrap justify-end gap-2">
                {solutionButton}
                {!solved && (
                  <button type="button" className={buttonClass()} onClick={checkC}>
                    {text.rope.check}
                  </button>
                )}
                {nextButton(text.rope.next, () => begin('corner'))}
              </div>
            </>,
          )}

        {step === 'corner' &&
          card(
            <>
              <h2 className="font-display text-xl">{text.corner.title}</h2>
              <p className="text-sm text-muted">{text.corner.instruction}</p>
              <SurveyField
                grid={params.grid}
                a={stakes.a}
                b={stakes.b}
                c={c}
                d={d}
                showRope={!solved}
                rightAngle
                restored={solved}
                settable={solved ? null : 'd'}
                onSet={(point) => {
                  setD(point);
                  setFeedback(null);
                }}
              />
              {feedbackLine}
              {hintBox('corner')}
              <div className="flex flex-wrap justify-end gap-2">
                {solutionButton}
                {!solved && (
                  <button type="button" className={buttonClass()} onClick={checkD}>
                    {text.corner.check}
                  </button>
                )}
                {nextButton(text.corner.next, () => begin('scene-area'))}
              </div>
            </>,
          )}

        {step === 'area' &&
          card(
            <>
              <h2 className="font-display text-xl">{text.area.title}</h2>
              <SurveyField
                grid={params.grid}
                a={stakes.a}
                b={stakes.b}
                c={stakes.c}
                d={stakes.d}
                showRope={false}
                rightAngle
                restored
                settable={null}
                onSet={() => {}}
              />
              <p className="text-center text-sm font-semibold">
                {format(text.area.figure, { w: params.plot.width, h: params.plot.height })}
              </p>
              <AnswerPad
                label={text.area.prompt}
                unit={text.area.unit}
                expected={plotArea(params)}
                revealed={revealed}
                onAnswer={(outcome) =>
                  answered(
                    outcome,
                    format(text.area.right, {
                      w: params.plot.width,
                      h: params.plot.height,
                      n: plotArea(params),
                    }),
                  )
                }
              />
              {feedbackLine}
              {hintBox('area')}
              <div className="flex flex-wrap justify-end gap-2">
                {solutionButton}
                {nextButton(text.area.next, () => begin('scene-triangle'))}
              </div>
            </>,
          )}

        {step === 'triangle' &&
          card(
            <>
              <h2 className="font-display text-xl">{text.triangle.title}</h2>
              <TriangleFigure
                base={params.triangle.base}
                height={params.triangle.height}
                framed={relaxed && hintLevel >= 1}
              />
              <AnswerPad
                label={text.triangle.prompt}
                unit={text.area.unit}
                expected={triangleArea(params)}
                revealed={revealed}
                onAnswer={(outcome) =>
                  answered(
                    outcome,
                    format(text.triangle.right, {
                      base: params.triangle.base,
                      height: params.triangle.height,
                      n: triangleArea(params),
                    }),
                  )
                }
              />
              {feedbackLine}
              {hintBox('triangle')}
              <div className="flex flex-wrap justify-end gap-2">
                {solutionButton}
                {nextButton(text.area.next, () => begin('scene-circle'))}
              </div>
            </>,
          )}

        {step === 'circle' &&
          card(
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                {text.circle.bonus}
              </p>
              <h2 className="font-display text-xl">{text.circle.title}</h2>
              <CircleFigure diameter={params.circle.diameter} showSquare={circleSolved} />

              {relaxed ? (
                <GuidedCircle
                  key={circleStep}
                  stage={circleStep}
                  diameter={params.circle.diameter}
                  steps={circle}
                  revealed={revealed}
                  onAnswer={(outcome) => {
                    if (outcome === 'wrong') {
                      miss(text.area.wrong, false);
                    } else if (circleStep < 2) {
                      setFeedback(null);
                      setCircleStep((n) => (n + 1) as 0 | 1 | 2);
                    } else {
                      setCircleSolved(true);
                      setSolved(true);
                      setFeedback({
                        tone: 'good',
                        text: format(text.circle.right, { rest: circle.rest, n: circle.area }),
                      });
                    }
                  }}
                />
              ) : (
                <>
                  <p className="text-sm text-muted">{text.circle.single}</p>
                  <AnswerPad
                    label={text.area.prompt}
                    unit={text.area.unit}
                    expected={egyptianCircleArea(params.circle.diameter)}
                    revealed={revealed}
                    onAnswer={(outcome) => {
                      if (outcome === 'right') {
                        setCircleSolved(true);
                        setSolved(true);
                        setFeedback({
                          tone: 'good',
                          text: format(text.circle.right, { rest: circle.rest, n: circle.area }),
                        });
                      } else {
                        miss(text.area.wrong, false);
                      }
                    }}
                  />
                </>
              )}

              {feedbackLine}
              {circleSolved && (
                <div className="flex flex-col gap-1 rounded-xl bg-good-soft px-3 py-2 text-sm text-good">
                  <p className="font-semibold">{text.circle.compareTitle}</p>
                  <p>
                    {format(text.circle.modern, {
                      r: decimal(params.circle.diameter / 2),
                      n: decimal(modernCircleArea(params.circle.diameter)),
                    })}
                  </p>
                  <p>
                    {format(text.circle.difference, {
                      p: decimal(circleError(params.circle.diameter) * 100),
                    })}
                  </p>
                  <p>{text.circle.pi}</p>
                </div>
              )}
              {hintBox('circle')}
              <div className="flex flex-wrap justify-end gap-2">
                {solutionButton}
                {!solved && (
                  <button
                    type="button"
                    className={buttonClass('ghost')}
                    onClick={() => begin('summary')}
                  >
                    {text.circle.skip}
                  </button>
                )}
                {nextButton(text.area.next, () => begin('summary'))}
              </div>
            </>,
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
                  {circleSolved && <li>{text.summary.circle}</li>}
                </ul>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className={buttonClass()}
                  onClick={() => onFinish({ stars, bonus: circleSolved })}
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

interface GuidedCircleProps {
  stage: 0 | 1 | 2;
  diameter: number;
  steps: { ninth: number; rest: number; area: number };
  revealed: number | null;
  onAnswer: (outcome: 'right' | 'wrong') => void;
}

/** Santai: the Egyptian method one step at a time (a ninth, the rest, the area). */
function GuidedCircle({ stage, diameter, steps, revealed, onAnswer }: GuidedCircleProps) {
  const t = useT();
  const text = t.ropeSurvey.circle;
  const prompts = [
    { label: format(text.stepNinth, { d: diameter }), unit: text.unitKhet, expected: steps.ninth },
    { label: text.stepRest, unit: text.unitKhet, expected: steps.rest },
    { label: text.stepArea, unit: t.ropeSurvey.area.unit, expected: steps.area },
  ] as const;
  const current = prompts[stage];
  return (
    <AnswerPad
      label={current.label}
      unit={current.unit}
      expected={current.expected}
      revealed={stage === 2 ? revealed : null}
      onAnswer={onAnswer}
    />
  );
}
