"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import SceneTransition from "@/components/transitions/SceneTransition";
import { FrozenRouter } from "@/components/transitions/PageTransition";

const DemoTransitionContext = createContext(null);

export function useDemoTransition() {
  const context = useContext(DemoTransitionContext);

  if (!context) {
    throw new Error(
      "useDemoTransition debe utilizarse dentro de DemoTransitionLayout",
    );
  }

  return context;
}

export default function DemoTransitionLayout({ children }) {
  const pathname = usePathname();

  return (
    <SceneTransition
      className="min-h-svh"
      sceneKey={pathname}
      sequence="cinematic"
      variant="portal"
      waitForReady
    >
      {(transitionContext) => (
        <DemoTransitionProvider value={transitionContext}>
          <FrozenRouter>{children}</FrozenRouter>
        </DemoTransitionProvider>
      )}
    </SceneTransition>
  );
}

function DemoTransitionProvider({ children, value }) {
  const exposedContext = useMemo(
    () => ({
      getSlotProps: value.getSlotProps,
      isInteractionLocked: value.isInteractionLocked,
      onReady: value.onReady,
      phase: value.phase,
    }),
    [
      value.getSlotProps,
      value.isInteractionLocked,
      value.onReady,
      value.phase,
    ],
  );

  return (
    <DemoTransitionContext.Provider value={exposedContext}>
      {children}
    </DemoTransitionContext.Provider>
  );
}
