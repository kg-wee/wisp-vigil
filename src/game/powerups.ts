import type { GameState, UpgradeLine } from "./state";

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  line: UpgradeLine;
  nextLevel: number;
  available: boolean;
  apply: (state: GameState) => void;
  canOffer: (state: GameState) => boolean;
}

const MAX_UPGRADE_LEVEL = 3;

export const UPGRADE_LABELS: Record<UpgradeLine, string> = {
  projectileSpeed: "Starfire Velocity",
  projectileNumber: "Astral Volley",
  projectileDamage: "Dawnforge Impact",
  bulletAoe: "Runic Blast",
  movementSpeed: "Cinderstep",
};

function getLineLevel(state: GameState, line: UpgradeLine): number {
  if (line === "projectileSpeed") return state.upgrades.projectileSpeedLevel;
  if (line === "projectileNumber") return state.upgrades.projectileNumberLevel;
  if (line === "projectileDamage") return state.upgrades.projectileDamageLevel;
  if (line === "bulletAoe") return state.upgrades.bulletAoeLevel;
  return state.upgrades.movementSpeedLevel;
}

export function getUpgradeLevel(state: GameState, line: UpgradeLine): number {
  return getLineLevel(state, line);
}

function makePowerUp(line: UpgradeLine, description: string): PowerUp {
  return {
    id: line,
    name: UPGRADE_LABELS[line],
    description,
    line,
    nextLevel: 1,
    available: true,
    canOffer: (state) => getLineLevel(state, line) < MAX_UPGRADE_LEVEL,
    apply: (state) => {
      const nextLevel = Math.min(MAX_UPGRADE_LEVEL, getLineLevel(state, line) + 1);
      if (line === "projectileSpeed") {
        state.upgrades.projectileSpeedLevel = nextLevel;
        state.upgrades.boltSpeedBonus = nextLevel * 130;
      } else if (line === "projectileNumber") {
        state.upgrades.projectileNumberLevel = nextLevel;
        state.upgrades.projectileCount = nextLevel === 1 ? 3 : nextLevel === 2 ? 5 : 5;
        state.upgrades.spreadAngle = 0.14 + nextLevel * 0.06;
      } else if (line === "projectileDamage") {
        state.upgrades.projectileDamageLevel = nextLevel;
        state.upgrades.boltDamage = 1 + nextLevel;
        state.upgrades.knockback = nextLevel * 95;
        state.upgrades.pierce = nextLevel >= 3 ? 4 : 0;
      } else if (line === "bulletAoe") {
        state.upgrades.bulletAoeLevel = nextLevel;
        state.upgrades.bulletAoeRadius = 30 + nextLevel * 30;
      } else {
        state.upgrades.movementSpeedLevel = nextLevel;
        state.upgrades.moveSpeedBonus = nextLevel * 45;
        state.upgrades.fireTrail = nextLevel >= 3;
      }
    },
  };
}

const POWER_UP_LINES: Array<Pick<PowerUp, "line" | "description">> = [
  {
    line: "projectileSpeed",
    description: "Starfire bolts gain a major speed boost.",
  },
  {
    line: "projectileNumber",
    description: "Volley jumps from 1 bolt to 3, then 5.",
  },
  {
    line: "projectileDamage",
    description: "Adds knockback. Level 3 becomes a piercing spear.",
  },
  {
    line: "bulletAoe",
    description: "Bolts burst with runic force and splash nearby enemies.",
  },
  {
    line: "movementSpeed",
    description: "Move faster. Level 3 leaves a killing fire trail.",
  },
];

export const UPGRADE_LINES = POWER_UP_LINES.map((entry) => entry.line);

export function nextUpgradeScoreForLevel(level: number): number {
  const earnedLevels = Math.max(0, level - 1);
  return 75 + earnedLevels * 100 + (earnedLevels * (earnedLevels - 1) * 50) / 2;
}

export function choosePowerUps(
  state: GameState,
  count = 3,
  random: () => number = Math.random
): PowerUp[] {
  const available = POWER_UP_LINES.filter(
    (entry) => getLineLevel(state, entry.line) < MAX_UPGRADE_LEVEL
  );
  const pool = [...available];
  const selected: typeof POWER_UP_LINES = [];

  while (selected.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected.map((entry) => {
    const powerUp = makePowerUp(entry.line, entry.description);
    powerUp.nextLevel = Math.min(
      MAX_UPGRADE_LEVEL,
      getLineLevel(state, entry.line) + 1
    );
    powerUp.name = `${UPGRADE_LABELS[entry.line]} Lv ${powerUp.nextLevel}`;
    if (!powerUp.canOffer(state)) {
      powerUp.description = "Max level reached.";
      powerUp.available = false;
    }
    return powerUp;
  });
}

export function hasAvailablePowerUps(state: GameState): boolean {
  return POWER_UP_LINES.some((entry) => getLineLevel(state, entry.line) < MAX_UPGRADE_LEVEL);
}
