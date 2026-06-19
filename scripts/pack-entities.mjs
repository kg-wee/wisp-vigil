/**
 * Packs source PNGs into public/assets/sprites/entities.png (4×6 grid, 64px frames).
 * Run: npm run pack:sprites
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITE_DIR = join(__dirname, "../public/assets/sprites");
const SIZE = 64;
const COLS = 4;
const ROWS = 6;
const EXTRA_FILES = ["boss.png", "projectile.png", "obstacle.png"];

const ROW_SOURCES = [
  { file: "player.png", kind: "pulse" },
  { file: "hazard.png", kind: "spin" },
  { file: "pickup.png", kind: "pickup" },
  { file: "pickup_health.png", kind: "pickup" },
  { file: "pickup_armor.png", kind: "pickup" },
  { file: "archer.png", kind: "spin" },
];

const BG_TOLERANCE = 55;

async function stripBackground(inputPath, tolerance = BG_TOLERANCE) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const channels = 4;
  const out = Buffer.from(data);

  const pixel = (x, y) => {
    const i = (y * width + x) * channels;
    return [out[i], out[i + 1], out[i + 2]];
  };

  const edgeSamples = [];
  for (let x = 0; x < width; x++) {
    edgeSamples.push(pixel(x, 0), pixel(x, height - 1));
  }
  for (let y = 1; y < height - 1; y++) {
    edgeSamples.push(pixel(0, y), pixel(width - 1, y));
  }

  const bg = [0, 1, 2].map((c) =>
    Math.round(edgeSamples.reduce((sum, s) => sum + s[c], 0) / edgeSamples.length)
  );

  const colorDist = (r, g, b) =>
    Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      if (colorDist(r, g, b) <= tolerance) {
        out[i + 3] = 0;
      } else {
        out[i + 3] = 255;
      }
    }
  }

  return sharp(out, { raw: { width, height, channels: 4 } });
}

async function prepareSource(filename) {
  const path = join(SPRITE_DIR, filename);
  const transparent = await stripBackground(path);
  await transparent.png().toFile(path);
  return path;
}

async function pulseFrames(input) {
  const scales = [0.88, 0.94, 1.0, 0.97];
  const frames = [];
  for (const scale of scales) {
    const px = Math.min(SIZE, Math.round(SIZE * scale));
    const padTop = Math.max(0, Math.floor((SIZE - px) / 2));
    const padLeft = padTop;
    const padBottom = Math.max(0, SIZE - px - padTop);
    const padRight = Math.max(0, SIZE - px - padLeft);
    frames.push(
      await sharp(input)
        .resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({
          top: padTop,
          bottom: padBottom,
          left: padLeft,
          right: padRight,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .ensureAlpha()
        .png()
        .toBuffer()
    );
  }
  return frames;
}

async function spinFrames(input) {
  const frames = [];
  for (const deg of [0, 90, 180, 270]) {
    frames.push(
      await sharp(input)
        .rotate(deg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .ensureAlpha()
        .png()
        .toBuffer()
    );
  }
  return frames;
}

async function buildPickupFrames(input) {
  const base = await sharp(input)
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();
  const glow = await sharp(input)
    .modulate({ brightness: 1.25, saturation: 1.15 })
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();
  return [base, glow, base, base];
}

function placeRow(composites, row, frames) {
  for (let col = 0; col < COLS; col++) {
    composites.push({
      input: frames[col],
      left: col * SIZE,
      top: row * SIZE,
    });
  }
}

async function framesForKind(input, kind) {
  if (kind === "pulse") return pulseFrames(input);
  if (kind === "spin") return spinFrames(input);
  return buildPickupFrames(input);
}

async function main() {
  await Promise.all(EXTRA_FILES.map((f) => prepareSource(f)));

  const composites = [];

  for (let row = 0; row < ROW_SOURCES.length; row++) {
    const { file, kind } = ROW_SOURCES[row];
    const src = await prepareSource(file);
    const frames = await framesForKind(src, kind);
    placeRow(composites, row, frames);
  }

  const outPath = join(SPRITE_DIR, "entities.png");
  await sharp({
    create: {
      width: COLS * SIZE,
      height: ROWS * SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  console.log(
    `Wrote transparent ${outPath} (${COLS * SIZE}×${ROWS * SIZE}, ${COLS * ROWS} frames)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
