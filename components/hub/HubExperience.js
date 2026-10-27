"use client";

import { useState } from "react";
import PreHub from "@/components/hub/PreHub";
import { useProgress } from "@/hooks/useProgress";

export default function HubExperience({ children }) {
  const [isPreHubComplete, setIsPreHubComplete] = useState(false);
  const { collectArtifact } = useProgress();

  if (!isPreHubComplete) {
    return (
      <PreHub
        onKeyFound={() => collectArtifact({ artifactId: "llave", result: "correct" })}
        onComplete={() => {
          setIsPreHubComplete(true);
        }}
      />
    );
  }

  return children;
}
