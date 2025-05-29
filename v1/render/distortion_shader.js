import { initRenderer, loadShaderFromURL } from './common.js';

const shaderPrograms = {
  task_5: null,
  task_6: null,
  task_7: null,
  task_8: null,
  task_9: null,
  task_10: null,
};

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

  const vs = await loadShaderFromURL('shaders/base.vert');
  const fsPath = `shaders/${task}.frag`;

  if (!shaderPrograms[task]) {
    const fs = await loadShaderFromURL(fsPath);
    shaderPrograms[task] = await initRenderer(gl, vs, fs);
  }
  const program = shaderPrograms[task];
  gl.useProgram(program);

  setupLensControls(gl, program);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawQuad(gl, program);
}

async function setupLensControls(gl, program) {
  //const lensControls = document.getElementById('lens-controls');
  const task10Controls = document.getElementById('task10-controls');

  const isTask10 = program === shaderPrograms['task_10'];
  document.getElementById('focal-length').parentElement.style.display = isTask10 ? 'none' : 'block';
  document.getElementById('image-scale').parentElement.style.display = isTask10 ? 'none' : 'block';
  task10Controls.style.display = isTask10 ? 'block' : 'none';

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uFocal = gl.getUniformLocation(program, 'u_focal_length');
  const uPos = gl.getUniformLocation(program, 'u_image_position');
  const uImageSize = gl.getUniformLocation(program, 'u_image_size');
  const uViewportSize = gl.getUniformLocation(program, 'u_viewport_size');
  const uImage = gl.getUniformLocation(program, 'u_image');
  const uRf = gl.getUniformLocation(program, 'u_rf');
  const uArcDeg = gl.getUniformLocation(program, 'u_arc_deg');

  let focal = 1.0;
  let position = isTask10 ? [0.0, 0.0] : [focal + 0.5, -0.5];
  let rf = 1.0;
  let arcDeg = 160.0;
  let viewport_scale = 6.0;

  let image_scale = 1.0;
  let aspect;// = 1.0;
  let imgReady = false;

  const img = new Image();
  img.src = '../assets/waifu.jpg';
  img.onload = () => {
    aspect = img.width / img.height;

    if (isTask10) {
      const cornerDist = Math.SQRT2;
      const maxRadius = 1.0;
      image_scale = maxRadius / cornerDist;
    }

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

  // UI elements
  const focalSlider = document.getElementById('focal-length');
  const focalLabel = document.getElementById('focal-length-value');
  const imageScaleSlider = document.getElementById('image-scale');
  const imageScaleLabel = document.getElementById('image-scale-value');
  const viewportScaleLabel = document.getElementById('viewport-scale-value');
  const viewportScaleSlider = document.getElementById('viewport-scale');

  const rfSlider = document.getElementById('rf-slider');
  const rfLabel = document.getElementById('rf-value');
  const arcSlider = document.getElementById('arc-slider');
  const arcLabel = document.getElementById('arc-value');

  addListener(focalSlider, 'input', () => {
    focal = parseFloat(focalSlider.value);
    focalLabel.textContent = focal.toFixed(1);
    triggerDraw();
  });

  addListener(imageScaleSlider, 'input', () => {
    image_scale = parseFloat(imageScaleSlider.value);
    imageScaleLabel.textContent = image_scale.toFixed(1);
    triggerDraw();
  });

    addListener(viewportScaleSlider, 'input', () => {
    viewport_scale = parseFloat(viewportScaleSlider.value);
    viewportScaleLabel.textContent = viewport_scale.toFixed(1);
    triggerDraw();
  });

  addListener(rfSlider, 'input', () => {
    rf = parseFloat(rfSlider.value);
    rfLabel.textContent = rf.toFixed(1);
    triggerDraw();
  });

  addListener(arcSlider, 'input', () => {
    arcDeg = parseFloat(arcSlider.value);
    arcLabel.textContent = arcDeg;
    triggerDraw();
  });

  // Disable dragging and keys for task 10
  if (!isTask10) {
    let dragging = false;
    let last = [0, 0];
    const canvas = gl.canvas;

    addListener(canvas, 'mousedown', e => {
      dragging = true;
      last = [e.clientX, e.clientY];
    });
    addListener(window, 'mouseup', () => {
      dragging = false;
    });
    addListener(window, 'mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - last[0];
      const dy = e.clientY - last[1];
      last = [e.clientX, e.clientY];
      position[0] += (8 * dx) / canvas.width;
      position[1] -= (8 * dy) / canvas.height;
      triggerDraw();
    });

    addListener(window, 'keydown', e => {
      const step = 0.1;
      if (e.key === 'ArrowLeft') position[0] -= step;
      if (e.key === 'ArrowRight') position[0] += step;
      if (e.key === 'ArrowUp') position[1] += step;
      if (e.key === 'ArrowDown') position[1] -= step;
      triggerDraw();
    });
  }

  function triggerDraw() {
    if (!imgReady) return;
    gl.useProgram(program);

    const aspect = img.width / img.height;
    

    let height = 1.0;
    let width = aspect * height;
    let image_world_size = [width * image_scale, height * image_scale];

    if (isTask10) {
      const diag = 2.0;
      height = diag / Math.sqrt(aspect * aspect + 1);
      width = aspect * height;
      image_world_size = [width * image_scale, height * image_scale];

      gl.uniform1f(uRf, rf);
      gl.uniform1f(uArcDeg, arcDeg);
    }

    gl.uniform1f(uFocal, focal);
    gl.uniform2fv(uPos, position);
    gl.uniform2fv(uImageSize, image_world_size);
    gl.uniform1f(uViewportSize, viewport_scale);

    gl.uniform2f(uResolution, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);
    drawQuad(gl, program);
  }
}
