"use client";

import { useRouter } from "next/navigation";
import { chapters } from "@/data/chapters";
import { useProgress } from "@/hooks/useProgress";

export default function HomeExperience() {
  const router = useRouter();
  const { ready } = useProgress();

  function enterExperience() {
    router.push(`/archivo/${chapters[0].id}`);
  }

  if (!ready) return <main className="loading">CARGANDO…</main>;

  return (
    <main className="experience">
      <section className="intro">
        <p className="kicker">EXPERIENCIA TRANSMEDIA</p>
        <h1>
          CARAVAL <span>∞</span>
        </h1>
        <p className="intro-copy">Caraval: La Isla de los Sueños</p>
        <button className="enter-button" onClick={enterExperience}>
          <span>ENTRAR</span>
          <span aria-hidden="true">↗</span>
        </button>
        <p className="microcopy">&nbsp;</p>
      </section>
    </main>
  );
}
