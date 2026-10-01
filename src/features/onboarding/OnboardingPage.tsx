import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  MAX_NAME_LENGTH,
  type Profile,
  ProfileSchema,
  TRAVELERS,
  type TravelerId,
} from '@/core/progress/profile';
import { useProgressStore } from '@/features/progress';
import { format, useT } from '@/i18n';
import { assetUrl } from '@/shared/assets';
import { buttonClass } from '@/shared/ui/button';

/** First screen of the game: choose a name and a traveler. Also reachable later to change them. */
export function OnboardingPage() {
  const t = useT();
  const navigate = useNavigate();
  const saved = useProgressStore((s) => s.profile);
  const setProfile = useProgressStore((s) => s.setProfile);

  const [name, setName] = useState(saved?.name ?? '');
  const [traveler, setTraveler] = useState<TravelerId>(saved?.traveler ?? 'a');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = ProfileSchema.safeParse({ name, traveler });
    if (!parsed.success) {
      setError(
        name.trim().length > MAX_NAME_LENGTH
          ? format(t.onboarding.nameTooLong, { max: MAX_NAME_LENGTH })
          : t.onboarding.nameRequired,
      );
      return;
    }
    const profile: Profile = parsed.data;
    setProfile(profile);
    navigate('/', { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-5 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <div className="shrink-0 rounded-2xl bg-panel p-1 shadow-sm">
          <img
            src={assetUrl('shared/kala-happy')}
            alt=""
            aria-hidden="true"
            className="h-28 w-[5.25rem] object-contain"
          />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl leading-tight">{t.onboarding.title}</h1>
          <p className="text-muted">{t.onboarding.intro}</p>
        </div>
      </header>

      <form
        onSubmit={submit}
        className="flex flex-col gap-5 rounded-2xl border border-line bg-panel p-4 shadow"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="player-name" className="text-sm font-semibold">
            {t.onboarding.nameLabel}
          </label>
          <input
            id="player-name"
            name="name"
            value={name}
            maxLength={MAX_NAME_LENGTH + 10}
            placeholder={t.onboarding.namePlaceholder}
            autoComplete="nickname"
            aria-invalid={error !== null}
            aria-describedby={error ? 'player-name-error' : undefined}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            className="min-h-11 rounded-xl border border-line bg-canvas px-3 text-base"
          />
          {error && (
            <p id="player-name-error" role="alert" className="text-sm font-semibold text-bad">
              {error}
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{t.onboarding.travelerLabel}</legend>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {TRAVELERS.map((id, index) => {
              const selected = id === traveler;
              return (
                <label
                  key={id}
                  className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-1.5 transition focus-within:outline focus-within:outline-2 focus-within:outline-accent ${
                    selected ? 'border-accent bg-panel-2' : 'border-line hover:border-accent/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="traveler"
                    value={id}
                    checked={selected}
                    onChange={() => setTraveler(id)}
                    className="sr-only"
                  />
                  <img
                    src={assetUrl(`shared/traveler-${id}`)}
                    alt=""
                    className="aspect-[3/4] w-full rounded-lg object-cover object-top"
                  />
                  <span className="text-xs font-semibold">
                    {format(t.onboarding.traveler, { n: index + 1 })}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">{t.onboarding.privacy}</p>
          <span className="flex gap-2">
            {saved && (
              <button type="button" className={buttonClass('ghost')} onClick={() => navigate(-1)}>
                {t.onboarding.cancel}
              </button>
            )}
            <button type="submit" className={buttonClass()}>
              {saved ? t.onboarding.save : t.onboarding.start}
            </button>
          </span>
        </div>
      </form>
    </main>
  );
}
