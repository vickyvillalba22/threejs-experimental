"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AnimatePresence, motion } from "motion/react";
import LegendProgress from "@/components/progress/LegendProgress";
import { useProgress } from "@/hooks/useProgress";
import {
  COIN_ENTRANCE_DURATION,
  COIN_SAVE_DURATION,
  HOLD_DURATION,
  LETTER_TEXT_REVEAL_DURATION,
  LETTER_TEXT_REVEAL_STEPS,
  PEN_FRAGMENT_MESSAGE_DURATION,
  PEN_REVEAL_DURATION,
  SEAL_TRANSFORM_DURATION,
} from "./constants";
import { easeOutCubic, getWorldPointAtScreenPosition } from "./invitationAnimations";
import { createLetterTexture, updateLetterTexture } from "./invitationTexture";
import styles from "./InvitationCard.module.css";

function RoseSymbol({ progress }) {
  return (
    <svg
      className={styles.roseSymbol}
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
  const penRevealRef = useRef({ active: false, completed: false, startedAt: 0 });
  const letterRevealPlayedRef = useRef(false);
  const coinEntranceRef = useRef({ active: false, startedAt: 0 });
  const transformationTimeoutRef = useRef(null);
  const transformationEndTimeoutRef = useRef(null);
  const penFragmentMessageTimeoutRef = useRef(null);
  const coinSaveTimeoutRef = useRef(null);
  const coinSaveRequestRef = useRef(null);
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
  const [isCoinSaving, setIsCoinSaving] = useState(false);
  const [aurioMessage, setAurioMessage] = useState("");
  const [isPenFragmentMessageVisible, setIsPenFragmentMessageVisible] = useState(false);
  const { collectArtifact, collectedArtifacts } = useProgress();

  const hasPen = collectedArtifacts.has("pluma-tinta");
  const hasRevealedLetter = hasDrawnLetter || hasPen;
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
    if (hasRevealedLetter || isHoldingPen) return;
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
    if (!canvas || !isHoldingPen || hasRevealedLetter) return undefined;

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
  }, [hasRevealedLetter, isHoldingPen]);

  function animateRoseHold(timestamp) {
    if (holdStartRef.current === null) holdStartRef.current = timestamp;
    const progress = Math.min((timestamp - holdStartRef.current) / HOLD_DURATION, 1);
    roseProgressRef.current = progress;
    setRoseProgress(progress);

    if (progress >= 1) {
      holdAnimationRef.current = null;
      holdStartRef.current = null;
      if (!hasRevealedLetter) {
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
    if (hasRevealedLetter) return;
    revealLetter();
  }

  function revealLetter() {
    if (hasRevealedLetter) return;
    penRevealRef.current = { active: true, completed: false, startedAt: performance.now() };
    setHasDrawnLetter(true);
    setIsHoldingPen(false);
    setIsPenFragmentMessageVisible(true);
    if (penFragmentMessageTimeoutRef.current !== null) {
      window.clearTimeout(penFragmentMessageTimeoutRef.current);
    }
    penFragmentMessageTimeoutRef.current = window.setTimeout(() => {
      collectArtifact({ artifactId: "pluma-tinta", result: "correct" });
      setIsPenFragmentMessageVisible(false);
      penFragmentMessageTimeoutRef.current = null;
    }, PEN_FRAGMENT_MESSAGE_DURATION);
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
    if (!isHoldingPen || hasRevealedLetter) return;
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

  function saveCoinAndEnterHub() {
    if (isCoinSaving) return;

    const progressFigure = document.querySelector("[data-progress-figure]");
    const progressBounds = progressFigure?.getBoundingClientRect();
    coinSaveRequestRef.current = {
      targetX: progressBounds ? progressBounds.left + progressBounds.width / 2 : window.innerWidth - 80,
      targetY: progressBounds ? progressBounds.top + progressBounds.height / 2 : 100,
    };
    setIsCoinSaving(true);
    coinSaveTimeoutRef.current = window.setTimeout(() => {
      onEnterHub();
    }, COIN_SAVE_DURATION);
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
    const shouldAnimateLetterText =
      hasRevealedLetter &&
      !letterRevealPlayedRef.current &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let letterRevealStep = shouldAnimateLetterText ? 0 : LETTER_TEXT_REVEAL_STEPS;
    const letterRevealStartedAt = performance.now();
    const texture = createLetterTexture(
      hasRevealedLetter,
      shouldAnimateLetterText ? 0 : 1,
    );
    if (hasRevealedLetter && !shouldAnimateLetterText) {
      letterRevealPlayedRef.current = true;
    }
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
    const penMaterials = [];
    const penStartPosition = new THREE.Vector3(1.62, 0.2, 0.3);
    const penRevealTarget = new THREE.Vector3(0, 0, 0.8);
    const penWhiteColor = new THREE.Color(0xffffff);
    const penGoldColor = new THREE.Color(0xd3ad72);
    penGroup.position.copy(penStartPosition);

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
           const material = new THREE.MeshStandardMaterial({
             color: 0xffffff,
             emissive: 0x000000,
             emissiveIntensity: 0.18,
             roughness: 0.62,
             metalness: 0.08,
           });
           penMaterials.push(material);
           object.material = material;
         });
         penGroup.add(penModel);
         penGroup.position.copy(penStartPosition);
      },
      undefined,
      () => undefined,
    );

    const sealGroup = new THREE.Group();
    // Keep the seal hidden as soon as the coin entrance starts. The scene is
    // rebuilt when the entrance state changes, so initializing it as visible
    // here can otherwise make it flash for a frame over the coin.
    sealGroup.visible = hasRevealedLetter && !isAurioRevealed && !isCoinEntering;
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
    const coinSaveAnimation = {
      active: false,
      startedAt: 0,
      origin: new THREE.Vector3(),
      target: new THREE.Vector3(),
    };

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
      if (shouldAnimateLetterText && letterRevealStep < LETTER_TEXT_REVEAL_STEPS) {
        const revealProgress = Math.min(
          (performance.now() - letterRevealStartedAt) / LETTER_TEXT_REVEAL_DURATION,
          1,
        );
        const nextRevealStep = Math.floor(revealProgress * LETTER_TEXT_REVEAL_STEPS);
        if (nextRevealStep > letterRevealStep) {
          letterRevealStep = nextRevealStep;
          updateLetterTexture(texture, true, letterRevealStep / LETTER_TEXT_REVEAL_STEPS);
        }
        if (revealProgress >= 1) letterRevealPlayedRef.current = true;
      }
      letterGroup.position.y = Math.sin(elapsed * 0.8) * 0.04;
      letterGroup.rotation.x += (targetRotationX - letterGroup.rotation.x) * 0.025;
      letterGroup.rotation.y += (targetRotationY - letterGroup.rotation.y) * 0.025;
      sealGroup.position.y = -1.2 + letterGroup.position.y;
      sealGroup.rotation.x = letterGroup.rotation.x;
      sealGroup.rotation.y = letterGroup.rotation.y;
      if (penGroup && !penDragRef.current.active) {
        penGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.04;
        if (penRevealRef.current.active) {
          const revealProgress = Math.min(
            (performance.now() - penRevealRef.current.startedAt) / PEN_REVEAL_DURATION,
            1,
          );
          const revealEase = easeOutCubic(revealProgress);
          penGroup.position.lerpVectors(penStartPosition, penRevealTarget, revealEase);
          penMaterials.forEach((material) => {
            material.color.copy(penWhiteColor).lerp(penGoldColor, revealEase);
          });
          if (revealProgress >= 1) {
            penRevealRef.current.active = false;
            penRevealRef.current.completed = true;
          }
        } else if (penRevealRef.current.completed) {
          penGroup.position.copy(penRevealTarget);
          penMaterials.forEach((material) => material.color.copy(penGoldColor));
        } else {
          penGroup.position.y = 0.2 + Math.sin(elapsed * 1.1) * 0.08;
        }
      }
      coinGroup.rotation.y = elapsed * 1.2;
      coinGroup.rotation.x = Math.sin(elapsed * 0.7) * 0.08;
      sealGroup.rotation.y = letterGroup.rotation.y + Math.sin(elapsed * 0.8) * 0.12;
      sealGroup.rotation.z = Math.sin(elapsed * 0.55) * 0.035;
      const transformProgress = transformationRef.current.active
        ? Math.min((performance.now() - transformationRef.current.startedAt) / SEAL_TRANSFORM_DURATION, 1)
        : 0;
      sealGroup.visible = hasRevealedLetter && !isAurioRevealed && !isCoinEntering;
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
      const coinEase = easeOutCubic(coinProgress);

      if (coinSaveRequestRef.current && !coinSaveAnimation.active) {
        const { targetX, targetY } = coinSaveRequestRef.current;

        coinSaveAnimation.active = true;
        coinSaveAnimation.startedAt = performance.now();
        coinSaveAnimation.origin.copy(coinGroup.position);
        coinSaveAnimation.target.copy(getWorldPointAtScreenPosition(camera, targetX, targetY));
        coinSaveRequestRef.current = null;
      }

      const coinSaveProgress = coinSaveAnimation.active
        ? Math.min((performance.now() - coinSaveAnimation.startedAt) / COIN_SAVE_DURATION, 1)
        : 0;
      const coinSaveEase = easeOutCubic(coinSaveProgress);
      coinGroup.visible = isCoinVisible;
      if (coinSaveAnimation.active) {
        coinGroup.position.lerpVectors(coinSaveAnimation.origin, coinSaveAnimation.target, coinSaveEase);
        coinGroup.scale.setScalar(Math.max(0.04, 1 - coinSaveEase * 0.96));
        coinGroup.rotation.x += 0.12;
        coinGroup.rotation.y += 0.16;
      } else {
        coinGroup.scale.setScalar(0.08 + coinEase * 0.92);
        coinGroup.rotation.x = coinEntranceRef.current.active
          ? -coinProgress * Math.PI * 2
          : Math.sin(elapsed * 0.55) * 0.08;
        coinGroup.rotation.y = elapsed * (coinEntranceRef.current.active ? 2.4 : 1.2);
      }
      coinMaterials.forEach((material) => {
        material.opacity = coinSaveAnimation.active ? coinEase * (1 - coinSaveEase) : coinEase;
        material.emissiveIntensity = 0.12 + Math.sin(coinProgress * Math.PI) * 0.45;
      });
      coinGlow.intensity = coinSaveAnimation.active
        ? Math.sin(coinSaveEase * Math.PI) * 20
        : Math.sin(coinProgress * Math.PI) * 26;
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
  }, [hasPen, hasRevealedLetter, isAurioRevealed, isCoinEntering, isCoinVisible]);

  useEffect(() => () => {
    if (holdAnimationRef.current !== null) window.cancelAnimationFrame(holdAnimationRef.current);
    if (transformationTimeoutRef.current !== null) window.clearTimeout(transformationTimeoutRef.current);
    if (transformationEndTimeoutRef.current !== null) window.clearTimeout(transformationEndTimeoutRef.current);
    if (penFragmentMessageTimeoutRef.current !== null) window.clearTimeout(penFragmentMessageTimeoutRef.current);
    if (coinSaveTimeoutRef.current !== null) window.clearTimeout(coinSaveTimeoutRef.current);
  }, []);

  return (
    <section className={styles.invitation} aria-labelledby="invitation-title">
      <LegendProgress />
      <div className={styles.atmosphere} />
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Cerrar invitación"
      >
        ×
      </button>
      <div
        ref={sceneContainerRef}
        className={styles.sceneContainer}
        aria-hidden="true"
      >
        {isLoading && (
          <p className={styles.loading}>
            ABRIENDO LA INVITACIÓN…
          </p>
        )}
        {!hasRevealedLetter && !isHoldingPen && (
          <button
            type="button"
            className={styles.penDropZone}
            onPointerDown={handlePenPointerDown}
            onPointerMove={handlePenPointerMove}
            onPointerUp={handlePenPointerUp}
            onPointerCancel={handlePenPointerCancel}
            aria-label="Arrastrar la pluma hasta la carta"
            title="Arrastrá la pluma hasta la carta"
          />
        )}
        {!hasRevealedLetter && isHoldingPen && (
          <canvas
            ref={drawingCanvasRef}
            className={styles.drawingCanvas}
            style={{ backgroundColor: "transparent" }}
            aria-label="Dibuja sobre la carta para revelar su contenido"
            onPointerDown={handleDrawingPointerDown}
            onPointerMove={handleDrawingPointerMove}
            onPointerUp={handleDrawingPointerUp}
            onPointerCancel={handleDrawingPointerUp}
          />
        )}
        {hasRevealedLetter && !isAurioRevealed && !isTransforming && (
          <button
            className={styles.roseButton}
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
            <span className={styles.hidden} aria-hidden="true"><RoseSymbol progress={roseProgress} /></span>
            <span className={styles.visuallyHidden}>Mantené presionado el sello para llenarlo y conseguir la moneda</span>
          </button>
        )}
      </div>
      <h2 id="invitation-title" className={styles.visuallyHidden}>Invitación a la Isla de los Sueños</h2>
      <section className={styles.interactions} aria-label="Objetos de la invitación">
        <p className={styles.eyebrow}>PRIMEROS OBJETOS</p>
        <p className={styles.message}>
          {!hasRevealedLetter
            ? "Escribas lo que escribas, ella ya sabe lo que quiere decirte."
            : !hasAurio
              ? "La carta ha despertado. Mantén presionada la rosa para pintarla."
              : "La carta guarda sus secretos. Ya puedes dirigirte a Caraval."}
        </p>
        {isHoldingPen && !hasRevealedLetter && (
          <p className={styles.hint}>Dibuja cualquier forma sobre la carta para revelar su contenido.</p>
        )}
        {hasRevealedLetter && !hasAurio && (
          <p className={styles.hint}>Mantén presionada la rosa de la carta.</p>
        )}
        {aurioMessage && (
          <p className={styles.result} aria-live="polite">{aurioMessage}</p>
        )}
      </section>
      <AnimatePresence>
        {isPenFragmentMessageVisible && !hasPen && (
          <motion.section
            className={styles.fragmentReveal}
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <motion.div
              className={styles.fragmentPanel}
              initial={{ opacity: 0, y: 28, scale: 0.9, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, scale: 0.96, filter: "blur(5px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.p
                className={styles.fragmentTitle}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              >
                Primer fragmento: Pluma de tinta -
              </motion.p>
              <motion.p
                className={styles.fragmentMeaning}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.5, ease: "easeOut" }}
              >
                <strong>El Poder de Escribir la Realidad:</strong> Representa la autoría absoluta de Legend sobre todo el juego y la magia de la isla.
              </motion.p>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
      {isAurioRevealed && !isCoinEntering && (
        <section className={styles.rewardOverlay}>
          <div className={styles.rewardPanel}>
            <p className={styles.rewardEyebrow}>FRAGMENTO CONSEGUIDO</p>
            <p className={styles.rewardTitle}>El Aurio de Legend</p>
            <p className={styles.rewardText}>En su superficie resplandece la promesa de un deseo capaz de desafiar la realidad, recordándote que la única forma de reclamarlo será descubriendo la figura secreta de quien gobierna esta feria.</p>
            <button
              type="button"
              className={styles.rewardButton}
              onClick={saveCoinAndEnterHub}
              disabled={isCoinSaving}
            >
              {isCoinSaving ? "GUARDANDO…" : "CONTINUAR"}
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
