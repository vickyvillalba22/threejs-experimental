"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthPanel from "@/components/AuthPanel";
import InvitationCard from "@/components/elements/invitation/InvitationCard";
import ExperienceIntroduction from "@/components/onboarding/ExperienceIntroduction";
import ParticleTrail from "@/components/ParticleTrail";
import { useProgress } from "@/hooks/useProgress";

export default function HomeExperience({ devTarget = "" }) {
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEntranceRevealed, setIsEntranceRevealed] = useState(false);
  const [isIntroductionOpen, setIsIntroductionOpen] = useState(false);
  const [isInvitationOpen, setIsInvitationOpen] = useState(devTarget === "letter");
  const {
    authError,
    authLoading,
    authUser,
    continueAsGuest,
    firebaseConfigured,
    ready,
    reset,
    signInWithGoogle,
    submitEmail,
    syncState,
  } = useProgress();

  function openInvitation() {
    setIsIntroductionOpen(true);
  }

  function openLetter() {
    setIsIntroductionOpen(false);
    setIsInvitationOpen(true);
  }

  function enterExperience() {
    router.push('/archivo/hub');
  }

  async function handleResetProgress() {
    if (!window.confirm("¿Querés borrar todo el progreso y comenzar de nuevo?")) return;
    await reset();
  }

  if (!ready) {
    return (
      <main className="grid min-h-svh place-content-center bg-app-background font-app-body text-[11px] tracking-[0.14em] text-app-accent">
        CARGANDO…
      </main>
    );
  }

  return (
    <main
      className="relative min-h-svh overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "linear-gradient(rgba(5, 5, 8, 0.38), rgba(5, 5, 8, 0.55)), url('/imgs/home-back-1.jpeg')",
      }}
    >
      <ParticleTrail onReveal={() => setIsEntranceRevealed(true)} />
      <div className="absolute right-6 top-6 z-[40] flex items-center gap-3 max-[600px]:left-6 max-[600px]:right-6 max-[600px]:justify-between">
        <span className="text-[12px] tracking-[0.12em]" aria-live="polite">
          {authUser && !authUser.isAnonymous
            ? `OPERADOR: ${authUser.displayName || authUser.email}`
            : syncState === "cloud"
              ? "SESIÓN ANÓNIMA"
              : "MODO LOCAL"}
        </span>
        <button
          className="border border-app-border bg-app-surface px-3 py-2 text-[12px] tracking-[0.1em] text-app-text transition-colors hover:border-app-accent hover:text-app-accent disabled:cursor-not-allowed disabled:opacity-50 rounded-2xl"
          onClick={() => setIsAuthOpen(true)}
          disabled={!firebaseConfigured}
          title={firebaseConfigured ? "Abrir opciones de acceso" : "Configurá Firebase para activar el acceso"}
        >
          {authUser && !authUser.isAnonymous ? "CUENTA" : "INICIAR SESIÓN"}
        </button>
        <button
          className="border border-app-border bg-transparent px-3 py-2 text-[10px] tracking-[0.1em] text-app-muted transition-colors hover:border-red-400 hover:text-red-300 rounded-2xl"
          onClick={handleResetProgress}
          type="button"
        >
          REINICIAR PROGRESO
        </button>
      </div>

      <section className="fixed inset-0 z-[30] flex flex-col items-center justify-center bg-black/25 p-6 text-center gap-10">
        <p className="mb-[10px] text-[20px] tracking-[0.14em]">
          EXPERIENCIA TRANSMEDIA
        </p>
        <div className="h-[40vh]">
          <p className="font-app-display text-[150px] font-light">
          CARAVAL
          </p>
          <p className="mx-auto mb-[26px] w-[min(550px,90vw)] font-app-display text-[40px]  text-app-subtle">
            La Isla de los Sueños
          </p>
        </div>
        
        <p className="mb-5 tracking-[0.14em] text-[20px]">
          MANTENÉ PRESIONADO EL MOUSE Y DIBUJÁ UN CÍRCULO
        </p>
        {isEntranceRevealed && (
          <div className="relative">
            <div className="entrance-flash" aria-hidden="true" />
            <button
              className="enter-button relative z-[1] flex w-fit justify-center overflow-hidden rounded-2xl border border-transparent bg-black px-5 py-4 text-[20px] tracking-[0.14em] text-app-text transition-colors duration-200 hover:bg-[#fafafa] hover:text-black"
              onClick={openInvitation}
            >
              <svg className="enter-button__border" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <rect x="1" y="1" width="98" height="98" rx="12" ry="25" pathLength="100" />
              </svg>
               <span className="relative z-[1]">COMENZAR</span>
            </button>
          </div>
        )}
        <p className="mt-4.5 text-[9px] text-app-faint">&nbsp;</p>
      </section>

      {isInvitationOpen && (
        <InvitationCard
          onClose={() => setIsInvitationOpen(false)}
          onEnterHub={enterExperience}
        />
      )}

      {isIntroductionOpen && <ExperienceIntroduction onContinue={openLetter} />}

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
