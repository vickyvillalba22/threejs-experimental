import Link from "next/link";

export default function HomeSelector() {
  return (
    <main className="grid min-h-svh place-items-center bg-app-background px-6 py-12 text-app-text">
      <section className="w-full max-w-4xl text-center">
        <p className="text-sm tracking-[0.24em] text-app-muted">
          EXPERIENCIA TRANSMEDIA
        </p>
        <h1 className="mt-5 font-app-display text-7xl font-light tracking-wide sm:text-9xl">
          CARAVAL
        </h1>
        <p className="mt-2 font-app-display text-3xl text-app-subtle sm:text-4xl">
          La Isla de los Sueños
        </p>

        <div className="mx-auto mt-16 grid max-w-2xl gap-4 sm:grid-cols-2">
          <Link
            className="rounded-2xl border border-app-text bg-app-text px-6 py-5 text-sm tracking-[0.14em] text-app-background transition-colors hover:border-app-accent hover:bg-app-accent"
            href="/oficial"
          >
            PROBAR EXPERIENCIA COMPLETA
          </Link>
          <Link
            className="rounded-2xl border border-app-border bg-app-surface px-6 py-5 text-sm tracking-[0.14em] text-app-text transition-colors hover:border-app-accent hover:text-app-accent"
            href="/demo"
          >
            PROBAR DEMO
          </Link>
        </div>
      </section>
    </main>
  );
}
