// Centralized theme assets. Everything that plays backgroundMusicSrc
// (AudioToggle) reads from here.
export const THEME_CONFIG = {
  backgroundMusicSrc: "/assets/theme/space/audio/bgm-space.mp3",
  characterSprites: {
    boy: {
      idle: "/assets/theme/space/character/astroboy-idle.png",
      yay: "/assets/theme/space/character/astroboy-yay.png",
    },
    girl: {
      idle: "/assets/theme/space/character/astrogirl-idle.png",
      yay: "/assets/theme/space/character/astrogirl-yay.png",
    },
  },
  coinSprites: {
    glow: "/assets/theme/space/coin/coin-glow.png",
    burst: "/assets/theme/space/coin/coin-burst.png",
  },
  rewardSprites: {
    closed: "/assets/theme/space/reward/gift-closed.png",
    opened: "/assets/theme/space/reward/gift-opened.png",
  },
  // Margin decorations, split by how often each should appear (see
  // src/lib/decorations.ts). The 3 biggest assets read as "landmarks" and
  // stay rare; the rest are small enough to scatter more freely.
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
};
