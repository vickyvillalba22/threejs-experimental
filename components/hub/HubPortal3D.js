"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "/models/puerta-hub-1.glb";
const AWAKENING_DURATION = 2400;

function createGlowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      color: { value: new THREE.Color("#f0f0f0") },
      intensity: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      varying vec2 vUv;

      void main() {
        float distanceFromCenter = distance(vUv, vec2(0.5));
        float glow = smoothstep(0.5, 0.02, distanceFromCenter);
        glow *= glow * 0.22 * intensity;
        gl_FragColor = vec4(color, glow);
      }
    `,
  });
}

function createParticles() {
  const count = 120;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.8 + Math.random() * 1.25;

    // Las partículas se distribuyen alrededor del arco en distintos niveles
    // para que puedan rodearlo también en profundidad.
    positions[i] = Math.cos(angle) * radius;
    positions[i + 1] = (Math.random() - 0.5) * 2.8;
    positions[i + 2] = Math.sin(angle) * (0.62 + Math.random() * 0.42);
    phases[index] = Math.random() * Math.PI * 2;
    scales[index] = 0.55 + Math.random() * 0.9;
    speeds[index] = 0.45 + Math.random() * 0.65;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("particleScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("particleSpeed", new THREE.BufferAttribute(speeds, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 0.045 },
      uOpacity: { value: 0.62 },
      uViewportHeight: { value: 1 },
      uCharge: { value: 0 },
      uBurst: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSize;
      uniform float uViewportHeight;
      uniform float uCharge;
      uniform float uBurst;
      attribute float phase;
      attribute float particleScale;
      attribute float particleSpeed;
      varying float vParticleAlpha;

      void main() {
        vec3 animatedPosition = position;
        float motion = uTime * particleSpeed + phase;

        // Durante la carga todas las partículas rodean el arco en el mismo
        // sentido, usando X/Z para producir una órbita horizontal real.
        float baseAngle = atan(position.z / 0.85, position.x);
        float horizontalRadius = length(vec2(position.x, position.z / 0.85));
        float orbitAngle = uCharge * 2.8 + particleSpeed * uCharge * 0.12;
        float horizontalAngle = baseAngle + orbitAngle;
        vec3 orbitPosition = vec3(
          cos(horizontalAngle) * horizontalRadius,
          position.y,
          sin(horizontalAngle) * horizontalRadius * 0.85
        );

        float collapse = smoothstep(0.0, 0.28, uBurst) * (1.0 - smoothstep(0.28, 0.48, uBurst));
        float explosion = sin(uBurst * 3.14159265);
        float radiusScale = 1.0 - collapse * 0.78 + explosion * 1.8;
        animatedPosition = orbitPosition * radiusScale;
        animatedPosition.x += sin(motion) * (0.12 + uCharge * 0.08);
        animatedPosition.y += cos(motion * 0.8) * (0.16 + uCharge * 0.08);
        animatedPosition.z += sin(motion * 0.6) * 0.08 + sin(uBurst * 3.14159265 + phase) * 0.3;

        vec4 modelPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
        gl_Position = projectionMatrix * modelPosition;
        gl_PointSize = uSize * particleScale * (uViewportHeight / max(-modelPosition.z, 1.0));
        vParticleAlpha = 0.65 + sin(motion * 1.4) * 0.2;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vParticleAlpha;

      void main() {
        float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
        float particle = smoothstep(0.5, 0.08, distanceFromCenter);
        gl_FragColor = vec4(vec3(0.92), particle * vParticleAlpha * uOpacity);
      }
    `,
  });

  return new THREE.Points(geometry, material);
}

function createFogPlane(position, scale, opacity) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: Math.random() * 10 },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 animatedPosition = position;
        animatedPosition.x += sin(uTime * 0.18 + position.y * 2.0) * 0.12;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(animatedPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;

      void main() {
        float horizontalFade = smoothstep(0.0, 0.32, vUv.x) * (1.0 - smoothstep(0.68, 1.0, vUv.x));
        float verticalFade = smoothstep(0.0, 0.55, vUv.y) * (1.0 - smoothstep(0.72, 1.0, vUv.y));
        float drift = 0.85 + sin(uTime * 0.24 + vUv.x * 5.0) * 0.15;
        float alpha = horizontalFade * verticalFade * drift * uOpacity;
        gl_FragColor = vec4(vec3(0.8), alpha);
      }
    `,
  });

  const fog = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 1.45), material);
  fog.position.set(...position);
  fog.scale.setScalar(scale);
  fog.renderOrder = 0;
  return fog;
}

function createEdgeMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      edgeColor: { value: new THREE.Color("#f2f2f2") },
      edgeOpacity: { value: 0.8 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -viewPosition.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 edgeColor;
      uniform float edgeOpacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDirection = normalize(vViewPosition);
        float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDirection)), 2.8);
        gl_FragColor = vec4(edgeColor, rim * edgeOpacity);
      }
    `,
  });
}

function createBurstMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uProgress: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uProgress;
      uniform float uOpacity;
      varying vec2 vUv;

      void main() {
        float distanceFromCenter = distance(vUv, vec2(0.5));
        float ringPosition = uProgress * 0.68;
        float ring = 1.0 - smoothstep(0.0, 0.045, abs(distanceFromCenter - ringPosition));
        float flash = 1.0 - smoothstep(0.0, 0.24, uProgress);
        float alpha = (ring * (1.0 - uProgress) + flash * 0.16) * uOpacity;
        gl_FragColor = vec4(vec3(1.0), alpha);
      }
    `,
  });
}

export default function HubPortal3D({ onAwaken }) {
  const containerRef = useRef(null);
  const holdTimerRef = useRef(null);
  const awakenedRef = useRef(false);
  const onAwakenRef = useRef(onAwaken);
  const chargeTargetRef = useRef(0);
  const burstStartRef = useRef(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isAwakened, setIsAwakened] = useState(false);

  useEffect(() => {
    onAwakenRef.current = onAwaken;
  }, [onAwaken]);

  function completeAwakening() {
    if (awakenedRef.current) return;
    awakenedRef.current = true;
    chargeTargetRef.current = 1;
    burstStartRef.current = performance.now();
    setIsCharging(false);
    setIsAwakened(true);
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      onAwakenRef.current?.();
    }, 820);
  }

  function beginAwakening(event) {
    if (awakenedRef.current) return;
    if (event?.pointerId !== undefined && event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    window.clearTimeout(holdTimerRef.current);
    chargeTargetRef.current = 1;
    setIsCharging(true);
    holdTimerRef.current = window.setTimeout(completeAwakening, AWAKENING_DURATION);
  }

  function cancelAwakening(event) {
    if (awakenedRef.current) return;
    if (event?.pointerId !== undefined && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    window.clearTimeout(holdTimerRef.current);
    chargeTargetRef.current = 0;
    setIsCharging(false);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.15, 9.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.42;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const portal = new THREE.Group();
    scene.add(portal);

    const ambientLight = new THREE.HemisphereLight("#eeeeee", "#111111", 2.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight("#ffffff", 4.8);
    keyLight.position.set(-3, 4, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#ffffff", 1.5);
    fillLight.position.set(3, 1, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight("#ffffff", 15, 10, 2);
    rimLight.position.set(0, 1.2, 3.8);
    scene.add(rimLight);

    const frontLight = new THREE.PointLight("#ffffff", 8, 8, 2);
    frontLight.position.set(-2.8, 2.5, 2.8);
    scene.add(frontLight);

    const glow = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 5.8), createGlowMaterial());
    const glowMaterial = glow.material;
    glow.position.set(0, 0.1, -1.6);
    portal.add(glow);

    const burst = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 5.8), createBurstMaterial());
    const burstMaterial = burst.material;
    burst.position.set(0, 0.1, 1.1);
    burst.renderOrder = 3;
    portal.add(burst);

    const farParticles = createParticles();
    farParticles.material.uniforms.uSize.value = 0.032;
    farParticles.material.uniforms.uOpacity.value = 0.42;
    farParticles.position.z = -0.8;
    portal.add(farParticles);

    const nearParticles = createParticles();
    nearParticles.material.uniforms.uSize.value = 0.065;
    nearParticles.material.uniforms.uOpacity.value = 0.78;
    nearParticles.position.z = 0.35;
    portal.add(nearParticles);

    const fogBack = createFogPlane([0, -1.9, -1.3], 1, 0.16);
    const fogFront = createFogPlane([0.3, -1.7, 0.55], 0.82, 0.1);
    portal.add(fogBack, fogFront);

    let animationFrame;
    let disposed = false;
    let model = null;
    let edgeMaterials = [];
    let particleTime = 0;
    let chargeProgress = 0;

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;

        model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        // Dejamos aire alrededor del arco para que se lea completo en el hub.
        const desiredHeight = 2.4;
        const scale = desiredHeight / Math.max(size.y, 0.001);

        model.position.sub(center);
        model.scale.setScalar(scale);
        // El modelo ya está centrado con respecto a su bounding box.
        // Mantenerlo en 0 evita que la base del arco quede fuera del canvas.
        model.position.y = 0;

        model.traverse((object) => {
          if (!object.isMesh) return;

          object.castShadow = false;
          object.receiveShadow = false;
          object.material = object.material.clone();

          // Conservamos la textura original de piedra, pero desaturamos su
          // lectura desde el material para mantener el lenguaje monocromático.
          object.material.color.set("#d0d0d0");
          object.material.metalness = 0.08;
          object.material.roughness = 0.9;
          object.material.emissive.set("#080808");
          object.material.emissiveIntensity = 0.08;
          if (object.material.map) {
            object.material.map.colorSpace = THREE.SRGBColorSpace;
            object.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
          }
          object.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <map_fragment>",
              `#include <map_fragment>
              float stoneLuminance = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
              stoneLuminance = pow(max(stoneLuminance, 0.001), 0.72);
              diffuseColor.rgb = vec3(stoneLuminance);`,
            );
          };
          object.material.needsUpdate = true;
        });

        portal.add(model);

        const edgeModel = model.clone();
        edgeModel.scale.multiplyScalar(1.012);
        edgeModel.renderOrder = 2;
        edgeMaterials = [];
        edgeModel.traverse((object) => {
          if (!object.isMesh) return;
          object.material = createEdgeMaterial();
          edgeMaterials.push(object.material);
          object.renderOrder = 2;
        });
        portal.add(edgeModel);
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el portal del hub", error);
      },
    );

    function resize() {
      const height = Math.max(container.clientHeight, 1);
      const width = Math.max(container.clientWidth, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      const viewportHeight = height * renderer.getPixelRatio();
      farParticles.material.uniforms.uViewportHeight.value = viewportHeight;
      nearParticles.material.uniforms.uViewportHeight.value = viewportHeight;
    }

    function animate() {
      animationFrame = window.requestAnimationFrame(animate);
      particleTime += 0.008;
      chargeProgress += (chargeTargetRef.current - chargeProgress) * 0.075;
      const burstProgress = burstStartRef.current === null
        ? 0
        : Math.min((performance.now() - burstStartRef.current) / 820, 1);

      if (model) {
        model.rotation.y = Math.sin(particleTime * 0.7) * 0.035;
      }

      farParticles.material.uniforms.uTime.value = particleTime;
      nearParticles.material.uniforms.uTime.value = particleTime + 1.8;
      farParticles.material.uniforms.uCharge.value = chargeProgress;
      nearParticles.material.uniforms.uCharge.value = chargeProgress;
      farParticles.material.uniforms.uBurst.value = burstProgress;
      nearParticles.material.uniforms.uBurst.value = burstProgress;
      glowMaterial.uniforms.intensity.value = 1 + chargeProgress * 1.8;
      burstMaterial.uniforms.uProgress.value = burstProgress;
      burstMaterial.uniforms.uOpacity.value = burstProgress > 0 ? 1 : 0;
      edgeMaterials.forEach((material) => {
        material.uniforms.edgeOpacity.value = 0.8 + chargeProgress * 0.8 + (1 - burstProgress) * 0.4;
      });
      fogBack.material.uniforms.uTime.value = particleTime;
      fogFront.material.uniforms.uTime.value = particleTime + 2.4;
      farParticles.rotation.y = particleTime * 0.035;
      nearParticles.rotation.y = particleTime * 0.06;
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(holdTimerRef.current);
      resizeObserver.disconnect();
      renderer.dispose();

      scene.traverse((object) => {
        if (!object.isMesh && !object.isPoints) return;
        object.geometry?.dispose();

        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose();
        }
      });

      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 h-full w-full overflow-hidden ${isCharging ? "cursor-wait" : "cursor-pointer"}`}
      aria-label="Portal espectral de entrada a Caraval"
      role="button"
      tabIndex={0}
      aria-pressed={isAwakened}
      onPointerDown={beginAwakening}
      onPointerUp={cancelAwakening}
      onPointerCancel={cancelAwakening}
      onPointerLeave={cancelAwakening}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          beginAwakening(event);
        }
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          cancelAwakening(event);
        }
      }}
    />
  );
}
