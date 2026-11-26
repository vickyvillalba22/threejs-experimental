"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import HubPortal3D from "@/components/hub/HubPortal3D";

const INSTRUCTION = "Mantén presionado el arco para descubrir lo que esconde";
const ROSE_DESCRIPTION =
  "La rosa representa una herida que Legend nunca pudo sanar, tómala para continuar";

export default function HubDemoScene({ onDemoPhaseChange }) {
  const [isRoseRevealed, setIsRoseRevealed] = useState(false);

  return (
    <main className="relative min-h-svh overflow-hidden bg-app-background text-app-text">
      <HubPortal3D
        onDemoPhaseChange={(payload) => {
          if (payload?.phase === "rose-revealed") {
            setIsRoseRevealed(true);
          }
          onDemoPhaseChange?.(payload);
        }}
      />

      <div className="pointer-events-none absolute left-6 top-28 z-20 max-w-xs sm:left-8">
        <h1 className="font-app-display text-5xl text-app-text sm:text-6xl">
          Bienvenido a Caraval
        </h1>

        <AnimatePresence mode="wait">
          <motion.p
            key={isRoseRevealed ? "rose" : "instruction"}
            aria-live="polite"
            className="mt-5 max-w-md font-app-body text-[24px] leading-relaxed text-app-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isRoseRevealed ? ROSE_DESCRIPTION : INSTRUCTION}
          </motion.p>
        </AnimatePresence>
      </div>
    </main>
  );
}
