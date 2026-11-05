import * as THREE from "three";

/**
 * Creates temporary material clones so an object can fade in without
 * mutating materials that may be shared by another mesh.
 *
 * Call restore() after the entrance finishes. It puts the original materials
 * back on the meshes and disposes the temporary clones.
 */
export function prepareThreeMaterials(
  root,
  { initialOpacity = 0, depthWrite = false } = {},
) {
  const meshRecords = [];
  const materialRecords = [];

  root.traverse((object) => {
    if (!object.isMesh || !object.material) return;

    const originalMaterial = object.material;
    const originalMaterials = Array.isArray(originalMaterial)
      ? originalMaterial
      : [originalMaterial];

    const animatedMaterials = originalMaterials.map((material) => {
      if (!material) return material;

      const animatedMaterial = material.clone();
      animatedMaterial.transparent = true;
      animatedMaterial.depthWrite = depthWrite;
      animatedMaterial.opacity = initialOpacity;
      animatedMaterial.needsUpdate = true;

      materialRecords.push({
        animatedMaterial,
        originalMaterial: material,
      });
      return animatedMaterial;
    });

    object.material = Array.isArray(originalMaterial)
      ? animatedMaterials
      : animatedMaterials[0];

    meshRecords.push({
      mesh: object,
      originalMaterial,
    });
  });

  let isRestored = false;

  function setOpacity(opacity) {
    if (isRestored) return;

    materialRecords.forEach(({ animatedMaterial }) => {
      animatedMaterial.opacity = opacity;
      animatedMaterial.needsUpdate = true;
    });
  }

  function commit() {
    if (isRestored) return;

    materialRecords.forEach(({ animatedMaterial, originalMaterial }) => {
      animatedMaterial.opacity = originalMaterial.opacity;
      animatedMaterial.transparent = originalMaterial.transparent;
      animatedMaterial.depthWrite = originalMaterial.depthWrite;
      animatedMaterial.needsUpdate = true;
    });
  }

  function restore() {
    if (isRestored) return;
    isRestored = true;

    meshRecords.forEach(({ mesh, originalMaterial }) => {
      mesh.material = originalMaterial;
    });

    materialRecords.forEach(({ animatedMaterial }) => {
      animatedMaterial.dispose();
    });
  }

  return {
    materials: materialRecords.map(({ animatedMaterial }) => animatedMaterial),
    commit,
    setOpacity,
    restore,
  };
}

export function createThreeEntranceRoot(parent) {
  const root = new THREE.Group();
  parent.add(root);
  return root;
}
