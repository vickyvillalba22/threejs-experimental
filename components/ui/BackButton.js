"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ className = "" }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 border border-app-border bg-app-surface px-4 py-2 text-sm text-app-text transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-2 focus-visible:outline-app-text focus-visible:outline-offset-2 ${className}`}
      onClick={() => router.back()}
      aria-label="Volver a la pantalla anterior"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="size-4"
      >
        <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m11 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Volver</span>
    </button>
  );
}
