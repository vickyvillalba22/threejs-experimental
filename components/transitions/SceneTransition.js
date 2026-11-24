"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canCompleteSceneTransition,
  SCENE_TRANSITION_DEFAULTS,
  SCENE_TRANSITION_PHASES,
} from "./sceneTransitionContract";
import {
  getSceneTransitionPreset,
  getSlotTransitionProps,
} from "./sceneTransitionPresets";

function SceneTransitionEntry({
  children,
  sceneKey,
  preset,
  sequence,
  lockInteraction,
  waitForReady,
  animateInitial,
  onComplete,
  reducedMotion,
  className,
  ...props
}) {
  const isRenderProp = typeof children === "function";
  const [animationComplete, setAnimationComplete] = useState(!animateInitial);
  const [sceneReady, setSceneReady] = useState(!isRenderProp);
  const [readyMetadata, setReadyMetadata] = useState(undefined);
  const completedRef = useRef(false);

  const markReady = useCallback((metadata) => {
    setReadyMetadata((current) => current ?? metadata);
    setSceneReady(true);
  }, []);

  const getSlotProps = useCallback(
    (slot = "default", index = 0, overrides = {}) =>
      getSlotTransitionProps({
        preset,
        sequence,
        slot,
        index,
        reducedMotion,
        overrides,
      }),
    [preset, reducedMotion, sequence],
  );

  const phase =
    animationComplete &&
    (!waitForReady || sceneReady)
      ? SCENE_TRANSITION_PHASES.COMPLETE
      : animationComplete && waitForReady
        ? SCENE_TRANSITION_PHASES.WAITING_FOR_READY
        : SCENE_TRANSITION_PHASES.ENTERING;

  const renderContext = useMemo(
    () => ({
      getSlotProps,
      isInteractionLocked:
        lockInteraction && phase !== SCENE_TRANSITION_PHASES.COMPLETE,
      onReady: markReady,
      phase,
    }),
    [getSlotProps, lockInteraction, markReady, phase],
  );

  const renderedChildren = isRenderProp
    ? children(renderContext)
    : children;

  useEffect(() => {
    if (
      completedRef.current ||
      !canCompleteSceneTransition({
        animationComplete,
        sceneReady,
        waitForReady,
      })
    ) {
      return;
    }

    completedRef.current = true;
    onComplete?.(readyMetadata);
  }, [
    animationComplete,
    onComplete,
    readyMetadata,
    sceneReady,
    waitForReady,
  ]);

  const isInteractionLocked =
    lockInteraction && phase !== SCENE_TRANSITION_PHASES.COMPLETE;

  return (
    <motion.div
      {...props}
      className={className}
      initial={animateInitial ? preset.initial : false}
      animate={preset.animate}
      exit={preset.exit}
      transition={{
        duration: reducedMotion ? 0 : preset.duration,
        ease: preset.ease,
      }}
      onAnimationComplete={() => setAnimationComplete(true)}
      aria-busy={isInteractionLocked || undefined}
      data-scene-key={sceneKey}
      data-transition-phase={phase}
      style={{
        ...props.style,
        pointerEvents: isInteractionLocked
          ? "none"
          : props.style?.pointerEvents,
      }}
    >
      {renderedChildren}
    </motion.div>
  );
}

export default function SceneTransition({
  children,
  sceneKey,
  variant = SCENE_TRANSITION_DEFAULTS.variant,
  sequence = SCENE_TRANSITION_DEFAULTS.sequence,
  lockInteraction = SCENE_TRANSITION_DEFAULTS.lockInteraction,
  waitForReady = SCENE_TRANSITION_DEFAULTS.waitForReady,
  mode = "sync",
  animateInitial = true,
  onComplete,
  className,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const preset = getSceneTransitionPreset(variant);

  return (
    <AnimatePresence mode={mode}>
      <SceneTransitionEntry
        key={sceneKey}
        {...props}
        className={className}
        lockInteraction={lockInteraction}
        onComplete={onComplete}
        preset={preset}
        reducedMotion={shouldReduceMotion === true}
        sceneKey={sceneKey}
        sequence={sequence}
        waitForReady={waitForReady}
        animateInitial={animateInitial}
      >
        {children}
      </SceneTransitionEntry>
    </AnimatePresence>
  );
}
