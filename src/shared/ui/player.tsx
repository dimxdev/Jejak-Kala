import { createContext, useContext } from 'react';

/** Who the player is, as the screens need to show them. Set by the app (features/progress knows the details). */
export interface PlayerView {
  name: string;
  /** picture of the chosen traveler, e.g. "shared/traveler-a" */
  portrait: string;
}

const PlayerContext = createContext<PlayerView>({
  name: 'Penjelajah',
  portrait: 'shared/traveler-a',
});

export const PlayerProvider = PlayerContext.Provider;

export const usePlayer = (): PlayerView => useContext(PlayerContext);
