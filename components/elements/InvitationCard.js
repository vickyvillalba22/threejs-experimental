"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import LegendProgress from "@/components/progress/LegendProgress";
import { useProgress } from "@/hooks/useProgress";

const HOLD_DURATION = 1800;
const SEAL_TRANSFORM_DURATION = 1500;
const COIN_ENTRANCE_DURATION = 1300;

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
     context.font = "600 44px Georgia, serif";
     context.fillText("DE LA OFICINA DEL MAESTRO DE CEREMONIAS", canvas.width / 2, 150);
     context.font = "700 100px Georgia, serif";
     context.fillText("Isla de los Sueños", canvas.width / 2, 255);

    context.strokeStyle = "rgba(115, 45, 43, 0.45)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(margin + 120, 310);
    context.lineTo(canvas.width - margin - 120, 310);
    context.stroke();

    context.textAlign = "left";
    context.fillStyle = "#3f2926";
     context.font = "54px Georgia, serif";
     let currentY = 390;
     currentY = drawWrappedText(context, "Estimado participante:", margin, currentY, textWidth, 72) + 30;
     currentY = drawWrappedText(
       context,
       "Has sido invitado a cruzar las fronteras de Caraval, donde los deseos cobran vida y la ilusión se confunde con la realidad.",
       margin,
       currentY,
       textWidth,
       72,
     ) + 30;

    context.fillStyle = "#70252c";
     context.font = "700 42px Georgia, serif";
    context.fillText("Su Cometido:", margin, currentY);
     currentY += 76;
    context.fillStyle = "#3f2926";
     context.font = "54px Georgia, serif";
     currentY = drawWrappedText(
       context,
       "Recorre la feria y encuentra los objetos que guardan los fragmentos de Legend. Solo los correctos revelarán su verdadera identidad.",
       margin,
       currentY,
       textWidth,
       72,
     ) + 30;
     currentY = drawWrappedText(
       context,
       "La magia tiene un precio. No todo lo que brilla pertenece a Legend. Antes de comenzar, recuerda nuestra única advertencia:",
       margin,
       currentY,
       textWidth,
       72,
    ) + 32;

    context.textAlign = "center";
    context.fillStyle = "#70252c";
     context.font = "italic 700 54px Georgia, serif";
    context.fillText('“Recuerda, es solo un juego...”', canvas.width / 2, currentY);
    context.textAlign = "right";
     context.font = "italic 46px Georgia, serif";
    context.fillText("— Legend", canvas.width - margin, currentY + 70);

    context.textAlign = "center";
    context.fillStyle = "#70252c";
     context.font = "700 34px Georgia, serif";
    context.fillText("MANTENÉ PRESIONADO SOBRE EL SELLO PARA PINTARLO", canvas.width / 2, canvas.height - 120);
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
  texture.needsUpdate = true;
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
  const drawingCanvasRef = useRef(null);
  const penGroupRef = useRef(null);
  const holdAnimationRef = useRef(null);
  const holdStartRef = useRef(null);
  const roseProgressRef = useRef(0);
  const transformationRef = useRef({ active: false, startedAt: 0 });
  const coinEntranceRef = useRef({ active: false, startedAt: 0 });
  const transformationTimeoutRef = useRef(null);
  const transformationEndTimeoutRef = useRef(null);
  const drawingRef = useRef({ active: false, lastPoint: null });
  const penDragRef = useRef({ active: false });
  const [roseProgress, setRoseProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDrawnLetter, setHasDrawnLetter] = useState(false);
  const [isHoldingPen, setIsHoldingPen] = useState(false);
  const [hasPaintedAurio, setHasPaintedAurio] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isCoinEntering, setIsCoinEntering] = useState(false);
  const [isCoinVisible, setIsCoinVisible] = useState(false);
  const [isAurioRevealed, setIsAurioRevealed] = useState(false);
  const [aurioMessage, setAurioMessage] = useState("");
  const { collectArtifact, collectedArtifacts } = useProgress();

  const hasPen = hasDrawnLetter || collectedArtifacts.has("pluma-tinta");
  const hasAurio = hasPaintedAurio || collectedArtifacts.has("aurio");

  function movePenToPointer(event) {
    const container = sceneContainerRef.current;
    const penGroup = penGroupRef.current;
    if (!container || !penGroup) return;

    const bounds = container.getBoundingClientRect();
    const aspect = bounds.width / Math.max(bounds.height, 1);
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(32 / 2)) * 9;
    const visibleWidth = visibleHeight * aspect;
    penGroup.position.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * visibleWidth;
    penGroup.position.y = (0.5 - (event.clientY - bounds.top) / bounds.height) * visibleHeight;
  }

  function isPointerOverLetter(event) {
    const container = sceneContainerRef.current;
    if (!container) return false;
    const bounds = container.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width;
    const relativeY = (event.clientY - bounds.top) / bounds.height;
    return relativeX >= 0.02 && relativeX <= 0.98 && relativeY >= 0.02 && relativeY <= 0.94;
  }

  function resetPenPosition() {
    if (!penGroupRef.current) return;
    penGroupRef.current.position.set(1.62, 0.2, 0.3);
  }

  function handlePenPointerDown(event) {
    if (hasPen || isHoldingPen) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    penDragRef.current.active = true;
    movePenToPointer(event);
  }

  function handlePenPointerMove(event) {
    if (!penDragRef.current.active) return;
    movePenToPointer(event);
  }

  function handlePenPointerUp(event) {
    if (!penDragRef.current.active) return;
    penDragRef.current.active = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (isPointerOverLetter(event)) {
      if (penGroupRef.current) {
        penGroupRef.current.visible = false;
        penGroupRef.current.position.set(0, 0, -10);
      }
      revealLetter();
      return;
    }

    resetPenPosition();
  }

  function handlePenPointerCancel(event) {
    if (!penDragRef.current.active) return;
    penDragRef.current.active = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    resetPenPosition();
  }

  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || !isHoldingPen || hasPen) return undefined;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio));
      const context = canvas.getContext("2d");
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(pixelRatio, pixelRatio);
      context.strokeStyle = "rgba(112, 37, 44, 0.8)";
      context.lineWidth = 4;
      context.lineCap = "round";
      context.lineJoin = "round";
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [hasPen, isHoldingPen]);

  function animateRoseHold(timestamp) {
    if (holdStartRef.current === null) holdStartRef.current = timestamp;
    const progress = Math.min((timestamp - holdStartRef.current) / HOLD_DURATION, 1);
    roseProgressRef.current = progress;
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
        transformationRef.current = { active: true, startedAt: performance.now() };
        setIsTransforming(true);
        setAurioMessage("La rosa se transforma en una moneda de Aurio.");
        transformationTimeoutRef.current = window.setTimeout(() => {
          coinEntranceRef.current = { active: true, startedAt: performance.now() };
          setIsCoinEntering(true);
          setIsCoinVisible(true);
          transformationTimeoutRef.current = window.setTimeout(() => {
            coinEntranceRef.current.active = false;
            setIsCoinEntering(false);
            setIsAurioRevealed(true);
          }, COIN_ENTRANCE_DURATION);
        }, 700);
        transformationEndTimeoutRef.current = window.setTimeout(() => {
          transformationRef.current.active = false;
          setIsTransforming(false);
        }, SEAL_TRANSFORM_DURATION);
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
    roseProgressRef.current = 0;
    setRoseProgress(0);
  }

  function finishDrawing() {
    if (hasPen) return;
    revealLetter();
  }

  function revealLetter() {
    if (hasPen) return;
    collectArtifact({ artifactId: "pluma-tinta", result: "correct" });
    setHasDrawnLetter(true);
    setIsHoldingPen(false);
    drawingRef.current = { active: false, lastPoint: null };
  }

  function getDrawingPoint(event) {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }

  function handleDrawingPointerDown(event) {
    if (!isHoldingPen || hasPen) return;
    const point = getDrawingPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current.active = true;
    drawingRef.current.lastPoint = point;
    const context = event.currentTarget.getContext("2d");
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function handleDrawingPointerMove(event) {
    if (!drawingRef.current.active) return;
    const point = getDrawingPoint(event);
    const previousPoint = drawingRef.current.lastPoint;
    if (!point || !previousPoint) return;
    const context = event.currentTarget.getContext("2d");
    context.lineTo(point.x, point.y);
    context.stroke();
    drawingRef.current.lastPoint = point;
  }

  function handleDrawingPointerUp(event) {
    if (!drawingRef.current.active) return;
    drawingRef.current.active = false;
    drawingRef.current.lastPoint = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    finishDrawing();
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
    letterGroup.visible = !isAurioRevealed;
    scene.add(letterGroup);
    const texture = createLetterTexture(hasPen);
    const loader = new GLTFLoader();
    let model;
    let modelSize = null;
    const letterMaterials = [];

    function fitModelToViewport() {
      if (!model || !modelSize) return;

      const visibleHeight =
        2 *
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
        camera.position.z;
      const visibleWidth = visibleHeight * camera.aspect;
      const horizontalScale = visibleWidth / modelSize.x;
      const verticalScale = visibleHeight / modelSize.y;
       const scale = Math.min(horizontalScale, verticalScale) * 0.92;

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
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1,
          });
          material.map.needsUpdate = true;
          material.needsUpdate = true;
          letterMaterials.push(material);
          object.material = material;
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

    const penGroup = new THREE.Group();
    penGroup.visible = !hasPen;
    penGroupRef.current = penGroup;
    scene.add(penGroup);

    loader.load(
      "/models/main%20objects/high_poly_stylized_feather_-_free_download.glb",
      (gltf) => {
        if (isDisposed) return;
        const penModel = gltf.scene;
        penModel.rotation.z = -Math.PI / 8;
        penModel.updateMatrixWorld(true);
        const penBox = new THREE.Box3().setFromObject(penModel);
        const penCenter = penBox.getCenter(new THREE.Vector3());
        const penSize = penBox.getSize(new THREE.Vector3());
        penModel.position.sub(penCenter);
        penModel.scale.setScalar(1.8 / Math.max(penSize.x, penSize.y, penSize.z));
        penModel.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = true;
          object.material = new THREE.MeshStandardMaterial({
            color: 0xd3ad72,
            emissive: 0x24130b,
            emissiveIntensity: 0.18,
            roughness: 0.62,
            metalness: 0.08,
          });
        });
        penGroup.add(penModel);
        penGroup.position.set(1.62, 0.2, 0.3);
      },
      undefined,
      () => undefined,
    );

    const sealGroup = new THREE.Group();
    sealGroup.visible = hasPen && !isAurioRevealed;
    sealGroup.position.set(0, -1.2, 0.8);
    scene.add(sealGroup);
    const sealMaterials = [];
    const sealEmptyColor = new THREE.Color(0xffffff);
    const sealFilledColor = new THREE.Color(0x70252c);

    loader.load(
      "/models/wax_seal_with_plant.glb",
      (gltf) => {
        if (isDisposed) return;
        const sealModel = gltf.scene;
        sealModel.updateMatrixWorld(true);
        const sealBox = new THREE.Box3().setFromObject(sealModel);
        const sealCenter = sealBox.getCenter(new THREE.Vector3());
        const sealSize = sealBox.getSize(new THREE.Vector3());
        sealModel.position.sub(sealCenter);
        sealModel.scale.setScalar(0.74 / Math.max(sealSize.x, sealSize.y, sealSize.z));
        sealModel.traverse((object) => {
          if (!object.isMesh) return;
          const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.48,
            depthWrite: false,
            emissive: 0x180408,
            emissiveIntensity: 0.12,
            roughness: 0.58,
            metalness: 0.08,
          });
          sealMaterials.push(material);
          object.material = material;
        });
        sealGroup.add(sealModel);
      },
      undefined,
      () => undefined,
    );

    const burstPositions = new Float32Array(90 * 3);
    for (let index = 0; index < 90; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35 + Math.random() * 1.25;
      burstPositions[index * 3] = Math.cos(angle) * radius;
      burstPositions[index * 3 + 1] = Math.sin(angle) * radius;
      burstPositions[index * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    const burstGeometry = new THREE.BufferGeometry();
    burstGeometry.setAttribute("position", new THREE.BufferAttribute(burstPositions, 3));
    const burstMaterial = new THREE.PointsMaterial({
      color: 0xf0d58c,
      size: 0.045,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const burstParticles = new THREE.Points(burstGeometry, burstMaterial);
    burstParticles.position.set(0, -1.2, 0.8);
    scene.add(burstParticles);

    const coinGroup = new THREE.Group();
    coinGroup.visible = isCoinVisible;
    scene.add(coinGroup);
    const coinMaterials = [];

    loader.load(
      "/models/main%20objects/pre-islamic_silver_coin_saa022n.glb",
      (gltf) => {
        if (isDisposed) return;
        const coinModel = gltf.scene;
        coinModel.updateMatrixWorld(true);
        const coinBox = new THREE.Box3().setFromObject(coinModel);
        const coinCenter = coinBox.getCenter(new THREE.Vector3());
        const coinSize = coinBox.getSize(new THREE.Vector3());
        coinModel.position.sub(coinCenter);
        coinModel.scale.setScalar(2.2 / Math.max(coinSize.x, coinSize.y, coinSize.z));
        coinModel.traverse((object) => {
          if (!object.isMesh) return;
          const material = new THREE.MeshStandardMaterial({
            color: 0xc5c8ce,
            metalness: 0.82,
            roughness: 0.24,
            emissive: 0x20242b,
            emissiveIntensity: 0.12,
            transparent: true,
            opacity: 0,
            depthWrite: false,
          });
          coinMaterials.push(material);
          object.material = material;
        });
        coinGroup.add(coinModel);
      },
      undefined,
      () => undefined,
    );

    scene.add(new THREE.AmbientLight(0xffe6c5, 2.2));
    const warmLight = new THREE.PointLight(0xffd4a4, 28, 12);
    warmLight.position.set(2.5, 3, 5);
    scene.add(warmLight);
    const redLight = new THREE.PointLight(0x8d1f3c, 18, 10);
    redLight.position.set(-3, -2, 3);
    scene.add(redLight);
    const coinGlow = new THREE.PointLight(0xf0d58c, 0, 6);
    coinGlow.position.set(0, 0, 1.4);
    scene.add(coinGlow);

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
      sealGroup.position.y = -1.2 + letterGroup.position.y;
      sealGroup.rotation.x = letterGroup.rotation.x;
      sealGroup.rotation.y = letterGroup.rotation.y;
      if (penGroup && !penDragRef.current.active) {
        penGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.04;
        penGroup.position.y = 0.2 + Math.sin(elapsed * 1.1) * 0.08;
      }
      coinGroup.rotation.y = elapsed * 1.2;
      coinGroup.rotation.x = Math.sin(elapsed * 0.7) * 0.08;
      sealGroup.rotation.y = letterGroup.rotation.y + Math.sin(elapsed * 0.8) * 0.12;
      sealGroup.rotation.z = Math.sin(elapsed * 0.55) * 0.035;
      const transformProgress = transformationRef.current.active
        ? Math.min((performance.now() - transformationRef.current.startedAt) / SEAL_TRANSFORM_DURATION, 1)
        : 0;
      if (transformationRef.current.active) {
        sealGroup.rotation.y = elapsed * 4.5;
        sealGroup.rotation.z = elapsed * 1.2;
        sealGroup.scale.setScalar(Math.max(0.06, 1 - transformProgress * 0.94));
        burstParticles.visible = true;
        burstParticles.rotation.z = elapsed * 1.8;
        burstParticles.scale.setScalar(0.6 + transformProgress * 1.8);
        burstMaterial.opacity = Math.sin(transformProgress * Math.PI) * 0.95;
      } else {
        sealGroup.scale.setScalar(1);
        burstParticles.visible = false;
        burstMaterial.opacity = 0;
      }
      sealMaterials.forEach((material) => {
        const fillProgress = roseProgressRef.current;
        material.color.copy(sealEmptyColor).lerp(sealFilledColor, fillProgress);
        material.opacity = (0.48 + fillProgress * 0.52) * (1 - transformProgress);
        material.emissiveIntensity = 0.12 + fillProgress * 0.36;
      });
      const letterFade = transformationRef.current.active
        ? Math.max(0, 1 - transformProgress)
        : isCoinEntering
          ? 0
        : isAurioRevealed
          ? 0
          : 1;
      letterMaterials.forEach((material) => {
        material.opacity = letterFade;
      });
      const coinProgress = coinEntranceRef.current.active
        ? Math.min((performance.now() - coinEntranceRef.current.startedAt) / COIN_ENTRANCE_DURATION, 1)
        : isAurioRevealed
          ? 1
          : 0;
      const coinEase = 1 - (1 - coinProgress) ** 3;
      coinGroup.visible = isCoinVisible;
      coinGroup.scale.setScalar(0.08 + coinEase * 0.92);
      coinGroup.rotation.x = coinEntranceRef.current.active
        ? -coinProgress * Math.PI * 2
        : Math.sin(elapsed * 0.55) * 0.08;
      coinGroup.rotation.y = elapsed * (coinEntranceRef.current.active ? 2.4 : 1.2);
      coinMaterials.forEach((material) => {
        material.opacity = coinEase;
        material.emissiveIntensity = 0.12 + Math.sin(coinProgress * Math.PI) * 0.45;
      });
      coinGlow.intensity = Math.sin(coinProgress * Math.PI) * 26;
      if (coinEntranceRef.current.active) {
        burstParticles.position.set(0, 0, 0.8);
        burstParticles.visible = true;
        burstParticles.scale.setScalar(0.5 + coinEase * 1.8);
        burstParticles.rotation.z = -elapsed * 2.1;
        burstMaterial.opacity = Math.sin(coinProgress * Math.PI) * 0.9;
      }
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
      if (penGroupRef.current === penGroup) penGroupRef.current = null;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeScene);
      window.removeEventListener("pointermove", handlePointerMove);
      texture.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      burstGeometry.dispose();
      burstMaterial.dispose();
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [hasPen, isAurioRevealed, isCoinEntering, isCoinVisible]);

  useEffect(() => () => {
    if (holdAnimationRef.current !== null) window.cancelAnimationFrame(holdAnimationRef.current);
    if (transformationTimeoutRef.current !== null) window.clearTimeout(transformationTimeoutRef.current);
    if (transformationEndTimeoutRef.current !== null) window.clearTimeout(transformationEndTimeoutRef.current);
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
        className="absolute left-1/2 top-1/2 aspect-[0.82] h-[min(86svh,760px)] w-auto max-w-[94vw] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        {isLoading && (
          <p className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 text-[10px] tracking-[0.16em] text-[#d9cdb8]">
            ABRIENDO LA INVITACIÓN…
          </p>
        )}
        {!hasPen && !isHoldingPen && (
          <button
            type="button"
            className="absolute bottom-[18%] left-[58%] right-0 top-[12%] z-[4] cursor-grab border-0 bg-transparent focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 active:cursor-grabbing"
            onPointerDown={handlePenPointerDown}
            onPointerMove={handlePenPointerMove}
            onPointerUp={handlePenPointerUp}
            onPointerCancel={handlePenPointerCancel}
            aria-label="Arrastrar la pluma hasta la carta"
            title="Arrastrá la pluma hasta la carta"
          />
        )}
        {!hasPen && isHoldingPen && (
          <canvas
            ref={drawingCanvasRef}
            className="absolute left-[8%] right-[8%] top-[8%] bottom-[18%] z-[3] h-auto w-auto cursor-crosshair touch-none bg-transparent"
            style={{ backgroundColor: "transparent" }}
            aria-label="Dibuja sobre la carta para revelar su contenido"
            onPointerDown={handleDrawingPointerDown}
            onPointerMove={handleDrawingPointerMove}
            onPointerUp={handleDrawingPointerUp}
            onPointerCancel={handleDrawingPointerUp}
          />
        )}
        {hasPen && !isAurioRevealed && !isTransforming && (
          <button
            className="group absolute bottom-[4%] left-1/2 z-[2] h-[22%] w-[32%] -translate-x-1/2 border-0 bg-transparent p-2 text-[#d9cdb8] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
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
            aria-label="Mantener presionado el sello para llenarlo y conseguir la moneda"
            aria-pressed={roseProgress > 0}
          >
            <span className="hidden" aria-hidden="true"><RoseSymbol progress={roseProgress} /></span>
            <span className="sr-only">Mantené presionado el sello para llenarlo y conseguir la moneda</span>
          </button>
        )}
      </div>
      <h2 id="invitation-title" className="sr-only">Invitación a la Isla de los Sueños</h2>
      <section className="invitation-interactions" aria-label="Objetos de la invitación">
        <p className="invitation-interactions__eyebrow">PRIMEROS OBJETOS</p>
        <p className="invitation-interactions__message">
          {!hasPen
            ? "La carta está en blanco. Arrastra la pluma hasta la carta."
            : !hasAurio
              ? "La carta ha despertado. Mantén presionada la rosa para pintarla."
              : "La carta guarda sus secretos. Ya puedes dirigirte a Caraval."}
        </p>
        {isHoldingPen && !hasPen && (
          <p className="invitation-interactions__hint">Dibuja cualquier forma sobre la carta para revelar su contenido.</p>
        )}
        {hasPen && !hasAurio && (
          <p className="invitation-interactions__hint">Mantén presionada la rosa de la carta.</p>
        )}
        {aurioMessage && (
          <p className="invitation-interactions__result" aria-live="polite">{aurioMessage}</p>
        )}
      </section>
      {isAurioRevealed && !isCoinEntering && (
        <section className="absolute inset-0 z-[10] grid place-items-end bg-black/35 p-6 pb-12 text-center backdrop-blur-[1px]">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-[#d9cdb8]/40 bg-[#110d0d]/85 p-6 shadow-[0_0_45px_rgba(214,184,112,0.28)]">
            <p className="text-[10px] tracking-[0.2em] text-[#d9cdb8]">FRAGMENTO CONSEGUIDO</p>
            <p className="mt-3 font-app-display text-4xl text-[#f0dfb2]">Moneda de Aurio</p>
            <p className="mt-2 text-sm text-[#d9cdb8]">El sello se ha convertido en una moneda mágica.</p>
            <button
              type="button"
              className="mt-5 border border-[#d9cdb8]/60 px-5 py-3 text-xs tracking-[0.16em] text-[#f0dfb2] transition-colors hover:border-[#f0dfb2] hover:bg-[#f0dfb2]/10"
              onClick={onEnterHub}
            >
              CONTINUAR A CARAVAL
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
