import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const BALCONY_MODEL_URL = "/models/balcony.glb";

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else {
      child.material?.dispose();
    }
  });
}

export function createBalcony(world) {
  const balcony = new THREE.Group();
  balcony.name = "Balcony";
  world.add(balcony);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  balcony.userData.dracoLoader = dracoLoader;

  loader.load(
    BALCONY_MODEL_URL,
    (gltf) => {
      if (world.userData.disposed) {
        disposeObject(gltf.scene);
        return;
      }

      const model = gltf.scene;
      model.name = "BalconyModel";

      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const largestDimension = Math.max(size.x, size.y, size.z);
      const scale = largestDimension > 0 ? 7 / largestDimension : 1;

      model.scale.setScalar(scale);
      model.rotation.y = (Math.PI * 7) / 4;
      model.position.set(
        -center.x * scale,
        -bounds.min.y * scale,
        -center.z * scale,
      );

      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
      });

      balcony.add(model);
    },
    undefined,
    (error) => {
      console.error("No se pudo cargar el ambiente del final A.", error);
    },
  );

  // Punto de referencia temporal para ubicar a Legend más adelante.
  const legendMarker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.95, 0.12, 32),
    new THREE.MeshStandardMaterial({
      color: "#9388c8",
      emissive: "#4a3f81",
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.72,
    }),
  );
  legendMarker.name = "LegendPositionMarker";
  legendMarker.position.set(0, 0.04, -0.6);
  balcony.add(legendMarker);

  return balcony;
}
