export type GamePhase = "menu" | "playing" | "boss" | "gameover";

export interface GameState {
  phase: GamePhase;
  score: number;
  timeRemaining: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  pickupsCollected: PickupStats;
  level: number;
  nextUpgradeScore: number;
  upgradeChoicesOpen: boolean;
  upgrades: UpgradeModifiers;
  muted: boolean;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
}

export interface PickupStats {
  soul: number;
  vitality: number;
  plating: number;
}

export type UpgradeLine =
  | "projectileSpeed"
  | "projectileNumber"
  | "projectileDamage"
  | "bulletAoe"
  | "movementSpeed";

export interface UpgradeModifiers {
  projectileSpeedLevel: number;
  projectileNumberLevel: number;
  projectileDamageLevel: number;
  bulletAoeLevel: number;
  movementSpeedLevel: number;
  projectileCount: number;
  spreadAngle: number;
  boltSpeedBonus: number;
  boltDamage: number;
  bulletAoeRadius: number;
  slowMultiplier: number;
  slowDurationMs: number;
  knockback: number;
  pierce: number;
  moveSpeedBonus: number;
  fireTrail: boolean;
}

export const ROUND_DURATION_SEC = 90;
export const BOSS_PHASE_SEC = 30;
export const BOSS_MAX_HP = 18;

export const PLAYER_MAX_HEALTH = 3;
export const PLAYER_MAX_ARMOR = 3;
export const PLAYER_BASE_MOVE_SPEED = 280;

export const PLAYER_RADIUS = 18;
export const HAZARD_RADIUS = 14;
export const PICKUP_RADIUS = 10;
export const ARCHER_RADIUS = 16;
export const BOSS_RADIUS = 30;
export const PROJECTILE_RADIUS = 7;
export const OBSTACLE_RADIUS = 26;

export const ARCHER_SPAWN_AFTER_SEC = 20;
export const ARCHER_SHOOT_INTERVAL_MS = 1800;

export const PLAYER_FIRE_INTERVAL_MS = 380;
export const PLAYER_BOLT_SPEED = 340;
export const PLAYER_AIM_RANGE = 460;
export const HAZARD_KILL_SCORE = 8;
export const ARCHER_KILL_SCORE = 25;
export const SOUL_PICKUP_SCORE = 35;
export const FIRST_UPGRADE_SCORE = 75;

export let WORLD_WIDTH = 800;
export let WORLD_HEIGHT = 600;

export function configureWorldSize(width: number, height: number): void {
  WORLD_WIDTH = width;
  WORLD_HEIGHT = height;
}

/** Max inset from world edges when the ward fully shrinks. */
export const ARENA_SHRINK_MARGIN_MAX = 130;

export function createInitialState(): GameState {
  return {
    phase: "menu",
    score: 0,
    timeRemaining: ROUND_DURATION_SEC,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    armor: 0,
    maxArmor: PLAYER_MAX_ARMOR,
    pickupsCollected: {
      soul: 0,
      vitality: 0,
      plating: 0,
    },
    level: 1,
    nextUpgradeScore: FIRST_UPGRADE_SCORE,
    upgradeChoicesOpen: false,
    upgrades: {
      projectileSpeedLevel: 0,
      projectileNumberLevel: 0,
      projectileDamageLevel: 0,
      bulletAoeLevel: 0,
      movementSpeedLevel: 0,
      projectileCount: 1,
      spreadAngle: 0,
      boltSpeedBonus: 0,
      boltDamage: 1,
      bulletAoeRadius: 0,
      slowMultiplier: 1,
      slowDurationMs: 0,
      knockback: 0,
      pierce: 0,
      moveSpeedBonus: 0,
      fireTrail: false,
    },
    muted: false,
    bossActive: false,
    bossHp: 0,
    bossMaxHp: BOSS_MAX_HP,
  };
}

/** 0 at round start → 1 when the timer hits zero. */
export function roundProgress(elapsedSec: number): number {
  const p = elapsedSec / ROUND_DURATION_SEC;
  return Math.max(0, Math.min(1, p));
}
