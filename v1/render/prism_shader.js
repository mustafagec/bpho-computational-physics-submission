import { initRenderer, loadShaderFromURL } from './common.js';


let viewport_scale = 6.0;
let alpha_rad = 45.0 * Math.PI/180.0;
let theta_i_rad = 5.0 * Math.PI/180.0;


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
  const uAlpha = gl.getUniformLocation(program, 'u_prism_alpha');
  const uThetaI = gl.getUniformLocation(program, 'u_theta_i');

  const viewportScaleLabel = document.getElementById('viewport-scale-value');
  const viewportScaleSlider = document.getElementById('viewport-scale');

  const alphaLabel = document.getElementById('prism-alpha-value');
  const alphaSlider = document.getElementById('prism-alpha-slider');

  const thetaILabel = document.getElementById('theta-i-value');
  const thetaISlider = document.getElementById('theta-i-slider');

  addListener(viewportScaleSlider, 'input', () => {
    viewport_scale = parseFloat(viewportScaleSlider.value);
    viewportScaleLabel.textContent = viewport_scale.toFixed(1);
    triggerDraw();
  });

  addListener(alphaSlider, 'input', () => {
    alpha_rad = parseFloat(alphaSlider.value) * Math.PI/180.0;
    alphaLabel.textContent = (alpha_rad * 180.0/Math.PI).toFixed(1);
    triggerDraw();
  });

  addListener(thetaISlider, 'input', () => {
    theta_i_rad = parseFloat(thetaISlider.value) * Math.PI/180.0;
    thetaILabel.textContent = (theta_i_rad * 180.0/Math.PI).toFixed(1);
    triggerDraw();
  });



  function triggerDraw() {
    gl.useProgram(program);

    //pass uniforms to the shader
    gl.uniform1f(uViewportScale, viewport_scale);// viewport_scale);
    gl.uniform1f(uAlpha, alpha_rad);
    gl.uniform1f(uThetaI, theta_i_rad);

    gl.clear(gl.COLOR_BUFFER_BIT);

    //render a new canvas
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
  triggerDraw()
}