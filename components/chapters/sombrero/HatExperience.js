"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HatScene from "@/components/chapters/sombrero/HatScene";
import { useProgress } from "@/hooks/useProgress";

export default function HatExperience() {
  const router = useRouter();
  const { collectArtifact } = useProgress();
  const [phase, setPhase] = useState("hat-reveal");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [message, setMessage] = useState("");

  function handleHatFlipChange(isFlipped) {
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
    router.push("/archivo/final-a");
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#09090c] text-app-text">
      <HatScene onHatFlipped={handleHatFlipChange} />

      {phase === "hat-reveal" && (
        <section className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center p-6 sm:bottom-8">
          <div className="max-w-sm border border-white/20 bg-black/60 px-5 py-4 text-center backdrop-blur-sm">
            <p className="text-xs tracking-[0.18em] text-app-subtle">EL SOMBRERO GUARDA UN SECRETO</p>
            <p className="mt-3 text-sm leading-relaxed text-app-text">
              Arrástralo hacia arriba y dale la vuelta para descubrir qué esconde en su interior.
            </p>
          </div>
        </section>
      )}

      {phase === "hat-riddle" && (
        <section className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center p-6 pb-8 text-center sm:items-center sm:pb-6">
          <form className="hat-riddle-reveal pointer-events-auto w-full max-w-lg" onSubmit={solveRiddle}>
            <p className="font-app-display text-2xl leading-relaxed text-app-text sm:text-3xl">
              No se puede tocar,<br />
              pero transforma los deseos.<br />
              ¿Qué te trajo hasta aquí?
            </p>
            <input
              value={riddleAnswer}
              onChange={(event) => setRiddleAnswer(event.target.value)}
              className="mt-8 w-full border-0 bg-white px-4 py-3 text-center text-black outline-none placeholder:text-black/45 focus:ring-2 focus:ring-white/70"
              placeholder="Tu respuesta"
              aria-label="Respuesta a la adivinanza"
              autoFocus
            />
            <button
              type="submit"
              className="mt-4 text-xs tracking-[0.14em] text-app-text transition-opacity hover:opacity-65 focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-4"
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
    </main>
  );
}
