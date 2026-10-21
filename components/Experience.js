export default function Experience({ initialChapterId }) {
  return (
    <main className="grid min-h-svh place-content-center bg-app-background font-app-body text-[11px] tracking-[0.14em] text-app-accent">
      BASE PARA EL CAPÍTULO {initialChapterId || "ACTUAL"}
    </main>
  );
}
