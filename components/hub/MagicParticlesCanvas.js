"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 220;
const EXPLOSION_DURATION = 2200;

export default function MagicParticlesCanvas({ active, originRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current || !originRef?.current) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const canvasBounds = canvas.getBoundingClientRect();
    const originBounds = originRef.current.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const origin = {
      x: originBounds.left - canvasBounds.left + originBounds.width / 2,
      y: originBounds.top - canvasBounds.top + originBounds.height / 2,
    };

    canvas.width = Math.max(1, Math.floor(canvasBounds.width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(canvasBounds.height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.globalCompositeOperation = "lighter";

    const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const angle = (Math.PI * 2 * index) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.35;
      const speed = 1.2 + Math.random() * 5.2;
      const isLargeSpark = index % 13 === 0;

      return {
        x: origin.x,
        y: origin.y,
        previousX: origin.x,
        previousY: origin.y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        radius: isLargeSpark ? 1.8 + Math.random() * 1.8 : 0.45 + Math.random() * 1.4,
        life: 0.7 + Math.random() * 0.3,
        delay: Math.random() * 0.16,
        brightness: 0.55 + Math.random() * 0.45,
        trail: isLargeSpark || index % 5 === 0,
      };
    });

    let animationFrame;
    const startedAt = performance.now();

    function draw(timestamp) {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(elapsed / EXPLOSION_DURATION, 1);

      context.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

      const flashProgress = Math.min(elapsed / 520, 1);
      const flashAlpha = Math.max(0, 1 - flashProgress) * 0.75;
      if (flashAlpha > 0) {
        const flashRadius = 22 + flashProgress * 145;
        const flash = context.createRadialGradient(
          origin.x,
          origin.y,
          0,
          origin.x,
          origin.y,
          flashRadius,
        );
        flash.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        flash.addColorStop(0.18, `rgba(255, 255, 255, ${flashAlpha * 0.42})`);
        flash.addColorStop(1, "rgba(255, 255, 255, 0)");
        context.fillStyle = flash;
        context.beginPath();
        context.arc(origin.x, origin.y, flashRadius, 0, Math.PI * 2);
        context.fill();
      }

      particles.forEach((particle) => {
        const particleProgress = Math.max(0, progress - particle.delay);
        const fadeProgress = Math.min(particleProgress / particle.life, 1);
        const alpha = Math.max(0, 1 - fadeProgress) * particle.brightness;

        if (particleProgress <= 0 || alpha <= 0) {
          return;
        }

        particle.previousX = particle.x;
        particle.previousY = particle.y;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityX *= 0.988;
        particle.velocityY = particle.velocityY * 0.988 + 0.018;

        context.globalAlpha = alpha;
        context.fillStyle = "#ffffff";
        context.shadowColor = "rgba(255, 255, 255, 0.95)";
        context.shadowBlur = particle.radius * 5;

        if (particle.trail) {
          context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.55})`;
          context.lineWidth = Math.max(0.5, particle.radius * 0.7);
          context.beginPath();
          context.moveTo(particle.previousX, particle.previousY);
          context.lineTo(particle.x, particle.y);
          context.stroke();
        }

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      context.globalAlpha = 1;
      context.shadowBlur = 0;

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, canvasBounds.width, canvasBounds.height);
      }
    }

    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      context.clearRect(0, 0, canvasBounds.width, canvasBounds.height);
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    };
  }, [active, originRef]);

  return <canvas ref={canvasRef} className="prehub-particles-canvas" aria-hidden="true" />;
}
