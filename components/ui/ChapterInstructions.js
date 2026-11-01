export default function ChapterInstructions({ title, description, instructions }) {
  if (!title && !description && !instructions) return null;

  return (
    <aside
      className="pointer-events-none absolute inset-x-4 top-6 z-30 mx-auto max-w-xl rounded-xl border border-white/20 bg-black/65 px-4 py-3 text-center shadow-[0_0_30px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:top-8 sm:px-6"
      aria-label="Instrucciones"
    >
      {title && <h1 className="font-app-display text-2xl text-app-text sm:text-3xl">{title}</h1>}
      {description && (
        <p className="mt-3 text-[24px] leading-relaxed text-app-muted">{description}</p>
      )}
      {instructions && (
        <div className="mt-4 border-t border-white/15 pt-3">
          <p className="text-[0.65rem] tracking-[0.18em] text-app-subtle">INSTRUCCIONES</p>
          <p className="mt-2 text-[24px] leading-relaxed text-app-text">{instructions}</p>
        </div>
      )}
    </aside>
  );
}
