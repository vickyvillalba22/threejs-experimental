import * as THREE from "three";

export function createEffects(world) {
  const effects = new THREE.Group();
  effects.name = "Effects";
  world.add(effects);

  const wishStars = new THREE.Group();
  wishStars.name = "WishStars";
  effects.add(wishStars);

  return { effects, particles: wishStars };
}
