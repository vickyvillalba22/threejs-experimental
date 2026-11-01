"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import FinalAScene from "@/components/chapters/final/FinalAScene";

export default function FinalAExperience({ title, description, instructions }) {
  const router = useRouter();
  const { saveWish, wish, wishes } = useProgress();
  const [value, setValue] = useState(wish || "");
  const [isSaved, setIsSaved] = useState(Boolean(wish));
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [hasSubmittedWish, setHasSubmittedWish] = useState(false);

  useEffect(() => {
    if (!isSceneReady) return undefined;

    const revealTimer = window.setTimeout(() => {
      setIsPanelVisible(true);
    }, 5000);

    return () => window.clearTimeout(revealTimer);
  }, [isSceneReady]);

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
      <FinalAScene wishes={wishes} onReady={() => setIsSceneReady(true)} />
      <section
        className={`final-a-experience__loader ${isSceneReady ? "is-complete" : ""}`}
        aria-live="polite"
        aria-label="Cargando el final A"
      >
        <div className="final-a-experience__sigil" aria-hidden="true">
          <span /><span /><span /><span />
          <span /><span /><span /><span />
        </div>
        <p className="final-a-experience__loader-copy">
          Las estrellas te guían hacia tu deseo.
        </p>
      </section>
      {isPanelVisible && !hasSubmittedWish && (
        <>
          <div className="final-a-experience__glow" aria-hidden="true" />
          <section className="final-a-experience__panel" aria-labelledby="final-a-title">
            <p className="final-a-experience__eyebrow">FINAL A · EL TRIUNFO</p>
            <h1 id="final-a-title">{title}</h1>
            <p className="final-a-experience__chapter-copy">{description}</p>
            <p className="final-a-experience__chapter-copy">{instructions}</p>
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
