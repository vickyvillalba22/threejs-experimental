"use client";

import { useContext, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

function FrozenRouter({ children }) {
  const routerContext = useContext(LayoutRouterContext);
  const [frozenRouterContext] = useState(() => routerContext);

  return (
    <LayoutRouterContext.Provider value={frozenRouterContext}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : {
        // With mode="wait", exit and enter run sequentially: 1s + 1s.
        duration: 1,
        ease: [0.22, 1, 0.36, 1],
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        className="min-h-svh"
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
