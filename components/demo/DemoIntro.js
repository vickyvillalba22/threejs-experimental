"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import styles from "./DemoIntro.module.css";

const INTRO_COPY =
  "Bienvenido a Caraval, una feria itinerante llena de magia, dirigida por el misterioso Legend. Encuentra sus objetos más preciados, descubre su identidad y él te concederá un deseo.";
const TYPEWRITER_INTERVAL = 34;

export default function DemoIntro() {
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const isCopyComplete =
    shouldReduceMotion || visibleCharacters >= INTRO_COPY.length;

  useEffect(() => {
    if (shouldReduceMotion || isCopyComplete) return undefined;

    const timeout = window.setTimeout(() => {
      setVisibleCharacters((current) => Math.min(current + 1, INTRO_COPY.length));
    }, TYPEWRITER_INTERVAL);

    return () => window.clearTimeout(timeout);
  }, [isCopyComplete, shouldReduceMotion, visibleCharacters]);

  return (
    <section className={styles.intro}>
      <div className={styles.portalStage}>
        <motion.div
          animate={{ opacity: [0.2, 0.8, 0.35], scale: [0.75, 1.1, 1] }}
          className={styles.portal}
          initial={{ opacity: 0, scale: 0.35 }}
          transition={{
            delay: 0.15,
            duration: shouldReduceMotion ? 0 : 2.8,
            ease: "easeInOut",
            repeat: shouldReduceMotion ? 0 : Infinity,
          }}
        />
        <AnimatePresence>
          {isCopyComplete && (
            <motion.button
              animate={{ opacity: 1, scale: 1 }}
              className={styles.startButton}
              initial={{ opacity: 0, scale: 0.75 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              type="button"
            >
              COMENZAR
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className={styles.atmosphere}
        initial={{ opacity: 0, scale: 1.4 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 1.8,
          ease: [0.16, 1, 0.3, 1],
        }}
      />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={styles.content}
        initial={{ opacity: 0, y: 28 }}
        transition={{
          delay: shouldReduceMotion ? 0 : 0.35,
          duration: shouldReduceMotion ? 0 : 0.9,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <motion.p animate={{ opacity: 1 }} className="font-app-display" initial={{ opacity: 0 }}>
          {INTRO_COPY.slice(0, visibleCharacters)}
          {!isCopyComplete && <span className={styles.caret} aria-hidden="true">▌</span>}
        </motion.p>

      </motion.div>
    </section>
  );
}
