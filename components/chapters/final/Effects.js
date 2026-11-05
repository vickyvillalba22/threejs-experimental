import * as THREE from "three";

function createWishStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 255, 245, 1)");
  gradient.addColorStop(0.18, "rgba(255, 244, 190, 0.95)");
  gradient.addColorStop(0.45, "rgba(255, 224, 130, 0.42)");
  gradient.addColorStop(1, "rgba(255, 224, 130, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

function createArrivalPulseTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.beginPath();
  context.arc(64, 64, 39, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 235, 165, 0.95)";
  context.lineWidth = 5;
  context.shadowColor = "rgba(255, 224, 130, 0.9)";
  context.shadowBlur = 10;
  context.stroke();

  return new THREE.CanvasTexture(canvas);
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const WISH_REVEAL_GAP = 0.52;
const WISH_REVEAL_DURATION = 0.9;
const ARRIVAL_PULSE_DURATION = 0.85;

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function createWishStar(wish, index, isRevealing, wishStarTexture) {
  const hash = hashString(wish.id);
  const x = ((hash % 1000) / 1000 - 0.5) * 8;
  const y = 4 + (((hash >>> 8) % 1000) / 1000) * 5.5;
  const z = 7 + (((hash >>> 18) % 1000) / 1000) * 5;
  const star = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: wishStarTexture,
      color: "#fff2b8",
      transparent: true,
      opacity: isRevealing ? 0 : 0.86,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  star.name = `WishStar-${wish.id}`;
  star.position.set(x, y, z);
  star.userData.baseY = y;
  star.scale.set(isRevealing ? 0.08 : 0.55, isRevealing ? 0.08 : 0.55, 1);
  star.userData.wish = wish;
  star.userData.phase = (hash % 1000) / 1000;
  star.userData.revealIndex = index;
  star.userData.revealOpacity = isRevealing ? 0 : 1;
  star.userData.revealProgress = isRevealing ? 0 : 1;
  star.userData.revealFlash = 0;
  return star;
}

export function createEffects(world) {
  const effects = new THREE.Group();
  effects.name = "Effects";
  world.add(effects);

  const wishStars = new THREE.Group();
  wishStars.name = "WishStars";
  effects.add(wishStars);

  const wishStarTexture = createWishStarTexture();
  const arrivalPulseTexture = createArrivalPulseTexture();
  let currentSignature = "";
  let revealStartedAt = null;
  let revealingStars = [];
  const arrivalPulses = new THREE.Group();
  arrivalPulses.name = "WishArrivalPulses";
  effects.add(arrivalPulses);

  function syncWishStars(wishes) {
    const signature = wishes.map((wish) => wish.id).join("|");
    if (signature === currentSignature) return false;
    currentSignature = signature;
    const existingStars = new Map(
      wishStars.children.map((star) => [star.userData.wish?.id, star]),
    );
    const nextStars = [];
    revealingStars = [];
    arrivalPulses.children.forEach((pulse) => pulse.material?.dispose());
    arrivalPulses.clear();

    wishes.forEach((wish) => {
      const existingStar = existingStars.get(wish.id);
      if (existingStar) {
        existingStar.userData.wish = wish;
        existingStar.userData.revealOpacity = 1;
        existingStar.userData.revealProgress = 1;
        existingStar.userData.revealFlash = 0;
        existingStar.userData.arrivalPulse = null;
        nextStars.push(existingStar);
        existingStars.delete(wish.id);
        return;
      }

      const star = createWishStar(
        wish,
        revealingStars.length,
        true,
        wishStarTexture,
      );
      const arrivalPulse = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: arrivalPulseTexture,
          color: "#fff0a8",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      arrivalPulse.position.copy(star.position);
      arrivalPulse.scale.set(0.18, 0.18, 1);
      arrivalPulse.visible = false;
      star.userData.arrivalPulse = arrivalPulse;
      arrivalPulses.add(arrivalPulse);
      revealingStars.push(star);
      nextStars.push(star);
    });

    existingStars.forEach((star) => star.material?.dispose());
    wishStars.clear();
    nextStars.forEach((star) => wishStars.add(star));
    revealStartedAt = revealingStars.length > 0 ? null : revealStartedAt;

    return true;
  }

  function updateWishStars(elapsed) {
    if (revealingStars.length === 0) return true;
    if (revealStartedAt === null) revealStartedAt = elapsed;

    let isComplete = true;
    revealingStars.forEach((star) => {
      const revealDelay = star.userData.revealIndex * WISH_REVEAL_GAP;
      const progress = Math.min(
        Math.max((elapsed - revealStartedAt - revealDelay) / WISH_REVEAL_DURATION, 0),
        1,
      );
      const easedProgress = easeOutCubic(progress);
      const arrivalPulse = Math.sin(progress * Math.PI);
      const scale = 0.08 + easedProgress * 0.47 + arrivalPulse * 0.12;

      star.userData.revealOpacity = easedProgress;
      star.userData.revealProgress = progress;
      star.userData.revealFlash = arrivalPulse;
      star.scale.set(scale, scale, 1);

      const pulse = star.userData.arrivalPulse;
      const pulseStart = revealStartedAt
        + revealDelay
        + WISH_REVEAL_DURATION;
      const pulseProgress = Math.min(
        Math.max((elapsed - pulseStart) / ARRIVAL_PULSE_DURATION, 0),
        1,
      );
      if (pulse) {
        pulse.visible = pulseProgress > 0 && pulseProgress < 1;
        pulse.material.opacity = (1 - pulseProgress) * 0.75;
        const pulseScale = 0.18 + pulseProgress * 1.15;
        pulse.scale.set(pulseScale, pulseScale, 1);
      }

      if (progress < 1 || pulseProgress < 1) isComplete = false;
    });

    return isComplete;
  }

  return {
    effects,
    particles: wishStars,
    wishStars,
    wishStarTexture,
    syncWishStars,
    updateWishStars,
    arrivalPulseTexture,
  };
}
