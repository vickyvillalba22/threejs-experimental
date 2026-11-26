"use client";

import { motion, useReducedMotion } from "motion/react";

export default function SmokeReveal({
  as = "div",
  children,
  className,
  delay = 0,
  duration = 1.05,
  move = true,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const MotionElement = motion[as] || motion.div;

  const hidden = shouldReduceMotion
    ? { opacity: 0 }
    : {
        opacity: 0,
        ...(move ? { y: 22, scale: 0.94 } : { scale: 0.94 }),
        filter: "blur(18px)",
      };

  const visible = shouldReduceMotion
    ? { opacity: 1 }
    : {
        opacity: 1,
        ...(move ? { y: 0, scale: 1 } : { scale: 1 }),
        filter: "blur(0px)",
      };

  const exit = shouldReduceMotion
    ? { opacity: 0 }
    : {
        opacity: 0,
        ...(move ? { y: -14, scale: 0.98 } : { scale: 0.98 }),
        filter: "blur(10px)",
      };

  return (
    <MotionElement
      {...props}
      className={className}
      initial={hidden}
      animate={visible}
      exit={exit}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              delay,
              duration,
              ease: [0.16, 1, 0.3, 1],
            }
      }
    >
      {children}
    </MotionElement>
  );
}
