import { useCallback, useEffect, useRef, useState } from 'react';
import type { Scene } from '@/core/story/schema';
import { format, useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { characters } from '@/shared/content/characters';
import { resolveSpeaker } from '@/shared/content/speakers';
import { buttonClass } from './button';
import { usePlayer } from './player';

interface ScenePlayerProps {
  scene: Scene;
  /** called after the last line */
  onDone: () => void;
  /** draw the scene's background picture (default). Pass false when the parent already shows it. */
  withBackground?: boolean;
  className?: string;
}

/**
 * Plays a few lines of dialogue: a paper card with the speaker's portrait, name and words. The focus
 * rests on the "Lanjut" button, so Enter or Space continues; the right arrow key works too.
 */
export function ScenePlayer({
  scene,
  onDone,
  withBackground = true,
  className = '',
}: ScenePlayerProps) {
  const t = useT();
  const player = usePlayer();
  const [index, setIndex] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);

  const line = scene.lines[index] ?? scene.lines[0];
  const last = index >= scene.lines.length - 1;
  const speaker = line ? resolveSpeaker(characters, line.who, line.mood, player) : null;

  const advance = useCallback(() => (last ? onDone() : setIndex((i) => i + 1)), [last, onDone]);

  // the focus follows each new line, so Enter always continues
  // biome-ignore lint/correctness/useExhaustiveDependencies: `index` is the trigger, not a value used inside
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  if (!line || !speaker) return null;

  return (
    <div className={`relative flex flex-1 flex-col justify-end ${className}`}>
      {withBackground && scene.background && (
        <img
          src={assetUrl(scene.background)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
      )}

      <div className="relative mx-auto w-full max-w-2xl p-3 sm:p-6">
        <section
          key={index}
          aria-label={speaker.name ?? undefined}
          className="animate-rise flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 shadow-lg"
        >
          <div className="flex gap-3">
            {speaker.portrait && (
              <img
                src={assetUrl(speaker.portrait)}
                alt=""
                aria-hidden="true"
                className="h-28 w-[5.25rem] shrink-0 rounded-xl object-cover object-top sm:h-32 sm:w-24"
              />
            )}
            <div className="flex min-w-0 flex-col gap-1">
              {speaker.name && (
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-lg font-semibold">{speaker.name}</span>
                  {speaker.role && <span className="text-xs text-muted">{speaker.role}</span>}
                </p>
              )}
              <p className={`leading-relaxed ${speaker.name ? '' : 'italic text-muted'}`}>
                {line.text}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs tabular-nums text-muted">
              {format(t.scene.progress, { current: index + 1, total: scene.lines.length })}
            </span>
            <span className="flex gap-2">
              {!last && (
                <button type="button" className={buttonClass('ghost')} onClick={onDone}>
                  {t.scene.skip}
                </button>
              )}
              <button ref={nextRef} type="button" className={buttonClass()} onClick={advance}>
                {last ? t.scene.done : t.scene.next}
              </button>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
