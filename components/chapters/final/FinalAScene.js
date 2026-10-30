"use client";

import { useEffect, useRef, useState } from "react";
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

export default function FinalAScene({ wishes = [] }) {
  const containerRef = useRef(null);
  const wishesRef = useRef(wishes);
  const [hoveredWish, setHoveredWish] = useState(null);

  useEffect(() => {
    wishesRef.current = wishes;
  }, [wishes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const world = createWorld(scene);
    const balcony = createBalcony(world);
    createSky(world);
    createLighting(world);
    const { wishStars, wishStarTexture, syncWishStars } = createEffects(world);
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

    const narrativeController = createNarrativeController(camera);
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
      syncWishStars(wishesRef.current);
      wishStars.children.forEach((star) => {
        const phase = star.userData.phase || 0;
        const pulse = 0.72 + Math.sin(clock.getElapsedTime() * 1.5 + phase * 6.28) * 0.2;
        star.material.opacity = pulse;
        star.position.y = star.userData.baseY
          + Math.sin(clock.getElapsedTime() * 0.45 + phase * 6.28) * 0.08;
      });
      narrativeController.update(clock.getElapsedTime());
      renderer.render(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function handlePointerMove(event) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const [intersection] = raycaster.intersectObjects(wishStars.children, false);

      if (!intersection?.object.userData.wish) {
        setHoveredWish(null);
        return;
      }

      setHoveredWish({
        text: intersection.object.userData.wish.text,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    }

    function handlePointerLeave() {
      setHoveredWish(null);
    }

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      world.userData.disposed = true;
      balcony.userData.dracoLoader?.dispose();
      wishStarTexture?.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0" aria-label="Cielo de deseos">
      {hoveredWish && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs -translate-x-1/2 -translate-y-full border border-white/20 bg-black/75 px-3 py-2 text-center text-xs text-white shadow-[0_0_20px_rgba(255,220,140,0.18)] backdrop-blur-sm"
          style={{ left: hoveredWish.x, top: hoveredWish.y - 12 }}
        >
          <p className="text-[0.6rem] uppercase tracking-[0.14em] text-white/60">
            Deseo de otra persona
          </p>
          <p className="mt-1">{hoveredWish.text}</p>
        </div>
      )}
    </div>
  );
}
