import Phaser from "phaser";
import { registerJuiceTextures } from "./JuiceManager";
import { FantasyTheme } from "./theme";

const PARTICLE_KEY = "juice-dot";
const C = FantasyTheme.colors;

export function applyMenuJuice(
  scene: Phaser.Scene,
  title: Phaser.GameObjects.Text,
  startHint: Phaser.GameObjects.Text
): void {
  registerJuiceTextures(scene);

  scene.tweens.add({
    targets: title,
    scale: { from: 1, to: 1.04 },
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  scene.tweens.add({
    targets: startHint,
    alpha: { from: 0.5, to: 1 },
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  const emitter = scene.add.particles(0, 0, PARTICLE_KEY, {
    x: { min: 0, max: scene.scale.width },
    y: { min: 0, max: scene.scale.height },
    lifespan: { min: 2500, max: 4500 },
    speed: { min: 4, max: 14 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.3, end: 0 },
    alpha: { start: 0.4, end: 0 },
    tint: [C.goldHex, C.arcaneHex, C.soulHex],
    blendMode: Phaser.BlendModes.ADD,
    frequency: 200,
    quantity: 1,
  });
  emitter.setDepth(1);
}
