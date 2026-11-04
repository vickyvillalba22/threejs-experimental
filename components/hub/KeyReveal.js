"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "@/components/hub/PreHub.module.css";

const KEY_GLOW_DURATION = 650;
const KEY_APPEAR_DURATION = 700;
const KEY_TRAVEL_DELAY = 250;
const KEY_TRAVEL_DURATION = 1200;
const KEY_COLOR_RESTORE_DURATION = 500;
const KEY_START_SCALE = 0.72;
const KEY_ORIGIN_SCALE = 0.92;
const KEY_CENTER_SCALE = 2.5;

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

export default function KeyReveal({ originRef, onComplete, onCenterReached }) {
  const canvasRef = useRef(null);
  const glowRef = useRef(false);
  const completeTimeoutRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onCenterReachedRef = useRef(onCenterReached);
  const centerReachedRef = useRef(false);
  const hoverRef = useRef(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [buttonPosition, setButtonPosition] = useState(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCenterReachedRef.current = onCenterReached;
  }, [onComplete, onCenterReached]);

  const updateButtonPosition = useCallback((position) => {
    const canvas = canvasRef.current;
    const origin = originRef.current;
    if (!canvas || !origin) return;

    if (position) {
      setButtonPosition(position);
      return;
    }

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
    renderer.domElement.className = styles["prehub-key-reveal__canvas"];
    canvas.style.display = "none";
    stage.appendChild(renderer.domElement);

    const keyGroup = new THREE.Group();
    scene.add(keyGroup);
    const keyMaterials = [];
    const colorRevealUniform = { value: 0 };
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
           const sourceMaterial = Array.isArray(object.material)
             ? object.material[0]
             : object.material;
           const material = new THREE.MeshPhysicalMaterial({
             color: sourceMaterial.color?.clone() ?? new THREE.Color(0xffffff),
             map: sourceMaterial.map ?? null,
             emissive: sourceMaterial.emissive?.clone() ?? new THREE.Color(0xffffff),
             emissiveMap: sourceMaterial.emissiveMap ?? null,
             emissiveIntensity: 0.16,
             metalness: 0.08,
             metalnessMap: sourceMaterial.metalnessMap ?? null,
             roughness: 0.08,
             roughnessMap: sourceMaterial.roughnessMap ?? null,
             normalMap: sourceMaterial.normalMap ?? null,
             transmission: 0.86,
             thickness: 0.35,
             ior: 1.45,
             transparent: true,
             opacity: 0.62,
             depthWrite: false,
             side: THREE.DoubleSide,
           });
           material.userData.baseOpacity = sourceMaterial.opacity ?? 1;
           material.userData.baseTransmission = sourceMaterial.transmission ?? 0;
           material.onBeforeCompile = (shader) => {
             shader.uniforms.uColorReveal = colorRevealUniform;
             shader.fragmentShader = `
               uniform float uColorReveal;
               ${shader.fragmentShader}
             `.replace(
               "#include <map_fragment>",
               `#include <map_fragment>
               diffuseColor.rgb = mix(vec3(1.0), diffuseColor.rgb, uColorReveal);`,
             ).replace(
               "#include <emissivemap_fragment>",
               `vec3 baseEmissiveRadiance = totalEmissiveRadiance;
               #include <emissivemap_fragment>
               totalEmissiveRadiance = mix(baseEmissiveRadiance, totalEmissiveRadiance, uColorReveal);`,
             );
           };
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

    let originTarget = new THREE.Vector3();
    const centerTarget = new THREE.Vector3(0, 0, 0);
    let startTarget = new THREE.Vector3();
    let originScreenPosition = { left: 0, top: 0 };
    let centerScreenPosition = { left: 0, top: 0 };
    let hoverStrength = 0;
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
      originTarget = new THREE.Vector3((x / bounds.width - 0.5) * 10 * aspect, (0.5 - y / bounds.height) * 10, 0);
      startTarget = originTarget.clone().add(new THREE.Vector3(0, -0.8, 0));
      originScreenPosition = { left: x, top: y };
      centerScreenPosition = { left: bounds.width / 2, top: bounds.height / 2 };
      updateButtonPosition(originScreenPosition);
    }

    let animationFrame;
    function animate(timestamp) {
      const elapsed = timestamp - startedAt;
      const appearProgress = Math.min(elapsed / KEY_APPEAR_DURATION, 1);
      const appearEase = 1 - (1 - appearProgress) ** 3;
      const travelProgress = Math.min(
        Math.max((elapsed - KEY_TRAVEL_DELAY - KEY_APPEAR_DURATION) / KEY_TRAVEL_DURATION, 0),
        1,
      );
      const travelEase = 1 - (1 - travelProgress) ** 3;

      if (travelProgress > 0) {
        keyGroup.position.lerpVectors(originTarget, centerTarget, travelEase);
      } else {
        keyGroup.position.lerpVectors(startTarget, originTarget, appearEase);
      }

      const appearScale = KEY_START_SCALE + (KEY_ORIGIN_SCALE - KEY_START_SCALE) * appearEase;
      const keyScale = appearScale + (KEY_CENTER_SCALE - KEY_ORIGIN_SCALE) * travelEase;
      keyGroup.scale.setScalar(keyScale * (glowRef.current ? 1.06 : 1));

      const colorRestoreProgress = Math.min(
        Math.max(
          (elapsed - KEY_APPEAR_DURATION - KEY_TRAVEL_DELAY - KEY_TRAVEL_DURATION) /
            KEY_COLOR_RESTORE_DURATION,
          0,
        ),
        1,
      );
      const colorRestoreEase = 1 - (1 - colorRestoreProgress) ** 3;
      colorRevealUniform.value = colorRestoreEase;

      hoverStrength += ((hoverRef.current ? 1 : 0) - hoverStrength) * 0.12;

      if (travelProgress >= 1 && !centerReachedRef.current) {
        centerReachedRef.current = true;
        onCenterReachedRef.current?.();
      }

      const screenProgress = travelEase;
      updateButtonPosition({
        left: originScreenPosition.left + (centerScreenPosition.left - originScreenPosition.left) * screenProgress,
        top: originScreenPosition.top + (centerScreenPosition.top - originScreenPosition.top) * screenProgress,
      });

      keyGroup.position.y += Math.sin(timestamp * 0.0022) * 0.08;
      keyGroup.rotation.y = Math.sin(timestamp * 0.002) * hoverStrength * 0.16;
      keyGroup.rotation.z = Math.sin(timestamp * 0.0018) * 0.08;
      const pulse = 0.5 + Math.sin(timestamp * 0.004) * 0.12;
      const glow = glowRef.current ? 1.4 : pulse + hoverStrength * 0.65;
      keyMaterials.forEach((material) => {
        material.emissiveIntensity = glow * (1 - colorRestoreEase) + 0.05 * colorRestoreEase;
        material.opacity = 0.62 + (material.userData.baseOpacity - 0.62) * colorRestoreEase;
        material.transmission = 0.86 + (material.userData.baseTransmission - 0.86) * colorRestoreEase;
      });
       haloMaterial.opacity = glowRef.current ? 0.8 : 0.22 + pulse * 0.12 + hoverStrength * 0.28;
       halo.scale.setScalar(glowRef.current ? 4.6 : 3.9 + pulse * 0.18 + hoverStrength * 0.65);
       keyLight.intensity = glowRef.current ? 42 : 20 + pulse * 8 + hoverStrength * 10;
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
      <canvas ref={canvasRef} className={styles["prehub-key-reveal__canvas"]} aria-hidden="true" />
      {buttonPosition && (
        <button
          type="button"
          className={`${styles["prehub-key-reveal__button"]} ${isGlowing ? styles["is-glowing"] : ""}`}
          style={{ left: buttonPosition.left, top: buttonPosition.top }}
          onClick={handleKeyClick}
          onPointerEnter={() => { hoverRef.current = true; }}
          onPointerLeave={() => { hoverRef.current = false; }}
          onFocus={() => { hoverRef.current = true; }}
          onBlur={() => { hoverRef.current = false; }}
          aria-label="Recoger la llave mágica"
        />
      )}
    </>
  );
}
