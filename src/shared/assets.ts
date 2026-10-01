// Where the pictures of the game are served from. A picture is named "<scope>/<id>" in the content
// (scope = a chapter id or "shared"); `bun run assets:build` writes it to public/assets/<scope>/<id>.webp.

/** The address of a shipped picture: "mesir/banner" -> "/assets/mesir/banner.webp". */
export const assetUrl = (ref: string): string => `${import.meta.env.BASE_URL}assets/${ref}.webp`;

/** Starts loading pictures so they are ready by the time a scene opens. */
export function preloadImages(refs: Iterable<string>): void {
  for (const ref of refs) {
    const image = new Image();
    image.src = assetUrl(ref);
  }
}
