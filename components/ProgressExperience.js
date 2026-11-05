"use client";

import { usePathname } from "next/navigation";
import LegendProgress from "@/components/progress/LegendProgress";
import DevNavigation from "@/components/dev/DevNavigation";
import { ProgressProvider } from "@/hooks/useProgress";

export default function ProgressExperience({ children }) {
  const pathname = usePathname();
  const isExperienceRoute = pathname?.startsWith("/archivo/");
  const isFinalA = pathname === "/archivo/final-a";

  return (
    <ProgressProvider>
      {children}
      {isExperienceRoute && !isFinalA && <LegendProgress />}
      <DevNavigation />
    </ProgressProvider>
  );
}
