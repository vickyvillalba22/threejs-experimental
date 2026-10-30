"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/hooks/useProgress";
import CarruselScene from "@/components/chapters/carrusel/CarruselScene";

const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7];
function shuffle(values) {
  return [...values].sort(() => Math.random() - 0.5);
}

export default function CarruselExperience() {
  const router = useRouter();
  const { collectArtifact } = useProgress();
  const [foundCards, setFoundCards] = useState([]);
  const [phase, setPhase] = useState("search");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [orderedCards, setOrderedCards] = useState(() => shuffle(CARD_VALUES));
  const [draggedValue, setDraggedValue] = useState(null);
  const [dragOverValue, setDragOverValue] = useState(null);

  function findCard(value) {
    if (foundCards.includes(value)) return;

    const nextCards = [...foundCards, value];
    setFoundCards(nextCards);

    if (nextCards.length === CARD_VALUES.length) {
      collectArtifact({ artifactId: "baraja-de-cartas", result: "correct" });
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
      collectArtifact({ artifactId: "sombrero-de-copa", result: "correct" });
      setPhase("hat-riddle");
      setMessage("El sombrero de copa guarda una última pregunta.");
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

  function solveFinalRiddle(event) {
    event.preventDefault();
    if (riddleAnswer.trim().toLocaleLowerCase() !== "magia") {
      setMessage("El sombrero no reconoce esa respuesta.");
      return;
    }

    router.push("/archivo/final-a");
  }

  return (
    <main className="carousel-experience">
      <CarruselScene onCardFound={findCard} />
      <section className="carousel-experience__panel">
        {phase === "search" && (
          <>
            <p className="carousel-experience__eyebrow">EL CARRUSEL MÁGICO</p>
            <h1>Encuentra las siete cartas</h1>
            <p className="carousel-experience__copy">
              Las cartas están escondidas en el movimiento del carrusel. Explora la escena con calma.
            </p>
            <div className="carousel-cards" aria-label="Cartas escondidas">
              {CARD_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={foundCards.includes(value) ? "is-found" : ""}
                  onClick={() => findCard(value)}
                  disabled={foundCards.includes(value)}
                >
                  {foundCards.includes(value) ? `✓ ${value}` : "?"}
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
            <h1>Ordena las cartas</h1>
            <p className="carousel-experience__copy">Arrastra las cartas para ordenarlas de menor a mayor.</p>
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
                  <span className="carousel-order-card__suit" aria-hidden="true">♥</span>
                  <span className="carousel-order-card__rank carousel-order-card__rank--bottom">{value}</span>
                </button>
              ))}
            </div>
            <p className="carousel-experience__status" aria-live="polite">Arrastra y suelta cada carta en su lugar.</p>
            {message && <p className="carousel-experience__message">{message}</p>}
          </>
        )}

        {phase === "hat-riddle" && (
          <form onSubmit={solveFinalRiddle}>
            <p className="carousel-experience__eyebrow">DENTRO DEL SOMBRERO</p>
            <h1>La última pregunta</h1>
            <p className="carousel-experience__riddle">
              No se puede tocar,<br />
              pero transforma los deseos.<br />
              ¿Qué te trajo hasta aquí?
            </p>
            <input
              value={riddleAnswer}
              onChange={(event) => setRiddleAnswer(event.target.value)}
              placeholder="Tu respuesta"
              autoFocus
            />
            <button type="submit" className="carousel-experience__submit">RESPONDER</button>
            {message && <p className="carousel-experience__message">{message}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
