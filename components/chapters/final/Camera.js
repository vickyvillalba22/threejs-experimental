import * as THREE from "three";

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 100);
  camera.name = "Camera";
  // Altura aproximada de los ojos del jugador, dentro del balcón.
  camera.position.set(0, 1.7, -3.3);
  camera.userData.lookTarget = new THREE.Vector3(0, 3.15, 6);
  camera.lookAt(camera.userData.lookTarget);
  return camera;
}
