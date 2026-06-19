import Phaser from "phaser";
import { applyGameOverJuice } from "../ui/gameOverJuice";
import { createBody, createTitle } from "../ui/OverlayText";
import { FantasyTheme } from "../ui/theme";

interface GameOverData {
  survived: boolean;
  score: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOver" });
  }

  create(data: GameOverData): void {
    const { survived, score } = data;
    const { copy, colors } = FantasyTheme;

    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      colors.bgDeep
    );

    const title = createTitle(
      this,
      this.scale.height * 0.3,
      survived ? copy.gameOverWin : copy.gameOverLose
    );
    applyGameOverJuice(this, title, survived);

    createBody(this, this.scale.height * 0.45, copy.gameOverScore(score));
    const hint = createBody(this, this.scale.height * 0.62, copy.gameOverRestart);
    hint.setColor(colors.gold);

    this.input.keyboard?.once("keydown-SPACE", () => this.restart());
    this.input.once("pointerdown", () => this.restart());
  }

  private restart(): void {
    this.scene.start("Game");
  }
}
