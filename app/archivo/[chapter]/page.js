"use client";

import { use } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { chapters } from '../../../data/chapters'; 
import HubExperience from '@/components/hub/HubExperience';
import BackButton from '@/components/ui/BackButton';
import HubPortal3D from '@/components/hub/HubPortal3D';

export default function EscenaDinamica({ params }) {
  const router = useRouter();
  const [isRiddleOpen, setIsRiddleOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerMessage, setAnswerMessage] = useState('');
  
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
        <HubPortal3D onAwaken={() => setIsRiddleOpen(true)} />
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
              {isRiddleOpen
                ? 'Resuelve la adivinanza para encontrar el siguiente destino.'
                : 'Mantené presionado el arco de entrada para despertarlo.'}
            </p>
          </div>
        )}
        {chapterId === 'hub' && isRiddleOpen && (
          <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-6">
            <section
              className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/25 bg-black/65 p-5 text-center shadow-[0_0_45px_rgba(255,255,255,0.16)] backdrop-blur-sm sm:p-6"
              aria-label="Primera adivinanza"
            >
              <p className="text-sm leading-relaxed text-app-text sm:text-base">
                Un lugar de mil estantes
                <br />
                y tesoros por mirar,
                <br />
                donde compras mil objetos
                <br />
                y te los llevas a tu hogar.
              </p>
              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (answer.trim().toLocaleLowerCase() === 'tienda') {
                    setAnswerMessage('La puerta reconoce tu respuesta.');
                    window.setTimeout(() => router.push('/archivo/tienda'), 650);
                  } else {
                    setAnswerMessage('La puerta permanece en silencio. Intenta otra vez.');
                  }
                }}
              >
                <label className="sr-only" htmlFor="hub-riddle-answer">Respuesta</label>
                <input
                  id="hub-riddle-answer"
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    setAnswerMessage('');
                  }}
                  autoFocus
                  autoComplete="off"
                  placeholder="Escribí la respuesta"
                  className="w-full rounded-xl border border-white/30 bg-black/50 px-4 py-3 text-center text-app-text outline-none transition-colors placeholder:text-white/45 focus:border-white"
                />
                <button
                  type="submit"
                  className="mt-3 w-full rounded-xl border border-white/40 px-4 py-3 text-xs tracking-[0.16em] text-app-text transition-colors hover:bg-white hover:text-black"
                >
                  RESPONDER
                </button>
                <p className="mt-3 min-h-5 text-xs text-app-subtle" aria-live="polite">
                  {answerMessage}
                </p>
              </form>
            </section>
          </div>
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
