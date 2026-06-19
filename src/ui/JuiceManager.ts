import Phaser from "phaser";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../game/state";
import { FantasyTheme } from "./theme";

const PARTICLE_KEY = "juice-dot";
const DEPTH_FX = 50;
const DEPTH_FLASH = 90;
const C = FantasyTheme.colors;

export function registerJuiceTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(PARTICLE_KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture(PARTICLE_KEY, 8, 8);
  g.destroy();
}

export class JuiceManager {
  private pickupEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private burstEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private readonly scene: Phaser.Scene) {
    registerJuiceTextures(scene);
    this.createEmitters();
  }

  attachPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.trailEmitter.startFollow(player);
  }

  setTrailActive(active: boolean): void {
    this.trailEmitter[active ? "start" : "stop"]();
  }

  pickupBurst(x: number, y: number, _kind: "soul"): void {
    const { copy } = FantasyTheme;
    this.pickupEmitter.explode(14, x, y);
    this.ringPulse(x, y, C.soulHex);
    this.floatText(x, y - 8, copy.pickupSoul, FantasyTheme.colors.soulShard);
  }

  vitalityPickup(x: number, y: number): void {
    const { copy } = FantasyTheme;
    this.pickupEmitter.setParticleTint(C.soulHex);
    this.pickupEmitter.explode(16, x, y);
    this.ringPulse(x, y, C.soulHex);
    this.floatText(x, y - 8, copy.pickupVitality, FantasyTheme.colors.vitality);
  }

  platingPickup(x: number, y: number): void {
    const { copy } = FantasyTheme;
    this.pickupEmitter.setParticleTint(C.wardHex);
    this.pickupEmitter.explode(18, x, y);
    this.ringPulse(x, y, C.wardHex);
    this.floatText(x, y - 8, copy.pickupPlating, FantasyTheme.colors.plating);
  }

  armorBreak(x: number, y: number): void {
    this.shake(140, 0.004);
    this.burstEmitter.setParticleTint(C.wardHex);
    this.burstEmitter.explode(18, x, y);
    this.ringPulse(x, y, C.wardHex);
    this.flash(C.wardHex, 0.12, 120);
  }

  healthHit(x: number, y: number): void {
    this.shake(180, 0.008);
    this.burstEmitter.setParticleTint(C.balefireHex);
    this.burstEmitter.explode(14, x, y);
    this.flash(C.flashLoseHex, 0.15, 100);
  }

  hazardHit(x: number, y: number): void {
    this.shake(320, 0.018);
    this.burstEmitter.setParticleTint(C.balefireHex);
    this.burstEmitter.explode(28, x, y);
    this.flash(C.flashLoseHex, 0.4, 220);
    this.hitStop(80);
  }

  playerShoot(x: number, y: number): void {
    this.ringPulse(x, y, C.arcaneHex, 16, 0.2);
  }

  enemyHit(x: number, y: number): void {
    this.burstEmitter.setParticleTint(C.arcaneHex);
    this.burstEmitter.explode(10, x, y);
    this.ringPulse(x, y, C.goldHex, 22, 0.28);
  }

  hazardSpawn(x: number, y: number): void {
    this.ringPulse(x, y, C.balefireHex, 28, 0.35);
  }

  bossSpawn(x: number, y: number): void {
    this.shake(400, 0.012);
    this.flash(C.balefireHex, 0.25, 350);
    this.ringPulse(x, y, C.balefireHex, 80, 0.55);
    this.burstEmitter.setParticleTint(C.balefireHex);
    this.burstEmitter.explode(24, x, y);
  }

  celebrate(): void {
    this.shake(200, 0.006);
    this.flash(C.flashWinHex, 0.22, 280);
    const cx = WORLD_WIDTH / 2;
    const cy = WORLD_HEIGHT / 2;
    this.pickupEmitter.setParticleTint([C.soulHex, C.goldHex, C.arcaneHex]);
    this.pickupEmitter.explode(40, cx, cy);
  }

  destroy(): void {
    this.pickupEmitter?.destroy();
    this.burstEmitter?.destroy();
    this.trailEmitter?.destroy();
  }

  private createEmitters(): void {
    this.pickupEmitter = this.scene.add.particles(0, 0, PARTICLE_KEY, {
      lifespan: { min: 300, max: 550 },
      speed: { min: 60, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [C.soulHex, C.goldHex],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.pickupEmitter.setDepth(DEPTH_FX);

    this.burstEmitter = this.scene.add.particles(0, 0, PARTICLE_KEY, {
      lifespan: { min: 250, max: 500 },
      speed: { min: 100, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: C.balefireHex,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.burstEmitter.setDepth(DEPTH_FX);

    this.trailEmitter = this.scene.add.particles(0, 0, PARTICLE_KEY, {
      lifespan: 280,
      frequency: 35,
      quantity: 1,
      speed: { min: 8, max: 24 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.45, end: 0 },
      tint: C.arcaneHex,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.trailEmitter.setDepth(DEPTH_FX - 1);
  }

  private shake(durationMs: number, intensity: number): void {
    this.scene.cameras.main.shake(durationMs, intensity);
  }

  private flash(color: number, alpha: number, durationMs: number): void {
    const flash = this.scene.add
      .rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, color, alpha)
      .setDepth(DEPTH_FLASH)
      .setScrollFactor(0);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: durationMs,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  private hitStop(ms: number): void {
    if (!this.scene.physics.world) return;
    this.scene.physics.world.pause();
    this.scene.time.delayedCall(ms, () => {
      if (this.scene.scene.isActive(this.scene.scene.key)) {
        this.scene.physics.world.resume();
      }
    });
  }

  private ringPulse(
    x: number,
    y: number,
    color: number,
    maxRadius = 36,
    duration = 0.25
  ): void {
    const ring = this.scene.add.circle(x, y, 8, color, 0).setStrokeStyle(2, color, 0.9);
    ring.setDepth(DEPTH_FX);
    this.scene.tweens.add({
      targets: ring,
      scale: maxRadius / 8,
      alpha: 0,
      duration: duration * 1000,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  private floatText(x: number, y: number, message: string, color: string): void {
    const text = this.scene.add
      .text(x, y, message, {
        fontFamily: FantasyTheme.fonts.hud,
        fontSize: "15px",
        color,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH_FX + 1)
      .setShadow(1, 1, "#1a1008", 2, true, true);
    this.scene.tweens.add({
      targets: text,
      y: y - 36,
      alpha: 0,
      scale: 1.15,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }
}
