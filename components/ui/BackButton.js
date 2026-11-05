"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ className = "" }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={`fixed left-4 top-4 z-[60] inline-flex size-11 items-center justify-center rounded-full border border-app-border bg-black/65 text-app-text shadow-[0_0_24px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-colors hover:border-app-accent hover:text-app-accent sm:left-6 sm:top-6 ${className}`}
      onClick={() => router.back()}
      aria-label="Volver a la pantalla anterior"
      title="Volver"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="size-5"
      >
        <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m11 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
