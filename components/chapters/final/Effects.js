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

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createEffects(world) {
  const effects = new THREE.Group();
  effects.name = "Effects";
  world.add(effects);

  const wishStars = new THREE.Group();
  wishStars.name = "WishStars";
  effects.add(wishStars);

  const wishStarTexture = createWishStarTexture();
  let currentSignature = "";

  function syncWishStars(wishes) {
    const signature = wishes.map((wish) => wish.id).join("|");
    if (signature === currentSignature) return;
    currentSignature = signature;

    wishStars.children.forEach((star) => star.material?.dispose());
    wishStars.clear();
    wishes.forEach((wish) => {
      const hash = hashString(wish.id);
      const x = ((hash % 1000) / 1000 - 0.5) * 8;
      const y = 4 + (((hash >>> 8) % 1000) / 1000) * 5.5;
      const z = 7 + (((hash >>> 18) % 1000) / 1000) * 5;
      const star = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: wishStarTexture,
          color: "#fff2b8",
          transparent: true,
          opacity: 0.86,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      star.name = `WishStar-${wish.id}`;
      star.position.set(x, y, z);
      star.userData.baseY = y;
      star.scale.set(0.55, 0.55, 1);
      star.userData.wish = wish;
      star.userData.phase = (hash % 1000) / 1000;
      wishStars.add(star);
    });
  }

  return {
    effects,
    particles: wishStars,
    wishStars,
    wishStarTexture,
    syncWishStars,
  };
}
