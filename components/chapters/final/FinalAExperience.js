"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import FinalAScene from "@/components/chapters/final/FinalAScene";
import FinalRevealSequence from "@/components/chapters/final/FinalRevealSequence";
import InterfaceReveal from "@/components/transitions/InterfaceReveal";
import styles from "./FinalAExperience.module.css";

export default function FinalAExperience({ title, description, instructions }) {
  const router = useRouter();
  const { saveWish, wish, wishes } = useProgress();
  const [value, setValue] = useState(wish || "");
  const [isSaved, setIsSaved] = useState(Boolean(wish));
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [areWishesReady, setAreWishesReady] = useState(false);
  const [hasSubmittedWish, setHasSubmittedWish] = useState(false);
  const [isWishAnimationComplete, setIsWishAnimationComplete] = useState(false);
  const hasSubmittedWishRef = useRef(false);
  const isPanelVisible = isSceneReady && areWishesReady;

  function submitWish(event) {
    event.preventDefault();
    if (!value.trim()) return;
    saveWish(value);
    setIsSaved(true);
    hasSubmittedWishRef.current = true;
    setHasSubmittedWish(true);
  }

  return (
    <main className={styles.experience}>
      {!isRevealComplete && (
        <FinalRevealSequence onContinue={() => setIsRevealComplete(true)} />
      )}
      {isRevealComplete && (
        <>
          <FinalAScene
            wishes={wishes}
            onReady={() => setIsSceneReady(true)}
            onWishesReady={() => {
              if (hasSubmittedWishRef.current) {
                setIsWishAnimationComplete(true);
                return;
              }
              setAreWishesReady(true);
            }}
          />
          {!isSceneReady && (
          <InterfaceReveal as="section" className={styles.sceneLoader} aria-live="polite">
            <p className={styles.sceneLoaderCopy}>Las estrellas te guían hacia tu deseo.</p>
          </InterfaceReveal>
          )}
        </>
      )}
      {isPanelVisible && !hasSubmittedWish && (
        <>
          <div className={styles.glow} aria-hidden="true" />
          <InterfaceReveal as="section" className={styles.panel} aria-labelledby="final-a-title">

            <h1 id="final-a-title" className={styles.title}>{title}</h1>
            <p className={styles.chapterCopy}>{description}</p>

            <form className={styles.form} onSubmit={submitWish}>
              <label className={styles.label} htmlFor="legend-wish">Escribe tu deseo</label>
              <textarea
                className={styles.textarea}
                id="legend-wish"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setIsSaved(false);
                }}
                rows={4}
                placeholder="Mi deseo es..."
              />
              <button className={styles.formButton} type="submit">ENTREGAR EL DESEO</button>
            </form>
            {isSaved && (
              <p className={styles.saved} aria-live="polite">
                Legend ha guardado tu deseo.
              </p>
            )}
          </InterfaceReveal>
        </>
      )}
      {hasSubmittedWish && (
        <InterfaceReveal as="section" className={styles.confirmation} aria-live="polite">
          <p className={styles.confirmationCopy}>
            Tu deseo ha sido recibido por el cielo. Ahora una nueva estrella lo guarda entre sus luces.
          </p>
        </InterfaceReveal>
      )}
      {hasSubmittedWish && isWishAnimationComplete && (
        <button
          type="button"
          className={`${styles.home} ${styles.homeBottom}`}
          onClick={() => router.push("/")}
        >
          VOLVER AL INICIO
        </button>
      )}
    </main>
  );
}
