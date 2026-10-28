import * as THREE from "three";

export function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3;
}

export function getWorldPointAtScreenPosition(camera, x, y) {
  const targetNdc = new THREE.Vector3(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1,
    0,
  );
  const targetOnCameraPlane = targetNdc.unproject(camera);
  const targetDirection = targetOnCameraPlane.sub(camera.position).normalize();
  const targetDistance = -camera.position.z / targetDirection.z;

  return camera.position.clone().add(targetDirection.multiplyScalar(targetDistance));
}
