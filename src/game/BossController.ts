import Phaser from "phaser";
import { createBossSprite } from "../assets/sprites";
import { GameEvents } from "./events";
import { createProjectileGroup, cullProjectiles, fireBolt } from "./projectiles";
import { BOSS_MAX_HP, BOSS_RADIUS, type GameState } from "./state";
import type { ArenaBounds } from "./ArenaBounds";

export class BossController {
  private sprite: Phaser.Physics.Arcade.Sprite | null = null;
  private readonly projectiles: Phaser.Physics.Arcade.Group;
  private shootTimer = 0;
  private summonTimer = 0;
  private moveTimer = 0;
  private damageCooldownMs = 0;
  private hp = BOSS_MAX_HP;
  private active = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly arena: ArenaBounds,
    private readonly getState: () => GameState,
    private readonly onStateChange: () => void,
    private readonly summonWraith: (x: number, y: number) => void
  ) {
    this.projectiles = createProjectileGroup(scene);
  }

  get boss(): Phaser.Physics.Arcade.Sprite | null {
    return this.sprite;
  }

  get projectileGroup(): Phaser.Physics.Arcade.Group {
    return this.projectiles;
  }

  isActive(): boolean {
    return this.active;
  }

  isDefeated(): boolean {
    return this.active && this.hp <= 0;
  }

  spawn(): void {
    if (this.active) return;

    const r = this.arena.rect;
    const x = r.centerX;
    const y = Math.min(r.bottom - BOSS_RADIUS, r.top + 150);

    this.sprite = createBossSprite(this.scene, x, y);
    this.sprite.setCircle(BOSS_RADIUS);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setImmovable(false);
    this.sprite.setDamping(true);
    this.sprite.setDrag(0.9);
    this.sprite.setMaxVelocity(125);

    this.hp = BOSS_MAX_HP;
    this.active = true;
    this.shootTimer = 0;
    this.summonTimer = 0;
    this.moveTimer = 0;
    this.damageCooldownMs = 0;

    const state = this.getState();
    state.bossActive = true;
    state.bossHp = this.hp;
    state.bossMaxHp = BOSS_MAX_HP;
    state.phase = "boss";
    this.onStateChange();

    this.scene.events.emit(GameEvents.BOSS_SPAWN, x, y);
  }

  damage(amount = 1): boolean {
    const sprite = this.getLiveSprite();
    if (!this.active || !sprite) return false;
    if (this.hp <= 0 || amount <= 0) return false;
    if (this.damageCooldownMs > 0) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.damageCooldownMs = 220;
    const state = this.getState();
    state.bossHp = this.hp;
    this.onStateChange();

    this.scene.tweens.add({
      targets: sprite,
      alpha: 0.4,
      duration: 60,
      yoyo: true,
      repeat: 1,
    });

    if (this.hp === 0) {
      this.defeat();
      return true;
    }
    return false;
  }

  update(deltaMs: number, player: Phaser.Physics.Arcade.Sprite): void {
    const sprite = this.getLiveSprite();
    if (!this.active || !sprite) return;

    this.arena.clampSprite(sprite, BOSS_RADIUS);
    this.moveTimer += deltaMs;
    this.shootTimer += deltaMs;
    this.summonTimer += deltaMs;
    this.damageCooldownMs = Math.max(0, this.damageCooldownMs - deltaMs);

    const r = this.arena.rect;
    const px = player.x;
    const py = player.y;
    const dx = px - sprite.x;
    const dy = py - sprite.y;
    const len = Math.hypot(dx, dy) || 1;

    if (this.moveTimer > 400) {
      sprite.setVelocity((dx / len) * 90, (dy / len) * 90);
    }

    const shootInterval = 850;
    if (this.shootTimer >= shootInterval) {
      this.shootTimer = 0;
      this.fireAt(px, py);
    }

    if (this.summonTimer >= 2600) {
      this.summonTimer = 0;
      this.summonRedWraith();
    }

    cullProjectiles(this.projectiles, r);
  }

  reset(): void {
    this.sprite?.destroy();
    this.sprite = null;
    this.projectiles.clear(true, true);
    this.active = false;
    this.hp = BOSS_MAX_HP;
    this.shootTimer = 0;
    this.summonTimer = 0;
    this.damageCooldownMs = 0;
  }

  private fireAt(tx: number, ty: number): void {
    const sprite = this.getLiveSprite();
    if (!sprite) return;
    const sx = sprite.x;
    const sy = sprite.y;
    for (const spread of [-0.22, 0, 0.22]) {
      fireBolt(
        this.scene,
        this.projectiles,
        sx,
        sy,
        tx,
        ty,
        305,
        spread + Phaser.Math.FloatBetween(-0.04, 0.04),
        BOSS_RADIUS * 0.65
      );
    }
    this.scene.events.emit(GameEvents.BOSS_SHOOT, sx, sy);
  }

  private summonRedWraith(): void {
    const sprite = this.getLiveSprite();
    if (!sprite) return;
    const r = this.arena.rect;
    const x = Phaser.Math.Clamp(
      sprite.x + Phaser.Math.Between(-90, 90),
      r.left + BOSS_RADIUS,
      r.right - BOSS_RADIUS
    );
    const y = Phaser.Math.Clamp(
      sprite.y + Phaser.Math.Between(55, 130),
      r.top + BOSS_RADIUS,
      r.bottom - BOSS_RADIUS
    );
    this.summonWraith(x, y);
  }

  private defeat(): void {
    if (!this.sprite) return;
    const defeatedSprite = this.sprite;
    const { x, y } = defeatedSprite;
    this.sprite = null;
    this.active = false;
    defeatedSprite.destroy();
    this.projectiles.clear(true, true);

    const state = this.getState();
    state.bossActive = false;
    state.bossHp = 0;
    state.phase = "playing";
    this.onStateChange();
    this.scene.events.emit(GameEvents.BOSS_DEFEATED, x, y);
  }

  private getLiveSprite(): Phaser.Physics.Arcade.Sprite | null {
    if (!this.sprite) return null;

    if (!this.sprite.active) {
      this.sprite = null;
      this.active = false;
      return null;
    }

    if (!this.sprite.body) {
      this.scene.physics.world.enable(this.sprite);
    }

    if (!this.sprite.body) {
      this.sprite = null;
      this.active = false;
      return null;
    }

    return this.sprite;
  }
}
