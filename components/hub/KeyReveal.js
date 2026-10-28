"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const KEY_GLOW_DURATION = 650;

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(0.18, "rgba(255, 255, 255, 0.42)");
  gradient.addColorStop(0.55, "rgba(255, 255, 255, 0.12)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

export default function KeyReveal({ originRef, onComplete }) {
  const canvasRef = useRef(null);
  const glowRef = useRef(false);
  const completeTimeoutRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const [isGlowing, setIsGlowing] = useState(false);
  const [buttonPosition, setButtonPosition] = useState(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const updateButtonPosition = useCallback(() => {
    const canvas = canvasRef.current;
    const origin = originRef.current;
    if (!canvas || !origin) return;

    const stage = canvas.parentElement;
    const stageBounds = stage.getBoundingClientRect();
    const originBounds = origin.getBoundingClientRect();
    setButtonPosition({
      left: originBounds.left - stageBounds.left + originBounds.width / 2,
      top: originBounds.top - stageBounds.top + originBounds.height / 2,
    });
  }, [originRef]);

  function handleKeyClick() {
    if (glowRef.current) return;
    glowRef.current = true;
    setIsGlowing(true);
    completeTimeoutRef.current = window.setTimeout(() => {
      onCompleteRef.current();
    }, KEY_GLOW_DURATION);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originRef.current) return undefined;

    const stage = canvas.parentElement;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    camera.position.z = 10;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "prehub-key-reveal__canvas";
    canvas.style.display = "none";
    stage.appendChild(renderer.domElement);

    const keyGroup = new THREE.Group();
    scene.add(keyGroup);
    const keyMaterials = [];
    const haloTexture = createGlowTexture();
    const haloMaterial = new THREE.SpriteMaterial({
      map: haloTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMaterial);
    halo.position.z = -0.18;
    halo.scale.set(3.9, 3.9, 1);
    keyGroup.add(halo);
    const loader = new GLTFLoader();
    let isDisposed = false;

    loader.load(
      "/models/main%20objects/magic_key.glb",
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const modelSize = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(4.1 / Math.max(modelSize, 0.001));
        // The source model is rotated onto its side; keep its face toward the camera.
        model.rotation.y = Math.PI / 2;
        model.traverse((object) => {
          if (!object.isMesh) return;
          const material = new THREE.MeshPhysicalMaterial({
            color: 0xf2f2f2,
            emissive: 0xffffff,
            emissiveIntensity: 0.16,
            metalness: 0.08,
            roughness: 0.08,
            transmission: 0.86,
            thickness: 0.35,
            ior: 1.45,
            transparent: true,
            opacity: 0.62,
            depthWrite: false,
          });
          keyMaterials.push(material);
          object.material = material;
        });
        keyGroup.add(model);
      },
      undefined,
      () => undefined,
    );

    scene.add(new THREE.AmbientLight(0xffe8bd, 2.2));
    const keyLight = new THREE.PointLight(0xffffff, 24, 12);
    keyLight.position.set(0, 1, 4);
    scene.add(keyLight);

    let target = new THREE.Vector3();
    let start = new THREE.Vector3();
    const startedAt = performance.now();

    function resize() {
      const bounds = stage.getBoundingClientRect();
      const aspect = bounds.width / Math.max(bounds.height, 1);
      camera.left = -5 * aspect;
      camera.right = 5 * aspect;
      camera.top = 5;
      camera.bottom = -5;
      camera.updateProjectionMatrix();
      renderer.setSize(bounds.width, bounds.height, false);

      const originBounds = originRef.current?.getBoundingClientRect();
      if (!originBounds) return;
      const x = originBounds.left - bounds.left + originBounds.width / 2;
      const y = originBounds.top - bounds.top + originBounds.height / 2;
      target = new THREE.Vector3((x / bounds.width - 0.5) * 10 * aspect, (0.5 - y / bounds.height) * 10, 0);
      start = target.clone().add(new THREE.Vector3(0, -1.8, 0));
      updateButtonPosition();
    }

    let animationFrame;
    function animate(timestamp) {
      const progress = Math.min((timestamp - startedAt) / 900, 1);
      const ease = 1 - (1 - progress) ** 3;
      keyGroup.position.lerpVectors(start, target, ease);
      keyGroup.position.y += Math.sin(timestamp * 0.0022) * 0.08;
      keyGroup.rotation.y = 0;
      keyGroup.rotation.z = Math.sin(timestamp * 0.0018) * 0.08;
      const pulse = 0.5 + Math.sin(timestamp * 0.004) * 0.12;
      const glow = glowRef.current ? 1.4 : pulse;
      keyMaterials.forEach((material) => {
        material.emissiveIntensity = glow;
      });
      haloMaterial.opacity = glowRef.current ? 0.8 : 0.22 + pulse * 0.12;
      halo.scale.setScalar(glowRef.current ? 4.6 : 3.9 + pulse * 0.18);
      keyLight.intensity = glowRef.current ? 42 : 20 + pulse * 8;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      if (completeTimeoutRef.current !== null) window.clearTimeout(completeTimeoutRef.current);
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      haloTexture.dispose();
      haloMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      canvas.style.display = "";
    };
  }, [originRef, updateButtonPosition]);

  return (
    <>
      <canvas ref={canvasRef} className="prehub-key-reveal__canvas" aria-hidden="true" />
      {buttonPosition && (
        <button
          type="button"
          className={`prehub-key-reveal__button ${isGlowing ? "is-glowing" : ""}`}
          style={{ left: buttonPosition.left, top: buttonPosition.top }}
          onClick={handleKeyClick}
          aria-label="Recoger la llave mágica"
        />
      )}
    </>
  );
}
