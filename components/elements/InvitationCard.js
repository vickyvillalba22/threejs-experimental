"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import LegendProgress from "@/components/progress/LegendProgress";
import { useProgress } from "@/hooks/useProgress";

const HOLD_DURATION = 1800;

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  });

  if (line) {
    context.fillText(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function createLetterTexture(showContent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 2048;
  const context = canvas.getContext("2d");
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  const margin = 120;
  const textWidth = canvas.width - margin * 2;

  context.fillStyle = "#f4e9c7";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const paperGradient = context.createRadialGradient(768, 950, 100, 768, 950, 1400);
  paperGradient.addColorStop(0, "rgba(255, 252, 226, 0.28)");
  paperGradient.addColorStop(1, "rgba(120, 74, 36, 0.18)");
  context.fillStyle = paperGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(76, 39, 35, 0.35)";
  context.lineWidth = 5;
  context.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);
  context.strokeStyle = "rgba(76, 39, 35, 0.12)";
  context.lineWidth = 2;
  context.strokeRect(94, 94, canvas.width - 188, canvas.height - 188);

  if (showContent) {
    context.textAlign = "center";
    context.fillStyle = "#4f2024";
    context.font = "600 34px Georgia, serif";
    context.fillText("DE LA OFICINA DEL MAESTRO DE CEREMONIAS", canvas.width / 2, 150);
    context.font = "700 84px Georgia, serif";
    context.fillText("Isla de los Sueños", canvas.width / 2, 255);

    context.strokeStyle = "rgba(115, 45, 43, 0.45)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(margin + 120, 310);
    context.lineTo(canvas.width - margin - 120, 310);
    context.stroke();

    context.textAlign = "left";
    context.fillStyle = "#3f2926";
    context.font = "40px Georgia, serif";
    let currentY = 390;
    currentY = drawWrappedText(context, "Estimado participante:", margin, currentY, textWidth, 60) + 30;
    currentY = drawWrappedText(
      context,
      "Ha sido distinguido con un privilegio reservado para muy pocos: atravesar las fronteras de mi feria. Ante usted se abren las puertas de Caraval, un escenario donde los deseos más profundos cobran vida y las ilusiones se entrelazan con la realidad.",
      margin,
      currentY,
      textWidth,
      60,
    ) + 30;

    context.fillStyle = "#70252c";
    context.font = "700 36px Georgia, serif";
    context.fillText("Su Cometido:", margin, currentY);
    currentY += 68;
    context.fillStyle = "#3f2926";
    context.font = "40px Georgia, serif";
    currentY = drawWrappedText(
      context,
      "Adéntrese en mi dominio y siga el camino que se abre ante usted. En cada escena encontrará objetos que guardan una parte de mí, pero no todos son los correctos. Solo aquellos que pertenecen al camino verdadero harán visible un fragmento auténtico de mi figura. Cuando esté completa, sabrá quién soy y conseguiré para usted un deseo.",
      margin,
      currentY,
      textWidth,
      60,
    ) + 30;
    currentY = drawWrappedText(
      context,
      "Pero le advierto que la magia tiene su precio y los pasillos de esta isla suelen extraviar a los imprudentes. Algunas cosas pueden parecerse a la magia, pero no todo lo que brilla pertenece a Legend. Antes de dar el primer paso y elegir su puerta, grabe en su mente nuestra única y sagrada advertencia:",
      margin,
      currentY,
      textWidth,
      60,
    ) + 32;

    context.textAlign = "center";
    context.fillStyle = "#70252c";
    context.font = "italic 700 46px Georgia, serif";
    context.fillText('“Recuerda, es solo un juego...”', canvas.width / 2, currentY);
    context.textAlign = "right";
    context.font = "italic 40px Georgia, serif";
    context.fillText("— Legend", canvas.width - margin, currentY + 70);

    context.textAlign = "center";
    context.fillStyle = "#70252c";
    context.font = "700 28px Georgia, serif";
    context.fillText("MANTENÉ PRESIONADO SOBRE LA ROSA PARA PINTARLA", canvas.width / 2, canvas.height - 120);
  } else {
    context.textAlign = "center";
    context.fillStyle = "rgba(79, 32, 36, 0.5)";
    context.font = "italic 42px Georgia, serif";
    context.fillText("La tinta espera una mano.", canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.center.set(0.5, 0.5);
  texture.rotation = 0;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.anisotropy = 4;
  return texture;
}

function RoseSymbol({ progress }) {
  return (
    <svg
      className="h-[86px] w-[86px]"
      style={{ filter: `drop-shadow(0 0 ${progress * 14 + 3}px rgba(190, 20, 50, ${0.2 + progress * 0.65}))` }}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="rose-progress-clip">
          <rect x="0" y={120 - progress * 120} width="120" height={progress * 120} />
        </clipPath>
      </defs>
      <g fill="#32151c" stroke="#713142" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M59 51C40 47 29 34 39 23c8-9 18 0 20 9 1-16 16-23 24-13 8 10-2 22-15 29 17-5 29 2 27 13-2 12-19 13-32 5 10 11 7 26-5 27-13 1-17-15-13-28-8 12-22 12-28 3-6-10 6-20 21-20Z" />
        <path d="M57 53C48 42 49 29 59 27c10-2 14 10 10 20 9-10 22-8 24 1 2 10-10 16-22 15 12 7 13 19 5 24-9 5-18-6-19-18-4 12-16 15-22 8-6-7 2-18 13-24Z" />
        <path d="M55 65c-4 14-5 27-2 39h13c-3-14-2-27-5-40Z" />
        <path d="M53 89c-10-7-19-7-27-3 8 2 14 7 18 15-1-6 2-10 9-12Z" />
        <path d="M63 91c10-7 19-7 27-3-8 2-14 7-18 15 1-6-2-10-9-12Z" />
      </g>
      <g clipPath="url(#rose-progress-clip)" fill="#c52243" stroke="#f0526d" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M59 51C40 47 29 34 39 23c8-9 18 0 20 9 1-16 16-23 24-13 8 10-2 22-15 29 17-5 29 2 27 13-2 12-19 13-32 5 10 11 7 26-5 27-13 1-17-15-13-28-8 12-22 12-28 3-6-10 6-20 21-20Z" />
        <path d="M57 53C48 42 49 29 59 27c10-2 14 10 10 20 9-10 22-8 24 1 2 10-10 16-22 15 12 7 13 19 5 24-9 5-18-6-19-18-4 12-16 15-22 8-6-7 2-18 13-24Z" />
        <path d="M55 65c-4 14-5 27-2 39h13c-3-14-2-27-5-40Z" />
        <path d="M53 89c-10-7-19-7-27-3 8 2 14 7 18 15-1-6 2-10 9-12Z" />
        <path d="M63 91c10-7 19-7 27-3-8 2-14 7-18 15 1-6-2-10-9-12Z" />
      </g>
    </svg>
  );
}

export default function InvitationCard({ onClose, onEnterHub }) {
  const sceneContainerRef = useRef(null);
  const holdAnimationRef = useRef(null);
  const holdStartRef = useRef(null);
  const [roseProgress, setRoseProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDrawnLetter, setHasDrawnLetter] = useState(false);
  const [hasPaintedAurio, setHasPaintedAurio] = useState(false);
  const [aurioMessage, setAurioMessage] = useState("");
  const { collectArtifact, collectedArtifacts } = useProgress();

  const hasPen = hasDrawnLetter || collectedArtifacts.has("pluma-tinta");
  const hasAurio = hasPaintedAurio || collectedArtifacts.has("aurio");

  function animateRoseHold(timestamp) {
    if (holdStartRef.current === null) holdStartRef.current = timestamp;
    const progress = Math.min((timestamp - holdStartRef.current) / HOLD_DURATION, 1);
    setRoseProgress(progress);

    if (progress >= 1) {
      holdAnimationRef.current = null;
      holdStartRef.current = null;
      if (!hasPen) {
        setAurioMessage("Primero debes usar la pluma sobre la carta.");
        return;
      }

      if (!hasAurio) {
        collectArtifact({ artifactId: "aurio", result: "correct" });
        setHasPaintedAurio(true);
        setAurioMessage("La rosa se transforma en una moneda de Aurio.");
        window.setTimeout(onEnterHub, 850);
      } else {
        onEnterHub();
      }
      return;
    }

    holdAnimationRef.current = window.requestAnimationFrame(animateRoseHold);
  }

  function startRoseHold() {
    if (holdAnimationRef.current === null) {
      holdStartRef.current = null;
      holdAnimationRef.current = window.requestAnimationFrame(animateRoseHold);
    }
  }

  function stopRoseHold() {
    if (holdAnimationRef.current !== null) {
      window.cancelAnimationFrame(holdAnimationRef.current);
      holdAnimationRef.current = null;
    }
    holdStartRef.current = null;
    setRoseProgress(0);
  }

  function drawOnLetter() {
    if (hasPen) return;
    collectArtifact({ artifactId: "pluma-tinta", result: "correct" });
    setHasDrawnLetter(true);
  }

  function handleRoseKeyDown(event) {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      startRoseHold();
    }
  }

  useEffect(() => {
    const container = sceneContainerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "pointer-events-none absolute inset-0 h-full w-full";
    container.appendChild(renderer.domElement);

    const letterGroup = new THREE.Group();
    letterGroup.rotation.z = Math.PI / 2;
    scene.add(letterGroup);
    const texture = createLetterTexture(hasPen);
    const loader = new GLTFLoader();
    let model;
    let modelSize = null;

    function fitModelToViewport() {
      if (!model || !modelSize) return;

      const visibleHeight =
        2 *
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
        camera.position.z;
      const visibleWidth = visibleHeight * camera.aspect;
      const horizontalScale = visibleWidth / modelSize.x;
      const verticalScale = visibleHeight / modelSize.y;
      const scale = Math.min(horizontalScale, verticalScale) * 0.86;

      letterGroup.scale.setScalar(scale);
    }

    let isDisposed = false;

    loader.load(
      "/models/letter-paper.glb",
      (gltf) => {
        if (isDisposed) return;
        model = gltf.scene;
        model.rotation.x = Math.PI / 2;
        model.updateMatrixWorld(true);
        model.traverse((object) => {
          if (!object.isMesh) return;
          object.material = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            roughness: 0.86,
            metalness: 0,
            side: THREE.DoubleSide,
          });
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const boundsSize = box.getSize(new THREE.Vector3());
        modelSize = new THREE.Vector3(boundsSize.y, boundsSize.x, boundsSize.z);
        letterGroup.add(model);
        fitModelToViewport();
        setIsLoading(false);
      },
      undefined,
      () => {
        if (!isDisposed) setIsLoading(false);
      },
    );

    scene.add(new THREE.AmbientLight(0xffe6c5, 2.2));
    const warmLight = new THREE.PointLight(0xffd4a4, 28, 12);
    warmLight.position.set(2.5, 3, 5);
    scene.add(warmLight);
    const redLight = new THREE.PointLight(0x8d1f3c, 18, 10);
    redLight.position.set(-3, -2, 3);
    scene.add(redLight);

    const particlePositions = new Float32Array(110 * 3);
    for (let index = 0; index < 110; index += 1) {
      particlePositions[index * 3] = (Math.random() - 0.5) * 8;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 6;
      particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xffe6c5, size: 0.018, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const clock = new THREE.Clock();
    let animationFrame;
    let targetRotationX = 0;
    let targetRotationY = 0;

    function handlePointerMove(event) {
      targetRotationY = ((event.clientX / window.innerWidth) * 2 - 1) * 0.06;
      targetRotationX = ((event.clientY / window.innerHeight) * 2 - 1) * 0.04;
    }

    function resizeScene() {
      const { width, height } = container.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      fitModelToViewport();
    }

    function animate() {
      const elapsed = clock.getElapsedTime();
      letterGroup.position.y = Math.sin(elapsed * 0.8) * 0.04;
      letterGroup.rotation.x += (targetRotationX - letterGroup.rotation.x) * 0.025;
      letterGroup.rotation.y += (targetRotationY - letterGroup.rotation.y) * 0.025;
      particles.rotation.z = elapsed * 0.012;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    }

    resizeScene();
    window.addEventListener("resize", resizeScene);
    window.addEventListener("pointermove", handlePointerMove);
    animate();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeScene);
      window.removeEventListener("pointermove", handlePointerMove);
      texture.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [hasPen]);

  useEffect(() => () => {
    if (holdAnimationRef.current !== null) window.cancelAnimationFrame(holdAnimationRef.current);
  }, []);

  return (
    <section className="fixed inset-0 z-[50] overflow-hidden bg-[#110d0d]" aria-labelledby="invitation-title">
      <LegendProgress />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(116,46,37,0.2),transparent_58%)]" />
      <button
        className="absolute right-6 top-5 z-[3] border-0 bg-transparent text-3xl text-[#d9cdb8] transition-colors hover:text-white"
        onClick={onClose}
        aria-label="Cerrar invitación"
      >
        ×
      </button>
      <div
        ref={sceneContainerRef}
        className="absolute left-1/2 top-1/2 aspect-[0.82] h-[min(78svh,700px)] w-auto max-w-[88vw] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        {isLoading && (
          <p className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 text-[10px] tracking-[0.16em] text-[#d9cdb8]">
            ABRIENDO LA INVITACIÓN…
          </p>
        )}
        <button
          className="group absolute bottom-[7%] left-1/2 z-[2] grid -translate-x-1/2 place-items-center border-0 bg-transparent p-2 text-[#d9cdb8] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            startRoseHold();
          }}
          onPointerUp={stopRoseHold}
          onPointerCancel={stopRoseHold}
          onPointerLeave={stopRoseHold}
          onKeyDown={handleRoseKeyDown}
          onKeyUp={(event) => {
            if (event.key === "Enter" || event.key === " ") stopRoseHold();
          }}
          onBlur={stopRoseHold}
           aria-label="Mantener presionada la rosa para pintarla y dirigirte a Caraval"
          aria-pressed={roseProgress > 0}
        >
          <RoseSymbol progress={roseProgress} />
           <span className="sr-only">Mantené presionado sobre la rosa para pintarla y dirigirte a Caraval</span>
        </button>
      </div>
      <h2 id="invitation-title" className="sr-only">Invitación a la Isla de los Sueños</h2>
      <section className="invitation-interactions" aria-label="Objetos de la invitación">
        <p className="invitation-interactions__eyebrow">PRIMEROS OBJETOS</p>
        <p className="invitation-interactions__message">
          {!hasPen
            ? "La carta está en blanco. Toma la pluma y dibuja sobre ella."
            : !hasAurio
              ? "La carta ha despertado. Mantén presionada la rosa para pintarla."
              : "La carta guarda sus secretos. Ya puedes dirigirte a Caraval."}
        </p>
        {!hasPen && (
          <button type="button" onClick={drawOnLetter}>
            TOMAR LA PLUMA Y ESCRIBIR
          </button>
        )}
        {hasPen && !hasAurio && (
          <p className="invitation-interactions__hint">Mantén presionada la rosa de la carta.</p>
        )}
        {aurioMessage && (
          <p className="invitation-interactions__result" aria-live="polite">{aurioMessage}</p>
        )}
      </section>
    </section>
  );
}
