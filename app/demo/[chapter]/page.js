import { notFound } from "next/navigation";
import HubDemo from "@/components/demo/hubDemo/HubDemo";
import TiendaDemo from "@/components/demo/tiendaDemo/TiendaDemo";
import CarruselDemo from "@/components/demo/carruselDemo/CarruselDemo";
import BackButton from "@/components/ui/BackButton";
import { demoChapters } from "@/data/demoChapters";

export default async function DemoChapterPage({ params }) {
  const { chapter: chapterId } = await params;
  const chapterData = demoChapters[chapterId];

  if (!chapterData) {
    notFound();
  }

  if (chapterId === "hubDemo") {
    return <HubDemo />;
  }

  if (chapterId === "tiendaDemo") {
    return (
      <>
        <BackButton />
        <TiendaDemo {...chapterData} />
      </>
    );
  }

  if (chapterId === "carruselDemo") {
    return (
      <>
        <BackButton />
        <CarruselDemo />
      </>
    );
  }

  return (
    <>
      <BackButton />
      <main className="grid min-h-svh place-items-center bg-app-background p-6 text-app-text">
        <section className="w-full max-w-2xl text-center">
          <p className="text-xs tracking-[0.2em] text-app-subtle">ESCENA DEMO</p>
          <h1 className="mt-4 font-app-display text-5xl sm:text-7xl">
            {chapterData.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-app-muted">
            {chapterData.description}
          </p>
          <p className="mt-4 text-sm tracking-[0.08em] text-app-subtle">
            Esta escena demo todavía está en construcción.
          </p>
        </section>
      </main>
    </>
  );
}
