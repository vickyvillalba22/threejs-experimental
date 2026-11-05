"use client";

import { motion, useReducedMotion } from "motion/react";

export default function InterfaceReveal({
  as = "div",
  children,
  className,
  delay = 0,
  move = true,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const MotionElement = motion[as] || motion.div;

  const hidden = shouldReduceMotion
    ? { opacity: 0 }
    : {
        opacity: 0,
        ...(move ? { y: 24, scale: 0.96 } : {}),
        filter: "blur(10px)",
      };

  const visible = shouldReduceMotion
    ? { opacity: 1 }
    : {
        opacity: 1,
        ...(move ? { y: 0, scale: 1 } : {}),
        filter: "blur(0px)",
      };

  const exit = shouldReduceMotion
    ? { opacity: 0 }
    : {
        opacity: 0,
        ...(move ? { y: -12, scale: 0.98 } : {}),
        filter: "blur(6px)",
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
              duration: 0.75,
              ease: [0.16, 1, 0.3, 1],
            }
      }
    >
      {children}
    </MotionElement>
  );
}
