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

export default function ParticleTrail({ onReveal }) {
  const canvasRef = useRef(null);
  const onRevealRef = useRef(onReveal);

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

    const particles = [];
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

    function addParticle(x, y, velocityX, velocityY, lifeMultiplier = 1) {
      if (particles.length >= MAX_PARTICLES) {
        particles.shift();
      }

      particles.push({
        alpha: 0.55 + Math.random() * 0.45,
        age: 0,
        life: (0.45 + Math.random() * 0.45) * lifeMultiplier,
        size: 0.012 + Math.random() * 0.018,
        vx: velocityX * (0.55 + Math.random() * 0.35),
        vy: velocityY * (0.55 + Math.random() * 0.35),
        x: x + (Math.random() - 0.5) * 0.018,
        y: y + (Math.random() - 0.5) * 0.018,
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

      for (let index = 1; index <= steps; index += 1) {
        const progress = index / steps;
        addParticle(
          previousPointer.x + deltaX * progress,
          previousPointer.y + deltaY * progress,
          deltaX * 2.4,
          deltaY * 2.4,
        );
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
      if (isDrawingGesture && isMagicCircle(gesturePoints)) revealEntrance();
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
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[35] h-full w-full" aria-hidden="true" />;
}
