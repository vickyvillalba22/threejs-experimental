"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import DemoContinueButton from "@/components/demo/DemoContinueButton";
import InterfaceReveal from "@/components/transitions/InterfaceReveal";
import SmokeReveal from "@/components/transitions/SmokeReveal";
import { useDemoTransition } from "@/components/demo/DemoTransitionLayout";
import TiendaScene from "@/components/chapters/tienda/TiendaScene";

export default function TiendaDemo({
  title = "La Tienda de Ilusiones",
  instructions = "1. Levanta el frasco.\n2. Haz clic en la máscara.",
  maskMeaning = "",
  onContinue,
}) {
  const router = useRouter();
  const { onReady } = useDemoTransition();
  const [isMaskRevealed, setIsMaskRevealed] = useState(false);

  function handleContinue() {
    if (onContinue) {
      onContinue();
      return;
    }

    router.push("/demo/carruselDemo");
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-app-background text-app-text">
      <header
        className="pointer-events-none absolute inset-x-4 top-6 z-10 mx-auto max-w-3xl text-center sm:top-8"
        aria-hidden={isMaskRevealed}
      >
        <AnimatePresence mode="wait">
          {!isMaskRevealed && (
            <InterfaceReveal key="shop-instructions" delay={0.15}>
              <h1 className="font-app-display text-4xl text-app-text sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 whitespace-pre-line text-[24px] leading-relaxed text-app-muted">
                {instructions}
              </p>
            </InterfaceReveal>
          )}
        </AnimatePresence>
      </header>

      <TiendaScene
        onReady={onReady}
        onMaskRevealComplete={() => setIsMaskRevealed(true)}
        showPocketWatch={false}
        pocketWatchAwakened={false}
        enablePostMaskInteraction={false}
      />

      <AnimatePresence>
        {isMaskRevealed && (
          <motion.div
            key="mask-focus"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.48)",
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMaskRevealed && maskMeaning && (
          <SmokeReveal
            as="section"
            key="mask-meaning"
            className="pointer-events-none absolute inset-x-4 bottom-7 z-10 mx-auto max-w-[40%] text-center sm:top-[50%]"
            aria-label="Significado de la máscara"
            delay={0.12}
            duration={1.45}
          >
            <p className="text-[1.35rem] leading-relaxed text-app-text sm:text-[1.9rem]">
              {maskMeaning}
            </p>
          </SmokeReveal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMaskRevealed && (
          <motion.div
            key="continue-button"
            className="pointer-events-none absolute bottom-4 right-4 z-20 sm:bottom-6 sm:right-6"
          >
            <DemoContinueButton delay={1.57} onClick={handleContinue} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
