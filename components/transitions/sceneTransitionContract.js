/**
 * Contract shared by every transition between experience scenes.
 *
 * The visual implementation belongs to SceneTransition. This module only
 * defines the public vocabulary and the lifecycle rules that implementation
 * must follow.
 */

export const SCENE_TRANSITION_PHASES = Object.freeze({
  IDLE: "idle",
  EXITING: "exiting",
  ENTERING: "entering",
  WAITING_FOR_READY: "waiting-for-ready",
  COMPLETE: "complete",
});

export const SCENE_TRANSITION_VARIANTS = Object.freeze({
  FADE: "fade",
  PORTAL: "portal",
  ZOOM_THROUGH: "zoom-through",
  FRAGMENT: "fragment",
  CURTAIN: "curtain",
  SHATTER: "shatter",
});

export const SCENE_TRANSITION_SEQUENCES = Object.freeze({
  SIMULTANEOUS: "simultaneous",
  STAGGER: "stagger",
  CINEMATIC: "cinematic",
});

export const SCENE_TRANSITION_DEFAULTS = Object.freeze({
  variant: SCENE_TRANSITION_VARIANTS.FADE,
  sequence: SCENE_TRANSITION_SEQUENCES.SIMULTANEOUS,
  lockInteraction: true,
  waitForReady: true,
});

/**
 * @typedef {string | Record<string, number>} SceneTransitionSequence
 *
 * A named sequence uses a preset. An object can provide custom delays per
 * semantic scene slot, for example:
 *
 * {
 *   background: 0,
 *   particles: 0.15,
 *   doors: 0.35,
 *   instructions: 0.7,
 * }
 */

/**
 * Context supplied to the incoming scene by SceneTransition.
 *
 * The render implementation will expose this context through a render prop
 * or an equivalent scene-transition hook.
 *
 * @typedef {Object} SceneTransitionRenderContext
 * @property {(metadata?: Record<string, unknown>) => void} onReady
 *   Marks the incoming scene as mounted and ready. It is idempotent.
 * @property {(slot?: string, index?: number, overrides?: Object) => Object} getSlotProps
 *   Returns Motion props for a semantic scene slot, including its sequence
 *   delay and the selected variant.
 * @property {boolean} isInteractionLocked
 *   True while the transition is exiting, entering, or waiting for readiness.
 * @property {string} phase
 *   One of SCENE_TRANSITION_PHASES.
 */

/**
 * Public props for SceneTransition.
 *
 * @typedef {Object} SceneTransitionProps
 * @property {string} sceneKey
 *   Stable identity of the incoming scene. It must change whenever the
 *   transition should be restarted.
 * @property {string} [variant]
 *   Visual preset from SCENE_TRANSITION_VARIANTS. New presets can be added
 *   without changing this contract.
 * @property {SceneTransitionSequence} [sequence]
 *   Named orchestration preset or semantic-slot delay map.
 * @property {boolean} [lockInteraction]
 *   Prevents interaction until the transition is complete. Defaults to true.
 * @property {boolean} [waitForReady]
 *   Requires both the entrance animation and onReady before completion.
 *   Defaults to true.
 * @property {(metadata?: Record<string, unknown>) => void} [onComplete]
 *   Called once after all completion conditions are satisfied.
 * @property {React.ReactNode | ((context: SceneTransitionRenderContext) => React.ReactNode)} children
 *   Incoming scene. A render function is required when waitForReady is true
 *   and readiness must be reported by the scene; static children are treated
 *   as ready when mounted.
 */

/**
 * The transition can complete only when:
 *
 * 1. the entrance animation has completed;
 * 2. the incoming scene has called onReady, unless waitForReady is false;
 * 3. onComplete has not already been called for the current sceneKey.
 *
 * prefers-reduced-motion may reduce the animation duration to zero, but it
 * does not bypass the readiness contract. The scene still has to mount and
 * report that it is ready.
 *
 * Interaction is locked during EXITING, ENTERING, and WAITING_FOR_READY when
 * lockInteraction is true. It is enabled again in COMPLETE.
 */

export function canCompleteSceneTransition({
  animationComplete,
  sceneReady,
  waitForReady = SCENE_TRANSITION_DEFAULTS.waitForReady,
}) {
  return Boolean(animationComplete && (!waitForReady || sceneReady));
}
