//import { initRenderer, loadShaderFromURL } from './render/common.js';
import { loadDistortionShader } from './render/distortion_shader.js';
import { loadPrismShader } from './render/prism_shader.js';
import { loadRainbowShader } from './render/rainbow_shader.js';

let currentSim = 'prism';
let currentMap = 'task_5';
let gl = null;

async function main() {
  const canvas = document.getElementById('glcanvas');
  gl = canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL2 is not supported.');
    return;
  }

  await updateRenderer();

  // Global tab switching
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSim = btn.dataset.sim;

      document.getElementById('lens-controls').style.display =
        currentSim === 'distortion' ? 'block' : 'none';
      document.getElementById('rainbow-controls').style.display =
        currentSim === 'rainbow' ? 'block' : 'none';
      document.getElementById('prism-controls').style.display =
        currentSim === 'prism' ? 'block' : 'none';
      document.getElementById('distortion-tabs').style.display = currentSim === 'distortion' ? 'block' : 'none';
      document.getElementById('v-scale').style.display = currentSim !== 'rainbow' ? 'block' : 'none';

      await updateRenderer();
    });
  });

  // Sub-tab switching for mapping functions
  document.querySelectorAll('.sub-tab-button').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.sub-tab-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMap = btn.dataset.map;
      await updateRenderer();
    });
  });
}

let lastSim = null;
let lastMap = null;

async function updateRenderer() {
  if (currentSim === lastSim && currentMap === lastMap) return;

  if (currentSim === 'distortion') {
    await loadDistortionShader(gl, currentMap);

  } else if (currentSim === 'prism') {
    await loadPrismShader(gl);
    
  } else if (currentSim === 'rainbow') {
    await loadRainbowShader(gl);
  }

  lastSim = currentSim;
  lastMap = currentMap;
}

//main();
document.addEventListener('DOMContentLoaded', main);