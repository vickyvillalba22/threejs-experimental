"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import ParticleTrail from "@/components/ParticleTrail";
import DemoIntro from "@/components/demo/DemoIntro";

export default function HomeDemo() {
  const [showIntro, setShowIntro] = useState(false);

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
              onReveal={() => setShowIntro(true)}
            />
            <section className="relative z-40 grid min-h-svh select-none place-items-center px-6 text-center">
              <p className="text-sm font-light sm:text-[50px]">
                Mantené presionado y dibujá un círculo
              </p>
            </section>
          </motion.div>
        ) : (
          <DemoIntro key="demo-intro" />
        )}
      </AnimatePresence>
    </main>
  );
}
