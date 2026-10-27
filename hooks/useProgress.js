"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { chapters } from "@/data/chapters";
import { getFirebaseServices, hasFirebaseConfig } from "@/lib/firebase";

const STORAGE_KEY = "signal-88-progress";
export const LEGEND_FRAGMENT_COUNT = 8;
const VALID_CLUE_IDS = new Set(Object.values(chapters).map((chapter) => chapter.id));

function normalizeClues(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((clueId) => VALID_CLUE_IDS.has(clueId)))];
}

function normalizeArtifacts(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((artifactId) => typeof artifactId === "string"))];
}

function normalizeFragments(value) {
  if (!Array.isArray(value)) return [];

  const fragments = value
    .filter(
      (fragment) =>
        fragment &&
        Number.isInteger(fragment.index) &&
        fragment.index >= 0 &&
        fragment.index < LEGEND_FRAGMENT_COUNT &&
        (fragment.status === "correct" || fragment.status === "incorrect"),
    )
    .reduce((result, fragment) => {
      if (!result.some((item) => item.index === fragment.index)) {
        result.push({
          index: fragment.index,
          status: fragment.status,
          artifactId: typeof fragment.artifactId === "string" ? fragment.artifactId : null,
        });
      }
      return result;
    }, []);

  return fragments.sort((a, b) => a.index - b.index);
}

function readLocal() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");

    if (Array.isArray(stored)) {
      return { clues: normalizeClues(stored), artifacts: [], fragments: [] };
    }

    return {
      clues: normalizeClues(stored.clues),
      artifacts: normalizeArtifacts(stored.artifacts),
      fragments: normalizeFragments(stored.fragments),
      wish: typeof stored.wish === "string" ? stored.wish : "",
    };
  } catch {
    return { clues: [], artifacts: [], fragments: [], wish: "" };
  }
}

function saveLocal({ clues, artifacts, fragments, wish = "" }) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ clues, artifacts, fragments, wish }),
  );
}

function getProvider(user) {
  if (user.isAnonymous) return "anonymous";
  return user.providerData[0]?.providerId || "password";
}

async function saveUserProfile(user, db) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const profile = {
    userId: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    isAnonymous: user.isAnonymous,
    authProvider: getProvider(user),
    lastLoginAt: serverTimestamp(),
  };

  if (!snapshot.exists()) profile.createdAt = serverTimestamp();
  await setDoc(userRef, profile, { merge: true });
}

