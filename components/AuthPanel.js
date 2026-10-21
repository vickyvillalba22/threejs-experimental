"use client";

import { useState } from "react";

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "El email ya tiene una cuenta asociada.",
  "auth/invalid-credential": "El email o la contraseña no son correctos.",
  "auth/invalid-email": "El formato del email no es válido.",
  "auth/popup-closed-by-user": "La ventana de Google se cerró antes de completar el acceso.",
  "auth/weak-password": "La contraseña debe tener al menos seis caracteres.",
};

function getErrorMessage(code) {
  return ERROR_MESSAGES[code] || `No se pudo completar la operación (${code}).`;
}

export default function AuthPanel({
  authError,
  authLoading,
  onClose,
  onContinueAsGuest,
  onGoogle,
  onSubmitEmail,
  user,
}) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onSubmitEmail({ email, password, mode });
      onClose();
    } catch {
      // El hook expone un codigo de error presentable en el panel.
    }
  }

  async function handleGoogle() {
    try {
      await onGoogle();
      onClose();
    } catch {
      // El hook expone un codigo de error presentable en el panel.
    }
  }

  async function handleGuest() {
    try {
      await onContinueAsGuest();
      onClose();
    } catch {
      // El hook expone un codigo de error presentable en el panel.
    }
  }

  return (
    <section
      className="fixed inset-0 z-[60] grid place-items-center bg-[rgba(11,11,13,0.92)] p-5 backdrop-blur-[12px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div className="relative w-full max-w-[460px] border border-app-border bg-app-surface p-[30px] max-[900px]:px-5 max-[900px]:py-[26px]">
        <button
          className="absolute right-[18px] top-4 z-[2] border-0 bg-transparent text-2xl"
          onClick={onClose}
          aria-label="Cerrar acceso"
        >
          ×
        </button>
        <p className="mb-[17px] text-[10px] leading-[1.5] tracking-[0.14em] text-app-accent">
          IDENTIFICACIÓN / FIREBASE AUTH
        </p>
        <h2
          id="auth-title"
          className="mb-[25px] font-app-display text-[clamp(28px,5vw,45px)] leading-[0.95] tracking-[-0.04em]"
        >
          IDENTIFICAR OPERADOR
        </h2>

        {user && !user.isAnonymous ? (
          <div className="grid gap-2">
            <small className="text-[8px] tracking-[0.1em] text-app-accent">SESIÓN ACTIVA</small>
            <strong className="break-words font-app-body text-[20px] leading-[1.3]">
              {user.displayName || user.email}
            </strong>
            <span className="mb-4 font-app-body text-xs text-[#9999a0]">{user.email}</span>
            <button
              className="w-full border border-[#555861] bg-transparent px-[13px] py-[13px] text-[9px] font-bold tracking-[0.1em] text-app-text hover:border-app-text"
              onClick={handleGuest}
              disabled={authLoading}
            >
              CONTINUAR COMO INVITADO
            </button>
          </div>
        ) : (
          <>
            <div
              className="mb-5 grid grid-cols-2 border border-app-border p-[3px]"
              aria-label="Modo de autenticación"
            >
              <button
                className={`border-0 px-[11px] py-[11px] text-[9px] tracking-[0.1em] ${mode === "signin" ? "bg-[#303037] text-app-text" : "bg-transparent text-app-faint"}`}
                onClick={() => setMode("signin")}
              >
                INGRESAR
              </button>
              <button
                className={`border-0 px-[11px] py-[11px] text-[9px] tracking-[0.1em] ${mode === "signup" ? "bg-[#303037] text-app-text" : "bg-transparent text-app-faint"}`}
                onClick={() => setMode("signup")}
              >
                CREAR CUENTA
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-[15px]">
              <label className="grid gap-[7px] text-[8px] tracking-[0.1em] text-[#a0a0a7]">
                <span>EMAIL</span>
                <input
                  className="w-full border border-[#4b4b53] bg-app-background p-3 font-app-body text-[13px] text-app-text outline-none focus:border-app-accent"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="grid gap-[7px] text-[8px] tracking-[0.1em] text-[#a0a0a7]">
                <span>CONTRASEÑA</span>
                <input
                  className="w-full border border-[#4b4b53] bg-app-background p-3 font-app-body text-[13px] text-app-text outline-none focus:border-app-accent"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={6}
                  required
                />
              </label>
              <button
                className="w-full border border-app-accent bg-app-accent px-[13px] py-[13px] text-[9px] font-bold tracking-[0.1em] text-app-background disabled:cursor-wait disabled:opacity-45"
                type="submit"
                disabled={authLoading}
              >
                {authLoading ? "PROCESANDO…" : mode === "signup" ? "CREAR CUENTA" : "INGRESAR"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[8px] text-app-faint before:h-px before:flex-1 before:bg-app-border before:content-[''] after:h-px after:flex-1 after:bg-app-border after:content-['']">
              <span>O</span>
            </div>
            <button
              className="w-full border border-[#555861] bg-transparent px-[13px] py-[13px] text-[9px] font-bold tracking-[0.1em] text-app-text hover:border-app-text disabled:cursor-wait disabled:opacity-45"
              onClick={handleGoogle}
              disabled={authLoading}
            >
              CONTINUAR CON GOOGLE
            </button>
            <p className="mt-[17px] font-app-body text-[11px] leading-[1.5] text-app-faint">
              El acceso como invitado utiliza una cuenta anónima de Firebase.
            </p>
          </>
        )}

        {authError && (
          <p
            className="mt-[18px] border-l-2 border-[#aaaeb8] bg-white/[0.06] px-3 py-[9px] font-app-body text-xs leading-[1.5] text-[#d5d5da]"
            role="alert"
          >
            {getErrorMessage(authError)}
          </p>
        )}
      </div>
    </section>
  );
}
