import * as THREE from "three";

export function createNarrativeController(camera, particles) {
  const target = camera.userData.lookTarget || new THREE.Vector3(0, 3.15, 6);
  const initialPosition = camera.position.clone();

  return {
    name: "NarrativeController",
    update(elapsed) {
      camera.position.x = initialPosition.x + Math.sin(elapsed * 0.12) * 0.08;
      camera.position.y = initialPosition.y + Math.sin(elapsed * 0.18) * 0.025;
      camera.lookAt(target);
      particles.rotation.y = elapsed * 0.025;
      particles.position.y = Math.sin(elapsed * 0.4) * 0.04;
    },
  };
}
