import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

// Renderer & scene setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Fullscreen quad
const geometry = new THREE.PlaneGeometry(2, 2);

// === Mode 1: GPU Shader ===
const gpuMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  },
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uResolution;
    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      float color = 0.5 + 0.5 * sin(uTime + uv.x * 40.0);
      gl_FragColor = vec4(vec3(color), 1.0);
    }
  `,
  vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
});

// === Mode 2: CPU Pixels ===
const width = 256, height = 256;
const size = width * height;
const pixelData = new Uint8Array(4 * size);

// Generate a checkerboard pattern
function updatePixelData() {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const isRed = ((x ^ y) & 16) === 0;
      pixelData[i]     = isRed ? 255 : 0;   // R
      pixelData[i + 1] = isRed ? 0   : 255; // G
      pixelData[i + 2] = 0;                // B
      pixelData[i + 3] = 255;              // A
    }
  }
}
updatePixelData();

const cpuTexture = new THREE.DataTexture(pixelData, width, height, THREE.RGBAFormat);
cpuTexture.needsUpdate = true;

const cpuMaterial = new THREE.MeshBasicMaterial({ map: cpuTexture });

// === Mesh setup ===
const quad = new THREE.Mesh(geometry, gpuMaterial);
scene.add(quad);

// === UI Buttons ===
document.getElementById('gpuBtn').onclick = () => {
  quad.material = gpuMaterial;
};

document.getElementById('cpuBtn').onclick = () => {
  updatePixelData();
  cpuTexture.needsUpdate = true;
  quad.material = cpuMaterial;
};

// === Animate ===
function animate(t) {
  requestAnimationFrame(animate);
  gpuMaterial.uniforms.uTime.value = t * 0.001;
  renderer.render(scene, camera);
}
animate();
