"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ParticleTrail from "@/components/ParticleTrail";
import DemoIntro from "@/components/demo/DemoIntro";
import { useDemoTransition } from "@/components/demo/DemoTransitionLayout";

export default function HomeDemo() {
  const router = useRouter();
  const { onReady } = useDemoTransition();
  const [showIntro, setShowIntro] = useState(false);
  const [showRetryMessage, setShowRetryMessage] = useState(false);
  const navigationStartedRef = useRef(false);
  const navigationFrameRef = useRef(null);

  useEffect(() => {
    onReady({ scene: "demo-intro" });
  }, [onReady]);

  useEffect(
    () => () => {
      if (navigationFrameRef.current !== null) {
        window.cancelAnimationFrame(navigationFrameRef.current);
      }
    },
    [],
  );

  function handleIntroStart() {
    if (navigationStartedRef.current) return;

    navigationStartedRef.current = true;
    navigationFrameRef.current = window.requestAnimationFrame(() => {
      navigationFrameRef.current = null;
      router.push("/demo/hubDemo");
    });
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-black text-app-text">
      <AnimatePresence initial={false} mode="wait">
        {!showIntro ? (
          <motion.div
            key="circle-entry"
            animate={{ opacity: 1, scale: 1 }}
            className="relative min-h-svh"
            exit={{ opacity: 0, scale: 1.08, filter: "blur(18px)" }}
            initial={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <ParticleTrail
              electricityDensity={1}
              gestureDensity={4}
              gestureSparks={2}
              gestureSpread={5}
              gestureSize={1.15}
              onInvalidGesture={() => setShowRetryMessage(true)}
              onReveal={() => setShowIntro(true)}
            />
            <section className="relative z-40 grid min-h-svh select-none place-items-center px-6 text-center">
              <div className="flex flex-col items-center">
                <p className="text-sm font-light sm:text-[50px]">
                  Mantené presionado y dibujá un círculo
                </p>
                {showRetryMessage && (
                  <p
                    aria-live="polite"
                    className="mt-2 text-[20px] font-light tracking-[0.08em] text-white/75"
                  >
                    intenta de nuevo!
                  </p>
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          <DemoIntro key="demo-intro" onStart={handleIntroStart} />
        )}
      </AnimatePresence>
    </main>
  );
}
