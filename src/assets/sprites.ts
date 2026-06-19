import Phaser from "phaser";
import {
  ARCHER_RADIUS,
  BOSS_RADIUS,
  HAZARD_RADIUS,
  OBSTACLE_RADIUS,
  PICKUP_RADIUS,
  PLAYER_RADIUS,
  PROJECTILE_RADIUS,
} from "../game/state";

export const ENTITY_SHEET = "entities";
export const FRAME_SIZE = 64;

export const SPRITE_KEYS = ["player", "hazard", "pickup"] as const;
export type SpriteKey = (typeof SPRITE_KEYS)[number];

export type PickupType = "soul" | "vitality" | "plating";

const FRAME_ROW = {
  player: 0,
  hazard: 1,
  soul: 2,
  vitality: 3,
  plating: 4,
  archer: 5,
} as const;

const COLS = 4;

function frameStart(row: number, col = 0): number {
  return row * COLS + col;
}

export const FRAME_START: Record<SpriteKey, number> = {
  player: frameStart(FRAME_ROW.player),
  hazard: frameStart(FRAME_ROW.hazard),
  pickup: frameStart(FRAME_ROW.soul),
};

const PICKUP_FRAME_START: Record<PickupType, number> = {
  soul: frameStart(FRAME_ROW.soul),
  vitality: frameStart(FRAME_ROW.vitality),
  plating: frameStart(FRAME_ROW.plating),
};

export const ANIM_KEYS: Record<SpriteKey, string> = {
  player: "player-idle",
  hazard: "hazard-spin",
  pickup: "pickup-soul-pulse",
};

const PICKUP_ANIM: Record<PickupType, string> = {
  soul: "pickup-soul-pulse",
  vitality: "pickup-vitality-pulse",
  plating: "pickup-plating-pulse",
};

export const SPRITE_DISPLAY: Record<SpriteKey, number> = {
  player: PLAYER_RADIUS * 2,
  hazard: HAZARD_RADIUS * 2,
  pickup: PICKUP_RADIUS * 2,
};

const FALLBACK_PATHS: Record<SpriteKey, string> = {
  player: "assets/sprites/player.png",
  hazard: "assets/sprites/hazard.png",
  pickup: "assets/sprites/pickup.png",
};

const EXTRA_PATHS = {
  boss: "assets/sprites/boss.png",
  projectile: "assets/sprites/projectile.png",
  obstacle: "assets/sprites/obstacle.png",
  pickup_health: "assets/sprites/pickup_health.png",
  pickup_armor: "assets/sprites/pickup_armor.png",
  archer: "assets/sprites/archer.png",
  flame: "assets/sprites/flame.png",
} as const;

export function preloadSprites(scene: Phaser.Scene): void {
  scene.load.spritesheet(ENTITY_SHEET, "assets/sprites/entities.png", {
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
  });

  for (const key of SPRITE_KEYS) {
    scene.load.image(key, FALLBACK_PATHS[key]);
  }

  scene.load.image("boss", EXTRA_PATHS.boss);
  scene.load.image("projectile", EXTRA_PATHS.projectile);
  scene.load.image("obstacle", EXTRA_PATHS.obstacle);
  scene.load.image("pickup_health", EXTRA_PATHS.pickup_health);
  scene.load.image("pickup_armor", EXTRA_PATHS.pickup_armor);
  scene.load.image("archer", EXTRA_PATHS.archer);
  scene.load.spritesheet("flame", EXTRA_PATHS.flame, {
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
  });
}

