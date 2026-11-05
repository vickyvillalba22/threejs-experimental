"use client";

import { usePathname } from "next/navigation";
import LegendProgress from "@/components/progress/LegendProgress";
import DevNavigation from "@/components/dev/DevNavigation";
import HomeButton from "@/components/ui/HomeButton";
import { ProgressProvider } from "@/hooks/useProgress";
import AmbientMusic from "@/components/audio/AmbientMusic";
import { getAmbientTrack } from "@/data/ambientTracks";

export default function ProgressExperience({ children }) {
  const pathname = usePathname();
  const ambientTrack = getAmbientTrack(pathname);
  const isExperienceRoute = pathname?.startsWith("/archivo/");
  const isFinalA = pathname === "/archivo/final-a";

  return (
    <ProgressProvider>
      <AmbientMusic
        src={ambientTrack}
        showControl={Boolean(ambientTrack)}
        alignWithHomeButton={isExperienceRoute}
      />
      {children}
      {isExperienceRoute && !isFinalA && <LegendProgress />}
      {isExperienceRoute && <HomeButton />}
      <DevNavigation />
    </ProgressProvider>
  );
}
