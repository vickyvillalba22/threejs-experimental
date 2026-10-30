"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import FinalAScene from "@/components/chapters/final/FinalAScene";

export default function FinalAExperience() {
  const router = useRouter();
  const { saveWish, wish, wishes } = useProgress();
  const [value, setValue] = useState(wish || "");
  const [isSaved, setIsSaved] = useState(Boolean(wish));
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [hasSubmittedWish, setHasSubmittedWish] = useState(false);

  useEffect(() => {
    const revealTimer = window.setTimeout(() => {
      setIsPanelVisible(true);
    }, 5000);

    return () => window.clearTimeout(revealTimer);
  }, []);

  function submitWish(event) {
    event.preventDefault();
    if (!value.trim()) return;
    saveWish(value);
    setIsSaved(true);
    setHasSubmittedWish(true);
    setIsPanelVisible(false);
  }

  return (
    <main className="final-a-experience">
      <FinalAScene wishes={wishes} />
      {isPanelVisible && !hasSubmittedWish && (
        <>
          <div className="final-a-experience__glow" aria-hidden="true" />
          <section className="final-a-experience__panel" aria-labelledby="final-a-title">
            <p className="final-a-experience__eyebrow">FINAL A · EL TRIUNFO</p>
            <h1 id="final-a-title">La figura está completa</h1>
            <p>
              Cada fragmento pertenece al mismo Legend. El maestro de ceremonias aparece ante ti
              y reconoce que has ganado el juego.
            </p>
            <p>Ahora puedes pedir tu deseo.</p>
            <form onSubmit={submitWish}>
              <label htmlFor="legend-wish">Escribe tu deseo</label>
              <textarea
                id="legend-wish"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setIsSaved(false);
                }}
                rows={4}
                placeholder="Mi deseo es..."
              />
              <button type="submit">ENTREGAR EL DESEO</button>
            </form>
            {isSaved && (
              <p className="final-a-experience__saved" aria-live="polite">
                Legend ha guardado tu deseo.
              </p>
            )}
            <button
              type="button"
              className="final-a-experience__home"
              onClick={() => router.push("/")}
            >
              VOLVER AL INICIO
            </button>
          </section>
        </>
      )}
      {hasSubmittedWish && (
        <button
          type="button"
          className="final-a-experience__home final-a-experience__home--bottom"
          onClick={() => router.push("/")}
        >
          VOLVER AL INICIO
        </button>
      )}
    </main>
  );
}