function useProgressState() {
  const [clues, setClues] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [fragments, setFragments] = useState([]);
  const [wish, setWish] = useState("");
  const cluesRef = useRef([]);
  const artifactsRef = useRef([]);
  const fragmentsRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState("local");
  const [remoteUser, setRemoteUser] = useState(null);
  const remoteUserRef = useRef(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const localProgress = readLocal();
    cluesRef.current = localProgress.clues;
    artifactsRef.current = localProgress.artifacts;
    fragmentsRef.current = localProgress.fragments;

    const hydrateLocal = window.setTimeout(() => {
      setClues(localProgress.clues);
      setArtifacts(localProgress.artifacts);
      setFragments(localProgress.fragments);
      setWish(localProgress.wish || "");
      saveLocal(localProgress);
      setReady(true);
    }, 0);

    if (!hasFirebaseConfig) return () => window.clearTimeout(hydrateLocal);

    const { auth, db } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        remoteUserRef.current = null;
        setRemoteUser(null);
        setAuthUser(null);
        try {
          setSyncState("connecting");
          await signInAnonymously(auth);
        } catch (error) {
          console.warn("No se pudo iniciar la sesion anonima.", error);
          setAuthError(error.code || "auth/anonymous-sign-in-failed");
          setSyncState("local");
        }
        return;
      }

      try {
        setSyncState("connecting");
        await saveUserProfile(user, db);

        const progressRef = doc(db, "progress", user.uid);
        const snapshot = await getDoc(progressRef);
        const remoteData = snapshot.exists() ? snapshot.data() : {};
        const remoteClues = normalizeClues(remoteData.clues);
        const remoteArtifacts = normalizeArtifacts(remoteData.artifacts);
        const remoteFragments = normalizeFragments(remoteData.fragments);
        const remoteWish = typeof remoteData.wish === "string" ? remoteData.wish : "";
        const mergedClues = normalizeClues([
          ...cluesRef.current,
          ...remoteClues,
        ]);
        const mergedArtifacts = normalizeArtifacts([
          ...artifactsRef.current,
          ...remoteArtifacts,
        ]);
        const mergedFragments = normalizeFragments([
          ...fragmentsRef.current,
          ...remoteFragments,
        ]);

        cluesRef.current = mergedClues;
        artifactsRef.current = mergedArtifacts;
        fragmentsRef.current = mergedFragments;
        setClues(mergedClues);
        setArtifacts(mergedArtifacts);
        setFragments(mergedFragments);
        setWish(remoteWish || localProgress.wish || "");
        saveLocal({
          clues: mergedClues,
          artifacts: mergedArtifacts,
          fragments: mergedFragments,
        });
        remoteUserRef.current = user;
        setRemoteUser(user);
        setAuthUser(user);
        setAuthError("");
        setSyncState("cloud");
      } catch (error) {
        console.warn("No se pudo sincronizar con Firebase.", error);
        setAuthUser(user);
        setAuthError(error.code || "firestore/sync-failed");
        setSyncState("local");
      }
    });

    return () => {
      window.clearTimeout(hydrateLocal);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready || !remoteUser) return;
    const { db } = getFirebaseServices();
    setDoc(
      doc(db, "progress", remoteUser.uid),
      {
        userId: remoteUser.uid,
        authProvider: getProvider(remoteUser),
        clues,
        artifacts,
        fragments,
        wish,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((error) => console.warn("No se pudo sincronizar el progreso.", error));
  }, [artifacts, clues, fragments, ready, remoteUser, wish]);

  const discover = useCallback((clueId) => {
    if (!VALID_CLUE_IDS.has(clueId) || cluesRef.current.includes(clueId)) return;

    const nextClues = [...cluesRef.current, clueId];
    cluesRef.current = nextClues;
    saveLocal({
      clues: nextClues,
      artifacts: artifactsRef.current,
      fragments: fragmentsRef.current,
      wish,
    });
    setClues(nextClues);
  }, [wish]);

  const collectArtifact = useCallback(({ artifactId, result = "none" }) => {
    if (!artifactId) return;

    const existingFragmentIndex = fragmentsRef.current.findIndex(
      (fragment) => fragment.artifactId === artifactId,
    );

    if (artifactsRef.current.includes(artifactId)) {
      if (
        result !== "incorrect" ||
        existingFragmentIndex === -1 ||
        fragmentsRef.current[existingFragmentIndex].status === "incorrect"
      ) {
        return;
      }

      const nextFragments = fragmentsRef.current.map((fragment, index) =>
        index === existingFragmentIndex
          ? { ...fragment, status: "incorrect" }
          : fragment,
      );
      fragmentsRef.current = nextFragments;
      setFragments(nextFragments);
      saveLocal({
        clues: cluesRef.current,
        artifacts: artifactsRef.current,
        fragments: nextFragments,
        wish,
      });
      return;
    }

    const nextArtifacts = [...artifactsRef.current, artifactId];
    let nextFragments = fragmentsRef.current;

    if (
      (result === "correct" || result === "incorrect") &&
      fragmentsRef.current.length < LEGEND_FRAGMENT_COUNT
    ) {
      nextFragments = [
        ...fragmentsRef.current,
        {
          index: fragmentsRef.current.length,
          status: result,
          artifactId,
        },
      ];
    }

    artifactsRef.current = nextArtifacts;
    fragmentsRef.current = nextFragments;
    setArtifacts(nextArtifacts);
    setFragments(nextFragments);
    saveLocal({
      clues: cluesRef.current,
      artifacts: nextArtifacts,
      fragments: nextFragments,
      wish,
    });
  }, [wish]);

  const reset = useCallback(async () => {
    cluesRef.current = [];
    artifactsRef.current = [];
    fragmentsRef.current = [];
    saveLocal({ clues: [], artifacts: [], fragments: [], wish: "" });
    setClues([]);
    setArtifacts([]);
    setFragments([]);
    setWish("");

    const user = remoteUserRef.current;
    if (!user || !hasFirebaseConfig) return;

    const { db } = getFirebaseServices();
    await setDoc(
      doc(db, "progress", user.uid),
      {
        userId: user.uid,
        authProvider: getProvider(user),
        clues: [],
        artifacts: [],
        fragments: [],
        wish: "",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, []);

  const saveWish = useCallback((value) => {
    const nextWish = value.trim();
    setWish(nextWish);
    saveLocal({
      clues: cluesRef.current,
      artifacts: artifactsRef.current,
      fragments: fragmentsRef.current,
      wish: nextWish,
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { auth } = getFirebaseServices();
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      setAuthError(error.code || "auth/google-sign-in-failed");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const submitEmail = useCallback(async ({ email, password, mode }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { auth } = getFirebaseServices();
      const action =
        mode === "signup"
          ? createUserWithEmailAndPassword
          : signInWithEmailAndPassword;
      await action(auth, email, password);
    } catch (error) {
      setAuthError(error.code || "auth/email-sign-in-failed");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { auth } = getFirebaseServices();
      await signOut(auth);
    } catch (error) {
      setAuthError(error.code || "auth/sign-out-failed");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const discovered = useMemo(() => new Set(clues), [clues]);
  const collectedArtifacts = useMemo(() => new Set(artifacts), [artifacts]);

  return {
    artifacts,
    authError,
    authLoading,
    authUser,
    clearAuthError: () => setAuthError(""),
    continueAsGuest,
    collectArtifact,
    discover,
    discovered,
    fragments,
    collectedArtifacts,
    firebaseConfigured: hasFirebaseConfig,
    ready,
    reset,
    signInWithGoogle,
    submitEmail,
    syncState,
    saveWish,
    wish,
  };
}

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const progress = useProgressState();

  return (
    <ProgressContext.Provider value={progress}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress debe utilizarse dentro de ProgressProvider");
  }
  return context;
}
