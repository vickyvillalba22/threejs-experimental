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
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { chapters } from "@/data/chapters";
import { getFirebaseServices, hasFirebaseConfig } from "@/lib/firebase";

const STORAGE_KEY = "signal-88-progress";
const PROGRESS_PERSISTENCE_ENABLED = process.env.NEXT_PUBLIC_DISABLE_PROGRESS_PERSISTENCE !== "true";
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
  if (!PROGRESS_PERSISTENCE_ENABLED) {
    window.localStorage.removeItem(STORAGE_KEY);
    return { clues: [], artifacts: [], fragments: [], wish: "" };
  }

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
  if (!PROGRESS_PERSISTENCE_ENABLED) return;
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
  const [wishes, setWishes] = useState([]);
  const cluesRef = useRef([]);
  const artifactsRef = useRef([]);
  const fragmentsRef = useRef([]);
  const pendingWishRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState("local");
  const [remoteUser, setRemoteUser] = useState(null);
  const remoteUserRef = useRef(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const resetVersionRef = useRef(0);

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

    if (!hasFirebaseConfig || !PROGRESS_PERSISTENCE_ENABLED) {
      return () => window.clearTimeout(hydrateLocal);
    }

    const { auth, db } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const authVersion = resetVersionRef.current;
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
        if (authVersion !== resetVersionRef.current) return;
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

        if (authVersion !== resetVersionRef.current) return;

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
    if (!PROGRESS_PERSISTENCE_ENABLED || !ready || !remoteUser) return;
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
    resetVersionRef.current += 1;
    cluesRef.current = [];
    artifactsRef.current = [];
    fragmentsRef.current = [];
    saveLocal({ clues: [], artifacts: [], fragments: [], wish: "" });
    setClues([]);
    setArtifacts([]);
    setFragments([]);
    setWish("");

    const user = remoteUserRef.current;
    if (!user || !hasFirebaseConfig || !PROGRESS_PERSISTENCE_ENABLED) return;

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

  useEffect(() => {
    if (!hasFirebaseConfig || !PROGRESS_PERSISTENCE_ENABLED || !remoteUser) {
      return undefined;
    }

    const { db } = getFirebaseServices();
    const wishesQuery = query(
      collection(db, "wishes"),
      orderBy("createdAt", "desc"),
      limit(120),
    );

    const unsubscribe = onSnapshot(
      wishesQuery,
      (snapshot) => {
        setWishes(
          snapshot.docs
            .map((wishDocument) => {
              const data = wishDocument.data();
              return {
                id: wishDocument.id,
                text: typeof data.text === "string" ? data.text : "",
              };
            })
            .filter((wishDocument) => wishDocument.text),
        );
      },
      (error) => {
        console.warn("No se pudieron cargar los deseos del cielo.", error);
      },
    );

    return unsubscribe;
  }, [remoteUser]);

  useEffect(() => {
    if (
      !remoteUser ||
      !hasFirebaseConfig ||
      !PROGRESS_PERSISTENCE_ENABLED ||
      !pendingWishRef.current
    ) {
      return undefined;
    }

    const pendingWish = pendingWishRef.current;
    pendingWishRef.current = null;
    const { db } = getFirebaseServices();

    addDoc(collection(db, "wishes"), {
      text: pendingWish.slice(0, 280),
      userId: remoteUser.uid,
      createdAt: serverTimestamp(),
    }).catch((error) => {
      pendingWishRef.current = pendingWish;
      console.warn("No se pudo sincronizar el deseo pendiente.", error);
    });

    return undefined;
  }, [remoteUser]);

  const saveWish = useCallback((value) => {
    const nextWish = value.trim();
    setWish(nextWish);
    saveLocal({
      clues: cluesRef.current,
      artifacts: artifactsRef.current,
      fragments: fragmentsRef.current,
      wish: nextWish,
    });

    if (nextWish) {
      setWishes((currentWishes) => [
        ...currentWishes,
        {
          id: `pending-${Date.now()}`,
          text: nextWish.slice(0, 280),
        },
      ]);
    }

    if (remoteUser && hasFirebaseConfig && PROGRESS_PERSISTENCE_ENABLED && nextWish) {
      const { db } = getFirebaseServices();
      addDoc(collection(db, "wishes"), {
        text: nextWish.slice(0, 280),
        userId: remoteUser.uid,
        createdAt: serverTimestamp(),
      }).catch((error) => {
        console.warn("No se pudo guardar el deseo en el cielo.", error);
      });
    } else if (hasFirebaseConfig && PROGRESS_PERSISTENCE_ENABLED && nextWish) {
      pendingWishRef.current = nextWish;
    }
  }, [remoteUser]);

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
    wishes,
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
