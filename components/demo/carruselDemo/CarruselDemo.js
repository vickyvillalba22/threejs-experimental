"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import CarruselScene from "@/components/chapters/carrusel/CarruselScene";
import { useDemoTransition } from "@/components/demo/DemoTransitionLayout";

export default function CarruselDemo() {
  const { onReady } = useDemoTransition();
  const shouldReduceMotion = useReducedMotion();
  const counterRef = useRef(null);
  const [foundCards, setFoundCards] = useState(0);
  const [flyingCards, setFlyingCards] = useState([]);

  useEffect(() => {
    onReady({ scene: "carrusel-demo" });
  }, [onReady]);

  function handleCardFound() {
    setFoundCards((current) => Math.min(current + 1, 7));
  }

  function handleCardFoundDetails({ value, clientX, clientY }) {
    const counterBounds = counterRef.current?.getBoundingClientRect();
    if (!counterBounds) return;

    const flyingCard = {
      id: `${value}-${Date.now()}`,
      value,
      x: clientX,
      y: clientY,
      targetX: counterBounds.left + counterBounds.width / 2 - 28,
      targetY: counterBounds.top + counterBounds.height / 2 - 38,
    };

    setFlyingCards((current) => [...current, flyingCard]);
  }

  function removeFlyingCard(id) {
    setFlyingCards((current) => current.filter((card) => card.id !== id));
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#09090c]">
      <CarruselScene
        onCardFound={handleCardFound}
        onCardFoundDetails={handleCardFoundDetails}
      />

      <div
        ref={counterRef}
        className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-app-text sm:left-8"
        aria-live="polite"
        aria-label={`${foundCards} de 7 cartas encontradas`}
      >
        <p className="font-app-display text-4xl font-normal leading-none sm:text-[80px]">
          {foundCards}
          <span className="mx-2 text-app-subtle">/</span>
          <span className="text-2xl text-app-muted sm:text-[80px]">7</span>
        </p>
        <p className="mt-2 text-[1.5rem] text-app-subtle">
          Cartas encontradas
        </p>
      </div>

      <motion.div
        className="pointer-events-none absolute right-[4%] top-[39%] z-10 flex w-36 flex-col items-center text-center text-app-text sm:right-[9%] sm:top-[37%]"
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: [0.68, 1, 0.68], y: [0, -5, 0] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 2.2, ease: "easeInOut", repeat: Infinity }
        }
        aria-hidden="true"
      >
        <span className="font-app-display text-base leading-tight sm:text-lg">
          Puedes rotar
          <br />
          el carrusel!
        </span>
        <svg
          className="mt-2 w-20 -rotate-[18deg] text-app-accent sm:w-24"
          viewBox="0 0 80 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M72 8C62 31 39 43 11 42M11 42l12-8M11 42l14 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <AnimatePresence>
        {flyingCards.map((card) => (
          <motion.div
            key={card.id}
            className="pointer-events-none fixed z-20 flex h-19 w-14 items-center justify-center rounded-[0.3rem] border border-[#9d2531]/70 bg-[#f7f0e4] text-2xl font-serif text-[#9d2531] shadow-[0_0.3rem_1rem_rgba(0,0,0,0.4)]"
            initial={{
              opacity: 0.95,
              left: card.x - 28,
              top: card.y - 38,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              opacity: [0.95, 1, 0],
              left: card.targetX,
              top: card.targetY,
              scale: [1, 1.12, 0.45],
              rotate: [0, -8, 0],
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.35, 1],
            }}
            onAnimationComplete={() => removeFlyingCard(card.id)}
            aria-hidden="true"
          >
            {card.value}
          </motion.div>
        ))}
      </AnimatePresence>
    </main>
  );
}