export function registerEntityAnimations(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ENTITY_SHEET)) return;

  const { anims } = scene;

  const define = (
    key: string,
    start: number,
    end: number,
    frameRate: number
  ) => {
    if (anims.exists(key)) return;
    anims.create({
      key,
      frames: anims.generateFrameNumbers(ENTITY_SHEET, { start, end }),
      frameRate,
      repeat: -1,
    });
  };

  define(ANIM_KEYS.player, frameStart(FRAME_ROW.player), frameStart(FRAME_ROW.player) + 3, 8);
  define(ANIM_KEYS.hazard, frameStart(FRAME_ROW.hazard), frameStart(FRAME_ROW.hazard) + 3, 12);
  define(PICKUP_ANIM.soul, PICKUP_FRAME_START.soul, PICKUP_FRAME_START.soul + 1, 6);
  define(
    PICKUP_ANIM.vitality,
    PICKUP_FRAME_START.vitality,
    PICKUP_FRAME_START.vitality + 1,
    6
  );
  define(
    PICKUP_ANIM.plating,
    PICKUP_FRAME_START.plating,
    PICKUP_FRAME_START.plating + 1,
    6
  );
  define(
    "archer-idle",
    frameStart(FRAME_ROW.archer),
    frameStart(FRAME_ROW.archer) + 3,
    10
  );

  if (!anims.exists("boss-idle")) {
    anims.create({
      key: "boss-idle",
      frames: [{ key: "boss" }],
      frameRate: 1,
      repeat: -1,
    });
  }

  if (!anims.exists("flame-burn")) {
    anims.create({
      key: "flame-burn",
      frames: anims.generateFrameNumbers("flame", { start: 0, end: 3 }),
      frameRate: 12,
      repeat: -1,
    });
  }
}

export function createEntitySprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: SpriteKey
): Phaser.Physics.Arcade.Sprite {
  const useSheet = scene.textures.exists(ENTITY_SHEET);

  const sprite = useSheet
    ? scene.physics.add.sprite(x, y, ENTITY_SHEET, FRAME_START[key])
    : scene.physics.add.sprite(x, y, key);

  applySpriteDisplaySize(sprite, key);

  if (useSheet && scene.anims.exists(ANIM_KEYS[key])) {
    sprite.play(ANIM_KEYS[key]);
  }

  return sprite;
}

export function createPickupSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: PickupType
): Phaser.Physics.Arcade.Sprite {
  const useSheet = scene.textures.exists(ENTITY_SHEET);
  const start = PICKUP_FRAME_START[type];
  const fallback =
    type === "soul"
      ? "pickup"
      : type === "vitality"
        ? "pickup_health"
        : "pickup_armor";

  const sprite = useSheet
    ? scene.physics.add.sprite(x, y, ENTITY_SHEET, start)
    : scene.physics.add.sprite(x, y, fallback);

  sprite.setDisplaySize(PICKUP_RADIUS * 2, PICKUP_RADIUS * 2);

  const anim = PICKUP_ANIM[type];
  if (useSheet && scene.anims.exists(anim)) {
    sprite.play(anim);
  }

  return sprite;
}

export function createArcherSprite(
  scene: Phaser.Scene,
  x: number,
  y: number
): Phaser.Physics.Arcade.Sprite {
  const useSheet = scene.textures.exists(ENTITY_SHEET);
  const sprite = useSheet
    ? scene.physics.add.sprite(x, y, ENTITY_SHEET, frameStart(FRAME_ROW.archer))
    : scene.physics.add.sprite(x, y, "archer");

  sprite.setDisplaySize(ARCHER_RADIUS * 2, ARCHER_RADIUS * 2);
  if (useSheet && scene.anims.exists("archer-idle")) {
    sprite.play("archer-idle");
  }
  sprite.setDepth(5);
  return sprite;
}

export function createBossSprite(
  scene: Phaser.Scene,
  x: number,
  y: number
): Phaser.Physics.Arcade.Sprite {
  const sprite = scene.physics.add.sprite(x, y, "boss");
  sprite.setDisplaySize(BOSS_RADIUS * 2.4, BOSS_RADIUS * 2.4);
  if (scene.anims.exists("boss-idle")) {
    sprite.play("boss-idle");
  }
  sprite.setDepth(6);
  return sprite;
}

export function createProjectileSprite(
  scene: Phaser.Scene,
  x: number,
  y: number
): Phaser.Physics.Arcade.Sprite {
  const sprite = scene.physics.add.sprite(x, y, "projectile");
  sprite.setDisplaySize(PROJECTILE_RADIUS * 2, PROJECTILE_RADIUS * 2);
  sprite.setDepth(5);
  return sprite;
}

export function createObstacleSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1
): Phaser.Physics.Arcade.Image {
  const size = OBSTACLE_RADIUS * 2 * scale;
  const obstacle = scene.physics.add.staticImage(x, y, "obstacle");
  obstacle.setDisplaySize(size, size);
  obstacle.setDepth(2);
  return obstacle;
}

export function applySpriteDisplaySize(
  sprite: Phaser.Physics.Arcade.Sprite,
  key: SpriteKey
): void {
  const size = SPRITE_DISPLAY[key];
  sprite.setDisplaySize(size, size);
}
