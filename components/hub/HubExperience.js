"use client";

import { useState } from "react";
import PreHub from "@/components/hub/PreHub";

export default function HubExperience({ children }) {
  const [isPreHubComplete, setIsPreHubComplete] = useState(false);

  if (!isPreHubComplete) {
    return <PreHub onComplete={() => setIsPreHubComplete(true)} />;
  }

  return children;
}
