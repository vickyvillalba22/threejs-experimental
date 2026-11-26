"use client";

import { motion, useReducedMotion } from "motion/react";
import styles from "./DemoIntro.module.css";

export default function DemoContinueButton({
  children = "CONTINUAR",
  delay = 0,
  onClick,
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="pointer-events-auto relative size-72"
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.7,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.span
        className={styles.portal}
        aria-hidden="true"
        animate={shouldReduceMotion ? { scale: 1 } : { scale: [1, 1.08, 1] }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                duration: 2.4,
                ease: "easeInOut",
                repeat: Infinity,
              }
        }
      />
      <button type="button" className={styles.startButton} onClick={onClick}>
        {children}
      </button>
    </motion.div>
  );
}
