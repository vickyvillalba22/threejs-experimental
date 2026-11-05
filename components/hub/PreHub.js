"use client";

import { useEffect, useRef, useState } from "react";
import KeyReveal from "@/components/hub/KeyReveal";
import MagicParticlesCanvas from "@/components/hub/MagicParticlesCanvas";
import styles from "@/components/hub/PreHub.module.css";

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

const EFFECT_DURATION = 2200;

export default function PreHub({ onComplete, onKeyFound }) {
  const [removedDoors, setRemovedDoors] = useState([]);
  const [activeDoor, setActiveDoor] = useState(null);
  const [status, setStatus] = useState("idle");
  const [isKeyCentered, setIsKeyCentered] = useState(false);
  const timerRef = useRef(null);
  const correctDoorRef = useRef(null);

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
        onKeyFound?.();
        setStatus("key-revealed");
        timerRef.current = null;
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

  return (
    <main className={`${styles.prehub} min-h-svh overflow-hidden bg-app-background font-app-body text-app-text`}>
      <div className={styles.prehub__atmosphere} aria-hidden="true" />

      <p className={styles.prehub__status} aria-live="polite">
        {status === "key-revealed"
          ? isKeyCentered
            ? (
              <span className={styles["prehub__fragment-message"]}>
                <strong className={styles["prehub__fragment-title"]}>La Llave del Destino</strong>
                <span className={styles["prehub__fragment-copy"]}>
                  En Caraval las puertas no se abren por azar, sino con la intención sincera de hacia dónde quieres dirigirte.
                </span>
              </span>
            )
            : null
          : "Elije la puerta correcta para llegar a Caraval"}
      </p>

      <section
        className={styles.prehub__stage}
        aria-label="Puertas de entrada a Caraval"
      >
        <div className={styles.prehub__doors}>
          {DOORS.map((door) => (
            <button
              key={door.id}
              type="button"
              ref={door.effect === "correct" ? correctDoorRef : undefined}
              className={[
                styles["prehub-door"],
                styles[`prehub-door--${door.effect}`],
                styles[`prehub-door--${door.position}`],
                activeDoor === door.id ? styles["is-active"] : "",
                removedDoors.includes(door.id) ? styles["is-removed"] : "",
                isKeyCentered && activeDoor !== door.id ? styles["is-background"] : "",
              ].filter(Boolean).join(" ")}
              onClick={() => selectDoor(door)}
              disabled={status !== "idle"}
              aria-label={door.label}
            >
              <span className={styles["prehub-door__silhouette"]} aria-hidden="true">
                <span className={styles["prehub-door__frame"]}>
                  <span className={styles["prehub-door__face"]}>
                    <span className={styles["prehub-door__grain"]} />
                    <span className={styles["prehub-door__arch"]} />
                    <span className={styles["prehub-door__handle"]} />
                    {door.effect === "shards" && (
                      <span className={styles["prehub-door__shards"]} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                    {door.effect === "water" && (
                      <span className={styles["prehub-door__ripples"]} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </span>
                  {door.effect === "shards" && (
                    <span className={styles["prehub-door__glass-pieces"]} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  {door.effect === "water" && (
                    <span className={styles["prehub-door__droplets"]} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  {door.effect === "correct" && (
                    <span className={styles["prehub-door__correct-particles"]} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  {door.effect === "fire" && (
                    <span className={styles["prehub-door__flames"]} aria-hidden="true">
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
                <span className={styles["prehub-door__aura"]} />
              </span>
              <span className={styles["prehub-door__caption"]}>{door.label}</span>
            </button>
          ))}
        </div>
        <MagicParticlesCanvas
          active={status === "unlocking"}
          originRef={correctDoorRef}
        />
        {status === "key-revealed" && (
          <KeyReveal
            originRef={correctDoorRef}
            onComplete={onComplete}
            onCenterReached={() => setIsKeyCentered(true)}
          />
        )}
      </section>

    </main>
  );
}
