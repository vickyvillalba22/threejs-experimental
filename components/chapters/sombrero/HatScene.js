"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const HAT_MODEL_URL = "/models/main%20objects/top_hat__free_download.glb";

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

function createNoiseTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const image = context.createImageData(canvas.width, canvas.height);

  for (let index = 0; index < image.data.length; index += 4) {
    const value = 8 + Math.floor(Math.random() * 22);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value + 2;
    image.data[index + 3] = 255;
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

export default function HatScene({ onHatFlipped }) {
  const containerRef = useRef(null);
  const onHatFlippedRef = useRef(onHatFlipped);

  useEffect(() => {
    onHatFlippedRef.current = onHatFlipped;
  }, [onHatFlipped]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09090c");
    scene.fog = new THREE.FogExp2("#09090c", 0.035);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.2, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight("#505050", 0.42);
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.2);
    keyLight.position.set(3, 5, 4);

    const rimLight = new THREE.PointLight("#ffffff", 125, 12, 2);
    rimLight.position.set(-4, 2.5, -3);

    const topLight = new THREE.SpotLight("#ffffff", 85, 14, Math.PI / 5, 0.65, 1.5);
    topLight.position.set(-2.5, 5, 3);
    topLight.target.position.set(0, 0, 0);

    scene.add(ambientLight, keyLight, rimLight, topLight, topLight.target);

    const hatRoot = new THREE.Group();
    scene.add(hatRoot);

    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.6 + Math.random() * 1.7;
      particlePositions[index * 3] = Math.cos(angle) * radius;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 3.8;
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    const particleMaterial = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.025,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.renderOrder = 1;
    scene.add(particles);

    let isDisposed = false;
    let hatObject = null;
    let hatBaseY = 0;
    let animationFrameId = null;
    let isDragging = false;
    let hasFlipped = false;
    let rotationX = 0;
    let rotationY = Math.PI;
    let lastPointer = { x: 0, y: 0 };
    const noiseTexture = createNoiseTexture();
    const loader = new GLTFLoader();

    function frameHat() {
      if (!hatObject) return;

      const bounds = new THREE.Box3().setFromObject(hatObject);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const largestDimension = Math.max(size.x, size.y, size.z);
      const modelScale = 3.2 / largestDimension;

      hatObject.scale.setScalar(modelScale);
      hatObject.position.set(
        -center.x * modelScale,
        -center.y * modelScale,
        -center.z * modelScale,
      );

      const framedBounds = new THREE.Box3().setFromObject(hatObject);
      const framedSize = framedBounds.getSize(new THREE.Vector3());
      const framedCenter = framedBounds.getCenter(new THREE.Vector3());
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const tanHalfFov = Math.tan(verticalFov / 2);
      const distanceForHeight = framedSize.y / (2 * tanHalfFov);
      const distanceForWidth = framedSize.x / (2 * tanHalfFov * camera.aspect);
      const distance = Math.max(distanceForHeight, distanceForWidth) * 2.25;

      camera.position.set(framedCenter.x, framedCenter.y + 0.1, framedCenter.z + distance);
      camera.lookAt(framedCenter.x, framedCenter.y, framedCenter.z);
      hatBaseY = hatObject.position.y;
    }

    loader.load(
      HAT_MODEL_URL,
      (gltf) => {
        if (isDisposed) {
          disposeObject(gltf.scene);
          return;
        }

        hatObject = gltf.scene;
        hatObject.rotation.set(rotationX, rotationY, 0);
        hatObject.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = false;
          object.receiveShadow = false;
          object.frustumCulled = false;

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if (!material) return;
            material.side = THREE.DoubleSide;
            material.map = noiseTexture;
            material.color?.set("#16171a");
            if ("roughness" in material) material.roughness = 0.74;
            if ("metalness" in material) material.metalness = 0.12;
            if ("emissive" in material) {
              material.emissive.set("#080808");
              material.emissiveIntensity = 0.12;
            }
            material.needsUpdate = true;
          });
        });

        hatRoot.add(hatObject);
        frameHat();
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el sombrero", error);
      },
    );

    function handlePointerDown(event) {
      isDragging = true;
      lastPointer = { x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!isDragging) return;

      const deltaX = event.clientX - lastPointer.x;
      const deltaY = event.clientY - lastPointer.y;
      lastPointer = { x: event.clientX, y: event.clientY };
      rotationY += deltaX * 0.01;
      rotationX = THREE.MathUtils.clamp(rotationX + deltaY * 0.01, -Math.PI, Math.PI);

      const isFlipped = rotationX <= -Math.PI * 0.7;
      if (isFlipped !== hasFlipped) {
        hasFlipped = isFlipped;
        onHatFlippedRef.current?.(isFlipped);
      }
    }

    function handlePointerUp(event) {
      isDragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointercancel", handlePointerUp);

    function resize() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      frameHat();
    }

    const clock = new THREE.Clock();
    function animate() {
      if (isDisposed) return;

      const elapsed = clock.getElapsedTime();
      if (hatObject) {
        hatObject.rotation.x = rotationX;
        hatObject.rotation.y = rotationY;
        hatObject.position.y = hatBaseY + Math.sin(elapsed * 0.9) * 0.035;
      }
      particles.rotation.y = elapsed * 0.025;
      particles.position.y = Math.sin(elapsed * 0.35) * 0.04;

      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener("resize", resize);
    animate();

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      if (hatObject) disposeObject(hatObject);
      noiseTexture.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-label="Sombrero de copa" />;
}
