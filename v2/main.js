
import { loadShader } from '../render.js';



let currentSim = 'prism';
let currentMap = 'task_5';

let gl = null;


let tabs = ['distortion', 'rainbow', 'prism', 'raymarch'];




async function main() {

  //initialisation --------------------------------------------------------------

  const canvas = document.getElementById('glcanvas');
  
  gl = canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL2 is not supported.');
    return;
  }

  await updateRenderer();


  //tab switching ----------------------------------------------------------------

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSim = btn.dataset.sim;

      for (let tab of tabs) {
        document.getElementById(`${tab}-controls`).style.display = currentSim === tab ? 'block' : 'none';
      }

      document.getElementById('distortion-tabs').style.display = currentSim === 'distortion' ? 'block' : 'none';
      //document.getElementById('v-scale').style.display = currentSim !== 'rainbow' && currentSim !== 'raymarch' ? 'block' : 'none';

      await updateRenderer();
    });
  });


  //sub tab switching ------------------------------------------------------------

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

  if (lastSim === 'raymarch') {
    window.__stopRaymarching?.();//call cleanup
  }

  loadShader(gl, currentSim, currentMap);

  lastSim = currentSim;
  lastMap = currentMap;
}


document.addEventListener('DOMContentLoaded', main);