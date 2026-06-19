import type { GameState } from "./state";

export type DamageResult = "absorbed_armor" | "absorbed_health" | "dead";

/** Armor absorbs first, then vitality. */
export function applySingleHit(state: GameState): DamageResult {
  if (state.armor > 0) {
    state.armor -= 1;
    return "absorbed_armor";
  }
  if (state.health > 0) {
    state.health -= 1;
    return state.health <= 0 ? "dead" : "absorbed_health";
  }
  return "dead";
}

export function healVitality(state: GameState, amount = 1): boolean {
  if (state.health >= state.maxHealth) return false;
  state.health = Math.min(state.maxHealth, state.health + amount);
  return true;
}

export function addPlating(state: GameState, amount = 1): boolean {
  if (state.armor >= state.maxArmor) return false;
  state.armor = Math.min(state.maxArmor, state.armor + amount);
  return true;
}
