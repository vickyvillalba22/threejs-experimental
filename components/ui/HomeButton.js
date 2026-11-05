"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeButton() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  function goHome() {
    router.push("/");
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 right-4 z-[100] inline-flex size-11 items-center justify-center rounded-full border border-app-border bg-black/65 text-app-text shadow-[0_0_24px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-colors hover:border-app-accent hover:text-app-accent sm:bottom-6 sm:right-6"
        onClick={() => setIsModalOpen(true)}
        aria-label="Volver al inicio"
        title="Volver al inicio"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-5"
        >
          <path d="m3 10.5 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 9.5v10h13v-10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 19.5v-5h5v5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-black/65 p-6 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIsModalOpen(false)}
        >
          <section
            className="w-full max-w-sm rounded-2xl border border-white/25 bg-app-surface p-6 text-center text-app-text shadow-[0_0_45px_rgba(255,255,255,0.16)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-confirmation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="home-confirmation-title" className="font-app-display text-3xl">
              ¿Volver al inicio?
            </h2>
            <p className="mt-3 text-2xl leading-relaxed text-app-muted">
              Perderás la escena actual y regresarás a la pantalla principal.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-app-border px-4 py-2 text-lg transition-colors hover:border-app-accent hover:text-app-accent"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg border border-app-text bg-app-text px-4 py-2 text-lg text-app-background transition-colors hover:border-app-accent hover:bg-app-accent"
                onClick={goHome}
              >
                Aceptar
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
