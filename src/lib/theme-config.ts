// Centralized theme assets. Everything that plays backgroundMusicSrc
// (AudioToggle) reads from here.
//
// coin/reward/audio/mute-icon are identical across every theme by product
// decision, so they live under public/assets/shared/ instead of being
// duplicated per theme. characterSprites and decorations differ per theme,
// keyed under `themes` by the orders.template value — though nothing in the
// app actually reads `template` yet (see PROJECT_STATUS.md), so every
// consumer is still hardcoded to `themes.space` for now.
export const THEME_CONFIG = {
  backgroundMusicSrc: "/assets/shared/audio/bgm-space.mp3",
  muteIcons: {
    on: "/assets/shared/icons/icon-sound-on.png",
    off: "/assets/shared/icons/icon-sound-off.png",
  },
  coinSprites: {
    glow: "/assets/shared/coin/coin-glow.png",
    burst: "/assets/shared/coin/coin-burst.png",
  },
  rewardSprites: {
    closed: "/assets/shared/reward/gift-closed.png",
    opened: "/assets/shared/reward/gift-opened.png",
  },
  themes: {
    space: {
      characterSprites: {
        boy: {
          idle: "/assets/theme/space/characters/astroboy-idle.png",
          yay: "/assets/theme/space/characters/astroboy-yay.png",
        },
        girl: {
          idle: "/assets/theme/space/characters/astrogirl-idle.png",
          yay: "/assets/theme/space/characters/astrogirl-yay.png",
        },
      },
      // Margin decorations, split by how often each should appear (see
      // src/lib/decorations.ts). The 3 biggest assets read as "landmarks"
      // and stay rare; the rest are small enough to scatter more freely.
      decorations: {
        large: [
          { key: "saturn-planet", src: "/assets/theme/space/decorations/saturn-planet.png", width: 200, height: 200 },
          { key: "striped-planet", src: "/assets/theme/space/decorations/striped-planet.png", width: 150, height: 150 },
          { key: "rocket", src: "/assets/theme/space/decorations/rocket.png", width: 120, height: 150 },
        ],
        small: [
          { key: "small-moon", src: "/assets/theme/space/decorations/small-moon.png", width: 100, height: 100 },
          { key: "crescent-moon", src: "/assets/theme/space/decorations/crescent-moon.png", width: 120, height: 120 },
          { key: "large-star", src: "/assets/theme/space/decorations/large-star.png", width: 100, height: 100 },
          { key: "star-cluster", src: "/assets/theme/space/decorations/star-cluster.png", width: 80, height: 80 },
          { key: "asteroid", src: "/assets/theme/space/decorations/asteroid.png", width: 80, height: 80 },
          { key: "comet", src: "/assets/theme/space/decorations/comet.png", width: 120, height: 80 },
          { key: "ufo", src: "/assets/theme/space/decorations/ufo.png", width: 120, height: 80 },
        ],
      },
    },
    // Not selectable anywhere in the app yet (ThemeSelectStep.tsx still
    // only offers "space"). Assets exist and are wired here so the data is
    // ready, but the large/small split and display sizes below are a
    // first-pass reading of the art, not visually tuned or reviewed the
    // way space's is — revisit before this theme actually ships.
    dinosaur: {
      characterSprites: {
        boy: {
          idle: "/assets/theme/dinosaur/characters/dinoboy-idle.png",
          yay: "/assets/theme/dinosaur/characters/dinoboy-yay.png",
        },
        girl: {
          idle: "/assets/theme/dinosaur/characters/dinogirl-idle.png",
          yay: "/assets/theme/dinosaur/characters/dinogirl-yay.png",
        },
      },
      decorations: {
        large: [
          { key: "volcano", src: "/assets/theme/dinosaur/decorations/volcano.png", width: 160, height: 160 },
          { key: "trees", src: "/assets/theme/dinosaur/decorations/trees.png", width: 160, height: 160 },
          { key: "dino-00", src: "/assets/theme/dinosaur/decorations/dino-00.png", width: 160, height: 160 },
          { key: "dino-01", src: "/assets/theme/dinosaur/decorations/dino-01.png", width: 160, height: 160 },
          { key: "dino-02", src: "/assets/theme/dinosaur/decorations/dino-02.png", width: 160, height: 160 },
          { key: "dino-03", src: "/assets/theme/dinosaur/decorations/dino-03.png", width: 160, height: 160 },
          { key: "dino-04", src: "/assets/theme/dinosaur/decorations/dino-04.png", width: 160, height: 160 },
          { key: "dino-05", src: "/assets/theme/dinosaur/decorations/dino-05.png", width: 160, height: 160 },
        ],
        small: [
          { key: "baby-dino-01", src: "/assets/theme/dinosaur/decorations/baby-dino-01.png", width: 90, height: 90 },
          { key: "baby-dino-02", src: "/assets/theme/dinosaur/decorations/baby-dino-02.png", width: 90, height: 90 },
          { key: "baby-dino-03", src: "/assets/theme/dinosaur/decorations/baby-dino-03.png", width: 90, height: 90 },
          { key: "baby-dino-04", src: "/assets/theme/dinosaur/decorations/baby-dino-04.png", width: 90, height: 90 },
          { key: "baby-dino-05", src: "/assets/theme/dinosaur/decorations/baby-dino-05.png", width: 90, height: 90 },
          { key: "baby-dino-06", src: "/assets/theme/dinosaur/decorations/baby-dino-06.png", width: 90, height: 90 },
          { key: "bone", src: "/assets/theme/dinosaur/decorations/bone.png", width: 90, height: 90 },
          { key: "egg", src: "/assets/theme/dinosaur/decorations/egg.png", width: 90, height: 90 },
          { key: "footprint", src: "/assets/theme/dinosaur/decorations/footprint.png", width: 90, height: 90 },
          { key: "leaf", src: "/assets/theme/dinosaur/decorations/leaf.png", width: 90, height: 90 },
          { key: "mushroom", src: "/assets/theme/dinosaur/decorations/mushroom.png", width: 90, height: 90 },
          { key: "rocks", src: "/assets/theme/dinosaur/decorations/rocks.png", width: 90, height: 90 },
        ],
      },
    },
  },
};
