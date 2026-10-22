"use client";

import { useEffect, useRef, useState } from "react";

const DOORS = [
  {
    id: "fire",
    label: "Puerta de fuego",
    effect: "fire",
    position: "left-back",
    description: "Una puerta cubierta de brasas.",
  },
  {
    id: "water",
    label: "Puerta de agua",
    effect: "water",
    position: "right-back",
    description: "Una puerta que parece respirar bajo el agua.",
  },
  {
    id: "shards",
    label: "Puerta de cristal",
    effect: "shards",
    position: "left-front",
    description: "Una puerta atravesada por grietas plateadas.",
  },
  {
    id: "correct",
    label: "Puerta sin nombre",
    effect: "correct",
    position: "right-front",
    description: "Una puerta silenciosa, sin ninguna marca.",
  },
];

const EFFECT_DURATION = 1500;

export default function PreHub({ onComplete }) {
  const [removedDoors, setRemovedDoors] = useState([]);
  const [activeDoor, setActiveDoor] = useState(null);
  const [status, setStatus] = useState("idle");
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function selectDoor(door) {
    if (status !== "idle" || removedDoors.includes(door.id)) {
      return;
    }

    setActiveDoor(door.id);

    if (door.effect === "correct") {
      setStatus("unlocking");
      timerRef.current = window.setTimeout(() => {
        onComplete();
      }, EFFECT_DURATION);
      return;
    }

    setStatus("destroying");
    setActiveDoor(door.id);
    timerRef.current = window.setTimeout(() => {
      setRemovedDoors((current) => [...current, door.id]);
      setActiveDoor(null);
      setStatus("idle");
      timerRef.current = null;
    }, EFFECT_DURATION);
  }

  const activeDoorData = DOORS.find((door) => door.id === activeDoor);

  return (
    <main className="prehub min-h-svh overflow-hidden bg-app-background font-app-body text-app-text">
      <div className="prehub__atmosphere" aria-hidden="true" />

      <header className="prehub__header">
        <p className="prehub__eyebrow">ANTES DE LA FERIA</p>
        <h1 className="font-app-display">Las puertas de Caraval</h1>
        <p className="prehub__intro">
          Cuatro umbrales esperan en la oscuridad. Solo uno conduce a la isla.
        </p>
      </header>

      <section
        className={`prehub__stage prehub__stage--${status}`}
        aria-label="Puertas de entrada a Caraval"
      >
        <div className="prehub__floor" aria-hidden="true" />
        <div className="prehub__doors">
          {DOORS.map((door) => (
            <button
              key={door.id}
              type="button"
              className={`prehub-door prehub-door--${door.effect} prehub-door--${door.position} ${
                activeDoor === door.id ? "is-active" : ""
              } ${removedDoors.includes(door.id) ? "is-removed" : ""}`}
              onClick={() => selectDoor(door)}
              disabled={status !== "idle"}
              aria-label={door.label}
            >
              <span className="prehub-door__silhouette" aria-hidden="true">
                <span className="prehub-door__frame">
                  <span className="prehub-door__face">
                    <span className="prehub-door__grain" />
                    <span className="prehub-door__arch" />
                    <span className="prehub-door__handle" />
                    {door.effect === "shards" && (
                      <span className="prehub-door__shards" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </span>
                  {door.effect === "fire" && (
                    <span className="prehub-door__flames" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                </span>
                <span className="prehub-door__aura" />
              </span>
              <span className="prehub-door__caption">{door.label}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="prehub__status" aria-live="polite">
        {status === "idle" && "Elegí una puerta para descubrir qué hay al otro lado."}
        {status === "destroying" && activeDoorData &&
          `${activeDoorData.label} no era la entrada. El umbral se desarma.`}
        {status === "unlocking" && "La puerta correcta reconoce tu presencia."}
      </p>
    </main>
  );
}
