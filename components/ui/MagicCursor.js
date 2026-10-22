"use client";

import { useEffect, useRef } from "react";

export default function MagicCursor() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const auraRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const aura = auraRef.current;
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!cursor || !dot || !ring || !aura || !finePointer.matches || reducedMotion.matches) {
      return undefined;
    }

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...target };
    let animationFrame;
    let hasPointer = false;

    function handlePointerMove(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      target.x = event.clientX;
      target.y = event.clientY;
      hasPointer = true;
      cursor.classList.add("is-visible");
    }

    function handlePointerOver(event) {
      if (!(event.target instanceof Element)) return;
      const interactive = event.target.closest("button, a, input, textarea, select, [role='button']");
      cursor.classList.toggle("is-hovering", Boolean(interactive));
    }

    function handlePointerDown() {
      cursor.classList.add("is-pressed");
    }

    function handlePointerUp() {
      cursor.classList.remove("is-pressed");
    }

    function handlePointerLeave() {
      cursor.classList.remove("is-visible");
    }

    function render() {
      current.x += (target.x - current.x) * 0.22;
      current.y += (target.y - current.y) * 0.22;

      if (hasPointer) {
        dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
        ring.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
        aura.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }

      animationFrame = window.requestAnimationFrame(render);
    }

    document.documentElement.classList.add("magic-cursor-enabled");
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerover", handlePointerOver, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("blur", handlePointerLeave);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("blur", handlePointerLeave);
      document.documentElement.classList.remove("magic-cursor-enabled");
    };
  }, []);

  return (
    <div ref={cursorRef} className="magic-cursor" aria-hidden="true">
      <span ref={auraRef} className="magic-cursor__aura" />
      <span ref={ringRef} className="magic-cursor__ring" />
      <span ref={dotRef} className="magic-cursor__dot" />
    </div>
  );
}
