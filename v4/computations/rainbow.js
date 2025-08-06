import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function f_THz_to_rgb(frequency) {
  const colorMap = [
    { f: 405, rgb: [0.5, 0.0, 0.0] },
    { f: 480, rgb: [1.0, 0.0, 0.0] },
    { f: 510, rgb: [1.0, 127.0 / 255.0, 0.0] },
    { f: 530, rgb: [1.0, 1.0, 0.0] },
    { f: 600, rgb: [0.0, 1.0, 0.0] },
    { f: 620, rgb: [0.0, 1.0, 1.0] },
    { f: 680, rgb: [0.0, 0.0, 1.0] },
    { f: 790, rgb: [127.0 / 255.0, 0.0, 1.0] },
  ];

  if (frequency < 405 || frequency > 790) return [0, 0, 0];

  for (let i = 0; i < colorMap.length - 1; i++) {
    const f1 = colorMap[i].f;
    const f2 = colorMap[i + 1].f;
    const rgb1 = colorMap[i].rgb;
    const rgb2 = colorMap[i + 1].rgb;

    if (frequency >= f1 && frequency <= f2) {
      const t = (frequency - f1) / (f2 - f1);
      const r = rgb1[0] * (1 - t) + rgb2[0] * t;
      const g = rgb1[1] * (1 - t) + rgb2[1] * t;
      const b = rgb1[2] * (1 - t) + rgb2[2] * t;
      return [r, g, b];
    }
  }

  return [0, 0, 0];
}

export function recomputeBands({
  numBands = 50,
  alphaDeg = 5,
  rainbowDistance = 8.0,
  observerHeight = 0
} = {}) {
  const pi = Math.PI;
  const alphaRad = alphaDeg * pi / 180;

  const data = new Float32Array(numBands * 2 * 4); // vec4 for each sample

  for (let i = 0; i < numBands; i++) {
    const f_THz = 790.0 - (i / numBands) * 385.0;
    const f_PHz = f_THz / 1000.0;

    const [rCol, gCol, bCol] = f_THz_to_rgb(f_THz);
    const n = Math.sqrt(1 + 1 / Math.sqrt(1.731 - 0.261 * Math.pow(f_PHz, 2)));

    // Primary
    const theta_p = Math.asin(Math.sqrt((4 - n * n) / 3));
    const e_p = 4 * Math.asin(Math.sqrt((4 - n * n) / 3) / n) - 2 * theta_p;
    const d_p = rainbowDistance * Math.sin(e_p) * Math.cos(alphaRad);

    data[i * 8 + 0] = d_p;
    data[i * 8 + 1] = rCol;
    data[i * 8 + 2] = gCol;
    data[i * 8 + 3] = bCol;

    // Secondary
    const theta_s = Math.asin(Math.sqrt((9 - n * n) / 8));
    const e_s = pi - 6 * Math.asin(Math.sqrt((9 - n * n) / 8) / n) + 2 * theta_s;
    const d_s = rainbowDistance * Math.sin(e_s) * Math.cos(alphaRad);

    data[i * 8 + 4] = d_s;
    data[i * 8 + 5] = rCol;
    data[i * 8 + 6] = gCol;
    data[i * 8 + 7] = bCol;
  }

  const texture = new THREE.DataTexture(
    data,
    numBands * 2, // width
    1,            // height
    THREE.RGBAFormat,
    THREE.FloatType
  );

  texture.needsUpdate = true;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const cPoint = new THREE.Vector2(0, -rainbowDistance * Math.sin(alphaRad) + observerHeight);

  return {
    texture,         // pass this as u_bands
    cPoint,          // pass as u_c_point
    spread: 0.005,   // or make dynamic
    numBands
  };
}
