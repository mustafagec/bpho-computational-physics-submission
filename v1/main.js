//import { initRenderer, loadShaderFromURL } from './render/common.js';
import { loadDistortionShader } from './render/distortion_shader.js';
import { loadPrismShader } from './render/prism_shader.js';

let currentSim = 'distortion';
let currentMap = 'lens_distortion';
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

      document.getElementById('distortion-tabs').style.display =
        currentSim === 'distortion' ? 'block' : 'none';

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

async function updateRenderer() {
  if (currentSim === 'distortion') {
    await loadDistortionShader(gl, currentMap);
  } else if (currentSim === 'prism') {
    await loadPrismShader(gl);
  }
}

main();