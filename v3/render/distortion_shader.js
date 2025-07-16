

const shaderPrograms = Object.fromEntries(
  Array.from({ length: 6 }, (_, i) => [`task_${i + 5}`, null])
);

let focal = 1.0;
let rf = 1.0;
let arcDeg = 160.0;
let image_scale = 0.4;
let viewport_scale = parseFloat(document.getElementById('viewport-scale').value);
let imgReady = false;
let aspect;


export function drawQuad(gl, program) {
  const posLoc = gl.getAttribLocation(program, 'a_position');
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function getPositionByTask(task) {
  switch (task) {
    case 'task_8':
    case 'task_9':
      return [0.75, 0.0];
    case 'task_10':
      return [0.0, 0.0];
    default:
      return [focal + 0.5, -0.5];
  }
}

export async function setupDistortionControls(gl, program, task, activeListeners) {
  function addListener(target, event, handler) {
    target.addEventListener(event, handler);
    activeListeners.push({ target, event, handler });
  }

  const isTask10 = task === 'task_10';

  // UI visibility setup
  const focalControl = document.getElementById('focal-length').parentElement;
  const imageScaleControl = document.getElementById('image-scale').parentElement;
  const task10Controls = document.getElementById('task10-controls');
  focalControl.style.display = isTask10 ? 'none' : 'block';
  imageScaleControl.style.display = isTask10 ? 'none' : 'block';
  task10Controls.style.display = isTask10 ? 'block' : 'none';

  const uniforms = {
    uResolution: gl.getUniformLocation(program, 'u_resolution'),
    uFocal: gl.getUniformLocation(program, 'u_focal_length'),
    uPos: gl.getUniformLocation(program, 'u_image_position'),
    uImageSize: gl.getUniformLocation(program, 'u_image_size'),
    uViewportSize: gl.getUniformLocation(program, 'u_viewport_size'),
    uImage: gl.getUniformLocation(program, 'u_image'),
    uRf: gl.getUniformLocation(program, 'u_rf'),
    uArcDeg: gl.getUniformLocation(program, 'u_arc_deg'),
  };

  const img = new Image();
  img.src = `./assets/waifu.jpg`;
  img.onload = () => {
    aspect = img.width / img.height;
    if (isTask10) {
      image_scale = 1.0 / Math.SQRT2;
    }
    imgReady = true;
    initTexture(gl, img, uniforms, program);
    triggerDraw();
  };

  const position = getPositionByTask(task);

  function triggerDraw() {
    if (!imgReady) return;
    gl.useProgram(program);

    const height = program === shaderPrograms['task_10']
      ? 2.0 / Math.sqrt(aspect * aspect + 1)
      : 1.0;
    const width = aspect * height;
    const imageSize = [width * image_scale, height * image_scale];

    gl.uniform1f(uniforms.uFocal, focal);
    gl.uniform2fv(uniforms.uPos, position);
    gl.uniform2fv(uniforms.uImageSize, imageSize);
    gl.uniform1f(uniforms.uViewportSize, viewport_scale);
    gl.uniform2f(uniforms.uResolution, gl.canvas.width, gl.canvas.height);

    if (isTask10) {
      gl.uniform1f(uniforms.uRf, rf);
      gl.uniform1f(uniforms.uArcDeg, arcDeg);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    drawQuad(gl, program);
  }

  function initTexture(gl, img, uniforms, program) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(uniforms.uImage, 0);
    gl.uniform2f(uniforms.uResolution, gl.canvas.width, gl.canvas.height);
  }

  // Slider hookup
  const sliders = [
    { id: 'focal-length', label: 'focal-length-value', value: v => focal = v },
    { id: 'image-scale', label: 'image-scale-value', value: v => image_scale = v },
    { id: 'viewport-scale', label: 'viewport-scale-value', value: v => viewport_scale = v },
    { id: 'rf-slider', label: 'rf-value', value: v => rf = v },
    { id: 'arc-slider', label: 'arc-value', value: v => arcDeg = v },
  ];

  for (const { id, label, value } of sliders) {
    const slider = document.getElementById(id);
    const display = document.getElementById(label);
    addListener(slider, 'input', () => {
      value(parseFloat(slider.value));
      display.textContent = slider.value;
      triggerDraw();
    });
  }

  // Presets
  if (['task_8', 'task_9'].includes(task)) {
    viewport_scale = 2.2;
    image_scale = 0.3;
  } else {
    viewport_scale = 6.0;
    image_scale = 0.3;
  }

  document.getElementById('viewport-scale').value = viewport_scale;
  document.getElementById('image-scale').value = image_scale;
  document.getElementById('viewport-scale-value').textContent = viewport_scale;
  document.getElementById('image-scale-value').textContent = image_scale;

  // Mouse & key interaction
  if (!isTask10) {
    let dragging = false;
    let last = [0, 0];
    const canvas = gl.canvas;

    addListener(canvas, 'mousedown', e => {
      dragging = true;
      last = [e.clientX, e.clientY];
    });
    addListener(window, 'mouseup', () => dragging = false);
    addListener(window, 'mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - last[0];
      const dy = e.clientY - last[1];
      last = [e.clientX, e.clientY];
      
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);

      position[0] += (dx / canvas.width) * (canvas.width / canvas.height) * viewport_scale;
      position[1] -= (dy / canvas.height) * viewport_scale;
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
}
