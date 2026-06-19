import { join } from "node:path";
import sharp from "sharp";

const OUT = join(process.cwd(), "public/assets/sprites/flame.png");
const SIZE = 64;
const FRAMES = 4;

function flameSvg(frame) {
  const sway = [-2, 1, 2, -1][frame];
  const pulse = [0, 2, 1, 3][frame];
  return `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect x="23" y="49" width="18" height="5" fill="#3a0a0a" opacity="0.55"/>
  <polygon points="${32 + sway},11 39,22 48,31 45,43 36,53 27,53 18,43 16,31 25,22" fill="#d45838"/>
  <polygon points="${31 - sway},16 37,25 43,33 40,43 34,50 27,49 21,42 20,33 26,25" fill="#8b2020"/>
  <polygon points="32,21 38,32 35,43 29,45 24,36 27,28" fill="#2a100c"/>
  <rect x="${24 - pulse}" y="32" width="5" height="5" fill="#f08028"/>
  <rect x="${38 + pulse}" y="34" width="4" height="4" fill="#f08028"/>
  <rect x="30" y="${46 - pulse}" width="5" height="4" fill="#f0d080"/>
</svg>`;
}

const frameBuffers = await Promise.all(
  Array.from({ length: FRAMES }, (_, i) =>
    sharp(Buffer.from(flameSvg(i))).png().toBuffer()
  )
);

await sharp({
  create: {
    width: SIZE * FRAMES,
    height: SIZE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(frameBuffers.map((input, i) => ({ input, left: i * SIZE, top: 0 })))
  .png()
  .toFile(OUT);

console.log(`Wrote ${OUT}`);
