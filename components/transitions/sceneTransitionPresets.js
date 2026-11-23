import {
  SCENE_TRANSITION_SEQUENCES,
  SCENE_TRANSITION_VARIANTS,
} from "./sceneTransitionContract";

const DEFAULT_EASE = [0.16, 1, 0.3, 1];
const STAGGER_STEP = 0.1;

const DEFAULT_SLOT = {
  initial: {
    opacity: 0,
    y: 18,
    scale: 0.98,
    filter: "blur(10px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    filter: "blur(6px)",
  },
};

export const SCENE_TRANSITION_PRESETS = Object.freeze({
  [SCENE_TRANSITION_VARIANTS.FADE]: {
    duration: 0.7,
    ease: DEFAULT_EASE,
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    slot: DEFAULT_SLOT,
  },
  [SCENE_TRANSITION_VARIANTS.PORTAL]: {
    duration: 0.9,
    ease: DEFAULT_EASE,
    initial: {
      opacity: 0,
      scale: 0.96,
      filter: "blur(18px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      scale: 1.06,
      filter: "blur(18px)",
    },
    slot: {
      initial: {
        opacity: 0,
        y: 24,
        scale: 0.94,
        filter: "blur(12px)",
      },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      },
      exit: {
        opacity: 0,
        y: -16,
        scale: 1.02,
        filter: "blur(8px)",
      },
    },
  },
  [SCENE_TRANSITION_VARIANTS.ZOOM_THROUGH]: {
    duration: 0.85,
    ease: DEFAULT_EASE,
    initial: {
      opacity: 0,
      scale: 1.16,
      filter: "blur(12px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      scale: 0.82,
      filter: "blur(14px)",
    },
    slot: DEFAULT_SLOT,
  },
  [SCENE_TRANSITION_VARIANTS.FRAGMENT]: {
    duration: 0.8,
    ease: DEFAULT_EASE,
    initial: {
      opacity: 0,
      y: 14,
      filter: "blur(7px)",
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      y: -14,
      filter: "blur(7px)",
    },
    slot: DEFAULT_SLOT,
  },
  [SCENE_TRANSITION_VARIANTS.CURTAIN]: {
    duration: 0.75,
    ease: DEFAULT_EASE,
    initial: {
      opacity: 0,
      x: 32,
      filter: "blur(8px)",
    },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      x: -32,
      filter: "blur(8px)",
    },
    slot: DEFAULT_SLOT,
  },
  [SCENE_TRANSITION_VARIANTS.SHATTER]: {
    duration: 0.9,
    ease: [0.22, 1, 0.36, 1],
    initial: {
      opacity: 0,
      scale: 1.04,
      filter: "blur(14px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      scale: 0.94,
      filter: "blur(18px)",
    },
    slot: DEFAULT_SLOT,
  },
});

const CINEMATIC_DELAYS = {
  background: 0,
  atmosphere: 0.08,
  particles: 0.18,
  content: 0.32,
  objects: 0.5,
  controls: 0.72,
  instructions: 0.86,
};

export function getSceneTransitionPreset(variant) {
  return (
    SCENE_TRANSITION_PRESETS[variant] ||
    SCENE_TRANSITION_PRESETS[SCENE_TRANSITION_VARIANTS.FADE]
  );
}

export function resolveSequenceDelay(sequence, slot, index = 0) {
  if (sequence && typeof sequence === "object") {
    return typeof sequence[slot] === "number" ? sequence[slot] : 0;
  }

  if (sequence === SCENE_TRANSITION_SEQUENCES.STAGGER) {
    return index * STAGGER_STEP;
  }

  if (sequence === SCENE_TRANSITION_SEQUENCES.CINEMATIC) {
    return CINEMATIC_DELAYS[slot] ?? index * STAGGER_STEP;
  }

  return 0;
}

export function getSlotTransitionProps({
  preset,
  sequence,
  slot = "default",
  index = 0,
  reducedMotion = false,
  overrides = {},
}) {
  const slotPreset = preset.slot || DEFAULT_SLOT;
  const delay = resolveSequenceDelay(sequence, slot, index);
  const duration = reducedMotion ? 0 : preset.duration;

  return {
    initial: overrides.initial || slotPreset.initial,
    animate: overrides.animate || slotPreset.animate,
    exit: overrides.exit || slotPreset.exit,
    transition: {
      duration,
      delay: reducedMotion ? 0 : delay,
      ease: preset.ease,
      ...overrides.transition,
    },
  };
}
