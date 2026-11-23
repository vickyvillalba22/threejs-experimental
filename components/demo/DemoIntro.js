"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import styles from "./DemoIntro.module.css";

const INTRO_COPY =
  "Bienvenido a Caraval, una feria itinerante llena de magia, dirigida por el misterioso Legend. Encuentra sus objetos más preciados, descubre su identidad y él te concederá un deseo.";
const TYPEWRITER_INTERVAL = 34;

export default function DemoIntro({
  isExiting = false,
  onExitComplete,
  onStart,
}) {
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const exitNotifiedRef = useRef(false);
  const reducedMotion = shouldReduceMotion === true;
  const isCopyComplete =
    reducedMotion || visibleCharacters >= INTRO_COPY.length;
  const shouldExit =
    isExiting || (hasStarted && typeof onStart === "function");

  useEffect(() => {
    if (reducedMotion || isCopyComplete || shouldExit) return undefined;

    const timeout = window.setTimeout(() => {
      setVisibleCharacters((current) => Math.min(current + 1, INTRO_COPY.length));
    }, TYPEWRITER_INTERVAL);

    return () => window.clearTimeout(timeout);
  }, [isCopyComplete, reducedMotion, shouldExit, visibleCharacters]);

  useEffect(() => {
    if (!shouldExit) {
      exitNotifiedRef.current = false;
    }
  }, [shouldExit]);

  function handleStart() {
    if (shouldExit) return;
    setHasStarted(true);
    onStart?.();
  }

  function handleAnimationComplete(definition) {
    if (
      definition !== "exit" ||
      !shouldExit ||
      exitNotifiedRef.current
    ) {
      return;
    }

    exitNotifiedRef.current = true;
    onExitComplete?.();
  }

  return (
    <motion.section
      animate={shouldExit ? "exit" : "visible"}
      className={styles.intro}
      initial="hidden"
      onAnimationComplete={handleAnimationComplete}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: reducedMotion ? 0 : 0.8,
            ease: [0.16, 1, 0.3, 1],
          },
        },
        exit: {
          opacity: 0,
          transition: {
            duration: reducedMotion ? 0 : 0.95,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      style={{ pointerEvents: shouldExit ? "none" : undefined }}
    >
      <motion.div
        animate={shouldExit ? "exit" : "visible"}
        className={styles.portalStage}
        variants={{
          hidden: { opacity: 0, scale: 0.82 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              delay: reducedMotion ? 0 : 0.15,
              duration: reducedMotion ? 0 : 0.8,
              ease: [0.16, 1, 0.3, 1],
            },
          },
          exit: {
            opacity: 0,
            scale: 1.28,
            filter: "blur(12px)",
            transition: {
              duration: reducedMotion ? 0 : 0.82,
              ease: [0.16, 1, 0.3, 1],
            },
          },
        }}
      >
        <motion.div
          animate={
            shouldExit
              ? {
                  opacity: 0,
                  scale: 1.35,
                  filter: "blur(16px)",
                }
              : {
                  opacity: reducedMotion ? 0.55 : [0.2, 0.8, 0.35],
                  scale: reducedMotion ? 1 : [0.75, 1.1, 1],
                }
          }
          className={styles.portal}
          initial={{ opacity: 0, scale: 0.35 }}
          transition={{
            delay: reducedMotion || shouldExit ? 0 : 0.15,
            duration: reducedMotion ? 0 : shouldExit ? 0.72 : 2.8,
            ease: "easeInOut",
            repeat: reducedMotion || shouldExit ? 0 : Infinity,
          }}
        />
        {isCopyComplete && (
          <motion.button
            animate={shouldExit ? "exit" : "visible"}
            className={styles.startButton}
            disabled={shouldExit || hasStarted}
            initial="hidden"
            type="button"
            variants={{
              hidden: { opacity: 0, scale: 0.75 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: {
                  duration: reducedMotion ? 0 : 0.7,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
              exit: {
                opacity: 0,
                scale: 0.6,
                y: 18,
                transition: {
                  duration: reducedMotion ? 0 : 0.4,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
            onClick={handleStart}
          >
            COMENZAR
          </motion.button>
        )}
      </motion.div>
      <motion.div
        animate={
          shouldExit
            ? { opacity: 0, scale: 1.12, filter: "blur(16px)" }
            : { opacity: 1, scale: 1 }
        }
        className={styles.atmosphere}
        initial={{ opacity: 0, scale: 1.4 }}
        transition={{
          duration: reducedMotion ? 0 : shouldExit ? 0.65 : 1.8,
          ease: [0.16, 1, 0.3, 1],
        }}
      />

      <motion.div
        animate={shouldExit ? "exit" : "visible"}
        className={styles.content}
        initial={{ opacity: 0, y: 28 }}
        variants={{
          hidden: { opacity: 0, y: 28 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              delay: reducedMotion ? 0 : 0.35,
              duration: reducedMotion ? 0 : 0.9,
              ease: [0.16, 1, 0.3, 1],
            },
          },
          exit: {
            opacity: 0,
            y: -42,
            filter: "blur(12px)",
            transition: {
              duration: reducedMotion ? 0 : 0.55,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
      >
        <motion.p animate={{ opacity: 1 }} className="font-app-display" initial={{ opacity: 0 }}>
          {INTRO_COPY.slice(0, visibleCharacters)}
          {!isCopyComplete && <span className={styles.caret} aria-hidden="true">▌</span>}
        </motion.p>

      </motion.div>
    </motion.section>
  );
}
