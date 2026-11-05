"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TiendaScene from "@/components/chapters/tienda/TiendaScene";
import { useProgress } from "@/hooks/useProgress";

export default function TiendaExperience({ title, description }) {
  const router = useRouter();
  const [hasFoundMask, setHasFoundMask] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [phase, setPhase] = useState("shop");
  const [secret, setSecret] = useState("");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [clockHour, setClockHour] = useState(null);
  const [isClockAwakening, setIsClockAwakening] = useState(false);
  const [message, setMessage] = useState("");
  const { collectArtifact } = useProgress();

  function handleGlassClick() {
    setHasFoundMask(true);
    setMessage("");
  }

  function handleGetFragment() {
    setIsPaymentOpen(true);
    setMessage("");
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
    if (isClockAwakening) return;

    const now = new Date();
    const currentHour = now.getHours() % 12 || 12;

    if (clockHour !== currentHour) {
      setMessage("La aguja de la hora no coincide con este momento.");
      return;
    }

    collectArtifact({ artifactId: "reloj-de-bolsillo", result: "correct" });
    setIsClockAwakening(true);
    window.setTimeout(() => setPhase("clock-fragment"), 1800);
  }

  function continueToCarousel() {
    router.push("/archivo/carrusel");
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-app-background text-app-text">
      <header
        className={`pointer-events-none absolute inset-x-4 top-6 z-10 mx-auto max-w-3xl text-center transition-[opacity,filter] duration-500 sm:top-8 ${hasFoundMask ? "opacity-0 blur-sm" : ""}`}
        aria-hidden={hasFoundMask}
      >
        <h1 className="font-app-display text-4xl text-app-text sm:text-5xl">{title}</h1>
        <p className="mt-4 text-[24px] leading-relaxed text-app-muted">{description}</p>
      </header>
      <TiendaScene
        onMaskClick={handleGlassClick}
        onClockHourChange={setClockHour}
        showPocketWatch={phase === "clock" || phase === "clock-fragment"}
        pocketWatchAwakened={isClockAwakening}
      />

      {hasFoundMask && phase === "shop" && (
        <section
          className="absolute inset-x-4 bottom-6 z-10 mx-auto max-w-md rounded-2xl border border-white/25 bg-black/70 p-5 text-center shadow-[0_0_45px_rgba(255,255,255,0.16)] backdrop-blur-md sm:bottom-8 sm:p-6"
          aria-label="Máscara veneciana"
        >
          {!isPaymentOpen ? (
            <>
              <p className="text-xs tracking-[0.16em] text-app-subtle">FRAGMENTO CONSEGUIDO</p>
              <p className="mt-3 font-app-display text-3xl text-app-text">La Máscara Veneciana</p>
              <p className="mt-2 text-[1.5rem] leading-relaxed text-app-text">
                Representa que tras las capas del Gran Maestro existe una herida del pasado que la magia jamás pudo congelar del todo.
              </p>
              <button
                type="button"
                className="mt-5 w-fit border rounded-md border-app-border bg-app-surface px-4 py-3 text-base text-app-text transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-2"
                onClick={handleGetFragment}
              >
                Conseguir fragmento
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 text-[1.5rem] leading-relaxed text-app-text">
                La máscara está al alcance de tu mano, pero la tienda exige un pago antes de entregártela.
              </p>
              <form className="mt-5 gap-3 flex flex-col" onSubmit={payWithSecret}>
                <label className="text-left text-md text-app-subtle" htmlFor="legend-secret">
                  Pagar con un secreto sincero
                </label>
                <input
                  id="legend-secret"
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  className="border border-app-border bg-black/50 px-4 py-3 text-md text-app-text outline-none focus:border-app-accent rounded-md"
                  placeholder="Escribe un secreto"
                />
                <button
                  type="button"
                  className="border rounded-md border-app-border bg-app-surface px-4 py-3 text-base text-app-text transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-2 w-fit self-center"
                  onClick={() => {
                    const form = document.getElementById("legend-secret");
                    form?.form?.requestSubmit();
                  }}
                >
                  Pagar
                </button>
              </form>
            </>
          )}
          {message && <p className="mt-3 text-xs text-app-subtle" aria-live="polite">{message}</p>}
        </section>
      )}

      {phase === "clock-riddle" && (
        <section className="absolute inset-0 z-20 grid place-items-center bg-black p-6 text-center">
          <form className="w-full max-w-md" onSubmit={solveClockRiddle}>
            <p className="text-[22px] text-app-subtle">Resuelve la adivinanza para encontrar la siguiente pieza:</p>
            <p className="object-modal-copy mt-6 font-app-display text-app-text">
              No camino, pero avanzo.<br />
              No hablo, pero marco el momento.<br />
              ¿Qué soy?
            </p>
            <input
              value={riddleAnswer}
              onChange={(event) => setRiddleAnswer(event.target.value)}
              className="mt-8 w-full border rounded-lg border-app-border bg-black px-4 py-3 text-center text-app-text outline-none focus:border-app-accent"
              placeholder="Tu respuesta"
              autoFocus
            />
            <button type="submit" className="mt-4 border rounded-lg border-app-border px-5 py-3 text-sm tracking-[0.14em] hover:border-app-accent">
              RESPONDER
            </button>
          </form>
        </section>
      )}

      {phase === "clock" && (
        <section className="pointer-events-none absolute inset-0 z-20 flex items-center bg-black/35 p-4 sm:p-8">
          <div className="pointer-events-none w-full max-w-md border border-white/15 rounded-lg bg-black/70 p-5 text-center shadow-[0_0_45px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:w-1/2 sm:max-w-lg sm:p-8">
            <p className="text-md tracking-[0.18em] text-app-subtle">EL RELOJ</p>
            <p className="mt-5 font-app-display text-4xl text-app-text">Ponlo en hora.</p>
            <p className="text-[25px] mt-3 leading-relaxed text-app-subtle">
              Arrastra las agujas hasta marcar la hora correcta. Los minutos no importan.
            </p>
            <p className="mt-5 text-[30px] text-app" aria-live="polite">
              Hora seleccionada: {clockHour || "—"}
            </p>
            <div>
              <button
                type="button"
                onClick={setClock}
                disabled={isClockAwakening}
                className="pointer-events-auto mt-5 border rounded-lg border-app-border px-5 py-3 text-md tracking-[0.14em] hover:border-app-accent disabled:cursor-wait disabled:opacity-60"
              >
                {isClockAwakening ? "DESPERTANDO EL RELOJ" : "AJUSTAR EL RELOJ"}
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === "clock-fragment" && (
        <section
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 p-4 sm:p-8"
          aria-label="Fragmento Reloj"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/25 bg-black/70 p-5 text-center shadow-[0_0_45px_rgba(255,255,255,0.16)] backdrop-blur-md sm:p-6">
            <p className="text-md text-app-subtle">FRAGMENTO CONSEGUIDO</p>
            <p className="mt-3 font-app-display text-3xl text-app-text">Reloj</p>
            <p className="mt-2 text-[1.5rem] leading-relaxed text-app-text">
              En Caraval el tiempo no se mide en horas, sino en la velocidad con la que la ilusión devora la cordura.
            </p>
            <button
              type="button"
              className="mt-5 w-fit border rounded-md border-app-border bg-app-surface px-4 py-2 text-lg text-app-text transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-2"
              onClick={continueToCarousel}
            >
              Continuar
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
