"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthPanel from "@/components/AuthPanel";
import { useProgress } from "@/hooks/useProgress";

export default function HomeExperience() {
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const {
    authError,
    authLoading,
    authUser,
    continueAsGuest,
    firebaseConfigured,
    ready,
    signInWithGoogle,
    submitEmail,
    syncState,
  } = useProgress();

  function enterExperience() {
    router.push('/archivo/hub');
  }

  if (!ready) {
    return (
      <main className="grid min-h-svh place-content-center bg-app-background font-app-body text-[11px] tracking-[0.14em] text-app-accent">
        CARGANDO…
      </main>
    );
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-app-background">
      <div className="absolute right-6 top-6 z-[40] flex items-center gap-3 max-[600px]:left-6 max-[600px]:right-6 max-[600px]:justify-between">
        <span className="text-[8px] tracking-[0.12em] text-app-faint" aria-live="polite">
          {authUser && !authUser.isAnonymous
            ? `OPERADOR: ${authUser.displayName || authUser.email}`
            : syncState === "cloud"
              ? "SESIÓN ANÓNIMA"
              : "MODO LOCAL"}
        </span>
        <button
          className="border border-app-border bg-app-surface px-3 py-2 text-[9px] tracking-[0.1em] text-app-text transition-colors hover:border-app-accent hover:text-app-accent disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setIsAuthOpen(true)}
          disabled={!firebaseConfigured}
          title={firebaseConfigured ? "Abrir opciones de acceso" : "Configurá Firebase para activar el acceso"}
        >
          {authUser && !authUser.isAnonymous ? "CUENTA" : "INICIAR SESIÓN"}
        </button>
      </div>

      <section className="fixed inset-0 z-[30] grid place-content-center justify-items-center bg-app-background p-6 text-center">
        <p className="mb-[17px] text-[10px] leading-[1.5] tracking-[0.14em] text-app-accent">
          EXPERIENCIA TRANSMEDIA
        </p>
        <h1 className="m-0 font-app-display text-[clamp(56px,13vw,170px)] leading-[0.85] tracking-[-0.08em]">
          CARAVAL
        </h1>
        <p className="mx-auto mb-[26px] mt-[36px] w-[min(550px,90vw)] font-app-body text-[15px] leading-[1.7] text-app-subtle">
          Caraval: La Isla de los Sueños
        </p>
        <button
          className="flex w-[min(360px,90vw)] justify-between border border-app-accent bg-app-accent px-[18px] py-4 text-[11px] tracking-[0.1em] text-app-background transition-colors duration-200 hover:bg-transparent hover:text-app-text"
          onClick={enterExperience}
        >
          <span>ENTRAR</span>
          <span aria-hidden="true">↗</span>
        </button>
        <p className="mt-4.5 text-[9px] text-app-faint">&nbsp;</p>
      </section>

      {isAuthOpen && (
        <AuthPanel
          authError={authError}
          authLoading={authLoading}
          onClose={() => setIsAuthOpen(false)}
          onContinueAsGuest={continueAsGuest}
          onGoogle={signInWithGoogle}
          onSubmitEmail={submitEmail}
          user={authUser}
        />
      )}
    </main>
  );
}
