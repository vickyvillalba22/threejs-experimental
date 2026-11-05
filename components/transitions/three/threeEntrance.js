import { animate } from "motion";
import * as THREE from "three";

const DEFAULT_DURATION = 1.8;
const DEFAULT_EASE = [0.16, 1, 0.3, 1];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function getOvershootScale(progress, startScale, overshootScale, overshootAt) {
  if (progress <= overshootAt) {
    const localProgress = progress / overshootAt;
    return THREE.MathUtils.lerp(startScale, overshootScale, localProgress);
  }

  const localProgress = (progress - overshootAt) / (1 - overshootAt);
  return THREE.MathUtils.lerp(overshootScale, 1, localProgress);
}

/**
 * Creates a reusable entrance controller for a Three.js Object3D.
 *
 * The root should be a dedicated Group that is not also controlled by the
 * scene's interaction loop. Existing scene motion can continue on the model
 * inside that Group while this controller handles the entrance transform.
 */
export function createThreeEntrance({
  root,
  materials = [],
  duration = DEFAULT_DURATION,
  delay = 0,
  startScale = 0.78,
  overshootScale = 1.04,
  overshootAt = 0.76,
  startPosition = { x: 0, y: -0.45, z: 0 },
  startRotation = { x: 0, y: -0.28, z: 0 },
  materialOpacity = (progress) => progress,
  reducedMotion = prefersReducedMotion(),
  onUpdate,
  onComplete,
}) {
  if (!root) {
    throw new Error("createThreeEntrance necesita un root de Three.js.");
  }

  const basePosition = root.position.clone();
  const baseScale = root.scale.clone();
  const baseRotation = root.rotation.clone();
  const entrancePosition = basePosition.clone().add(
    new THREE.Vector3(startPosition.x, startPosition.y, startPosition.z),
  );
  const entranceRotation = new THREE.Euler(
    baseRotation.x + startRotation.x,
    baseRotation.y + startRotation.y,
    baseRotation.z + startRotation.z,
  );

  let controls = null;

  function apply(progress) {
    root.position.lerpVectors(entrancePosition, basePosition, progress);
    root.rotation.set(
      THREE.MathUtils.lerp(entranceRotation.x, baseRotation.x, progress),
      THREE.MathUtils.lerp(entranceRotation.y, baseRotation.y, progress),
      THREE.MathUtils.lerp(entranceRotation.z, baseRotation.z, progress),
    );

    const scaleFactor = getOvershootScale(
      progress,
      startScale,
      overshootScale,
      overshootAt,
    );
    root.scale.copy(baseScale).multiplyScalar(scaleFactor);

    const opacity = materialOpacity(progress);
    materials.forEach((material) => {
      if (!material) return;
      material.opacity = opacity;
      material.needsUpdate = true;
    });

    onUpdate?.({ progress, root });
  }

  function start() {
    apply(0);

    if (reducedMotion) {
      apply(1);
      onComplete?.();
      return { stop() {} };
    }

    controls = animate(0, 1, {
      delay,
      duration,
      ease: DEFAULT_EASE,
      onUpdate: apply,
      onComplete: () => {
        controls = null;
        apply(1);
        onComplete?.();
      },
    });

    return controls;
  }

  function stop() {
    controls?.stop();
    controls = null;
  }

  return {
    apply,
    start,
    stop,
    basePosition,
    baseScale,
    baseRotation,
  };
}
