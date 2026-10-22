"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "/models/puerta-hub-1.glb";

function createGlowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      color: { value: new THREE.Color("#f0f0f0") },
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
      varying vec2 vUv;

      void main() {
        float distanceFromCenter = distance(vUv, vec2(0.5));
        float glow = smoothstep(0.5, 0.02, distanceFromCenter);
        glow *= glow * 0.22;
        gl_FragColor = vec4(color, glow);
      }
    `,
  });
}

function createParticles() {
  const count = 180;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    positions[i] = (Math.random() - 0.5) * 5.6;
    positions[i + 1] = (Math.random() - 0.5) * 5.8;
    positions[i + 2] = (Math.random() - 0.5) * 2.2;
    phases[index] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    color: "#eeeeee",
    size: 0.035,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

export default function HubPortal3D() {
  const containerRef = useRef(null);

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
    renderer.toneMappingExposure = 1.3;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const portal = new THREE.Group();
    scene.add(portal);

    const ambientLight = new THREE.HemisphereLight("#eeeeee", "#111111", 2.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight("#ffffff", 4.2);
    keyLight.position.set(-3, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight("#ffffff", 12, 8, 2);
    rimLight.position.set(0, 0.2, -1.3);
    scene.add(rimLight);

    const glow = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 5.8), createGlowMaterial());
    glow.position.set(0, 0.1, -1.6);
    portal.add(glow);

    const particles = createParticles();
    portal.add(particles);

    let animationFrame;
    let disposed = false;
    let model = null;
    let particleTime = 0;

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

          // La textura original se retira para que el arco tenga una lectura
          // monocromática limpia y podamos controlar el tono desde la escena.
          object.material.map = null;
          object.material.color.set("#777777");
          object.material.metalness = 0.48;
          object.material.roughness = 0.72;
          object.material.emissive.set("#242424");
          object.material.emissiveIntensity = 0.5;
          object.material.needsUpdate = true;
        });

        portal.add(model);
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el portal del hub", error);
      },
    );

    function resize() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function animate() {
      animationFrame = window.requestAnimationFrame(animate);
      particleTime += 0.008;

      if (model) {
        model.rotation.y = Math.sin(particleTime * 0.7) * 0.035;
      }

      particles.rotation.y = particleTime * 0.08;
      particles.position.y = Math.sin(particleTime * 0.8) * 0.035;
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
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
      className="absolute inset-0 h-full w-full overflow-hidden"
      aria-label="Portal espectral de entrada a Caraval"
      role="img"
    />
  );
}
