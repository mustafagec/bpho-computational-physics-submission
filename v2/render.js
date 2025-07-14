
import { task_dynamic_vars, task_uniforms } from './variables.js';

import { recompute_bands } from './computations/rainbow.js';
import { setupRaymarchControls, startRaymarchingRenderLoop } from './computations/raymarch.js';
import { addListener, clearListeners, initRenderer, loadShaderFromURL } from './init.js';



let activeListeners = [];

let raymarchActive = false;



export async function loadShader(gl, shader, sub_task) {
  const vs = await loadShaderFromURL(`shaders/base.vert`);
  const fs = await loadShaderFromURL(`shaders/${shader}.frag`);
  const program = await initRenderer(gl, vs, fs);

  shader = (shader === "distortion") ? sub_task : shader;

  clearListeners(activeListeners);

    
  if (shader === 'rainbow') recompute_bands(gl);

  const position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  if (shader === "raymarch") { //raymarch uses an uniterrupted render loop
    setupRaymarchControls(gl, program);
    startRaymarchingRenderLoop(gl, program, raymarchActive);
  } else {
    setupControls(gl, program, shader);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}


async function setupControls(gl, program, shader) {
  let uniform_vars = task_uniforms[shader];
  let dynamic_vars = task_dynamic_vars[shader];//test for empty vars

  let uniform_locations = [];
  let dynamic_locations = [];

  for (let key in uniform_vars) {
    const location = gl.getUniformLocation(program, `u_${key}`);
    uniform_locations.push(location);
  }

  for (let key in dynamic_vars) {
    const location = gl.getUniformLocation(program, `u_${key}`);
    dynamic_locations.push(location);

    const slider = document.getElementById(`${key}_slider`);
    const label = document.getElementById(`${key}_value`);

    //console.log(key);
    addListener(slider, 'input', () => {
      dynamic_vars[key] = parseFloat(slider.value);
      label.textContent = dynamic_vars[key].toFixed(1);
      if (shader === 'rainbow') {
        if (key === 'alpha' || key === 'height') c_point = [0, -rainbow_distance * Math.sin(alpha_deg * pi/180.0) + observer_height];
        recompute_bands(gl);
      }
      triggerDraw();
    }, activeListeners);
  }


  function triggerDraw() {
    gl.useProgram(program);
    
    Object.keys(uniform_vars).forEach((key, index) => {
      const variable = uniform_vars[key];
      const location = uniform_locations[index];

      if (Number.isInteger(variable)) {
        gl.uniform1i(location, variable);
      } else {
        gl.uniform1f(location, variable);
      }
    });

    Object.keys(dynamic_vars).forEach((key, index) => {
      const variable = dynamic_vars[key];
      const location = dynamic_locations[index];

      if (Number.isInteger(variable)) {
        gl.uniform1i(location, variable);
      } else {
        gl.uniform1f(location, variable);
      }
    });

    gl.clear(gl.COLOR_BUFFER_BIT);

    /* draw */
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

  triggerDraw();
}



window.__stopRaymarching = () => {
  raymarchActive = false;
};