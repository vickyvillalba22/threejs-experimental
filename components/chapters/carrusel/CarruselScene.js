"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { createFloatingCards } from "@/components/chapters/carrusel/FloatingCards";
import { createThreeEntrance } from "@/components/transitions/three";

const softReflectorShader = {
  name: "SoftReflectorShader",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    reflectivity: { value: 0.1 },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;

    #include <common>
    #include <logdepthbuf_pars_vertex>

    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float reflectivity;
    varying vec4 vUv;

    #include <logdepthbuf_pars_fragment>

    void main() {
      #include <logdepthbuf_fragment>

      vec3 reflection = texture2DProj(tDiffuse, vUv).rgb;
      vec3 surfaceColor = mix(color, reflection, reflectivity);
      gl_FragColor = vec4(surfaceColor, 1.0);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

export default function CarruselScene({
  onCardFound,
  isCardReveal = false,
  showDeck = false,
  onCardRevealComplete,
}) {
  const containerRef = useRef(null);
  const onCardFoundRef = useRef(onCardFound);
  const onCardRevealCompleteRef = useRef(onCardRevealComplete);
  const floatingCardsRef = useRef(null);
  const deckRootRef = useRef(null);
  const deckEntranceRef = useRef(null);
  const deckEntranceStartedRef = useRef(false);
  const cardRevealActiveRef = useRef(isCardReveal);
  const showDeckRef = useRef(showDeck);

  useEffect(() => {
    onCardFoundRef.current = onCardFound;
  }, [onCardFound]);

  useEffect(() => {
    onCardRevealCompleteRef.current = onCardRevealComplete;
  }, [onCardRevealComplete]);

  useEffect(() => {
    cardRevealActiveRef.current = isCardReveal;
    if (isCardReveal) {
      floatingCardsRef.current?.playCompletionAnimation(() => {
        onCardRevealCompleteRef.current?.();
      });
    }
  }, [isCardReveal]);

  useEffect(() => {
    showDeckRef.current = showDeck;
    if (deckRootRef.current) {
      deckRootRef.current.visible = showDeck;
    }
    if (showDeck && deckEntranceRef.current && !deckEntranceStartedRef.current) {
      deckEntranceStartedRef.current = true;
      deckEntranceRef.current.start();
    }
  }, [showDeck]);

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
    const viewTargetYOffset = -0.48;

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
    const rimLight = new THREE.PointLight("#c49a78", 70, 12, 2);
    rimLight.position.set(-4, 2, -3);
    scene.add(ambientLight, keyLight, rimLight);

    // Piso de espejo negro: queda en la escena y no dentro del grupo del
    // carrusel, así el reflejo permanece quieto cuando el usuario lo gira.
    const floorGeometry = new THREE.PlaneGeometry(24, 24);
    const floorReflector = new Reflector(floorGeometry, {
      // La base coincide con el fondo para que el plano no se perciba como
      // una superficie gris; solo debe aparecer el reflejo del carrusel.
      color: "#09090c",
      clipBias: 0.003,
      textureWidth: 768,
      textureHeight: 768,
      multisample: 2,
      shader: softReflectorShader,
    });
    floorReflector.name = "black-glass-floor";
    floorReflector.rotation.x = -Math.PI / 2;
    floorReflector.position.y = -2.5;
    scene.add(floorReflector);

    const deckRoot = new THREE.Group();
    deckRoot.name = "destiny-card-deck";
    deckRoot.visible = showDeckRef.current;
    deckRoot.position.set(-1.8, 0, 0.45);
    const deckEntranceRoot = new THREE.Group();
    deckEntranceRoot.name = "destiny-card-deck-entrance";
    deckEntranceRoot.add(deckRoot);
    scene.add(deckEntranceRoot);
    deckRootRef.current = deckRoot;

    const carouselRoot = new THREE.Group();
    carouselRoot.position.x = 1.35;
    const carouselEntranceRoot = new THREE.Group();
    carouselEntranceRoot.name = "carousel-entrance";
    carouselEntranceRoot.add(carouselRoot);
    scene.add(carouselEntranceRoot);

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
    let deckModel = null;
    let deckBottom = 0;
    let carouselEntrance = null;
    let deckEntrance = null;
    const loader = new GLTFLoader();

    function positionDeck() {
      if (!deckModel) return;
      deckRoot.position.y = floorReflector.position.y - deckBottom + 0.08;
    }

    loader.load(
      "/models/main%20objects/deck_of_cards.glb",
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
        const modelScale = 1.65 / largestDimension;

        gltf.scene.position.set(
          -center.x * modelScale,
          -center.y * modelScale,
          -center.z * modelScale,
        );
        gltf.scene.scale.setScalar(modelScale);
        gltf.scene.updateMatrixWorld(true);

        const normalizedBounds = new THREE.Box3().setFromObject(gltf.scene);
        deckBottom = normalizedBounds.min.y;
        gltf.scene.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = false;
          object.receiveShadow = false;
        });

        deckModel = gltf.scene;
        deckRoot.add(deckModel);
        positionDeck();
        deckRoot.visible = showDeckRef.current;

        deckEntrance = createThreeEntrance({
          root: deckEntranceRoot,
          duration: 1.55,
          startScale: 0.7,
          startPosition: { x: 0, y: -0.32, z: -0.1 },
          startRotation: { x: 0.08, y: -0.24, z: 0.04 },
        });
        deckEntranceRef.current = deckEntrance;
        if (showDeckRef.current) {
          deckEntranceStartedRef.current = true;
          deckEntrance.start();
        }
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el mazo de cartas", error);
      },
    );

    function frameCarousel() {
      const bounds = new THREE.Box3().setFromObject(carouselModel || carouselRoot);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const tanHalfFov = Math.tan(verticalFov / 2);
      const distanceForHeight = size.y / (2 * tanHalfFov);
      const distanceForWidth = size.x / (2 * tanHalfFov * camera.aspect);
      // Dejamos más margen para que el carrusel entre completo y se aprecie
      // mejor el piso reflectante alrededor de la estructura.
      const distance = Math.max(distanceForHeight, distanceForWidth) * 1.52;

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
        gltf.scene.updateMatrixWorld(true);

        // El modelo se normaliza alrededor del origen, por eso calculamos la
        // base real después de escalarlo para que nunca parezca suspendido.
        const normalizedBounds = new THREE.Box3().setFromObject(gltf.scene);
        floorReflector.position.y = normalizedBounds.min.y - 0.035;
        positionDeck();

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
            material.depthWrite = true;
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

        keyLight.intensity = 1.8;
        rimLight.intensity = 24;
        mistParticles.scale.setScalar(0.8);
        carouselEntrance = createThreeEntrance({
          root: carouselEntranceRoot,
          duration: 1.9,
          startScale: 0.72,
          startPosition: { x: 0, y: -0.38, z: -0.2 },
          startRotation: { x: 0.06, y: -0.24, z: 0.03 },
          onUpdate: ({ progress }) => {
            keyLight.intensity = THREE.MathUtils.lerp(1.8, 4.5, progress);
            rimLight.intensity = THREE.MathUtils.lerp(24, 70, progress);
            mistParticles.scale.setScalar(THREE.MathUtils.lerp(0.8, 1, progress));
          },
        });
        carouselEntrance.start();
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el carrusel", error);
      },
    );

    const floatingCards = createFloatingCards({
      scene,
      camera,
      renderer,
      carouselRoot,
      onCardFound: (value) => onCardFoundRef.current?.(value),
    });
    floatingCardsRef.current = floatingCards;
    if (cardRevealActiveRef.current) {
      floatingCards.playCompletionAnimation(() => {
        onCardRevealCompleteRef.current?.();
      });
    }

    const pointer = { active: false, x: 0 };

    function handlePointerDown(event) {
      if (cardRevealActiveRef.current || showDeckRef.current) return;
      pointer.active = true;
      pointer.x = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!pointer.active || !carouselReady || cardRevealActiveRef.current || showDeckRef.current) return;
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
    const rotationClock = new THREE.Clock();
    const carouselRotationSpeed = 0.04;

    function animate() {
      animationFrame = window.requestAnimationFrame(animate);
      const delta = Math.min(rotationClock.getDelta(), 0.05);

      // Giro automático muy sutil. Durante el arrastre dejamos que el usuario
      // tenga el control completo y retomamos el movimiento al soltarlo.
      if (
        !pointer.active &&
        carouselReady &&
        !cardRevealActiveRef.current &&
        !showDeckRef.current
      ) {
        carouselRoot.rotation.y += delta * carouselRotationSpeed;
      }
      mistMaterial.uniforms.uTime.value = performance.now() * 0.001;
      floatingCards.update();
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
      floatingCardsRef.current = null;
      deckRootRef.current = null;
      floatingCards.dispose();
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      scene.remove(floorReflector);
      carouselEntrance?.stop();
      deckEntrance?.stop();
      deckEntranceRef.current = null;
      deckEntranceStartedRef.current = false;
      floorReflector.dispose();
      floorGeometry.dispose();
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
