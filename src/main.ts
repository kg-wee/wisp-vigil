import Phaser from "phaser";
import { createGameConfig } from "./game/config";
import { selectWorldSize } from "./game/layout";

const parent = "game-container";

let selectedWorld = selectWorldSize();
let game = new Phaser.Game(createGameConfig(parent));
let resizeTimer: number | undefined;

window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const nextWorld = selectWorldSize();
    if (
      nextWorld.width === selectedWorld.width &&
      nextWorld.height === selectedWorld.height
    ) {
      return;
    }

    selectedWorld = nextWorld;
    game.destroy(true);
    game = new Phaser.Game(createGameConfig(parent));
  }, 160);
});

export default game;
