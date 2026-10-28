"use client";

import { usePathname, useRouter } from "next/navigation";

const destinations = [
  { label: "Carta", href: "/?dev=letter" },
  { label: "Hub", href: "/archivo/hub" },
  { label: "Tienda", href: "/archivo/tienda" },
  { label: "Carrusel", href: "/archivo/carrusel" },
  { label: "Túneles", href: "/archivo/tuneles" },
  { label: "Final A", href: "/archivo/final-a" },
  { label: "Final B", href: "/archivo/final-b" },
  { label: "Final C", href: "/archivo/final-c" },
  { label: "Final D", href: "/archivo/final-d" },
];

export default function DevNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  if (process.env.NODE_ENV === "production") return null;

  return (
    <details className="fixed bottom-4 right-4 z-[100] w-52 rounded-xl border border-yellow-300/40 bg-black/85 p-3 text-yellow-100 shadow-2xl backdrop-blur-md">
      <summary className="cursor-pointer text-[10px] tracking-[0.16em]">MODO DESARROLLO</summary>
      <p className="mt-2 text-[10px] leading-relaxed text-yellow-100/60">
        Accesos directos para probar escenas sin recorrer la historia.
      </p>
      <nav className="mt-3 grid gap-1" aria-label="Navegación de desarrollo">
        {destinations.map((destination) => (
          <button
            key={destination.href}
            type="button"
            className={`rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-yellow-100/15 ${
              pathname === destination.href ? "bg-yellow-100/15" : ""
            }`}
            onClick={() => router.push(destination.href)}
          >
            {destination.label}
          </button>
        ))}
      </nav>
    </details>
  );
}
