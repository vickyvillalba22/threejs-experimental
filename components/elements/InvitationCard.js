"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function InvitationCard({ onClose, onEnterHub }) {
  const sceneContainerRef = useRef(null);

  useEffect(() => {
    const container = sceneContainerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "pointer-events-none absolute inset-0 h-full w-full";
    container.appendChild(renderer.domElement);

    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cardShape = new THREE.Shape();
    const width = 3.25;
    const height = 4.45;
    const radius = 0.16;
    cardShape.moveTo(-width / 2 + radius, -height / 2);
    cardShape.lineTo(width / 2 - radius, -height / 2);
    cardShape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
    cardShape.lineTo(width / 2, height / 2 - radius);
    cardShape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
    cardShape.lineTo(-width / 2 + radius, height / 2);
    cardShape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
    cardShape.lineTo(-width / 2, -height / 2 + radius);
    cardShape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);

    const cardGeometry = new THREE.ExtrudeGeometry(cardShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    });
    cardGeometry.center();

    const cardMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.72,
      metalness: 0.22,
      transparent: true,
      opacity: 0.94,
    });
    const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
    cardGroup.add(cardMesh);

    const edgeGeometry = new THREE.EdgesGeometry(cardGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xb8bbc3,
      transparent: true,
      opacity: 0.7,
    });
    const edgeMesh = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    cardGroup.add(edgeMesh);

    const glowGeometry = new THREE.PlaneGeometry(width * 1.15, height * 1.15);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x9ca3b8,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.z = -0.12;
    cardGroup.add(glowMesh);

    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      particlePositions[index * 3] = (Math.random() - 0.5) * 8;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 7;
      particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xd5d7df,
      size: 0.025,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xb8bbc3, 1.8));
    const keyLight = new THREE.PointLight(0xffffff, 18, 8);
    keyLight.position.set(1.8, 2.4, 3.5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x737caa, 15, 7);
    rimLight.position.set(-2.5, -1.5, 1.5);
    scene.add(rimLight);

    const pointer = new THREE.Vector2();
    const targetRotation = new THREE.Vector2();
    const clock = new THREE.Clock();
    let animationFrame;

    function handlePointerMove(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      targetRotation.y = pointer.x * 0.12;
      targetRotation.x = pointer.y * 0.08;
    }

    function resizeScene() {
      const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
      const aspect = containerWidth / Math.max(containerHeight, 1);
      const viewHeight = 6;
      camera.left = (-aspect * viewHeight) / 2;
      camera.right = (aspect * viewHeight) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      cardGroup.scale.set((aspect * viewHeight * 0.96) / width, (viewHeight * 0.96) / height, 1);
      renderer.setSize(containerWidth, containerHeight, false);
    }

    function animate() {
      const elapsed = clock.getElapsedTime();
      cardGroup.position.y = Math.sin(elapsed * 0.9) * 0.06;
      cardGroup.rotation.x += (targetRotation.x - cardGroup.rotation.x) * 0.035;
      cardGroup.rotation.y += (targetRotation.y - cardGroup.rotation.y) * 0.035;
      particles.rotation.y = elapsed * 0.025;
      particles.position.y = Math.sin(elapsed * 0.25) * 0.08;
      glowMaterial.opacity = 0.06 + Math.sin(elapsed * 1.4) * 0.018;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    }

    resizeScene();
    window.addEventListener("resize", resizeScene);
    window.addEventListener("pointermove", handlePointerMove);
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeScene);
      window.removeEventListener("pointermove", handlePointerMove);
      cardGeometry.dispose();
      edgeGeometry.dispose();
      glowGeometry.dispose();
      particleGeometry.dispose();
      cardMaterial.dispose();
      edgeMaterial.dispose();
      glowMaterial.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <section
      className="fixed inset-0 z-[50] grid place-items-center overflow-hidden bg-[rgba(11,11,13,0.92)] p-5 backdrop-blur-[12px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invitation-title"
    >
      <div
        ref={sceneContainerRef}
        className="relative z-[1] max-h-[calc(100svh-40px)] w-full max-w-[460px] overflow-hidden border border-app-border bg-app-surface/80 text-center shadow-[0_0_80px_rgba(255,255,255,0.08)] backdrop-blur-[3px]"
      >
        <div className="relative z-[1] max-h-[calc(100svh-40px)] overflow-y-auto p-[clamp(24px,5vw,42px)]">
          <button
            className="absolute right-[18px] top-4 border-0 bg-transparent text-2xl text-app-muted hover:text-app-text"
            onClick={onClose}
            aria-label="Cerrar invitación"
          >
            ×
          </button>
          <p className="mb-5 text-[10px] tracking-[0.14em] text-app-accent">
            De la Oficina del Maestro de Ceremonias
          </p>
          <h2
            id="invitation-title"
            className="mb-6 font-app-display text-[clamp(34px,7vw,58px)] leading-[0.95] tracking-[-0.04em]"
          >
            Isla de los Sueños
          </h2>
          <div className="mx-auto mb-8 max-w-[390px] text-left font-app-body text-sm leading-relaxed text-app-muted">
            <p className="mb-5">Estimado participante:</p>
            <p className="mb-5">
              Ha sido distinguido con un privilegio reservado para muy pocos: atravesar las fronteras de mi feria. Ante usted se abren las puertas de Caraval, un escenario donde los deseos más profundos cobran vida y las ilusiones se entrelazan con la realidad.
            </p>
            <h3 className="mb-2 text-[11px] font-bold tracking-[0.12em] text-app-text">
              Su Cometido:
            </h3>
            <p className="mb-5">
              Adéntrese en mi dominio, descifre las evidencias ocultas entre las sombras y descubra el lugar exacto de mi paradero. Si demuestra la astucia necesaria para encontrarme, seré yo mismo quien le conceda aquello que su corazón más anhela: un deseo mágico.
            </p>
            <p className="mb-5">
              Pero le advierto que la magia tiene su precio y los pasillos de esta isla suelen extraviar a los imprudentes. Antes de dar el primer paso y elegir su puerta, grabe en su mente nuestra única y sagrada advertencia:
            </p>
            <p className="mb-5 text-center text-app-text">
              &quot;Recuerda, es solo un juego...&quot;
            </p>
            <p className="text-right">— Legend</p>
          </div>
          <button
            className="border border-app-accent bg-app-accent px-5 py-4 text-[11px] font-bold tracking-[0.14em] text-app-background transition-colors hover:bg-transparent hover:text-app-accent"
            onClick={onEnterHub}
          >
            ENTRAR AL HUB
          </button>
        </div>
      </div>
    </section>
  );
}
