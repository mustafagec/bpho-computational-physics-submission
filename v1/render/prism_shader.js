import { initRenderer, loadShaderFromURL } from './common.js';
import { vec2, mat2 } from 'gl-matrix';


/* uniform variables */

let viewport_scale = 6.0;
let alpha_rad = 45.0 * Math.PI/180.0;
let theta_i_rad = 5.0 * Math.PI/180.0;

let beam_width = 0.2;
let beam_count = 50;
//let beam_points = [];

const prism_height = 4.0;
/*
function cw_rot(p, theta) { //clockwise vector rotation
  const rot_mat = mat2.fromValues(Math.cos(theta), Math.sin(theta), -Math.sin(theta), Math.cos(theta));
  return vec2.transformMat2(vec2.create(), p, rot_mat);
}


function raycast(ray_origin, ray_dir, line_a, line_b) {
  const r = vec2.clone(ray_origin);
  const d = vec2.clone(ray_dir);
  const a = vec2.clone(line_a);
  const b = vec2.clone(line_b);

  const v = vec2.create();
  vec2.sub(v, b, a);

  const denom = d[0] * v[1] - d[1] * v[0];

  if (Math.abs(denom) < 1e-10) {
    return null;
  }

  const diff = vec2.create();
  vec2.sub(diff, a, r);

  const t = (diff[0] * v[1] - diff[1] * v[0]) / denom;

  if (t <= 0) {
    return null;
  }


  const intersection = vec2.create();
  vec2.scaleAndAdd(intersection, r, d, t);

  
  const normal = vec2.fromValues(-v[1], v[0]);
  vec2.normalize(normal, normal);

  return { point: intersection, normal: normal };
}

function update_beam_points() { //generate beam start & end points to pass to the shader
  //get dynamic position of screen corners depending on viewport scale

  let p_0 = vec2.fromValues(-prism_height/2.0 * tan(alpha_rad / 2.0), 0.0);

  let raycast_result = raycast(p_0, cw_rot(, alpha_rad), );
  if (raycast_result) return;

  let p_1 = raycast_result.point;
  let n_1 = raycast_result.normal;
  
  //incident point to screen edge

  for (let i = 0; i < beam_count; i++) {
    //interpolate from p_1 - beam_width * beam_count/2 to p_1 + beam_width * beam_count/2
    //const result = vec2.create();
    //vec2.lerp(result, a, b, t)

    //for each beam, iterate through all visible frequencies
    
  }
}*/



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