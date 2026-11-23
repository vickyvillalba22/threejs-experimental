"use client";

import { useCallback } from "react";
import PreHub from "@/components/hub/PreHub";
import { useDemoTransition } from "@/components/demo/DemoTransitionLayout";

export default function HubDemo() {
  const transitionContext = useDemoTransition();
  const { onReady } = transitionContext;

  const handlePreHubReady = useCallback(
    (metadata = {}) => {
      const canvasCount = Number(metadata.canvasCount || 0);

      if (
        metadata.mounted !== true ||
        metadata.canvasReady !== true ||
        canvasCount < 1
      ) {
        return;
      }

      onReady({
        canvasCount,
        scene: "prehub",
      });
    },
    [onReady],
  );

  return (
    <PreHub
      onReady={handlePreHubReady}
      transitionContext={transitionContext}
    />
  );
}
