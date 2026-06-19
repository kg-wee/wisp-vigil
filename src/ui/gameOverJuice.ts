import Phaser from "phaser";

export function applyGameOverJuice(
  scene: Phaser.Scene,
  title: Phaser.GameObjects.Text,
  survived: boolean
): void {
  title.setScale(0.3);
  title.setAlpha(0);

  scene.tweens.add({
    targets: title,
    scale: 1,
    alpha: 1,
    duration: 500,
    ease: "Back.easeOut",
  });

  if (survived) {
    scene.cameras.main.flash(450, 110, 200, 140);
  } else {
    scene.cameras.main.shake(280, 0.008);
    scene.cameras.main.flash(300, 80, 20, 20);
  }
}
