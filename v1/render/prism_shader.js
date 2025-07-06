import { initRenderer, loadShaderFromURL } from './common.js';
import { vec2, mat2 } from 'https://esm.sh/gl-matrix@3.4.3';


/* uniform variables */

let viewport_scale = 14.0;
document.getElementById('viewport-scale-value').textContent = viewport_scale.toFixed(1);
document.getElementById('viewport-scale').value = viewport_scale.toFixed(1);

let alpha_rad = 60.0 * Math.PI/180.0;
let theta_i_rad = 16.7 * Math.PI/180.0;

let beam_width = 0.1;
let beam_count = 25;

let frequencies_count = 10;

let beam_segments = []

const prism_height = 4.0;

function f_THz_to_rgb(frequency) {
  const colorMap = [
    { f: 405, rgb: [0.5, 0.0, 0.0] },  // Deep Red
    { f: 480, rgb: [1.0, 0.0, 0.0] },  // Red
    { f: 510, rgb: [1.0, 127.0/255.0, 0.0] },  // Orange
    { f: 530, rgb: [1.0, 1.0, 0.0] },  // Yellow
    { f: 600, rgb: [0.0, 1.0, 0.0] },  // Green
    { f: 620, rgb: [0.0, 1.0, 1.0] },  // Cyan
    { f: 680, rgb: [0.0, 0.0, 1.0] },  // Blue
    { f: 790, rgb: [127.0/255.0, 0.0, 1.0] },  // Violet
    ];

  if (frequency < 405 || frequency > 790) return [0, 0, 0];

  for (let i = 0; i < colorMap.length - 1; i++) {
    const f1 = colorMap[i].f;
    const f2 = colorMap[i + 1].f;
    const rgb1 = colorMap[i].rgb;
    const rgb2 = colorMap[i + 1].rgb;

    if (frequency >= f1 && frequency <= f2) {
      const t = (frequency - f1) / (f2 - f1);

      const r = rgb1[0] * (1 - t) + rgb2[0] * t;
      const g = rgb1[1] * (1 - t) + rgb2[1] * t;
      const b = rgb1[2] * (1 - t) + rgb2[2] * t;

      return [r, g, b];
    }
  }

  return [0, 0, 0];
}


