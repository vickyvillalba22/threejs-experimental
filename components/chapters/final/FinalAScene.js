"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createWorld } from "@/components/chapters/final/World";
import { createBalcony } from "@/components/chapters/final/Balcony";
import { createSky } from "@/components/chapters/final/Sky";
import { createLighting } from "@/components/chapters/final/Lighting";
import { createEffects } from "@/components/chapters/final/Effects";
import { createCamera } from "@/components/chapters/final/Camera";
import { createNarrativeController } from "@/components/chapters/final/NarrativeController";

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

export default function FinalAScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const world = createWorld(scene);
    createBalcony(world);
    createSky(world);
    createLighting(world);
    const { particles } = createEffects(world);
    const camera = createCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const narrativeController = createNarrativeController(camera, particles);
    const clock = new THREE.Clock();
    let animationFrameId;

    function resize() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function animate() {
      animationFrameId = window.requestAnimationFrame(animate);
      narrativeController.update(clock.getElapsedTime());
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      world.userData.disposed = true;
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
