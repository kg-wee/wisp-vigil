import Phaser from "phaser";
import { AudioManager } from "../assets/AudioManager";
import { createEntitySprite } from "../assets/sprites";
import { ArcherSpawner } from "../game/ArcherSpawner";
import { ArenaBounds } from "../game/ArenaBounds";
import { BossController } from "../game/BossController";
import { EnvironmentObstacles } from "../game/EnvironmentObstacles";
import { GameEvents } from "../game/events";
import { HazardSpawner } from "../game/HazardSpawner";
import { PlayerAttack } from "../game/PlayerAttack";
import { getPickupType, PickupSpawner } from "../game/PickupSpawner";
import {
  choosePowerUps,
  hasAvailablePowerUps,
  nextUpgradeScoreForLevel,
  type PowerUp,
} from "../game/powerups";
import {
  addPlating,
  applySingleHit,
  healVitality,
} from "../game/PlayerDamage";
import {
  ARCHER_KILL_SCORE,
  BOSS_PHASE_SEC,
  createInitialState,
  HAZARD_KILL_SCORE,
  PLAYER_BASE_MOVE_SPEED,
  PLAYER_RADIUS,
  SOUL_PICKUP_SCORE,
  type GameState,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../game/state";
import { drawArenaBackdrop } from "../ui/ArenaBackdrop";
import { Hud } from "../ui/Hud";
import { JuiceManager } from "../ui/JuiceManager";
import { PauseMenu } from "../ui/PauseMenu";
import { PowerUpPicker } from "../ui/PowerUpPicker";
import { FantasyTheme } from "../ui/theme";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private pointerTarget: Phaser.Math.Vector2 | null = null;
  private pointerActive = false;
  private dragStartPointer: Phaser.Math.Vector2 | null = null;
  private dragStartPlayer: Phaser.Math.Vector2 | null = null;
  private state!: GameState;
  private hud!: Hud;
  private arena!: ArenaBounds;
  private environment!: EnvironmentObstacles;
  private hazards!: HazardSpawner;
  private archers!: ArcherSpawner;
  private playerAttack!: PlayerAttack;
  private pickups!: PickupSpawner;
  private boss!: BossController;
  private fireTrails!: Phaser.Physics.Arcade.StaticGroup;
  private audio!: AudioManager;
  private juice!: JuiceManager;
  private powerUpPicker!: PowerUpPicker;
  private pauseMenu!: PauseMenu;
  private menuButton!: Phaser.GameObjects.Container;
  private offeredPowerUps: PowerUp[] = [];
  private menuOpen = false;
  private elapsed = 0;
  private invulnMs = 0;
  private boundsDamageTimer = 0;
  private fireTrailTimer = 0;
  private bossPhaseStarted = false;
  private bossCollidersWired = false;

  constructor() {
    super({ key: "Game" });
  }

  create(): void {
    this.state = { ...createInitialState(), phase: "playing" };
    this.registry.set("gameState", this.state);
    this.elapsed = 0;
    this.invulnMs = 0;
    this.boundsDamageTimer = 0;
    this.bossPhaseStarted = false;
    this.fireTrailTimer = 0;
    this.bossCollidersWired = false;

    drawArenaBackdrop(this);

    this.arena = new ArenaBounds(this);
    this.arena.update(0);

    this.environment = new EnvironmentObstacles(this, this.arena);

    this.player = createEntitySprite(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "player");
    this.player.setCircle(PLAYER_RADIUS);
    this.player.setCollideWorldBounds(true);
    this.player.setDamping(true);
    this.player.setDrag(0.92);
    this.player.setMaxVelocity(320);
    this.player.setDepth(7);

    this.juice = new JuiceManager(this);
    this.juice.attachPlayer(this.player);

    this.hazards = new HazardSpawner(this);
    this.archers = new ArcherSpawner(this);
    this.playerAttack = new PlayerAttack(this);
    this.pickups = new PickupSpawner(this);
    this.fireTrails = this.physics.add.staticGroup();
    this.boss = new BossController(
      this,
      this.arena,
      () => this.state,
      () => this.syncState(),
      (x, y) => this.hazards.spawnBossWraith({ x, y })
    );
    this.audio = new AudioManager(this);
    this.hud = new Hud(this);
    this.powerUpPicker = new PowerUpPicker(this);
    this.pauseMenu = new PauseMenu(this);
    this.menuButton = this.createMenuButton();

    this.physics.add.collider(this.player, this.environment.group);
    this.physics.add.collider(this.hazards.hazards, this.environment.group);
    this.physics.add.collider(this.archers.archerGroup, this.environment.group);
    this.physics.add.collider(
      this.boss.projectileGroup,
      this.environment.group,
      (proj) => (proj as Phaser.Physics.Arcade.Sprite).destroy()
    );
    this.physics.add.collider(
      this.archers.projectiles,
      this.environment.group,
      (proj) => (proj as Phaser.Physics.Arcade.Sprite).destroy()
    );
    this.physics.add.collider(
      this.playerAttack.projectiles,
      this.environment.group,
      (proj) => (proj as Phaser.Physics.Arcade.Sprite).destroy()
    );

    this.physics.add.overlap(
      this.playerAttack.projectiles,
      this.hazards.hazards,
      (proj, hazard) =>
        this.onPlayerBoltHitHazard(
          hazard as Phaser.Physics.Arcade.Sprite,
          proj as Phaser.Physics.Arcade.Sprite
        ),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.fireTrails,
      this.hazards.hazards,
      (_trail, hazard) =>
        this.onFireTrailHitHazard(hazard as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.playerAttack.projectiles,
      this.archers.archerGroup,
      (proj, archer) =>
        this.onPlayerBoltHitArcher(
          archer as Phaser.Physics.Arcade.Sprite,
          proj as Phaser.Physics.Arcade.Sprite
        ),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.hazards.hazards,
      () => this.onPlayerDamaged(),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.archers.archerGroup,
      () => this.onPlayerDamaged(),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.archers.projectiles,
      (_player, proj) => {
        (proj as Phaser.Physics.Arcade.Sprite).destroy();
        this.onPlayerDamaged();
      },
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.pickups.pickups,
      (_p, pickup) => this.onPickup(pickup as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.boss.projectileGroup,
      (_player, proj) => {
        (proj as Phaser.Physics.Arcade.Sprite).destroy();
        this.onPlayerDamaged();
      },
      undefined,
      this
    );

    this.events.on(GameEvents.HAZARD_SPAWN, (x: number, y: number) => {
      this.juice.hazardSpawn(x, y);
    });
    this.events.on(GameEvents.ARCHER_SPAWN, (x: number, y: number) => {
      this.juice.hazardSpawn(x, y);
    });
    this.events.on(GameEvents.BOSS_SPAWN, (x: number, y: number) => {
      this.juice.bossSpawn(x, y);
      this.audio.playShield(this.state.muted);
      this.wireBossColliders();
    });
    this.events.on(GameEvents.BOSS_SHOOT, (x: number, y: number) => {
      this.juice.hazardSpawn(x, y);
    });
    this.events.on(GameEvents.PLAYER_SHOOT, (x: number, y: number) => {
      this.audio.playShoot(this.state.muted);
      this.juice.playerShoot(x, y);
    });
    this.events.on(GameEvents.BOSS_DEFEATED, () => {
      this.juice.celebrate();
      this.state.score += 150;
      this.syncState();
      this.time.delayedCall(400, () => this.winRound());
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as GameScene["wasd"];

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.audio.unlock();
      this.audio.startMusic(this.state.muted);
      if (this.state.upgradeChoicesOpen || this.menuOpen) return;
      this.pointerActive = true;
      this.dragStartPointer = new Phaser.Math.Vector2(p.worldX, p.worldY);
      this.dragStartPlayer = new Phaser.Math.Vector2(this.player.x, this.player.y);
      this.pointerTarget = this.dragStartPlayer.clone();
    });
    this.input.on("pointerup", () => {
      this.stopPointerDrag();
    });
    this.input.on("pointerupoutside", () => {
      this.stopPointerDrag();
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.updatePointerDrag(p);
    });
    this.input.keyboard?.on("keydown", () => this.audio.unlock());
    this.input.keyboard?.on("keydown", () => this.audio.startMusic(this.state.muted));
    this.input.keyboard?.on("keydown-Q", this.togglePauseMenu, this);

    this.events.emit(GameEvents.STATE_CHANGED, this.state);
    this.audio.startMusic(this.state.muted);
  }

  private updatePointerDrag(p: Phaser.Input.Pointer): void {
    if (!this.pointerActive || !this.dragStartPointer || !this.dragStartPlayer) return;

    const target = new Phaser.Math.Vector2(
      this.dragStartPlayer.x + (p.worldX - this.dragStartPointer.x),
      this.dragStartPlayer.y + (p.worldY - this.dragStartPointer.y)
    );
    this.pointerTarget = target;
  }

  private stopPointerDrag(): void {
    this.pointerActive = false;
    this.pointerTarget = null;
    this.dragStartPointer = null;
    this.dragStartPlayer = null;
  }

  update(_time: number, delta: number): void {
    if (this.state.phase === "gameover") return;
    if (this.menuOpen) {
      this.hud.update(this.state);
      return;
    }
    if (this.state.upgradeChoicesOpen) {
      this.hud.update(this.state);
      return;
    }

    this.elapsed += delta / 1000;
    this.arena.update(this.elapsed);

    this.maybeStartBossPhase();
    this.hazards.setDifficulty(this.elapsed);
    this.hazards.update(delta, this.player, this.arena);
    this.archers.update(delta, this.elapsed, this.player, this.arena);
    this.pickups.update(delta, this.arena, this.environment.group);
    this.boss.update(delta, this.player);
    this.playerAttack.update(
      delta,
      this.player,
      this.arena,
      this.hazards,
      this.archers,
      this.boss,
      this.state
    );

    this.movePlayer();
    this.tickTimer(delta);
    this.checkOutOfBounds(delta);
    this.updateTrail();
    this.updateFireTrail(delta);

    if (this.invulnMs > 0) {
      this.invulnMs -= delta;
      this.player.setAlpha(Math.sin(this.time.now / 80) > 0 ? 1 : 0.35);
    } else {
      this.player.setAlpha(1);
    }

    this.hud.update(this.state);
  }

  private maybeStartBossPhase(): void {
    if (this.bossPhaseStarted || this.state.timeRemaining > BOSS_PHASE_SEC) return;

    this.bossPhaseStarted = true;
    this.hazards.setPaused(true);
    this.archers.setPaused(true);
    this.boss.spawn();
  }

  private movePlayer(): void {
    const speed = PLAYER_BASE_MOVE_SPEED + this.state.upgrades.moveSpeedBonus;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy) || 1;
      this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
    } else if (this.pointerActive && this.pointerTarget) {
      const dx = this.pointerTarget.x - this.player.x;
      const dy = this.pointerTarget.y - this.player.y;
      const len = Math.hypot(dx, dy) || 1;
      if (len > 8) {
        this.player.setVelocity((dx / len) * speed, (dy / len) * speed);
      } else {
        this.player.setVelocity(0, 0);
      }
    } else {
      this.player.setVelocity(0, 0);
    }

    this.arena.clampSprite(this.player, PLAYER_RADIUS);
  }

  private checkOutOfBounds(delta: number): void {
    if (this.arena.contains(this.player.x, this.player.y, PLAYER_RADIUS - 2)) {
      this.boundsDamageTimer = 0;
      return;
    }

    this.boundsDamageTimer += delta;
    if (this.boundsDamageTimer >= 500) {
      this.boundsDamageTimer = 0;
      this.events.emit(GameEvents.OUT_OF_BOUNDS);
      this.onPlayerDamaged();
    }
  }

  private tickTimer(delta: number): void {
    this.state.timeRemaining -= delta / 1000;
    if (this.state.timeRemaining > 0) {
      this.syncState();
      return;
    }

    this.state.timeRemaining = 0;
    if (this.bossPhaseStarted && this.boss.isActive() && !this.boss.isDefeated()) {
      this.loseRound();
    } else {
      this.winRound();
    }
  }

  private wireBossColliders(): void {
    if (this.bossCollidersWired) return;
    const bossSprite = this.boss.boss;
    if (!bossSprite) return;

    this.physics.add.overlap(
      this.player,
      bossSprite,
      () => this.onPlayerDamaged(),
      undefined,
      this
    );
    this.physics.add.collider(bossSprite, this.environment.group);
    this.physics.add.overlap(
      this.playerAttack.projectiles,
      bossSprite,
      (first, second) =>
        this.onPlayerBoltHitBoss(
          first as Phaser.Physics.Arcade.Sprite,
          second as Phaser.Physics.Arcade.Sprite
        ),
      undefined,
      this
    );
    this.bossCollidersWired = true;
  }

  private onPlayerBoltHitHazard(
    hazard: Phaser.Physics.Arcade.Sprite,
    proj: Phaser.Physics.Arcade.Sprite
  ): void {
    if (!hazard.active) return;
    const damage = Math.max(1, (proj.getData("damage") as number) ?? 1);
    const aoeRadius = Math.max(0, (proj.getData("aoeRadius") as number) ?? 0);
    const slowMultiplier = (proj.getData("slowMultiplier") as number) ?? 1;
    const slowDurationMs = (proj.getData("slowDurationMs") as number) ?? 0;
    const knockback = Math.max(0, (proj.getData("knockback") as number) ?? 0);
    const { x, y } = hazard;

    this.hazards.applySlow(hazard, slowMultiplier, slowDurationMs);
    this.hazards.applyKnockback(hazard, proj.x, proj.y, knockback);
    const result = this.hazards.damage(hazard, damage);
    if (aoeRadius > 0) {
      this.drawAoeImpact(x, y, aoeRadius);
      this.damageHazardsInArea(
        x,
        y,
        aoeRadius,
        hazard,
        damage,
        slowMultiplier,
        slowDurationMs,
        knockback
      );
    }
    this.consumePlayerProjectile(proj);
    this.juice.enemyHit(x, y);
    if (result.defeated) {
      this.addScore(HAZARD_KILL_SCORE);
      this.events.emit(GameEvents.ENEMY_DEFEATED, result.x, result.y);
    }
    this.syncState();
  }

  private onPlayerBoltHitArcher(
    archer: Phaser.Physics.Arcade.Sprite,
    proj: Phaser.Physics.Arcade.Sprite
  ): void {
    if (!archer.active) return;
    this.consumePlayerProjectile(proj);
    const { x, y } = archer;
    archer.destroy();
    this.addScore(ARCHER_KILL_SCORE);
    this.juice.enemyHit(x, y);
    this.events.emit(GameEvents.ENEMY_DEFEATED, x, y);
    this.syncState();
  }

  private onFireTrailHitHazard(hazard: Phaser.Physics.Arcade.Sprite): void {
    if (!hazard.active) return;
    if (hazard.getData("burnedByTrail")) return;
    hazard.setData("burnedByTrail", true);
    const result = this.hazards.damage(hazard, 999);
    this.juice.enemyHit(result.x, result.y);
    if (result.defeated) {
      this.addScore(HAZARD_KILL_SCORE);
      this.events.emit(GameEvents.ENEMY_DEFEATED, result.x, result.y);
      this.syncState();
    }
  }

  private onPlayerBoltHitBoss(
    first: Phaser.Physics.Arcade.Sprite,
    second: Phaser.Physics.Arcade.Sprite
  ): void {
    const activeBoss = this.boss.boss;
    if (!activeBoss) return;

    const boss = first === activeBoss ? first : second === activeBoss ? second : null;
    const proj = first === activeBoss ? second : first;
    if (!boss || proj === boss) return;

    if (!proj.active || proj.getData("hitBoss")) return;
    proj.setData("hitBoss", true);
    this.consumePlayerProjectile(proj);
    if (!this.boss.isActive() || this.boss.isDefeated()) return;
    const { x, y } = boss;
    const damage = Math.max(1, (proj.getData("damage") as number) ?? 1);
    const defeated = this.boss.damage(damage);
    this.addScore(12);
    this.juice.enemyHit(x, y);
    this.syncState();
    if (defeated) return;
  }

  private consumePlayerProjectile(proj: Phaser.Physics.Arcade.Sprite): void {
    if (!proj.active) return;
    const pierceRemaining = (proj.getData("pierceRemaining") as number) ?? 0;
    if (pierceRemaining > 0) {
      proj.setData("pierceRemaining", pierceRemaining - 1);
      return;
    }
    proj.destroy();
  }

  private damageHazardsInArea(
    x: number,
    y: number,
    radius: number,
    primary: Phaser.Physics.Arcade.Sprite,
    damage: number,
    slowMultiplier: number,
    slowDurationMs: number,
    knockback: number
  ): void {
    const radiusSq = radius * radius;
    this.hazards.hazards.children.each((child) => {
      const hazard = child as Phaser.Physics.Arcade.Sprite;
      if (!hazard.active || hazard === primary) return true;
      const distSq = (hazard.x - x) ** 2 + (hazard.y - y) ** 2;
      if (distSq > radiusSq) return true;

      this.hazards.applySlow(hazard, slowMultiplier, slowDurationMs);
      this.hazards.applyKnockback(hazard, x, y, knockback);
      const result = this.hazards.damage(hazard, damage);
      this.juice.enemyHit(hazard.x, hazard.y);
      if (result.defeated) {
        this.addScore(HAZARD_KILL_SCORE);
        this.events.emit(GameEvents.ENEMY_DEFEATED, result.x, result.y);
      }
      return true;
    });
  }

  private drawAoeImpact(x: number, y: number, radius: number): void {
    const ring = this.add
      .circle(x, y, radius, 0x8cb8d8, 0.1)
      .setStrokeStyle(2, 0xf0d080, 0.85)
      .setDepth(60);
    this.tweens.add({
      targets: ring,
      scale: 1.25,
      alpha: 0,
      duration: 220,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  private onPickup(pickup: Phaser.Physics.Arcade.Sprite): void {
    const { x, y } = pickup;
    const type = getPickupType(pickup);
    pickup.destroy();

    if (type === "vitality") {
      this.state.pickupsCollected.vitality += 1;
      const healed = healVitality(this.state, 1);
      if (healed) {
        this.juice.vitalityPickup(x, y);
        this.audio.playPickup(this.state.muted);
        this.events.emit(GameEvents.PLAYER_HEAL);
      }
      this.syncState();
      return;
    }

    if (type === "plating") {
      this.state.pickupsCollected.plating += 1;
      const plated = addPlating(this.state, 1);
      if (plated) {
        this.juice.platingPickup(x, y);
        this.audio.playShield(this.state.muted);
      }
      this.syncState();
      return;
    }

    if (this.boss.isActive() && !this.boss.isDefeated()) {
      this.state.pickupsCollected.soul += 1;
      const defeated = this.boss.damage(1);
      this.addScore(20);
      this.juice.pickupBurst(x, y, "soul");
      this.audio.playPickup(this.state.muted);
      this.syncState();
      if (defeated) return;
    }

    this.state.pickupsCollected.soul += 1;
    this.addScore(SOUL_PICKUP_SCORE);
    this.juice.pickupBurst(x, y, "soul");
    this.audio.playPickup(this.state.muted);
    this.events.emit(GameEvents.PICKUP);
    this.syncState();
  }

  private onPlayerDamaged(): void {
    if (this.invulnMs > 0 || this.state.phase === "gameover") return;

    const result = applySingleHit(this.state);
    this.invulnMs = 1200;

    if (result === "absorbed_armor") {
      this.juice.armorBreak(this.player.x, this.player.y);
      this.audio.playShield(this.state.muted);
      this.events.emit(GameEvents.ARMOR_BREAK);
      this.syncState();
      return;
    }

    if (result === "absorbed_health") {
      this.juice.healthHit(this.player.x, this.player.y);
      this.audio.playHit(this.state.muted);
      this.events.emit(GameEvents.HEALTH_HURT);
      this.syncState();
      return;
    }

    this.audio.playHit(this.state.muted);
    this.events.emit(GameEvents.HIT);
    this.juice.hazardHit(this.player.x, this.player.y);
    this.time.delayedCall(400, () => this.loseRound());
  }

  private winRound(): void {
    if (this.state.phase === "gameover") return;
    this.state.score += Math.ceil(this.state.timeRemaining) * 5;
    this.syncState();
    this.audio.playVictory(this.state.muted);
    this.juice.celebrate();
    this.time.delayedCall(550, () => this.finishRound(true));
  }

  private updateTrail(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const moving =
      Math.abs(body.velocity.x) > 20 || Math.abs(body.velocity.y) > 20;
    this.juice.setTrailActive(moving);
  }

  private updateFireTrail(delta: number): void {
    if (!this.state.upgrades.fireTrail) return;

    this.fireTrailTimer += delta;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const moving =
      Math.abs(body.velocity.x) > 20 || Math.abs(body.velocity.y) > 20;
    if (!moving || this.fireTrailTimer < 140) return;

    this.fireTrailTimer = 0;
    const flame = this.physics.add
      .staticSprite(this.player.x, this.player.y, "flame", 0)
      .setDepth(4);
    flame.setDisplaySize(24, 24);
    flame.setCircle(10, 22, 31);
    flame.refreshBody();
    if (this.anims.exists("flame-burn")) {
      flame.play("flame-burn");
    }
    this.fireTrails.add(flame);
    this.tweens.add({
      targets: flame,
      alpha: 0,
      scale: 1.12,
      duration: 2000,
      ease: "Sine.easeOut",
      onComplete: () => flame.destroy(),
    });
  }

  private loseRound(): void {
    if (this.state.phase === "gameover") return;
    this.finishRound(false);
  }

  private createMenuButton(): Phaser.GameObjects.Container {
    const { colors, fonts } = FantasyTheme;
    const x = this.scale.width - 66;
    const y = this.scale.height - 48;
    const bg = this.add
      .rectangle(0, 0, 104, 46, 0x2a2420, 0.9)
      .setStrokeStyle(1, 0x8cb8d8, 0.55);
    const label = this.add
      .text(0, 0, "Menu", {
        fontFamily: fonts.hud,
        fontSize: "16px",
        color: colors.parchment,
      })
      .setOrigin(0.5);
    const button = this.add
      .container(x, y, [bg, label])
      .setSize(104, 46)
      .setDepth(20)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    button.on("pointerover", () => bg.setStrokeStyle(2, 0xf0d080, 1));
    button.on("pointerout", () => bg.setStrokeStyle(1, 0x8cb8d8, 0.55));
    button.on("pointerdown", () => this.openPauseMenu());
    return button;
  }

  private togglePauseMenu(): void {
    if (this.state.phase === "gameover" || this.state.upgradeChoicesOpen) return;
    if (this.menuOpen) {
      this.closePauseMenu();
    } else {
      this.openPauseMenu();
    }
  }

  private openPauseMenu(): void {
    if (this.menuOpen || this.state.phase === "gameover" || this.state.upgradeChoicesOpen) {
      return;
    }
    this.menuOpen = true;
    this.stopPointerDrag();
    this.physics.world.pause();
    this.player.setVelocity(0, 0);
    this.pauseMenu.show(
      this.state,
      () => this.closePauseMenu(),
      () => this.restartRun(),
      () => this.toggleMuteFromMenu()
    );
  }

  private toggleMuteFromMenu(): void {
    this.state.muted = !this.state.muted;
    this.audio.setMuted(this.state.muted);
    this.syncState();
    this.pauseMenu.show(
      this.state,
      () => this.closePauseMenu(),
      () => this.restartRun(),
      () => this.toggleMuteFromMenu()
    );
  }

  private closePauseMenu(): void {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    this.pauseMenu.destroy();
    this.physics.world.resume();
  }

  private restartRun(): void {
    this.menuOpen = false;
    this.pauseMenu.destroy();
    this.physics.world.resume();
    this.scene.restart();
  }

  private finishRound(survived: boolean): void {
    this.state.phase = "gameover";
    this.syncState();
    this.audio.stopMusic();
    this.audio.playGameOver(this.state.muted);
    this.scene.start("GameOver", { survived, score: this.state.score });
  }

  private addScore(amount: number): void {
    this.state.score += amount;
    this.maybeOpenPowerUpPicker();
  }

  private maybeOpenPowerUpPicker(): void {
    if (this.state.upgradeChoicesOpen) return;
    if (this.state.phase === "gameover") return;
    if (this.state.score < this.state.nextUpgradeScore) return;
    if (!hasAvailablePowerUps(this.state)) return;

    this.state.upgradeChoicesOpen = true;
    this.stopPointerDrag();
    this.offeredPowerUps = choosePowerUps(this.state, 3, () =>
      Phaser.Math.FloatBetween(0, 1)
    );
    this.physics.world.pause();
    this.player.setVelocity(0, 0);
    this.powerUpPicker.show(this.offeredPowerUps, (choice) =>
      this.selectPowerUp(choice)
    );
    this.syncState();
  }

  private selectPowerUp(choice: PowerUp): void {
    if (!this.state.upgradeChoicesOpen) return;
    if (!choice.available) return;

    choice.apply(this.state);
    this.state.level += 1;
    this.state.nextUpgradeScore = nextUpgradeScoreForLevel(this.state.level);
    this.state.upgradeChoicesOpen = false;
    this.offeredPowerUps = [];
    this.powerUpPicker.destroy();
    this.physics.world.resume();
    this.syncState();
    this.maybeOpenPowerUpPicker();
  }

  private syncState(): void {
    this.registry.set("gameState", { ...this.state });
    this.events.emit(GameEvents.STATE_CHANGED, this.state);
  }

  shutdown(): void {
    this.events.off(GameEvents.HAZARD_SPAWN);
    this.events.off(GameEvents.ARCHER_SPAWN);
    this.events.off(GameEvents.BOSS_SPAWN);
    this.events.off(GameEvents.BOSS_SHOOT);
    this.events.off(GameEvents.BOSS_DEFEATED);
    this.events.off(GameEvents.PLAYER_SHOOT);
    this.input.keyboard?.off("keydown-Q", this.togglePauseMenu, this);
    this.juice?.destroy();
    this.powerUpPicker?.destroy();
    this.pauseMenu?.destroy();
    this.menuButton?.destroy();
    this.hud?.destroy();
    this.arena?.destroy();
    this.hazards?.reset();
    this.archers?.reset();
    this.playerAttack?.reset();
    this.pickups?.reset();
    this.boss?.reset();
    this.fireTrails?.clear(true, true);
    this.environment?.reset();
    this.audio?.stopMusic();
    this.bossCollidersWired = false;
  }
}
