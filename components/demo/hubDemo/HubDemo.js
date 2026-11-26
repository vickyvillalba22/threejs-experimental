"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import PreHub from "@/components/hub/PreHub";
import { useDemoTransition } from "@/components/demo/DemoTransitionLayout";
import HubDemoScene from "@/components/demo/hubDemo/HubDemoScene";
import SceneTransition from "@/components/transitions/SceneTransition";

export default function HubDemo() {
  const router = useRouter();
  const transitionContext = useDemoTransition();
  const { onReady } = transitionContext;
  const [activeScene, setActiveScene] = useState("prehub");

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

  const handleDemoPhaseChange = useCallback(
    ({ phase } = {}) => {
      if (phase === "rose-approach-complete") {
        router.push("/demo/tiendaDemo");
      }
    },
    [router],
  );

  return (
    <SceneTransition
      sceneKey={activeScene}
      variant="grow"
      mode="wait"
      waitForReady={false}
      animateInitial={activeScene !== "prehub"}
      className="min-h-svh"
    >
      {activeScene === "hub" ? (
        <HubDemoScene onDemoPhaseChange={handleDemoPhaseChange} />
      ) : (
        <PreHub
          onComplete={() => setActiveScene("hub")}
          onReady={handlePreHubReady}
          transitionContext={transitionContext}
        />
      )}
    </SceneTransition>
  );
}
