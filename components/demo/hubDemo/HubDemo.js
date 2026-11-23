"use client";

import PreHub from "@/components/hub/PreHub";
import { useDemoTransition } from "@/components/demo/DemoTransitionLayout";

export default function HubDemo() {
  const { onReady } = useDemoTransition();

  return <PreHub onReady={onReady} />;
}
