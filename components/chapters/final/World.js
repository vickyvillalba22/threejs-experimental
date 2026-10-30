import * as THREE from "three";

export function createWorld(scene) {
  scene.background = new THREE.Color("#070914");
  scene.fog = new THREE.FogExp2("#070914", 0.018);

  const world = new THREE.Group();
  world.name = "World";
  scene.add(world);

  return world;
}
