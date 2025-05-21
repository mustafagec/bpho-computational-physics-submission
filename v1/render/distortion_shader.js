import { initRenderer, loadShaderFromURL } from './common.js';

//cache for compiled shader programs
const shaderPrograms = {
  task_5: null,
  task_6: null,
  task_7: null,
  task_8: null,
  task_9: null,
  task_10: null,
};

//track active event listeners for cleanup
let activeListeners = [];
function addListener(target, event, handler) {
  target.addEventListener(event, handler);
  activeListeners.push({ target, event, handler });
}
function clearListeners() {
  for (const { target, event, handler } of activeListeners) {
    target.removeEventListener(event, handler);
  }
  activeListeners = [];
}

function drawQuad(gl, program) {
  const posLoc = gl.getAttribLocation(program, 'a_position');
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export async function loadDistortionShader(gl, task) {
  clearListeners();

  //load/compile base vertex shader
  const vs = await loadShaderFromURL('shaders/base.vert');
  const fsPath = `shaders/${task}.frag`;

  if (!shaderPrograms[task]) {
    const fs = await loadShaderFromURL(fsPath);
    shaderPrograms[task] = await initRenderer(gl, vs, fs);
  }
  const program = shaderPrograms[task];
  gl.useProgram(program);

  setupLensControls(gl, program);

  //final draw call
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawQuad(gl, program);
}

async function setupLensControls(gl, program) {
  //uniform locations
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uFocal = gl.getUniformLocation(program, 'u_focal_length');
  const uPos = gl.getUniformLocation(program, 'u_image_position');
  const uSize = gl.getUniformLocation(program, 'u_image_size');
  const uImage = gl.getUniformLocation(program, 'u_image');

  //initial variables
  let focal = 1.0;
  const position = [focal + 0.5, -0.5];

  let scale = 1.0;
  let aspect = 1.0;
  let imgReady = false;

  /* image initialisation */
  const img = new Image();
  img.src = '../assets/waifu.jpg';
  img.onload = () => {
    aspect = img.width / img.height;
    imgReady = true;
    initTexture();
    triggerDraw();
  };

  function initTexture() {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(uImage, 0);
    gl.uniform2f(uResolution, gl.canvas.width, gl.canvas.height);
  }

  //user input handling --------------------------------------------------------------------

  //UI elements
  const focalSlider = document.getElementById('focal-length');
  const focalLabel = document.getElementById('focal-length-value');
  const scaleSlider = document.getElementById('image-scale');
  const scaleLabel = document.getElementById('image-scale-value');

  addListener(focalSlider, 'input', () => {
    focal = parseFloat(focalSlider.value);
    focalLabel.textContent = focal.toFixed(1);
    triggerDraw();
  });

  addListener(scaleSlider, 'input', () => {
    scale = parseFloat(scaleSlider.value);
    scaleLabel.textContent = scale.toFixed(1);
    triggerDraw();
  });

  /* mouse dragging */
  let dragging = false;
  let last = [0, 0];
  const canvas = gl.canvas;
  addListener(canvas, 'mousedown', e => { dragging = true; last = [e.clientX, e.clientY]; });
  addListener(window, 'mouseup', () => { dragging = false; });
  addListener(window, 'mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - last[0];
    const dy = e.clientY - last[1];
    last = [e.clientX, e.clientY];
    position[0] += (8 * dx) / canvas.width;
    position[1] -= (8 * dy) / canvas.height;
    triggerDraw();
  });

  /* arrow keys */
  addListener(window, 'keydown', e => {
    const step = 0.1;
    if (e.key === 'ArrowLeft') position[0] -= step;
    if (e.key === 'ArrowRight') position[0] += step;
    if (e.key === 'ArrowUp') position[1] += step;
    if (e.key === 'ArrowDown') position[1] -= step;
    triggerDraw();
  });

  /* drawing */
  function triggerDraw() {
    if (!imgReady) return;
    gl.useProgram(program);
    const size = [scale * aspect, scale];
    gl.uniform1f(uFocal, focal);
    gl.uniform2fv(uPos, position);
    gl.uniform2fv(uSize, size);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawQuad(gl, program);
  }
}
