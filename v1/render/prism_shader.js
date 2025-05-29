import { initRenderer, loadShaderFromURL } from './common.js';


let viewport_scale = 6.0;


let activeListeners = [];
function addListener(target, event, handler) {
  target.addEventListener(event, handler);
  activeListeners.push({ target, event, handler });
}




export async function loadPrismShader(gl) {
  const vs = await loadShaderFromURL('shaders/base.vert');
  const fs = await loadShaderFromURL('shaders/prism.frag');
  const program = await initRenderer(gl, vs, fs);

  setupPrismControls(gl, program);

  const position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}


async function setupPrismControls(gl, program) {

  const uViewportScale = gl.getUniformLocation(program, 'u_viewport_scale');

  const viewportScaleLabel = document.getElementById('viewport-scale-value');
  const viewportScaleSlider = document.getElementById('viewport-scale');

  addListener(viewportScaleSlider, 'input', () => {
    viewport_scale = parseFloat(viewportScaleSlider.value);
    viewportScaleLabel.textContent = viewport_scale.toFixed(1);
    triggerDraw();
  });

  function triggerDraw() {
    gl.useProgram(program);

    gl.uniform1f(uViewportScale, 6.0);// viewport_scale);

    gl.clear(gl.COLOR_BUFFER_BIT);

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
}