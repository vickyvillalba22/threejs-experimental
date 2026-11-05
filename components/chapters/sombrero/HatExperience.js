"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HatScene from "@/components/chapters/sombrero/HatScene";
import { useProgress } from "@/hooks/useProgress";

export default function HatExperience({ title, description, instructions }) {
  const router = useRouter();
  const { collectArtifact } = useProgress();
  const [phase, setPhase] = useState("hat-reveal");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [message, setMessage] = useState("");

  function handleHatFlipChange(isFlipped) {
    if (phase === "hat-fragment") return;

    setPhase(isFlipped ? "hat-riddle" : "hat-reveal");
    if (!isFlipped) {
      setMessage("");
    }
  }

  function solveRiddle(event) {
    event.preventDefault();

    if (riddleAnswer.trim().toLocaleLowerCase() !== "magia") {
      setMessage("El sombrero no reconoce esa respuesta.");
      return;
    }

    collectArtifact({
      artifactId: "sombrero-de-copa",
      result: "correct",
    });
    setPhase("hat-fragment");
  }

  function continueToFinal() {
    router.push("/archivo/final-a");
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#09090c] text-app-text">
      <HatScene onHatFlipped={handleHatFlipChange} />

      {phase === "hat-reveal" && (
        <section className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center px-6 text-center sm:top-8">
          <div className="max-w-xl drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
            <h1 className="font-app-display text-4xl text-app-text">{title}</h1>
            <p className="mt-3 text-[24px] leading-relaxed text-app-text">{instructions}</p>
          </div>
        </section>
      )}

      {phase === "hat-riddle" && (
        <section className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center p-6 pb-8 text-center sm:items-center sm:pb-6">
          <form className="hat-riddle-reveal pointer-events-auto w-full max-w-lg" onSubmit={solveRiddle}>
            <p className="object-modal-copy font-app-display leading-relaxed text-app-text">
              En pociones y hechizos la vas a encontrar,<br />
              de todos los deseos es la dueña sin par.<br />
              Cambia el mundo entero sin dejarte ver,<br />
              y logra en un instante lo que no puede ser.
            </p>
            <input
              value={riddleAnswer}
              onChange={(event) => setRiddleAnswer(event.target.value)}
              className="mt-8 w-full border-0 rounded-2xl bg-white px-4 py-3 text-center text-black outline-none placeholder:text-black/45 focus:ring-2 focus:ring-white/70"
              placeholder="Tu respuesta"
              aria-label="Respuesta a la adivinanza"
              autoFocus
            />
            <button
              type="submit"
              className="mt-4 text-xs tracking-[0.14em] text-app-text transition-opacity hover:opacity-65 focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-4 border px-4 py-2 rounded-2xl"
            >
              RESPONDER
            </button>
            {message && (
              <p className="mt-4 text-xs text-app-subtle" aria-live="polite">
                {message}
              </p>
            )}
          </form>
        </section>
      )}

      {phase === "hat-fragment" && (
        <section
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 p-4 sm:p-8"
          aria-label="Fragmento Sombrero de Copa"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/25 bg-black/70 p-5 text-center shadow-[0_0_45px_rgba(255,255,255,0.16)] backdrop-blur-md sm:p-6">
            <p className="text-md text-app-subtle">FRAGMENTO CONSEGUIDO</p>
            <p className="mt-3 font-app-display text-3xl text-app-text">El Sombrero de Copa</p>
            <p className="mt-2 text-[1.5rem] leading-relaxed text-app-text">
              Simboliza la fachada pública, la autoridad teatral y el rol de creador de ilusiones.
            </p>
            <button
              type="button"
              className="mt-5 w-fit rounded-md border border-app-border bg-app-surface px-4 py-2 text-lg text-app-text transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-2"
              onClick={continueToFinal}
            >
              Continuar
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
