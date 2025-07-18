//import { initRenderer, loadShaderFromURL } from './render/common.js';
/*import { loadShader } from './render.js';

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


  const distortionTabs = document.getElementById('distortion-tabs');

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
      document.getElementById('universal-controls').style.display = 
  currentSim !== 'rainbow' && currentSim !== 'raymarch' ? 'block' : 'none';
      document.getElementById('raymarch-controls').style.display =
        currentSim === 'raymarch' ? 'block' : 'none';

      if (currentSim === 'distortion') {
        distortionTabs.classList.add('visible');
      } else {
        distortionTabs.classList.remove('visible');
      }

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

  // Stop raymarching loop when switching away
  if (lastSim === 'raymarch') {
    window.__stopRaymarching?.();  // call cleanup
  }

  await loadShader(gl, (currentSim === 'distortion') ? currentMap : currentSim);
  lastSim = currentSim;
  lastMap = currentMap;
}

//main();
document.addEventListener('DOMContentLoaded', main);*/

// main.js
import { loadShader } from './render.js';

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

  const distortionTabs = document.getElementById('distortion-tabs');

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
      document.getElementById('distortion-tabs').style.display =
        currentSim === 'distortion' ? 'block' : 'none';
      document.getElementById('universal-controls').style.display =
        currentSim !== 'rainbow' && currentSim !== 'raymarch' ? 'block' : 'none';
      document.getElementById('raymarch-controls').style.display =
        currentSim === 'raymarch' ? 'block' : 'none';

      if (currentSim === 'distortion') {
        distortionTabs.classList.add('visible');
      } else {
        distortionTabs.classList.remove('visible');
        hideAllTaskControls();
      }

      await updateRenderer();
      updateTaskControls();
    });
  });

  // Sub-tab switching for mapping functions
  document.querySelectorAll('.sub-tab-button').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.sub-tab-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMap = btn.dataset.map;

      await updateRenderer();
      updateTaskControls();
    });
  });

  document.querySelectorAll('input[type="range"]').forEach(slider => {
    // Look for span using label[for] if needed, or walk the DOM reliably
    const controlRow = slider.closest('.control-row');
    const valueSpan = controlRow?.querySelector('label span');

    if (valueSpan) {
      valueSpan.textContent = slider.value;
    }

    slider.addEventListener('input', () => {
      if (valueSpan) {
        valueSpan.textContent = slider.value;
      }
    });
  });
}

function updateTaskControls() {
  /*hideAllTaskControls();

  const task5 = document.getElementById('task5-controls');
  const task6_7 = document.getElementById('task6-7-controls');
  const task8 = document.getElementById('task8-controls');
  const task9 = document.getElementById('task9-controls');
  const task10 = document.getElementById('task10-controls');

  // Always show viewport scale (universal)
  document.getElementById('universal-controls').style.display = 'block';

  if (currentSim !== 'distortion') return;

  switch (currentMap) {
    case 'task_5':
      task5.style.display = 'block';
      break;
    case 'task_6_7':
      task6_7.style.display = 'block';
      break;
    case 'task_8':
      task8.style.display = 'block';
      break;
    case 'task_9':
      task9.style.display = 'block';
      break;
    case 'task_10':
      task10.style.display = 'block';
      break;
  }*/

    document
    .querySelectorAll('.task-controls')
    .forEach(el => el.classList.remove('visible'));

  const idMap = {
    task_5: 'task5-controls',
    task_6_7: 'task6-7-controls',
    task_8: 'task8-controls',
    task_9: 'task9-controls',
    task_10: 'task10-controls',
  };
  document
    .getElementById(idMap[currentMap])
    .classList.add('visible');
}


function showRows(selectors) {
  selectors.forEach(sel => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (el) el.closest('.control-row').style.display = 'flex';
  });
}

function hideAllTaskControls() {
  const allTaskGroups = document.querySelectorAll('#lens-controls .task-controls');
  allTaskGroups.forEach(group => {
    group.style.display = 'none';
  });
}

let lastSim = null;
let lastMap = null;

async function updateRenderer() {
  if (currentSim === lastSim && currentMap === lastMap) return;

  if (lastSim === 'raymarch') {
    window.__stopRaymarching?.();
  }

  await loadShader(gl, currentSim === 'distortion' ? currentMap : currentSim);

  lastSim = currentSim;
  lastMap = currentMap;
}

document.addEventListener('DOMContentLoaded', main);
