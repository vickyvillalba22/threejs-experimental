"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TiendaScene from "@/components/chapters/tienda/TiendaScene";
import { useProgress } from "@/hooks/useProgress";

export default function TiendaExperience() {
  const router = useRouter();
  const [hasFoundMask, setHasFoundMask] = useState(false);
  const [phase, setPhase] = useState("shop");
  const [secret, setSecret] = useState("");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [clockTime, setClockTime] = useState("");
  const [message, setMessage] = useState("");
  const { collectArtifact, collectedArtifacts } = useProgress();

  function handleGlassClick() {
    setHasFoundMask(true);
    setMessage("La máscara aparece dentro del frasco. Para tomarla, debes pagar.");
  }

  function payWithSecret(event) {
    event.preventDefault();
    if (!secret.trim()) {
      setMessage("El secreto no puede quedar en blanco.");
      return;
    }

    collectArtifact({ artifactId: "mascara-veneciana", result: "correct" });
    setPhase("clock-riddle");
    setMessage("El secreto ha sido aceptado. La máscara es tuya.");
  }

  function payWithAurio() {
    collectArtifact({ artifactId: "mascara-veneciana", result: "correct" });
    collectArtifact({ artifactId: "aurio", result: "incorrect" });
    router.push("/archivo/tuneles");
  }

  function solveClockRiddle(event) {
    event.preventDefault();
    if (riddleAnswer.trim().toLocaleLowerCase() !== "reloj") {
      setMessage("La adivinanza permanece en silencio.");
      return;
    }

    setPhase("clock");
    setMessage("El reloj aparece. Ponlo en hora para continuar.");
  }

  function setClock() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (clockTime !== currentTime) {
      setMessage("El reloj no coincide con la hora de este momento.");
      return;
    }

    collectArtifact({ artifactId: "reloj-de-bolsillo", result: "correct" });
    router.push("/archivo/carrusel");
  }

  const hasMask = hasFoundMask || collectedArtifacts.has("mascara-veneciana");

  return (
    <main className="relative min-h-svh overflow-hidden bg-app-background text-app-text">
      <TiendaScene onGlassClick={handleGlassClick} />

      {hasMask && phase === "shop" && (
        <section
          className="absolute inset-x-4 bottom-6 z-10 mx-auto max-w-md rounded-2xl border border-white/25 bg-black/70 p-5 text-center shadow-[0_0_45px_rgba(255,255,255,0.16)] backdrop-blur-md sm:bottom-8 sm:p-6"
          aria-label="Máscara veneciana"
        >
          <p className="font-app-display text-2xl text-app-text">La máscara veneciana</p>
          <p className="mt-3 text-sm leading-relaxed text-app-muted">
            La máscara está al alcance de tu mano, pero la tienda exige un pago antes de entregártela.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={payWithSecret}>
            <label className="text-left text-xs text-app-subtle" htmlFor="legend-secret">
              Pagar con un secreto sincero
            </label>
            <input
              id="legend-secret"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              className="border border-app-border bg-black/50 px-4 py-3 text-sm text-app-text outline-none focus:border-app-accent"
              placeholder="Escribe un secreto"
            />
            <button
              type="button"
              className="border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-2"
              onClick={() => {
                const form = document.getElementById("legend-secret");
                form?.form?.requestSubmit();
              }}
            >
              Pagar con un secreto sincero
            </button>
            <button
              type="button"
              className="border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-2"
              onClick={payWithAurio}
            >
              Pagar con Aurio — alterar el fragmento
            </button>
          </form>
          {message && <p className="mt-3 text-xs text-app-subtle" aria-live="polite">{message}</p>}
        </section>
      )}

      {phase === "clock-riddle" && (
        <section className="absolute inset-0 z-20 grid place-items-center bg-black p-6 text-center">
          <form className="w-full max-w-md" onSubmit={solveClockRiddle}>
            <p className="text-xs tracking-[0.18em] text-app-subtle">LA SIGUIENTE PIEZA ESTÁ OCULTA</p>
            <p className="mt-6 font-app-display text-3xl text-app-text">
              No camino, pero avanzo.<br />
              No hablo, pero marco el momento.<br />
              ¿Qué soy?
            </p>
            <input
              value={riddleAnswer}
              onChange={(event) => setRiddleAnswer(event.target.value)}
              className="mt-8 w-full border border-app-border bg-black px-4 py-3 text-center text-app-text outline-none focus:border-app-accent"
              placeholder="Tu respuesta"
              autoFocus
            />
            <button type="submit" className="mt-4 border border-app-border px-5 py-3 text-xs tracking-[0.14em] hover:border-app-accent">
              RESPONDER
            </button>
            {message && <p className="mt-4 text-xs text-app-subtle" aria-live="polite">{message}</p>}
          </form>
        </section>
      )}

      {phase === "clock" && (
        <section className="absolute inset-0 z-20 grid place-items-center bg-black/90 p-6 text-center backdrop-blur-sm">
          <div className="w-full max-w-md">
            <p className="text-xs tracking-[0.18em] text-app-subtle">EL RELOJ DE BOLSILLO</p>
            <p className="mt-5 font-app-display text-3xl text-app-text">Ponlo en hora.</p>
            <input
              type="time"
              value={clockTime}
              onChange={(event) => setClockTime(event.target.value)}
              className="mt-7 border border-app-border bg-black px-5 py-3 text-center text-app-text"
              autoFocus
            />
            <div>
              <button type="button" onClick={setClock} className="mt-5 border border-app-border px-5 py-3 text-xs tracking-[0.14em] hover:border-app-accent">
                AJUSTAR EL RELOJ
              </button>
            </div>
            {message && <p className="mt-4 text-xs text-app-subtle" aria-live="polite">{message}</p>}
          </div>
        </section>
      )}
    </main>
  );
}
