"use client";

import { use } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { chapters } from '../../../data/chapters'; 
import HubExperience from '@/components/hub/HubExperience';
import BackButton from '@/components/ui/BackButton';
import HubPortal3D from '@/components/hub/HubPortal3D';
import TiendaExperience from '@/components/chapters/tienda/TiendaExperience';
import CarruselExperience from '@/components/chapters/carrusel/CarruselExperience';
import FinalAExperience from '@/components/chapters/final/FinalAExperience';
import { useProgress } from '@/hooks/useProgress';

export default function EscenaDinamica({ params }) {
  const router = useRouter();
  const { collectArtifact } = useProgress();
  const [isRoseRevealed, setIsRoseRevealed] = useState(false);
  
  // Desempaquetamos la promesa de params utilizando React.use()
  const resolvedParams = use(params);
  const chapterId = resolvedParams.chapter;
  
  const chapterData = chapters[chapterId];
  const actionButtonClass = "border border-app-border bg-app-surface px-4 py-2 text-sm text-app-text transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-2";

  if (!chapterData) {
    return (
      <main className="min-h-svh bg-app-background p-8 text-app-text">
        Escena no encontrada.
      </main>
    );
  }

  if (chapterId === 'tienda') {
    return <TiendaExperience />;
  }

  if (chapterId === 'carrusel') {
    return <CarruselExperience />;
  }

  if (chapterId === 'final-a') {
    return <FinalAExperience />;
  }

  const hubContent = (
    <main className="relative min-h-svh overflow-hidden bg-app-background p-6 text-app-text sm:p-8">
      <div className="relative z-20">
        <BackButton />
      </div>
      {chapterId === 'hub' ? (
         <HubPortal3D
           onAwaken={() => {
             collectArtifact({ artifactId: "rosa", result: "correct" });
             setIsRoseRevealed(true);
           }}
         />
      ) : (
        <>
          <h1 className="font-app-display text-4xl text-app-text">{chapterData.title}</h1>
          <p className="mt-4 max-w-2xl font-app-body leading-relaxed text-app-muted">
            {chapterData.description}
          </p>
        </>
      )}

      <div className={chapterId === 'hub'
        ? 'absolute left-6 top-28 z-20 max-w-xs sm:left-8'
        : 'mt-8 flex flex-wrap gap-4'}>
        {chapterId === 'hub' && (
          <div>
            <h1 className="font-app-display text-5xl text-app-text sm:text-6xl">Bienvenido a Caraval</h1>
            <p className="mt-5 max-w-md font-app-body leading-relaxed text-app-muted">
              {isRoseRevealed
                ? 'El arco ha revelado una rosa. Tómala y continúa hacia la primera escena.'
                : 'Mantené presionado el arco de entrada para despertarlo.'}
            </p>
          </div>
        )}
        {chapterId === 'hub' && isRoseRevealed && (
          <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-6">
            <section
              className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/25 bg-black/65 p-5 text-center shadow-[0_0_45px_rgba(255,255,255,0.16)] backdrop-blur-sm sm:p-6"
              aria-label="Rosa descubierta"
            >
              <p className="font-app-display text-3xl text-app-text">La rosa ha aparecido</p>
              <p className="mt-4 text-sm leading-relaxed text-app-muted">
                El arco ha hecho crecer una rosa entre sus líneas. Su fragmento ya forma parte de la figura de Legend.
              </p>
              <button
                type="button"
                className="mt-5 w-full rounded-xl border border-white/40 px-4 py-3 text-xs tracking-[0.16em] text-app-text transition-colors hover:bg-white hover:text-black"
                onClick={() => router.push('/archivo/tienda')}
              >
                CONTINUAR A LA TIENDA
              </button>
            </section>
          </div>
        )}

        {chapterId === 'tienda' && (
          <>
            <button className={actionButtonClass} onClick={() => router.push('/archivo/carrusel')}>
              Pagar con un secreto sincero — revelar un fragmento auténtico
            </button>
            <button className={actionButtonClass} onClick={() => router.push('/archivo/tuneles')}>
              Pagar con sangre — abrir un camino incierto
            </button>
          </>
        )}

        {chapterId === 'carrusel' && (
          <>
            <button className={actionButtonClass} onClick={() => router.push('/archivo/final-a')}>
              Confiar en Julian
            </button>
            <button className={actionButtonClass} onClick={() => router.push('/archivo/final-b')}>
              Desconfiar
            </button>
          </>
        )}

        {chapterId === 'tuneles' && (
          <>
            <button className={actionButtonClass} onClick={() => router.push('/archivo/final-c')}>
              Enfrentarse y firmar
            </button>
            <button className={actionButtonClass} onClick={() => router.push('/archivo/final-d')}>
              Huir
            </button>
          </>
        )}

        {chapterId.includes('final') && (
          <button className={actionButtonClass} onClick={() => router.push('/')}>
            Volver al Inicio
          </button>
        )}
      </div>
    </main>
  );

  return chapterId === 'hub' ? (
    <HubExperience>{hubContent}</HubExperience>
  ) : (
    hubContent
  );
}
