"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import CarruselScene from "@/components/chapters/carrusel/CarruselScene";
import styles from "@/components/chapters/carrusel/CarruselExperience.module.css";

const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7];
const CARD_PIP_POSITIONS = {
  1: [[3, 2]],
  2: [[1, 2], [5, 2]],
  3: [[1, 2], [3, 2], [5, 2]],
  4: [[1, 1], [1, 3], [5, 1], [5, 3]],
  5: [[1, 1], [1, 3], [3, 2], [5, 1], [5, 3]],
  6: [[1, 1], [3, 1], [5, 1], [1, 3], [3, 3], [5, 3]],
  7: [[1, 1], [3, 1], [5, 1], [1, 3], [3, 2], [5, 3], [3, 3]],
};

export default function CarruselExperience({ title, description, instructions }) {
  const router = useRouter();
  const { collectArtifact } = useProgress();
  const [foundCards, setFoundCards] = useState([]);
  const [phase, setPhase] = useState("search");
  const [message, setMessage] = useState("");
  const [orderedCards, setOrderedCards] = useState([]);
  const [draggedValue, setDraggedValue] = useState(null);
  const [dragOverValue, setDragOverValue] = useState(null);

  function findCard(value) {
    if (foundCards.includes(value)) return;

    const nextCards = [...foundCards, value];
    setFoundCards(nextCards);

    if (nextCards.length === CARD_VALUES.length) {
      // La baraja conserva el orden en que el usuario descubrió las cartas.
      // Ese mismo orden será el estado inicial del drag and drop.
      setOrderedCards(nextCards);
      setPhase("order");
      setMessage("Las siete cartas han aparecido. Ordénalas de menor a mayor.");
    }
  }

  function handleCardDrop(event, targetValue) {
    event.preventDefault();
    const sourceValue = Number(event.dataTransfer.getData("text/plain")) || draggedValue;
    setDragOverValue(null);
    setDraggedValue(null);

    if (!sourceValue || sourceValue === targetValue) return;

    const nextOrder = [...orderedCards];
    const sourceIndex = nextOrder.indexOf(sourceValue);
    let targetIndex = nextOrder.indexOf(targetValue);
    nextOrder.splice(sourceIndex, 1);
    if (sourceIndex < targetIndex) targetIndex -= 1;
    nextOrder.splice(targetIndex, 0, sourceValue);
    setOrderedCards(nextOrder);

    if (nextOrder.every((value, index) => value === index + 1)) {
      collectArtifact({ artifactId: "baraja-de-cartas", result: "correct" });
      setPhase("card-reveal");
    } else {
      setMessage("Sigue ordenando las cartas de menor a mayor.");
    }
  }

  function continueToHat() {
    router.push("/archivo/sombrero");
  }

  function handleCardDragStart(event, value) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(value));
    setDraggedValue(value);
  }

  function handleCardDragEnd() {
    setDraggedValue(null);
    setDragOverValue(null);
  }

  return (
    <main className={styles.experience}>
      <CarruselScene
        onCardFound={findCard}
        isCardReveal={phase === "card-reveal"}
        showDeck={phase === "fragment"}
        onCardRevealComplete={() => setPhase("fragment")}
      />
      {phase !== "fragment" && phase !== "card-reveal" && (
        <section className={styles.panel}>
        {phase === "search" && (
          <>
            <h1>{title}</h1>
            <p className={`${styles.copy} ${styles.chapterCopy}`}>{description}</p>
            <p className={`${styles.copy} ${styles.chapterCopy}`}>{instructions}</p>
            <div className={styles.cards} aria-label="Cartas escondidas">
              {foundCards.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={styles.found}
                  disabled
                >
                  ✓ {value}
                </button>
              ))}
              {CARD_VALUES.filter((value) => !foundCards.includes(value)).map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled
                  className="rounded-md"
                >
                  ?
                </button>
              ))}
            </div>
            <p className={styles.status} aria-live="polite">
              {foundCards.length} / 7 cartas encontradas
            </p>
          </>
        )}

        {phase === "order" && (
          <>
            <p className={styles.eyebrow}>LA BARAJA HA SIDO REVELADA</p>
            <h1>{title}</h1>
            <p className={`${styles.copy} ${styles.chapterCopy}`}>{description}</p>
            <p className={`${styles.copy} ${styles.chapterCopy}`}>{instructions}</p>
            <div className={`${styles.cards} ${styles.cardsOrder}`} aria-label="Orden de las cartas">
              {orderedCards.map((value) => (
                <button
                  key={value}
                  type="button"
                  draggable
                  className={`${styles.orderCard} ${draggedValue === value ? styles.isDragging : ""} ${dragOverValue === value ? styles.isDragTarget : ""}`}
                  onDragStart={(event) => handleCardDragStart(event, value)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverValue(value);
                  }}
                  onDrop={(event) => handleCardDrop(event, value)}
                  onDragEnd={handleCardDragEnd}
                  aria-label={`Carta ${value}. Arrástrala para cambiar su posición.`}
                >
                  <span className={styles.orderRank}>{value}</span>
                  <span className={styles.orderPips} aria-hidden="true">
                    {CARD_PIP_POSITIONS[value].map(([row, column], pipIndex) => (
                      <span
                        key={`${value}-${pipIndex}`}
                        className={styles.orderPip}
                        style={{ gridRow: row, gridColumn: column }}
                      >
                        ♥
                      </span>
                    ))}
                  </span>
                  <span className={`${styles.orderRank} ${styles.orderRankBottom}`}>{value}</span>
                </button>
              ))}
            </div>
            <p className={styles.status} aria-live="polite">Arrastra y suelta cada carta en su lugar.</p>
            {message && <p className={styles.message}>{message}</p>}
          </>
        )}

        </section>
      )}

      {phase === "fragment" && (
        <section
          className={styles.fragmentReveal}
          aria-label="Fragmento Las cartas del Destino"
        >
          <div className={styles.fragmentPanel}>
            <p className={styles.fragmentEyebrow}>FRAGMENTO CONSEGUIDO</p>
            <h2 className={styles.fragmentTitle}>Las cartas del Destino</h2>
            <p className={styles.fragmentMeaning}>
              Simboliza la manipulación del azar, la ilusión del control y las trampas del destino. Representa que en Caraval cada carta dictamina una prueba, pero solo quien desafía las reglas puede cambiar el resultado del juego.
            </p>
            <button
              type="button"
              className={styles.fragmentContinue}
              onClick={continueToHat}
            >
              Continuar
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
