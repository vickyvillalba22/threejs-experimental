"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function TiendaScene({ onMaskClick }) {
  const containerRef = useRef(null);
  const onMaskClickRef = useRef(onMaskClick);

  useEffect(() => {
    onMaskClickRef.current = onMaskClick;
  }, [onMaskClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050505");
    scene.fog = new THREE.FogExp2("#050505", 0.06);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.sortObjects = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const environmentGenerator = new THREE.PMREMGenerator(renderer);
    const environmentTexture = environmentGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    scene.environment = environmentTexture;
    environmentGenerator.dispose();

    const ambientLight = new THREE.AmbientLight("#222222", 0.12);

    const coneAngle = Math.atan(0.15);

    const inspectionLight = new THREE.SpotLight(
      "#ffffff",
      2600,
      30,
      coneAngle,
      0.5,
      2,
    );
    inspectionLight.position.set(0, 10, 0);
    inspectionLight.target.position.set(0, 0, -0.8);

    const inspectionBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 10 * Math.tan(coneAngle), 10, 96, 1, true),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uOpacity: { value: 0.75 },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormalV;
          varying vec3 vViewPos;
          varying float vH;
          varying float vAng;

          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormalV = normalize(normalMatrix * normal);
            vViewPos = -mv.xyz;
            vH = (position.y + 5.0) / 10.0;
            vAng = uv.x;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          uniform float uTime;
          varying vec3 vNormalV;
          varying vec3 vViewPos;
          varying float vH;
          varying float vAng;

          float hash3(vec3 p) {
            return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
          }

          float noise3(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            vec3 u = f * f * (3.0 - 2.0 * f);
            float x00 = mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), u.x);
            float x10 = mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), u.x);
            float x01 = mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), u.x);
            float x11 = mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), u.x);
            return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
          }

          float fbm3(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
              v += a * noise3(p);
              p = p * 2.07 + vec3(1.3, 7.1, 3.7);
              a *= 0.5;
            }
            return v;
          }

          void main() {
            float facing = abs(dot(normalize(vNormalV), normalize(vViewPos)));
            float core = pow(facing, 1.4);
            float ang = vAng * 6.2831853;
            float flow = vH * 2.0 + uTime * 0.12;
            vec3 q = vec3(cos(ang) * 3.0, flow, sin(ang) * 3.0);
            float n = fbm3(q + vec3(0.0, 0.0, uTime * 0.02));
            float streak = 0.35 + 0.65 * smoothstep(0.3, 0.75, n);
            float fade = smoothstep(0.0, 0.2, vH) * (0.3 + 0.7 * vH);
            float alpha = core * streak * fade * uOpacity;
            gl_FragColor = vec4(vec3(1.0), alpha);
          }
        `,
      }),
    );
    inspectionBeam.position.set(0, 5, 0);

    const beamParticleCount = 260;
    const beamParticlePositions = new Float32Array(beamParticleCount * 3);
    for (let i = 0; i < beamParticleCount; i += 1) {
      const y = Math.random() * 10;
      const maxRadius = 0.12 + (10 * Math.tan(Math.PI / 8) - 0.12) * (y / 10);
      const radius = maxRadius * Math.sqrt(Math.random()) * 0.92;
      const angle = Math.random() * Math.PI * 2;
      beamParticlePositions[i * 3] = Math.cos(angle) * radius;
      beamParticlePositions[i * 3 + 1] = y;
      beamParticlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const beamParticleGeometry = new THREE.BufferGeometry();
    beamParticleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(beamParticlePositions, 3),
    );
    const beamParticles = new THREE.Points(
      beamParticleGeometry,
      new THREE.PointsMaterial({
        color: "#fff6e0",
        size: 0.05,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(beamParticles);

    const innerLight = new THREE.PointLight("#ffaa00", 140, 6, 2);
    innerLight.position.set(0, 1, -0.8);

    // Relleno frontal suave para conservar el detalle de la máscara a través
    // del cristal, sin competir con el haz principal.
    const maskFillLight = new THREE.PointLight("#fff1d2", 55, 3.5, 2);
    maskFillLight.position.set(0, 0.1, 0.35);

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshBasicMaterial({ color: "#ffaa00", toneMapped: false }),
    );
    innerGlow.position.copy(innerLight.position);
    innerGlow.visible = false;

    scene.add(
      ambientLight,
      inspectionLight,
      inspectionLight.target,
      inspectionBeam,
      innerLight,
      innerGlow,
      maskFillLight,
    );

    const bottle = new THREE.Group();
    bottle.position.set(0, 0, -0.8);
    bottle.scale.setScalar(0.68);
    scene.add(bottle);

    let isDisposed = false;
    let maskObject = null;
    const maskLoader = new GLTFLoader();
    maskLoader.load(
      "/models/main%20objects/venetian_mask_1.glb",
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

        const maskBounds = new THREE.Box3().setFromObject(gltf.scene);
        const maskSize = maskBounds.getSize(new THREE.Vector3());
        const maskCenter = maskBounds.getCenter(new THREE.Vector3());
        const largestDimension = Math.max(maskSize.x, maskSize.y, maskSize.z);

        // Normalizamos el modelo para que quede dentro del cuerpo del frasco,
        // independientemente de las unidades utilizadas por el archivo GLB.
        gltf.scene.scale.setScalar(0.92 / largestDimension);
        gltf.scene.position.set(
          -maskCenter.x * gltf.scene.scale.x,
          -maskCenter.y * gltf.scene.scale.y - 0.02,
          -maskCenter.z * gltf.scene.scale.z,
        );
        gltf.scene.rotation.set(0, Math.PI, 0);
        gltf.scene.renderOrder = 2;
        maskObject = gltf.scene;
        if (isBottleLifted) scene.attach(maskObject);

        gltf.scene.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = false;
          object.receiveShadow = false;
          object.renderOrder = 2;

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if (!material) return;
            material.depthTest = true;
            material.depthWrite = true;
            material.needsUpdate = true;
          });
        });

        bottle.add(gltf.scene);
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar la máscara veneciana", error);
      },
    );

    // Capa visual de niebla baja: la FogExp2 aporta profundidad, mientras
    // esta capa hace visible el banco espectral sobre el suelo invisible.
    const groundFog = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          fogColor: { value: new THREE.Color("#a8a8a8") },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 fogColor;
          uniform float uTime;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise(p);
              p = p * 2.03 + vec2(1.7, 9.2);
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 p = vUv * vec2(3.5, 2.0);
            vec2 drift = vec2(uTime * 0.03, uTime * 0.008);
            vec2 warp = vec2(
              fbm(p + drift),
              fbm(p + vec2(5.2, 1.3) - drift)
            );
            float n = fbm(p + 1.8 * warp + drift * 0.5);
            float cloud = smoothstep(0.36, 0.7, n);

            vec2 d = (vUv - vec2(0.5, 0.45)) * vec2(1.0, 2.4);
            float edge = 1.0 - smoothstep(0.18, 0.62, length(d));

            float alpha = cloud * edge * 0.7;
            gl_FragColor = vec4(fogColor, alpha);
          }
        `,
      }),
    );
    groundFog.position.set(0, -1.3, -0.6);
    groundFog.renderOrder = 4;
    scene.add(groundFog);

    const shelfMaterial = new THREE.LineBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.4,
    });

    function addWireBox(parent, width, height, depth, x, y, z) {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
        shelfMaterial,
      );
      edges.position.set(x, y, z);
      parent.add(edges);
    }

    function createSpectralShelf(x, z) {
      const shelf = new THREE.Group();
      shelf.position.set(x, 0, z);
      shelf.rotation.y = Math.atan2(-x, -z);

      const frameHeight = 3.03;
      const frameCenterY = 0.3;
      addWireBox(shelf, 0.04, frameHeight, 0.6, -0.78, frameCenterY, 0);
      addWireBox(shelf, 0.04, frameHeight, 0.6, 0.78, frameCenterY, 0);
      addWireBox(shelf, 1.6, frameHeight, 0.02, 0, frameCenterY, -0.3);
      [-0.5, 0.5].forEach((dx) => addWireBox(shelf, 0.03, 3, 0.6, dx, 0.315, 0));
      [-1.2, -0.2, 0.8, 1.8].forEach((y) => addWireBox(shelf, 1.52, 0.03, 0.6, 0, y, 0));

      scene.add(shelf);
      return shelf;
    }

    const shelves = [
      createSpectralShelf(-3.4, -1.5),
      createSpectralShelf(3.4, -1.5),
      createSpectralShelf(-2.17, -2.99),
      createSpectralShelf(2, -2.99),
    ];

    const pedestalHeight = 1.2;
    const pedestal = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.62, 0.72, pedestalHeight, 8)),
      new THREE.LineBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.4,
      }),
    );
    pedestal.position.set(0, -0.75 - pedestalHeight / 2, -0.8);
    scene.add(pedestal);

    const shelfTops = [-1.185, -0.185, 0.815, 1.815];
    const shelfPieces = [];

    function placeOnShelf(shelf, geometry, color, x, shelfIndex, z) {
      geometry.computeBoundingBox();
      geometry.translate(0, -geometry.boundingBox.min.y, 0);
      const piece = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: "#ffffff",
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        }),
      );
      piece.position.set(x, shelfTops[shelfIndex], z);
      shelf.add(piece);
      shelfPieces.push({ mesh: piece, baseY: shelfTops[shelfIndex], phase: Math.random() * Math.PI * 2 });
    }

    const flatTorus = new THREE.TorusGeometry(0.15, 0.04, 24, 64);
    flatTorus.rotateX(Math.PI / 2);

    const [leftShelf, rightShelf, backLeftShelf] = shelves;

    placeOnShelf(leftShelf, new THREE.BoxGeometry(0.32, 0.32, 0.32, 4, 4, 4), "#d4a72c", -0.3, 0, 0.05);
    placeOnShelf(leftShelf, new THREE.SphereGeometry(0.17, 32, 24), "#e9e4d8", 0.2, 0, -0.05);
    placeOnShelf(leftShelf, new THREE.CylinderGeometry(0.11, 0.11, 0.7, 24, 6), "#6f7c8f", -0.2, 1, 0);
    placeOnShelf(leftShelf, new THREE.ConeGeometry(0.16, 0.42, 24, 6), "#d4a72c", 0.25, 1, 0.04);
    placeOnShelf(leftShelf, flatTorus, "#c9c3b5", -0.1, 2, 0);
    placeOnShelf(leftShelf, new THREE.IcosahedronGeometry(0.16, 2), "#b52c68", 0.25, 2, -0.05);

    placeOnShelf(rightShelf, new THREE.CylinderGeometry(0.09, 0.14, 0.5, 12, 4), "#4a4f5c", 0.2, 0, 0);
    placeOnShelf(rightShelf, new THREE.BoxGeometry(0.22, 0.6, 0.22, 3, 6, 3), "#c9c3b5", -0.15, 0, 0.03);
    placeOnShelf(rightShelf, new THREE.OctahedronGeometry(0.15, 2), "#d4a72c", 0.3, 1, 0);
    placeOnShelf(rightShelf, new THREE.SphereGeometry(0.1, 24, 20), "#b52c68", -0.15, 1, 0.05);
    placeOnShelf(rightShelf, new THREE.TetrahedronGeometry(0.2, 2), "#6f7c8f", 0.1, 2, 0);

    placeOnShelf(backLeftShelf, new THREE.SphereGeometry(0.14, 24, 20), "#4a4f5c", -0.2, 0, 0);
    placeOnShelf(backLeftShelf, new THREE.BoxGeometry(0.26, 0.26, 0.26, 4, 4, 4), "#d4a72c", 0.15, 0, 0.04);
    placeOnShelf(backLeftShelf, new THREE.ConeGeometry(0.12, 0.36, 24, 6), "#b52c68", -0.1, 1, 0);
    placeOnShelf(backLeftShelf, new THREE.IcosahedronGeometry(0.14, 2), "#c9c3b5", 0.1, 2, 0);

    const deepRightShelf = shelves[3];

    placeOnShelf(deepRightShelf, new THREE.SphereGeometry(0.13, 24, 20), "#d4a72c", -0.25, 0, 0);
    placeOnShelf(deepRightShelf, new THREE.BoxGeometry(0.22, 0.22, 0.22, 3, 3, 3), "#4a4f5c", 0.2, 0, 0.03);
    placeOnShelf(deepRightShelf, new THREE.CylinderGeometry(0.1, 0.1, 0.6, 24, 6), "#e9e4d8", -0.1, 1, 0);
    placeOnShelf(deepRightShelf, new THREE.OctahedronGeometry(0.14, 2), "#b52c68", 0.3, 1, 0.02);
    placeOnShelf(deepRightShelf, new THREE.TetrahedronGeometry(0.18, 2), "#6f7c8f", 0, 2, 0);

    const magicEmitters = shelfPieces.filter((_, index) => index % 3 === 0).map((piece) => piece.mesh);
    const magicPerEmitter = 120;
    const magicCount = magicEmitters.length * magicPerEmitter;
    const magicPositions = new Float32Array(magicCount * 3);
    const magicColors = new Float32Array(magicCount * 3);
    const magicEmitterIndex = new Uint16Array(magicCount);
    const magicPhases = new Float32Array(magicCount);
    const magicAngles = new Float32Array(magicCount);
    const magicRadii = new Float32Array(magicCount);
    const magicHeadings = new Float32Array(magicEmitters.length);
    const magicReach = new Float32Array(magicEmitters.length);
    const magicCurlFrequency = new Float32Array(magicEmitters.length);
    const magicCurlAmplitude = new Float32Array(magicEmitters.length);
    const magicCurlPhase = new Float32Array(magicEmitters.length);
    const magicBend = new Float32Array(magicEmitters.length);
    const magicRise = new Float32Array(magicEmitters.length);
    const magicOrigins = new Float32Array(magicEmitters.length * 3);
    const magicOriginVector = new THREE.Vector3();
    for (let i = 0; i < magicCount; i += 1) {
      magicEmitterIndex[i] = Math.floor(i / magicPerEmitter);
      magicPhases[i] = (i % magicPerEmitter) / magicPerEmitter + Math.random() * 0.01;
      magicAngles[i] = Math.random() * Math.PI * 2;
      magicRadii[i] = Math.sqrt(Math.random());
    }

    for (let e = 0; e < magicEmitters.length; e += 1) {
      magicHeadings[e] = Math.random() * Math.PI * 2;
      magicReach[e] = 0.3 + Math.random() * 0.7;
      magicCurlFrequency[e] = 4 + Math.random() * 6;
      magicCurlAmplitude[e] = 0.05 + Math.random() * 0.25;
      magicCurlPhase[e] = Math.random() * Math.PI * 2;
      magicBend[e] = (Math.random() - 0.5) * 4;
      magicRise[e] = 0.6 + Math.random() * 0.8;
    }
    const magicPositionAttribute = new THREE.BufferAttribute(magicPositions, 3);
    magicPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    const magicColorAttribute = new THREE.BufferAttribute(magicColors, 3);
    magicColorAttribute.setUsage(THREE.DynamicDrawUsage);
    const magicGeometry = new THREE.BufferGeometry();
    magicGeometry.setAttribute("position", magicPositionAttribute);
    magicGeometry.setAttribute("color", magicColorAttribute);
    const magicParticles = new THREE.Points(
      magicGeometry,
      new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(magicParticles);

    function updateMagicParticles(time) {
      magicEmitters.forEach((emitter, index) => {
        emitter.getWorldPosition(magicOriginVector);
        magicOrigins[index * 3] = magicOriginVector.x;
        magicOrigins[index * 3 + 1] = magicOriginVector.y;
        magicOrigins[index * 3 + 2] = magicOriginVector.z;
      });

      for (let i = 0; i < magicCount; i += 1) {
        const origin = magicEmitterIndex[i] * 3;
        const life = (time * 0.22 + magicPhases[i]) % 1;
        const angle = magicAngles[i];
        const emitter = magicEmitterIndex[i];
        const bentHeading = magicHeadings[emitter] + magicBend[emitter] * life * life;
        const reach = magicReach[emitter] * life;
        const curl =
          Math.sin(life * magicCurlFrequency[emitter] + magicCurlPhase[emitter]) *
          magicCurlAmplitude[emitter] *
          life;
        const jitter = magicRadii[i] * 0.03 * (1 - life);
        const lateral = Math.sin(angle) * 0.12 * (1 - life);
        magicPositions[i * 3] =
          magicOrigins[origin] +
          Math.cos(bentHeading) * reach -
          Math.sin(bentHeading) * (curl + lateral) +
          Math.cos(angle) * jitter;
        magicPositions[i * 3 + 1] = magicOrigins[origin + 1] + 0.05 + life * magicRise[emitter];
        magicPositions[i * 3 + 2] =
          magicOrigins[origin + 2] +
          Math.sin(bentHeading) * reach +
          Math.cos(bentHeading) * (curl + lateral) +
          Math.sin(angle) * jitter;
        const brightness = Math.min(life / 0.08, 1) * (1 - life) ** 1.6;
        magicColors[i * 3] = brightness;
        magicColors[i * 3 + 1] = brightness;
        magicColors[i * 3 + 2] = brightness;
      }

      magicPositionAttribute.needsUpdate = true;
      magicColorAttribute.needsUpdate = true;
    }

    const bodyProfile = [
      new THREE.Vector2(0.85, -1.1),
      new THREE.Vector2(0.8, -0.98),
      new THREE.Vector2(0.78, -0.4),
      new THREE.Vector2(0.74, 0.2),
      new THREE.Vector2(0.62, 0.62),
      new THREE.Vector2(0.4, 0.92),
      new THREE.Vector2(0.18, 1.04),
      new THREE.Vector2(0, 1.08),
    ];
    const bodyGeometry = new THREE.LatheGeometry(bodyProfile, 48);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ffffff"),
      roughness: 0.04,
      transmission: 1,
      thickness: 0.35,
      ior: 1.45,
      attenuationColor: new THREE.Color("#ffffff"),
      attenuationDistance: Infinity,
      envMapIntensity: 0.7,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeometry, glassMaterial);
    body.renderOrder = 10;
    bottle.add(body);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 24), glassMaterial);
    knob.position.y = 1.14;
    knob.renderOrder = 10;
    bottle.add(knob);

    const particleCount = 90;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleBaseY = new Float32Array(particleCount);
    const particlePhases = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 * Math.sqrt(Math.random());
      const y = -0.8 + Math.random() * 1.6;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particleBaseY[i] = y;
      particlePhases[i] = Math.random() * Math.PI * 2;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: "#ffc766",
        size: 0.035,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    bottle.add(particles);

    const clickableObjects = [body, knob];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let animationFrame;
    let isBottleLifted = false;
    let isBottleDragging = false;
    let isMaskPointerDown = false;
    let bottlePointerStartY = 0;
    let bottleLiftStartY = 0;
    let bottleLiftStartTime = 0;

    function updatePointer(event) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    }

    function startBottleLift() {
      if (isBottleLifted) return;
      isBottleLifted = true;
      isBottleDragging = false;
      bottleLiftStartY = bottle.position.y;
      bottleLiftStartTime = performance.now();

      // Sacamos la máscara del frasco conservando su posición en pantalla.
      // Así queda disponible para el clic cuando el vidrio desaparece.
      if (maskObject && maskObject.parent === bottle) scene.attach(maskObject);
    }

    function handlePointerDown(event) {
      updatePointer(event);

      if (isBottleLifted) {
        isMaskPointerDown = Boolean(
          maskObject && raycaster.intersectObject(maskObject, true).length > 0,
        );
        return;
      }

      if (raycaster.intersectObjects(clickableObjects, false).length === 0) return;
      isBottleDragging = true;
      bottlePointerStartY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      event.preventDefault();
    }

    function handlePointerMove(event) {
      if (!isBottleDragging || isBottleLifted) return;

      const bounds = renderer.domElement.getBoundingClientRect();
      const upwardMovement = (bottlePointerStartY - event.clientY) / bounds.height;
      if (upwardMovement > 0 && maskObject && maskObject.parent === bottle) {
        scene.attach(maskObject);
      }
      bottle.position.y = THREE.MathUtils.clamp(upwardMovement * 3, 0, 0.9);

      if (upwardMovement > 0.12) startBottleLift();
    }

    function handlePointerUp(event) {
      if (isBottleDragging) {
        isBottleDragging = false;
        if (!isBottleLifted) bottle.position.y = 0;
        if (renderer.domElement.hasPointerCapture(event.pointerId)) {
          renderer.domElement.releasePointerCapture(event.pointerId);
        }
        return;
      }

      if (isBottleLifted && isMaskPointerDown) {
        updatePointer(event);
        if (maskObject && raycaster.intersectObject(maskObject, true).length > 0) {
          onMaskClickRef.current?.();
        }
      }
      isMaskPointerDown = false;
    }

    function handlePointerCancel(event) {
      isBottleDragging = false;
      isMaskPointerDown = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      if (!isBottleLifted) bottle.position.y = 0;
    }

    function resize() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Encuadramos el frasco según su tamaño real para que la cámara no
      // dependa de una distancia fija ni cambie de proporción entre pantallas.
      bottle.updateMatrixWorld(true);
      const bottleBounds = new THREE.Box3().setFromObject(bottle);
      const bottleCenter = bottleBounds.getCenter(new THREE.Vector3());
      const bottleHeight = bottleBounds.getSize(new THREE.Vector3()).y;
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      // Dejamos más aire alrededor del frasco para conservar una escala
      // espectral y evitar que domine todo el encuadre.
      const frameRatio = 0.42;
      const tanHalfFov = Math.tan(verticalFov / 2);
      const distanceForHeight = bottleHeight / (2 * tanHalfFov * frameRatio);

      // Incluimos estantes y mesa para que la escena completa entre en pantallas
      // estrechas sin recortar elementos laterales.
      const stageBounds = bottleBounds.clone();
      shelves.forEach((shelf) => stageBounds.expandByObject(shelf));
      const stageCenter = stageBounds.getCenter(new THREE.Vector3());
      const stageWidth = stageBounds.getSize(new THREE.Vector3()).x;
      const distanceForWidth = (stageWidth / 2) * 1.1 / (tanHalfFov * camera.aspect);

      camera.position.set(
        stageCenter.x,
        bottleCenter.y,
        Math.max(distanceForHeight, distanceForWidth),
      );
      camera.lookAt(stageCenter.x, bottleCenter.y, bottleCenter.z);
      renderer.setSize(width, height, false);
    }

    function updateBottleFade(time) {
      if (bottleLiftStartTime <= 0) return;

      const progress = THREE.MathUtils.clamp(
        (time - bottleLiftStartTime) / 1100,
        0,
        1,
      );
      bottle.position.y = bottleLiftStartY + progress * 0.45;
      glassMaterial.opacity = 0.3 * (1 - progress);
      particles.material.opacity = 0.9 * (1 - progress);

      if (progress >= 1) {
        body.visible = false;
        knob.visible = false;
        particles.visible = false;
        bottleLiftStartTime = -1;
      }
    }

    function animate() {
      animationFrame = window.requestAnimationFrame(animate);
      const time = performance.now();
      if (!isBottleLifted) bottle.rotation.y = Math.sin(time * 0.0007) * 0.08;
      groundFog.material.uniforms.uTime.value = performance.now() * 0.001;
      inspectionBeam.material.uniforms.uTime.value = performance.now() * 0.001;
      beamParticles.rotation.y = performance.now() * 0.00008;
      updateMagicParticles(time * 0.001);
      updateBottleFade(time);
      shelfPieces.forEach(({ mesh, baseY, phase }) => {
        mesh.position.y = baseY + 0.05 + Math.sin(performance.now() * 0.0011 + phase) * 0.03;
      });
      const particlePositionAttribute = particles.geometry.attributes.position;
      for (let i = 0; i < particleCount; i += 1) {
        particlePositionAttribute.setY(
          i,
          particleBaseY[i] + Math.sin(performance.now() * 0.0008 + particlePhases[i]) * 0.06,
        );
      }
      particlePositionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointercancel", handlePointerCancel);
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
      renderer.domElement.removeEventListener("pointercancel", handlePointerCancel);
      scene.traverse((object) => {
        if (!object.geometry) return;
        object.geometry?.dispose();
        object.material?.dispose();
      });
      renderer.dispose();
      environmentTexture.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full cursor-pointer"
      aria-label="Frasco de cristal interactivo"
      role="button"
      tabIndex={0}
    />
  );
}
