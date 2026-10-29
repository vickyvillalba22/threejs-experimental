"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function CarruselScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09090c");
    scene.fog = new THREE.FogExp2("#09090c", 0.035);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 1.2, 8);
    // Desplazamiento visual del carrusel respecto del panel izquierdo.
    const viewTargetX = 0.3;
    const viewTargetYOffset = -0.37;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight("#77778a", 1.4);
    const keyLight = new THREE.DirectionalLight("#fff4dc", 4.5);
    keyLight.position.set(3, 6, 5);
    const rimLight = new THREE.PointLight("#9ca8ff", 90, 12, 2);
    rimLight.position.set(-4, 2, -3);
    scene.add(ambientLight, keyLight, rimLight);

    const carouselRoot = new THREE.Group();
    carouselRoot.position.x = 1.35;
    scene.add(carouselRoot);

    const mistParticleCount = 420;
    const mistPositions = new Float32Array(mistParticleCount * 3);
    const mistPhases = new Float32Array(mistParticleCount);
    for (let i = 0; i < mistParticleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.random() * 0.65;
      const index = i * 3;
      mistPositions[index] = Math.cos(angle) * radius * 1.05;
      mistPositions[index + 1] = (Math.random() - 0.5) * 4.4;
      mistPositions[index + 2] = Math.sin(angle) * radius * 0.7;
      mistPhases[i] = Math.random() * Math.PI * 2;
    }

    const mistGeometry = new THREE.BufferGeometry();
    mistGeometry.setAttribute("position", new THREE.BufferAttribute(mistPositions, 3));
    mistGeometry.setAttribute("aPhase", new THREE.BufferAttribute(mistPhases, 1));
    const mistMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;

        void main() {
          vec3 animatedPosition = position;
          animatedPosition.x += sin(uTime * 0.22 + aPhase) * 0.08;
          animatedPosition.y += sin(uTime * 0.34 + aPhase * 1.7) * 0.12;
          animatedPosition.z += cos(uTime * 0.18 + aPhase) * 0.06;

          vec4 modelViewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
          gl_Position = projectionMatrix * modelViewPosition;
          gl_PointSize = 48.0 / max(1.0, -modelViewPosition.z);
          vAlpha = 0.45 + 0.35 * sin(uTime * 0.3 + aPhase);
        }
      `,
      fragmentShader: `
        varying float vAlpha;

        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float softCircle = 1.0 - smoothstep(0.05, 0.5, distanceToCenter);
          gl_FragColor = vec4(vec3(1.0), softCircle * vAlpha * 0.5);
        }
      `,
    });
    const mistParticles = new THREE.Points(mistGeometry, mistMaterial);
    mistParticles.renderOrder = 2;
    carouselRoot.add(mistParticles);

    let isDisposed = false;
    let carouselReady = false;
    let carouselModel = null;
    const loader = new GLTFLoader();

    function frameCarousel() {
      const bounds = new THREE.Box3().setFromObject(carouselModel || carouselRoot);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const tanHalfFov = Math.tan(verticalFov / 2);
      const distanceForHeight = size.y / (2 * tanHalfFov);
      const distanceForWidth = size.x / (2 * tanHalfFov * camera.aspect);
      // Dejamos un poco más de margen para que el carrusel se vea más pequeño.
      const distance = Math.max(distanceForHeight, distanceForWidth) * 1.32;

      camera.position.set(viewTargetX, center.y + 0.15, center.z + distance);
      camera.lookAt(viewTargetX, center.y + viewTargetYOffset, center.z);
    }

    loader.load(
      "/models/carousel_spinning.glb",
      (gltf) => {
        if (isDisposed) {
          gltf.scene.traverse((object) => {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material?.dispose();
            }
          });
          return;
        }

        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const largestDimension = Math.max(size.x, size.y, size.z);
        const modelScale = 4.8 / largestDimension;

        // Normalizamos el modelo para que la escena pueda trabajar con una
        // escala manejable y dejamos su centro en el origen de rotación.
        gltf.scene.position.set(
          -center.x * modelScale,
          -center.y * modelScale,
          -center.z * modelScale,
        );
        gltf.scene.scale.setScalar(modelScale);
        gltf.scene.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = false;
          object.receiveShadow = false;

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if (!material) return;

            // Convertimos todo el carrusel a una superficie blanca y neutra,
            // sin conservar los colores ni las texturas originales.
            material.map = null;
            material.vertexColors = false;
            material.color?.set("#ffffff");
            material.transparent = true;
            material.opacity = 0.72;
            material.depthWrite = false;
            material.side = THREE.DoubleSide;

            if ("roughness" in material) material.roughness = 0.18;
            if ("metalness" in material) material.metalness = 0.05;
            if ("emissive" in material) {
              material.emissive.set("#ffffff");
              material.emissiveIntensity = 0.35;
            }
            if ("transmission" in material) {
              material.transmission = 0.2;
              material.thickness = 0.2;
              material.ior = 1.45;
            }

            material.needsUpdate = true;
          });
        });

        carouselRoot.add(gltf.scene);
        carouselModel = gltf.scene;
        carouselReady = true;
        frameCarousel();
        resize();
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el carrusel", error);
      },
    );

    const pointer = { active: false, x: 0 };

    function handlePointerDown(event) {
      pointer.active = true;
      pointer.x = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!pointer.active || !carouselReady) return;
      const deltaX = event.clientX - pointer.x;
      pointer.x = event.clientX;
      carouselRoot.rotation.y += deltaX * 0.008;
    }

    function handlePointerUp(event) {
      pointer.active = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    }

    function resize() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (carouselReady) {
        frameCarousel();
      } else {
        camera.lookAt(viewTargetX, viewTargetYOffset, 0);
      }
      renderer.setSize(width, height, false);
    }

    let animationFrame;
    function animate() {
      animationFrame = window.requestAnimationFrame(animate);
      // El carrusel no gira solo: únicamente responde al arrastre del usuario.
      mistMaterial.uniforms.uTime.value = performance.now() * 0.001;
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointercancel", handlePointerUp);
    resize();
    animate();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[1] h-full w-full cursor-grab active:cursor-grabbing"
      aria-label="Carrusel mágico interactivo"
    />
  );
}
