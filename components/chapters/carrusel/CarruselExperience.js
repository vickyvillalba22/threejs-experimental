"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import CarruselScene from "@/components/chapters/carrusel/CarruselScene";

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
      router.push("/archivo/sombrero");
    } else {
      setMessage("Sigue ordenando las cartas de menor a mayor.");
    }
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
    <main className="carousel-experience">
      <CarruselScene onCardFound={findCard} />
      <section className="carousel-experience__panel">
        {phase === "search" && (
          <>
            <p className="carousel-experience__eyebrow">EL CARRUSEL MÁGICO</p>
            <h1>{title}</h1>
            <p className="carousel-experience__copy carousel-experience__chapter-copy">{description}</p>
            <p className="carousel-experience__copy carousel-experience__chapter-copy">{instructions}</p>
            <div className="carousel-cards" aria-label="Cartas escondidas">
              {foundCards.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="is-found"
                  onClick={() => findCard(value)}
                  disabled
                >
                  ✓ {value}
                </button>
              ))}
              {CARD_VALUES.filter((value) => !foundCards.includes(value)).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => findCard(value)}
                >
                  ?
                </button>
              ))}
            </div>
            <p className="carousel-experience__status" aria-live="polite">
              {foundCards.length} / 7 cartas encontradas
            </p>
          </>
        )}

        {phase === "order" && (
          <>
            <p className="carousel-experience__eyebrow">LA BARAJA HA SIDO REVELADA</p>
            <h1>{title}</h1>
            <p className="carousel-experience__copy carousel-experience__chapter-copy">{description}</p>
            <p className="carousel-experience__copy carousel-experience__chapter-copy">{instructions}</p>
            <div className="carousel-cards carousel-cards--order" aria-label="Orden de las cartas">
              {orderedCards.map((value) => (
                <button
                  key={value}
                  type="button"
                  draggable
                  className={`carousel-order-card ${draggedValue === value ? "is-dragging" : ""} ${dragOverValue === value ? "is-drag-target" : ""}`}
                  onDragStart={(event) => handleCardDragStart(event, value)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverValue(value);
                  }}
                  onDrop={(event) => handleCardDrop(event, value)}
                  onDragEnd={handleCardDragEnd}
                  aria-label={`Carta ${value}. Arrástrala para cambiar su posición.`}
                >
                  <span className="carousel-order-card__rank">{value}</span>
                  <span className="carousel-order-card__pips" aria-hidden="true">
                    {CARD_PIP_POSITIONS[value].map(([row, column], pipIndex) => (
                      <span
                        key={`${value}-${pipIndex}`}
                        className="carousel-order-card__pip"
                        style={{ gridRow: row, gridColumn: column }}
                      >
                        ♥
                      </span>
                    ))}
                  </span>
                  <span className="carousel-order-card__rank carousel-order-card__rank--bottom">{value}</span>
                </button>
              ))}
            </div>
            <p className="carousel-experience__status" aria-live="polite">Arrastra y suelta cada carta en su lugar.</p>
            {message && <p className="carousel-experience__message">{message}</p>}
          </>
        )}

      </section>
    </main>
  );
}
