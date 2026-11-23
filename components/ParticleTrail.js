"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const MAX_PARTICLES = 1900;

const vertexShader = `
  attribute float aAlpha;
  attribute float aSize;

  uniform vec2 uResolution;

  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (uResolution.y / 2.0);
  }
`;

const fragmentShader = `
  varying float vAlpha;

  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float softness = 1.0 - smoothstep(0.18, 0.5, distanceFromCenter);
    gl_FragColor = vec4(1.0, 1.0, 1.0, softness * vAlpha);
  }
`;

const electricVertexShader = `
  attribute float aAlpha;

  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const electricFragmentShader = `
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha);
  }
`;

const MAX_ELECTRIC_ARCS = 96;
const MAX_ELECTRIC_SEGMENTS = 720;

export default function ParticleTrail({
  onReveal,
  onInvalidGesture,
  gestureDensity = 1,
  gestureSpread = 1,
  gestureSize = 1,
  gestureSparks = 0,
  electricityDensity = 0,
}) {
  const canvasRef = useRef(null);
  const onRevealRef = useRef(onReveal);
  const onInvalidGestureRef = useRef(onInvalidGesture);

  useEffect(() => {
    onInvalidGestureRef.current = onInvalidGesture;
  }, [onInvalidGesture]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const positions = new Float32Array(MAX_PARTICLES * 3);
    const alphas = new Float32Array(MAX_PARTICLES);
    const sizes = new Float32Array(MAX_PARTICLES);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fragmentShader,
      transparent: true,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const electricPositions = new Float32Array(MAX_ELECTRIC_SEGMENTS * 2 * 3);
    const electricAlphas = new Float32Array(MAX_ELECTRIC_SEGMENTS * 2);
    const electricGeometry = new THREE.BufferGeometry();
    electricGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(electricPositions, 3),
    );
    electricGeometry.setAttribute(
      "aAlpha",
      new THREE.BufferAttribute(electricAlphas, 1),
    );

    const electricMaterial = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fragmentShader: electricFragmentShader,
      transparent: true,
      vertexShader: electricVertexShader,
    });
    const electricLines = new THREE.LineSegments(
      electricGeometry,
      electricMaterial,
    );
    scene.add(electricLines);

    const particles = [];
    const electricArcs = [];
    let aspect = 1;
    let hasPointer = false;
    let previousPointer = null;
    let gesturePoints = [];
    let isDrawingGesture = false;
    let hasRevealed = false;
    let animationFrame;
    let lastTime = performance.now();

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      aspect = width / Math.max(height, 1);
      camera.left = -aspect;
      camera.right = aspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width, height);
    }

    function addParticle(
      x,
      y,
      velocityX,
      velocityY,
      lifeMultiplier = 1,
      spreadMultiplier = 1,
      sizeMultiplier = 1,
    ) {
      if (particles.length >= MAX_PARTICLES) {
        particles.shift();
      }

      particles.push({
        alpha: 0.55 + Math.random() * 0.45,
        age: 0,
        life: (0.45 + Math.random() * 0.45) * lifeMultiplier,
        size: (0.012 + Math.random() * 0.018) * sizeMultiplier,
        vx: velocityX * (0.55 + Math.random() * 0.35),
        vy: velocityY * (0.55 + Math.random() * 0.35),
        x: x + (Math.random() - 0.5) * 0.018 * spreadMultiplier,
        y: y + (Math.random() - 0.5) * 0.018 * spreadMultiplier,
      });
    }

    function addElectricArc(x, y, velocityX, velocityY) {
      if (electricArcs.length >= MAX_ELECTRIC_ARCS) {
        electricArcs.shift();
      }

      const movementAngle = Math.atan2(velocityY, velocityX);
      const angle = movementAngle + (Math.random() - 0.5) * 1.8;
      const normalX = -Math.sin(angle);
      const normalY = Math.cos(angle);
      const segmentCount = 4 + Math.floor(Math.random() * 4);
      const length = 0.08 + Math.random() * 0.12;
      const startX = x + (Math.random() - 0.5) * 0.05;
      const startY = y + (Math.random() - 0.5) * 0.05;
      const points = [];

      for (let index = 0; index <= segmentCount; index += 1) {
        const progress = index / segmentCount;
        const jitter =
          index === 0 || index === segmentCount
            ? 0
            : (Math.random() - 0.5) * 0.07;

        points.push({
          x: startX + Math.cos(angle) * length * progress + normalX * jitter,
          y: startY + Math.sin(angle) * length * progress + normalY * jitter,
        });
      }

      electricArcs.push({
        age: 0,
        life: 0.12 + Math.random() * 0.16,
        points,
        strength: 0.75 + Math.random() * 0.25,
      });
    }

    function isMagicCircle(points) {
      if (points.length < 12) return false;

      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const ratio = width / Math.max(height, 0.001);
      if (width < 0.15 || height < 0.15 || ratio < 0.35 || ratio > 2.8) return false;

      const center = points.reduce(
        (result, point) => ({
          x: result.x + point.x / points.length,
          y: result.y + point.y / points.length,
        }),
        { x: 0, y: 0 },
      );
      const radii = points.map((point) => Math.hypot(point.x - center.x, point.y - center.y));
      const averageRadius = radii.reduce((sum, radius) => sum + radius, 0) / radii.length;
      const radiusVariation = radii.reduce(
        (sum, radius) => sum + Math.abs(radius - averageRadius),
        0,
      ) / radii.length;
      const startEndDistance = Math.hypot(
        points[0].x - points[points.length - 1].x,
        points[0].y - points[points.length - 1].y,
      );

      let angularTravel = 0;
      for (let index = 1; index < points.length; index += 1) {
        const previousAngle = Math.atan2(points[index - 1].y - center.y, points[index - 1].x - center.x);
        const currentAngle = Math.atan2(points[index].y - center.y, points[index].x - center.x);
        let angleDifference = currentAngle - previousAngle;
        if (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
        if (angleDifference < -Math.PI) angleDifference += Math.PI * 2;
        angularTravel += Math.abs(angleDifference);
      }

      return (
        averageRadius > 0.12 &&
        startEndDistance < averageRadius * 1.15 &&
        radiusVariation < averageRadius * 0.7 &&
        angularTravel > Math.PI * 1.3
      );
    }

    function revealEntrance() {
      if (hasRevealed) return;

      hasRevealed = true;
      for (let index = 0; index < 90; index += 1) {
        const angle = (index / 90) * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.16;
        addParticle(
          (Math.random() - 0.5) * 0.08,
          -0.38 + (Math.random() - 0.5) * 0.08,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          1.6,
        );
      }
      onRevealRef.current?.();
    }

    function handlePointerMove(event) {
      if (event.pointerType && event.pointerType !== "mouse") {
        return;
      }

      const nextX = (event.clientX / window.innerWidth) * 2 * aspect - aspect;
      const nextY = 1 - (event.clientY / window.innerHeight) * 2;
      if (!hasPointer) {
        hasPointer = true;
        previousPointer = { x: nextX, y: nextY };
        return;
      }

      const deltaX = nextX - previousPointer.x;
      const deltaY = nextY - previousPointer.y;
      const distance = Math.hypot(deltaX, deltaY);
      const steps = Math.min(18, Math.max(3, Math.ceil(distance * 42)));
      const isGestureTrail = isDrawingGesture;
      const emissionSteps = isGestureTrail
        ? Math.ceil(steps * Math.max(1, gestureDensity))
        : steps;
      const spreadMultiplier = isGestureTrail ? gestureSpread : 1;
      const sizeMultiplier = isGestureTrail ? gestureSize : 1;
      const sparkCount = isGestureTrail
        ? Math.max(0, Math.ceil(gestureSparks))
        : 0;
      const electricArcCount = isGestureTrail
        ? Math.max(0, Math.ceil(electricityDensity))
        : 0;

      for (let index = 1; index <= emissionSteps; index += 1) {
        const progress = index / emissionSteps;
        addParticle(
          previousPointer.x + deltaX * progress,
          previousPointer.y + deltaY * progress,
          deltaX * 2.4,
          deltaY * 2.4,
          1,
          spreadMultiplier,
          sizeMultiplier,
        );
      }

      for (let index = 0; index < sparkCount; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.18;

        addParticle(
          nextX,
          nextY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.35,
          spreadMultiplier * 0.8,
          sizeMultiplier * 1.8,
        );
      }

      for (let index = 0; index < electricArcCount; index += 1) {
        addElectricArc(nextX, nextY, deltaX, deltaY);
      }

      if (isDrawingGesture) {
        gesturePoints.push({ x: nextX, y: nextY });
        if (gesturePoints.length > 160) gesturePoints.shift();
      }

      previousPointer = { x: nextX, y: nextY };
    }

    function handlePointerDown(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;

      isDrawingGesture = true;
      gesturePoints = [{
        x: (event.clientX / window.innerWidth) * 2 * aspect - aspect,
        y: 1 - (event.clientY / window.innerHeight) * 2,
      }];
    }

    function handlePointerUp() {
      if (isDrawingGesture) {
        if (isMagicCircle(gesturePoints)) {
          revealEntrance();
        } else {
          onInvalidGestureRef.current?.();
        }
      }

      isDrawingGesture = false;
      gesturePoints = [];
    }

    function render(time) {
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      let activeParticles = 0;
      for (const particle of particles) {
        particle.age += delta;
        if (particle.age >= particle.life) {
          continue;
        }

        particle.vx *= 0.965;
        particle.vy = particle.vy * 0.965 - delta * 0.08;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;

        const lifeProgress = particle.age / particle.life;
        positions[activeParticles * 3] = particle.x;
        positions[activeParticles * 3 + 1] = particle.y;
        positions[activeParticles * 3 + 2] = 0;
        alphas[activeParticles] = particle.alpha * (1 - lifeProgress) ** 1.8;
        sizes[activeParticles] = particle.size * (1 - lifeProgress * 0.35);
        activeParticles += 1;
      }

      particles.splice(0, particles.length, ...particles.filter((particle) => particle.age < particle.life));
      geometry.setDrawRange(0, activeParticles);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;

      let activeElectricSegments = 0;
      for (const arc of electricArcs) {
        arc.age += delta;
        if (arc.age >= arc.life) continue;

        const lifeProgress = arc.age / arc.life;
        const alpha = arc.strength * (1 - lifeProgress) ** 1.5;

        for (let index = 0; index < arc.points.length - 1; index += 1) {
          if (activeElectricSegments >= MAX_ELECTRIC_SEGMENTS) break;

          const start = arc.points[index];
          const end = arc.points[index + 1];
          const vertexOffset = activeElectricSegments * 2;
          const positionOffset = vertexOffset * 3;
          const segmentAlpha = alpha * (0.7 + Math.random() * 0.3);

          electricPositions[positionOffset] = start.x;
          electricPositions[positionOffset + 1] = start.y;
          electricPositions[positionOffset + 2] = 0.02;
          electricPositions[positionOffset + 3] = end.x;
          electricPositions[positionOffset + 4] = end.y;
          electricPositions[positionOffset + 5] = 0.02;
          electricAlphas[vertexOffset] = segmentAlpha;
          electricAlphas[vertexOffset + 1] = segmentAlpha;
          activeElectricSegments += 1;
        }
      }

      electricArcs.splice(
        0,
        electricArcs.length,
        ...electricArcs.filter((arc) => arc.age < arc.life),
      );
      electricGeometry.setDrawRange(0, activeElectricSegments * 2);
      electricGeometry.attributes.position.needsUpdate = true;
      electricGeometry.attributes.aAlpha.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      geometry.dispose();
      material.dispose();
      electricGeometry.dispose();
      electricMaterial.dispose();
      renderer.dispose();
    };
  }, [
    electricityDensity,
    gestureDensity,
    gestureSize,
    gestureSparks,
    gestureSpread,
  ]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[35] h-full w-full" aria-hidden="true" />;
}
