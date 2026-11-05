"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_VOLUME = 0.35;
const DEFAULT_FADE_DURATION = 2400;

function clampVolume(value) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Reproductor global preparado para recibir la pista correspondiente a la
 * escena actual. Usa dos elementos de audio para poder hacer crossfade entre
 * una pista y la siguiente sin cortar la reproducción.
 */
export default function AmbientMusic({
  src = null,
  volume: initialVolume = DEFAULT_VOLUME,
  fadeDuration = DEFAULT_FADE_DURATION,
  showControl = false,
  alignWithHomeButton = false,
}) {
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const playersRef = useRef([]);
  const activePlayerRef = useRef(0);
  const animationFrameRef = useRef(null);
  const transitionIdRef = useRef(0);
  const pendingSrcRef = useRef(null);
  const hasUserInteractedRef = useRef(false);
  const transitionToRef = useRef(null);
  const volumeRef = useRef(initialVolume);
  const isMutedRef = useRef(false);

  useEffect(() => {
    const players = [new Audio(), new Audio()];

    players.forEach((player) => {
      player.loop = true;
      player.preload = "auto";
      player.playsInline = true;
      player.volume = 0;
    });

    playersRef.current = players;

    function handleUserInteraction() {
      hasUserInteractedRef.current = true;

      if (pendingSrcRef.current && transitionToRef.current) {
        transitionToRef.current(pendingSrcRef.current);
      }
    }

    window.addEventListener("pointerdown", handleUserInteraction, {
      passive: true,
    });
    window.addEventListener("keydown", handleUserInteraction, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointerdown", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      players.forEach((player) => {
        player.pause();
        player.removeAttribute("src");
        player.load();
      });

      playersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const players = playersRef.current;

    if (!players.length) {
      return undefined;
    }

    const transitionTo = (nextSrc) => {
      const currentPlayer = players[activePlayerRef.current];
      const nextPlayerIndex = 1 - activePlayerRef.current;
      const nextPlayer = players[nextPlayerIndex];
      const transitionId = transitionIdRef.current + 1;

      transitionIdRef.current = transitionId;
      pendingSrcRef.current = nextSrc;

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (!nextSrc) {
        pendingSrcRef.current = null;

        if (currentPlayer.paused || currentPlayer.volume === 0) {
          currentPlayer.pause();
          currentPlayer.currentTime = 0;
          currentPlayer.volume = 0;
          return;
        }

        const startedAt = performance.now();
        const startingVolume = currentPlayer.volume;

        const fadeOut = (now) => {
          if (transitionId !== transitionIdRef.current) {
            return;
          }

          const progress = clampVolume(
            (now - startedAt) / Math.max(1, fadeDuration),
          );

          currentPlayer.volume = clampVolume(startingVolume * (1 - progress));

          if (progress < 1) {
            animationFrameRef.current = window.requestAnimationFrame(fadeOut);
            return;
          }

          currentPlayer.pause();
          currentPlayer.currentTime = 0;
          currentPlayer.volume = 0;
          animationFrameRef.current = null;
        };

        animationFrameRef.current = window.requestAnimationFrame(fadeOut);
        return;
      }

      if (currentPlayer.src === nextSrc && !currentPlayer.paused) {
        pendingSrcRef.current = null;
        return;
      }

      if (nextPlayer.src !== nextSrc) {
        nextPlayer.pause();
        nextPlayer.src = nextSrc;
        nextPlayer.load();
      }

      nextPlayer.volume = 0;

      if (!hasUserInteractedRef.current) {
        return;
      }

      nextPlayer
        .play()
        .then(() => {
          if (transitionId !== transitionIdRef.current) {
            return;
          }

          pendingSrcRef.current = null;
          const startedAt = performance.now();
          const startingVolume = currentPlayer.volume;

          const fade = (now) => {
            if (transitionId !== transitionIdRef.current) {
              return;
            }

            const progress = clampVolume(
              (now - startedAt) / Math.max(1, fadeDuration),
            );

            currentPlayer.volume = clampVolume(startingVolume * (1 - progress));
            nextPlayer.volume = clampVolume(
              (isMutedRef.current ? 0 : volumeRef.current) * progress,
            );

            if (progress < 1) {
              animationFrameRef.current = window.requestAnimationFrame(fade);
              return;
            }

            currentPlayer.pause();
            currentPlayer.currentTime = 0;
            currentPlayer.volume = 0;
            activePlayerRef.current = nextPlayerIndex;
            animationFrameRef.current = null;
          };

          animationFrameRef.current = window.requestAnimationFrame(fade);
        })
        .catch(() => {
          // El navegador puede bloquear el audio hasta una interacción.
          // La pista queda pendiente para reintentarse en la siguiente.
          // interacción del usuario.
        });
    };

    transitionToRef.current = transitionTo;
    transitionTo(src);

    return () => {
      transitionIdRef.current += 1;

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [fadeDuration, src]);

  function handleMuteToggle() {
    const nextMuted = !isMutedRef.current;
    const activePlayer = playersRef.current[activePlayerRef.current];

    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    if (activePlayer && !activePlayer.paused) {
      activePlayer.volume = nextMuted ? 0 : volumeRef.current;
    }

  }

  function activateAudio() {
    hasUserInteractedRef.current = true;

    const pendingSrc = pendingSrcRef.current;
    const nextPlayer = playersRef.current[1 - activePlayerRef.current];

    if (
      pendingSrc &&
      transitionToRef.current &&
      nextPlayer?.paused
    ) {
      transitionToRef.current(pendingSrc);
    }
  }

  function handleVolumeChange(event) {
    const nextVolume = Number(event.target.value);
    const activePlayer = playersRef.current[activePlayerRef.current];

    volumeRef.current = nextVolume;
    setVolume(nextVolume);

    if (activePlayer && !activePlayer.paused && !isMutedRef.current) {
      activePlayer.volume = nextVolume;
    }

  }

  if (!showControl) {
    return null;
  }

  const positionClass = alignWithHomeButton
    ? "right-20 sm:right-24"
    : "right-4 sm:right-6";

  return (
    <div className={`group fixed bottom-4 ${positionClass} z-[100] sm:bottom-6`}>
      <div
        className={`absolute bottom-full left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 pb-2 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
          isPanelOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <label
          className="relative flex h-28 w-11 items-center justify-center rounded-full border border-app-border bg-black/75 text-app-text shadow-[0_0_24px_rgba(0,0,0,0.3)] backdrop-blur-sm"
          title="Volumen"
        >

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volumen de la música"
            className="absolute left-1/2 top-1/2 h-1 w-20 -translate-x-1/2 -translate-y-1/2 -rotate-90 accent-app-accent"
          />
        </label>

        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-app-border bg-black/75 text-app-text shadow-[0_0_24px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-colors hover:border-app-accent hover:text-app-accent"
          onClick={handleMuteToggle}
          aria-label={isMuted ? "Activar sonido" : "Silenciar sonido"}
          aria-pressed={isMuted}
          title={isMuted ? "Activar sonido" : "Silenciar sonido"}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="size-5"
          >
            <path d="M4 10v4h3l4 3V7L7 10H4Z" strokeLinejoin="round" />
            {isMuted ? (
              <path d="m16 10 4 4m0-4-4 4" strokeLinecap="round" />
            ) : (
              <>
                <path d="M15 9.5a4 4 0 0 1 0 5" strokeLinecap="round" />
                <path d="M17.5 7a7.5 7.5 0 0 1 0 10" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-full border border-app-border bg-black/65 text-app-text shadow-[0_0_24px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-colors hover:border-app-accent hover:text-app-accent"
        onPointerDown={activateAudio}
        onClick={() => setIsPanelOpen((current) => !current)}
        aria-label="Controles de sonido"
        aria-expanded={isPanelOpen}
        title="Controles de sonido"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-5"
        >
          <path d="M4 10v4h3l4 3V7L7 10H4Z" strokeLinejoin="round" />
          {isMuted ? (
            <path d="m16 10 4 4m0-4-4 4" strokeLinecap="round" />
          ) : (
            <>
              <path d="M15 9.5a4 4 0 0 1 0 5" strokeLinecap="round" />
              <path d="M17.5 7a7.5 7.5 0 0 1 0 10" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
