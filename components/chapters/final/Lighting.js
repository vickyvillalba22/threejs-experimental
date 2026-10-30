import * as THREE from "three";

export function createLighting(world) {
  const lighting = new THREE.Group();
  lighting.name = "Lighting";
  world.add(lighting);

  const ambient = new THREE.HemisphereLight("#737bb0", "#090a12", 0.55);
  lighting.add(ambient);

  const moonLight = new THREE.DirectionalLight("#d5d3c9", 2.4);
  moonLight.position.set(-14, 10, -1);
  moonLight.target.position.set(5.5, 8.5, 10);
  lighting.add(moonLight, moonLight.target);

  const warmInteriorLight = new THREE.PointLight("#d18b68", 16, 8, 2);
  warmInteriorLight.position.set(0, 2.3, -1.7);
  lighting.add(warmInteriorLight);

  const markerLight = new THREE.PointLight("#7566d8", 9, 4, 2);
  markerLight.position.set(0, 0.8, -0.6);
  lighting.add(markerLight);

  return lighting;
}
