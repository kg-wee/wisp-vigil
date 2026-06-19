import Phaser from "phaser";
import { AudioManager } from "../assets/AudioManager";
import { createInitialState } from "../game/state";
import { applyMenuJuice } from "../ui/menuJuice";
import { createBody, createTitle } from "../ui/OverlayText";
import { FantasyTheme } from "../ui/theme";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "Menu" });
  }

  create(): void {
    const state = createInitialState();
    this.registry.set("gameState", state);
    const { copy, colors } = FantasyTheme;

    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      colors.bgDeep
    );

    const title = createTitle(this, this.scale.height * 0.3, copy.gameTitle);
    createBody(this, this.scale.height * 0.48, copy.menuBody);

    const start = createBody(this, this.scale.height * 0.68, copy.menuStart);
    start.setColor(colors.gold);

    applyMenuJuice(this, title, start);

    const audio = new AudioManager(this);
    const unlock = () => audio.unlock();
    this.input.on("pointerdown", unlock);
    this.input.keyboard?.on("keydown", unlock);

    this.input.keyboard?.once("keydown-SPACE", () => this.startGame());
    this.input.once("pointerdown", () => this.startGame());
  }

  private startGame(): void {
    this.scene.start("Game");
  }
}
