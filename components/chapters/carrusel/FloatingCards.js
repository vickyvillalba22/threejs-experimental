import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createThreeEntrance } from "@/components/transitions/three";

const CARD_VALUES = ["CherviTuz", "Chervi2", "Chervi3", "Chervi4", "Chervi5", "Chervi6", "Chervi7"];
const CARD_POSITIONS = [
  [-1.35, 0.35, 1.35],
  [-0.65, 1.0, 1.75],
  [0.05, 0.25, 2.0],
  [0.75, 1.05, 1.65],
  [1.45, 0.35, 1.15],
  [1.25, 0.8, -0.85],
  [-1.05, 0.5, -1.25],
];

function valueFromName(name) {
  return name === "CherviTuz" ? 1 : Number(name.replace("Chervi", ""));
}

export function createFloatingCards({ scene, camera, renderer, carouselRoot, onCardFound }) {
  const cardsRoot = new THREE.Group();
  cardsRoot.name = "floating-cards";
  cardsRoot.renderOrder = 1;
  carouselRoot.add(cardsRoot);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const interactiveMeshes = [];
  const clock = new THREE.Clock();
  let isDisposed = false;
  let pointerDown = null;
  let cardsLoaded = false;
  let pendingCompletionCallback = null;
  let completionAnimation = null;
  const entranceControllers = [];

  const completionDuration = 1900;
  const completionStagger = 90;

  function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function handlePointerDown(event) {
    pointerDown = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event) {
    if (!pointerDown) return;
    const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (distance > 8) return;
    if (completionAnimation) return;

    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(interactiveMeshes, false)[0];
    const cardAnchor = hit?.object.userData.cardAnchor;
    if (!cardAnchor || cardAnchor.userData.found) return;

    cardAnchor.userData.found = true;
    cardAnchor.visible = false;
    onCardFound?.(cardAnchor.userData.value);
  }

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);

  const loader = new GLTFLoader();
  loader.load(
    "/models/cards.glb",
    (gltf) => {
      if (isDisposed) return;

      const cardGroups = new Map();
      gltf.scene.traverse((object) => {
        if (!object.isMesh || !object.parent) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const frontMaterial = materials.find((material) => CARD_VALUES.includes(material?.name));
        if (frontMaterial) cardGroups.set(frontMaterial.name, object.parent);
      });

      CARD_VALUES.forEach((cardValue, index) => {
        const sourceCard = cardGroups.get(cardValue);
        if (!sourceCard) return;

        const card = sourceCard.clone(true);
        card.position.set(0, 0, 0);
        card.rotation.set(0, 0, 0);
        card.quaternion.identity();
        card.scale.setScalar(1);
        card.matrix.identity();
        card.matrixWorld.identity();
        card.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(card);
        const center = bounds.getCenter(new THREE.Vector3());
        const anchor = new THREE.Group();
        anchor.userData.value = valueFromName(cardValue);
        anchor.userData.found = false;
        anchor.position.fromArray(CARD_POSITIONS[index]);
        anchor.userData.basePosition = anchor.position.clone();
        anchor.userData.tilt = 0.08 * (index % 2 ? 1 : -1);

        card.position.set(-center.x, -center.y, -center.z);
        card.scale.setScalar(0.28);
        card.traverse((object) => {
          if (!object.isMesh) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          const isBack = materials.some((material) => material?.name === "Oborot");
          object.visible = !isBack;
          object.frustumCulled = false;
          object.renderOrder = 1;
          object.userData.cardAnchor = anchor;
          materials.forEach((material) => {
            if (!material) return;
            material.side = THREE.DoubleSide;
            material.depthTest = true;
            material.depthWrite = true;
            material.transparent = false;
            material.opacity = 1;
            material.needsUpdate = true;
          });
        });

        const cardEntranceRoot = new THREE.Group();
        cardEntranceRoot.name = `card-entrance-${index + 1}`;
        anchor.userData.cardObject = card;
        cardEntranceRoot.add(card);
        anchor.add(cardEntranceRoot);
        cardsRoot.add(anchor);
        card.traverse((object) => {
          if (object.isMesh && object.visible) interactiveMeshes.push(object);
        });

        const entrance = createThreeEntrance({
          root: cardEntranceRoot,
          duration: 1.15,
          delay: index * 0.1,
          startScale: 0.18,
          startPosition: { x: 0, y: -0.22, z: -0.12 },
          startRotation: { x: 0.08, y: -0.18, z: anchor.userData.tilt },
        });
        entranceControllers.push(entrance);
        entrance.start();
      });

      cardsLoaded = true;
      if (pendingCompletionCallback) {
        const callback = pendingCompletionCallback;
        pendingCompletionCallback = null;
        startCompletionAnimation(callback);
      }
    },
    undefined,
    (error) => console.error("No se pudieron cargar las cartas", error),
  );

  function startCompletionAnimation(onComplete) {
    if (isDisposed) return;
    if (!cardsLoaded) {
      pendingCompletionCallback = onComplete;
      return;
    }
    if (completionAnimation) return;

    cardsRoot.children.forEach((anchor, index) => {
      anchor.visible = true;
      anchor.position.copy(anchor.userData.basePosition);
      anchor.rotation.set(0, 0, 0);
      anchor.scale.setScalar(1);
      anchor.userData.completionStart = anchor.position.clone();
      anchor.userData.completionIndex = index;
    });

    completionAnimation = {
      startedAt: performance.now(),
      onComplete,
    };
  }

  function update() {
    if (completionAnimation) {
      const elapsed = performance.now() - completionAnimation.startedAt;
      const totalDuration = completionDuration + completionStagger * Math.max(cardsRoot.children.length - 1, 0);
      const progress = Math.min(elapsed / totalDuration, 1);

      cardsRoot.children.forEach((anchor) => {
        const index = anchor.userData.completionIndex || 0;
        const start = anchor.userData.completionStart;
        const localProgress = Math.min(
          Math.max((elapsed - index * completionStagger) / completionDuration, 0),
          1,
        );
        const easedProgress = 1 - (1 - localProgress) ** 3;
        const target = new THREE.Vector3(
          0,
          -0.2 + index * 0.012,
          0.48 + index * 0.018,
        );

        anchor.position.lerpVectors(start, target, easedProgress);
        anchor.rotation.z = anchor.userData.tilt * (1 - easedProgress);
         const card = anchor.userData.cardObject;
         if (card) {
          card.lookAt(camera.position);
          card.rotateY(Math.PI);
          card.rotateZ(anchor.rotation.z);
        }
      });

      if (progress >= 1) {
        cardsRoot.children.forEach((anchor) => {
          anchor.visible = false;
        });
        const callback = completionAnimation.onComplete;
        completionAnimation = null;
        callback?.();
      }
      return;
    }

    const elapsed = clock.getElapsedTime();
    cardsRoot.children.forEach((anchor, index) => {
      if (!anchor.userData.found) {
        const basePosition = anchor.userData.basePosition;
        anchor.position.y = basePosition.y + Math.sin(elapsed * 1.4 + index) * 0.08;
         const card = anchor.userData.cardObject;
         if (card) {
          card.lookAt(camera.position);
          card.rotateY(Math.PI);
          card.rotateZ(anchor.userData.tilt);
        }
      }
    });
  }

  return {
    update,
    playCompletionAnimation: startCompletionAnimation,
    dispose() {
      isDisposed = true;
      pendingCompletionCallback = null;
      completionAnimation = null;
      entranceControllers.forEach((entrance) => entrance.stop());
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      carouselRoot.remove(cardsRoot);
    },
  };
}
