"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { chapters } from '../../../data/chapters'; 
import HubExperience from '@/components/hub/HubExperience';
import BackButton from '@/components/ui/BackButton';
import HubPortal3D from '@/components/hub/HubPortal3D';

export default function EscenaDinamica({ params }) {
  const router = useRouter();
  
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

  const hubContent = (
    <main className="relative min-h-svh overflow-hidden bg-app-background p-6 text-app-text sm:p-8">
      <div className="relative z-20">
        <BackButton />
      </div>
      {chapterId === 'hub' ? (
        <HubPortal3D />
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
            <p className="mb-3 text-[10px] tracking-[0.28em] text-app-faint">ARCHIVO / ENTRADA</p>
            <h1 className="font-app-display text-5xl text-app-text sm:text-6xl">{chapterData.title}</h1>
            <p className="mt-5 max-w-md font-app-body leading-relaxed text-app-muted">
              {chapterData.description}
            </p>
          </div>
        )}
        {chapterId === 'hub' && (
          <button className={`${actionButtonClass} mt-7`} onClick={() => router.push('/archivo/tienda')}>
            Ir a la Tienda
          </button>
        )}

        {chapterId === 'tienda' && (
          <>
            <button className={actionButtonClass} onClick={() => router.push('/archivo/carrusel')}>
              Pagar con Secreto
            </button>
            <button className={actionButtonClass} onClick={() => router.push('/archivo/tuneles')}>
              Pagar con Sangre
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
