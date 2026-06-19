import Phaser from "phaser";
import type { GameState } from "../game/state";
import { FantasyTheme } from "./theme";

const STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FantasyTheme.fonts.hud,
  fontSize: "18px",
  color: FantasyTheme.colors.parchment,
};

const TOP_Y = 12;
const VITALITY_Y = 34;
const VITALITY_BAR_W = 72;
const VITALITY_BAR_H = 8;
const PLATING_Y = 48;
const BOSS_LABEL_Y = 52;
const BOSS_BAR_Y = 66;
const BOSS_BAR_W = 220;

export class Hud {
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly platingText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly bossLabel: Phaser.GameObjects.Text;
  private readonly bossBarBg: Phaser.GameObjects.Rectangle;
  private readonly bossBarFill: Phaser.GameObjects.Rectangle;
  private readonly vitalityBarBg: Phaser.GameObjects.Rectangle;
  private readonly vitalityBarFill: Phaser.GameObjects.Rectangle;
  private readonly bossBarX: number;
  private readonly vitalityBarX: number;
  private lastScore = 0;
  private urgentTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    const { colors } = FantasyTheme;
    const w = scene.scale.width;

    this.scoreText = scene.add.text(16, TOP_Y, "", STYLE).setDepth(10);
    this.timeText = scene.add
      .text(w - 16, TOP_Y, "", { ...STYLE, align: "right" })
      .setOrigin(1, 0)
      .setDepth(10);

    this.vitalityBarX = 16;
    this.vitalityBarBg = scene.add
      .rectangle(
        this.vitalityBarX + VITALITY_BAR_W / 2,
        VITALITY_Y + VITALITY_BAR_H / 2,
        VITALITY_BAR_W,
        VITALITY_BAR_H,
        0x2a1810,
        0.9
      )
      .setDepth(10);
    this.vitalityBarFill = scene.add
      .rectangle(
        this.vitalityBarX,
        VITALITY_Y + VITALITY_BAR_H / 2,
        VITALITY_BAR_W,
        VITALITY_BAR_H,
        0x6ecf8a
      )
      .setOrigin(0, 0.5)
      .setDepth(11);

    this.platingText = scene.add
      .text(16, PLATING_Y, "", { ...STYLE, fontSize: "15px" })
      .setOrigin(0, 0)
      .setDepth(10);

    this.levelText = scene.add
      .text(16, PLATING_Y + 18, "", {
        ...STYLE,
        fontSize: "13px",
        fontFamily: FantasyTheme.fonts.body,
        color: colors.parchmentDim,
      })
      .setOrigin(0, 0)
      .setDepth(10);

    this.bossBarX = w / 2 - BOSS_BAR_W / 2;
    this.bossLabel = scene.add
      .text(w / 2, BOSS_LABEL_Y, "", {
        ...STYLE,
        fontSize: "14px",
        color: colors.balefire,
      })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setVisible(false);
    this.bossBarBg = scene.add
      .rectangle(w / 2, BOSS_BAR_Y, BOSS_BAR_W, 10, 0x2a1810, 0.85)
      .setDepth(10)
      .setVisible(false);
    this.bossBarFill = scene.add
      .rectangle(this.bossBarX, BOSS_BAR_Y, BOSS_BAR_W, 10, 0xd45838)
      .setOrigin(0, 0.5)
      .setDepth(11)
      .setVisible(false);
  }

  update(state: GameState): void {
    const { copy, colors } = FantasyTheme;

    if (state.score !== this.lastScore) {
      this.bump(this.scoreText);
      this.lastScore = state.score;
    }

    this.scoreText.setText(`${copy.hudScore} ${state.score}`);
    const secs = Math.ceil(state.timeRemaining);
    this.timeText.setText(`${copy.hudTime} ${secs}`);

    if (secs > 0 && secs <= 10) {
      this.timeText.setColor(colors.urgent);
      this.pulseUrgent();
    } else {
      this.timeText.setColor(colors.parchment);
      this.stopUrgentPulse();
    }

    const hpRatio = state.maxHealth > 0 ? state.health / state.maxHealth : 0;
    this.vitalityBarFill.width = VITALITY_BAR_W * hpRatio;

    this.platingText.setText(
      state.armor > 0 ? `${copy.hudPlating} ×${state.armor}` : ""
    );
    this.levelText.setText(
      `Level ${state.level} · next power at ${state.nextUpgradeScore} glory`
    );

    const showBoss = state.bossActive && state.bossHp > 0;
    this.bossLabel.setVisible(showBoss);
    this.bossBarBg.setVisible(showBoss);
    this.bossBarFill.setVisible(showBoss);
    if (showBoss) {
      this.bossLabel.setText("Balefire Lord");
      const ratio = state.bossHp / state.bossMaxHp;
      this.bossBarFill.width = BOSS_BAR_W * ratio;
      this.bossBarFill.x = this.bossBarX;
    }
  }

  private bump(target: Phaser.GameObjects.Text): void {
    target.setScale(1);
    target.scene.tweens.add({
      targets: target,
      scale: { from: 1, to: 1.2 },
      duration: 100,
      yoyo: true,
      ease: "Back.easeOut",
    });
  }

  private pulseUrgent(): void {
    if (this.urgentTween?.isPlaying()) return;
    this.urgentTween = this.timeText.scene.tweens.add({
      targets: this.timeText,
      scale: { from: 1, to: 1.15 },
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private stopUrgentPulse(): void {
    this.urgentTween?.stop();
    this.urgentTween = undefined;
    this.timeText.setScale(1);
  }

  destroy(): void {
    this.scoreText.destroy();
    this.timeText.destroy();
    this.platingText.destroy();
    this.levelText.destroy();
    this.bossLabel.destroy();
    this.bossBarBg.destroy();
    this.bossBarFill.destroy();
    this.vitalityBarBg.destroy();
    this.vitalityBarFill.destroy();
  }
}
