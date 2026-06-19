export interface WorldSize {
  width: number;
  height: number;
}

const LANDSCAPE_WORLD: WorldSize = { width: 800, height: 600 };
const PORTRAIT_WORLD: WorldSize = { width: 480, height: 960 };

export function selectWorldSize(): WorldSize {
  if (typeof window === "undefined") return LANDSCAPE_WORLD;

  const portrait = window.innerHeight > window.innerWidth;
  return portrait ? PORTRAIT_WORLD : LANDSCAPE_WORLD;
}