function cw_rot(p, theta) { //clockwise vector rotation
  const rot_mat = mat2.fromValues(Math.cos(theta), -Math.sin(theta), Math.sin(theta), Math.cos(theta));
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
  beam_segments.length = 0;

  /* screen corners & prism vertices */
  let screen_bl_corner = vec2.fromValues(-2.0/3.0 * viewport_scale, -0.5 * viewport_scale);
  let screen_br_corner = vec2.fromValues(2.0/3.0 * viewport_scale, -0.5 * viewport_scale);
  let screen_tl_corner = vec2.fromValues(-2.0/3.0 * viewport_scale, 0.5 * viewport_scale);
  let screen_tr_corner = vec2.fromValues(2.0/3.0 * viewport_scale, 0.5 * viewport_scale);

  let prism_central_corner = vec2.fromValues(0.0, prism_height/2.0);
  let prism_left_corner = vec2.fromValues(-prism_height * Math.tan(alpha_rad / 2.0), -prism_height/2.0);
  let prism_right_corner = vec2.fromValues(prism_height * Math.tan(alpha_rad / 2.0), -prism_height/2.0);

  let p_0 = vec2.fromValues(-prism_height/2.0 * Math.tan(alpha_rad / 2.0), 0.0);
  let n_0 = vec2.fromValues(-Math.cos(alpha_rad / 2.0), Math.sin(alpha_rad / 2.0));

  /* raycast 0, find starting point for successive raycasts */

  //find the point on the left of the screen to cast beams from with correct alpha to the normal
  let raycast_result = raycast(p_0, cw_rot(n_0, -theta_i_rad), screen_tl_corner, screen_bl_corner);
  if (!raycast_result) return;

  //starting point of beam
  let p_1 = raycast_result.point;
  let n_1 = raycast_result.normal;
  

  for (let i = 0; i < beam_count; i++) {

    //determine origin of sub_beam start
    let fixed_x = -2.0 / 3.0 * viewport_scale;

    let vertical_width = 2.0 * beam_width / (2.0 * Math.cos(alpha_rad/2.0 - theta_i_rad));

    let origin_y = (p_1[1] - vertical_width/2.0) + i/beam_count * vertical_width;
    let sub_beam_origin = vec2.fromValues(-2.0/3.0 * viewport_scale, origin_y);

    //cast rays through each medium boundary and the final screen edge
    for (let j = 0; j < frequencies_count; j++) {

      let f_THz = 790.0 - (j / frequencies_count) * 385.0;
      let f_PHz = f_THz / 1000.0;

      //refractive index of crown glass
      let n = Math.pow(1 + 1/Math.pow(1.731 - 0.261 * Math.pow(f_PHz, 2.0), 0.5), 0.5);

      let theta_r = Math.asin(Math.sin(theta_i_rad) / n);
      let theta_t = Math.asin(Math.sqrt(n*n - Math.pow(Math.sin(theta_i_rad), 2.0)) * Math.sin(alpha_rad) - Math.sin(theta_i_rad) * Math.cos(alpha_rad));


      //raycast 1, point beams enter prism --------------------------------------------------
      let dir_1 = cw_rot(n_0, -theta_i_rad);
      vec2.scale(dir_1, dir_1, -1.0)
      let raycast_result = raycast(sub_beam_origin, dir_1, prism_left_corner, prism_central_corner);
      if (!raycast_result) continue;

      let p_2 = raycast_result.point;
      let n_2 = raycast_result.normal;


      //raycast 2, point beams exit prism ---------------------------------------------------
      let inverse_n_0 = vec2.create();
      vec2.scale(inverse_n_0, n_0, -1.0)
      raycast_result = raycast(p_2, cw_rot(inverse_n_0, -theta_r), prism_central_corner, prism_right_corner);
      if (!raycast_result) continue;

      let p_3 = raycast_result.point;
      let n_3 = raycast_result.normal;


      //raycast 3, point beams exit screen --------------------------------------------------

      raycast_result = raycast(p_3, cw_rot(n_3, theta_t), screen_br_corner, screen_tr_corner);
      if (!raycast_result) continue;

      let p_4 = raycast_result.point;
      let n_4 = raycast_result.normal;

      //console.log({ p_2, p_3, p_4 });

      //insert all data to be passed to the shader ------------------------------------------
      const color = f_THz_to_rgb(f_THz);

      beam_segments.push({
        start: vec2.clone(sub_beam_origin),
        end: vec2.clone(p_2),
        color: color
      });

      // segment 2: p2 -> p3
      beam_segments.push({
        start: vec2.clone(p_2),
        end: vec2.clone(p_3),
        color: color
      });

      // segment 3: p3 -> p4
      beam_segments.push({
        start: vec2.clone(p_3),
        end: vec2.clone(p_4),
        color: color
      })
    }
  }
}
update_beam_points();


function createBeamTexture(gl, segments) {
  const floatsPerSegment = 8; // start(2), end(2), color(3), padding(1)
  const data = new Float32Array(segments.length * floatsPerSegment);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const offset = i * floatsPerSegment;
    data.set([
      seg.start[0], seg.start[1],
      seg.end[0], seg.end[1],
      seg.color[0], seg.color[1], seg.color[2],
      0.0 // padding
    ], offset);
  }

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const texWidth = 2; // 2 RGBA texels per segment
  const texHeight = segments.length;

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    texWidth,
    texHeight,
    0,
    gl.RGBA,
    gl.FLOAT,
    data
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return { texture, count: segments.length };
}

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
    update_beam_points();
    gl.useProgram(program);

    const { texture, count } = createBeamTexture(gl, beam_segments);
    const uBeamTex = gl.getUniformLocation(program, 'u_beam_texture');
    const uSegmentCount = gl.getUniformLocation(program, 'u_segment_count');

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uBeamTex, 0); // Texture unit 0
    gl.uniform1i(uSegmentCount, count);

    //pass uniforms to the shader
    
    gl.uniform1f(uAlpha, alpha_rad);
    gl.uniform1f(uThetaI, theta_i_rad);
    gl.uniform1f(uViewportScale, viewport_scale);// viewport_scale);

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