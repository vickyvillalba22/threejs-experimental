import * as THREE from "three";

function createMoonGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 252, 238, 0.25)");
  gradient.addColorStop(0.28, "rgba(242, 238, 220, 0.1)");
  gradient.addColorStop(1, "rgba(242, 238, 220, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSky(world) {
  const sky = new THREE.Group();
  sky.name = "Sky";
  world.add(sky);

  const dawnGradient = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 30),
    new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color("#0d0d14") },
        uHorizonColor: { value: new THREE.Color("#4b464e") },
        uDawnColor: { value: new THREE.Color("#876d6d") },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uDawnColor;
        varying vec2 vUv;

        void main() {
          float horizon = smoothstep(0.0, 0.5, vUv.y);
          float dawn = smoothstep(0.0, 0.38, vUv.y) * (1.0 - smoothstep(0.2, 0.68, vUv.y));
          vec3 color = mix(uDawnColor, uHorizonColor, horizon);
          color = mix(color, uTopColor, smoothstep(0.45, 1.0, vUv.y));
          color += uDawnColor * dawn * 0.08;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );
  dawnGradient.position.set(0, 8, 28);
  dawnGradient.name = "DawnGradient";
  dawnGradient.renderOrder = -10;
  sky.add(dawnGradient);

  const starCount = 320;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const brightness = new Float32Array(starCount);
  const clusterCenters = [
    [-16, 5, 15],
    [-12, 9, 18],
    [-8, 14, 23],
    [-4, 7, 16],
    [0, 11, 21],
    [4, 6, 17],
    [8, 13, 24],
    [13, 8, 19],
    [17, 14, 22],
    [-15, 17, 25],
    [-5, 18, 27],
    [6, 18, 26],
    [15, 19, 28],
    [-19, 11, 22],
  ];

  for (let index = 0; index < starCount; index += 1) {
    const cluster = clusterCenters[index % clusterCenters.length];
    const spread = 0.45 + Math.random() * 1.8;
    positions[index * 3] = cluster[0] + (Math.random() - 0.5) * spread;
    positions[index * 3 + 1] = cluster[1] + (Math.random() - 0.5) * spread;
    positions[index * 3 + 2] = cluster[2] + (Math.random() - 0.5) * spread;
    sizes[index] = 0.06 + Math.random() * 0.1;
    brightness[index] = 0.55 + Math.random() * 0.45;
  }

  const stars = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color("#e6e8ff") },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aBrightness;
        varying float vBrightness;

        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = aSize * (360.0 / max(1.0, -viewPosition.z));
          vBrightness = aBrightness;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vBrightness;

        void main() {
          float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
          float circle = 1.0 - smoothstep(0.22, 0.5, distanceFromCenter);
          float core = 1.0 - smoothstep(0.0, 0.18, distanceFromCenter);
          gl_FragColor = vec4(uColor * (vBrightness + core * 0.35), circle * vBrightness);
        }
      `,
    }),
  );
  stars.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  stars.geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  stars.geometry.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
  stars.name = "Stars";
  sky.add(stars);

  const moon = new THREE.Group();
  moon.name = "Moon";
  moon.position.set(5.5, 8.5, 10);
  sky.add(moon);

  const moonDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.86, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color("#f4f2e9") },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec2 vUv;

        float hash(vec2 point) {
          return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 point) {
          vec2 cell = floor(point);
          vec2 local = fract(point);
          local = local * local * (3.0 - 2.0 * local);
          float bottom = mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x);
          float top = mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x);
          return mix(bottom, top, local.y);
        }

        void main() {
          vec2 centeredUv = vUv - 0.5;
          float softNoise = noise(centeredUv * 9.0) * 0.55 + noise(centeredUv * 22.0) * 0.45;
          float shade = 0.93 + softNoise * 0.07;
          float edge = 1.0 - smoothstep(0.46, 0.5, length(centeredUv));
          gl_FragColor = vec4(uColor * shade, edge);
        }
      `,
    }),
  );
  moonDisc.name = "MoonDisc";
  moon.add(moonDisc);

  const moonGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createMoonGlowTexture(),
      color: "#fffbed",
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  moonGlow.name = "MoonGlow";
  moonGlow.scale.set(4.2, 4.2, 1);
  moon.add(moonGlow);

  return sky;
}
