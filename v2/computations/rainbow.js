
import { task_vars, task_dynamic_vars, task_uniforms } from '../variables.js'



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

/* variables */

let num_bands = task_uniforms.rainbow.num_bands;
let alpha_deg = task_dynamic_vars.rainbow.alpha_deg;
let data;
let rainbow_distance = task_dynamic_vars.rainbow.rainbow_distance;

let pi = Math.PI;

export function recompute_bands(gl) {
  //clear data
  data = new Float32Array(num_bands*2 * 4);

  let alpha_rad = alpha_deg * pi/180;

  //recompute distance-rgb pair data
  for (let i = 0; i < num_bands; i++) {
    //(distance, r, g, b)
    //data must be recomputed when a change is made to num_bands, distance (r), alpha
    
    let f_THz = 790.0 - (i / num_bands) * 385.0;
    let f_PHz = f_THz / 1000.0;

    const [rCol, gCol, bCol] = f_THz_to_rgb(f_THz);

    let n = Math.pow(1 + 1/Math.pow(1.731 - 0.261 * Math.pow(f_PHz, 2.0), 0.5), 0.5);


    //primary ----------
    let theta_p = Math.asin(Math.pow((4 - n*n) / 3, 0.5));
    let e_p = 4 * Math.asin(Math.pow((4 - n*n) / 3, 0.5)/ n) - 2 * theta_p;

    let d_p = rainbow_distance * Math.sin(e_p) * Math.cos(alpha_rad);

    
    data[i*2 * 4 + 0] = d_p;
    data[i*2 * 4 + 1] = rCol;
    data[i*2 * 4 + 2] = gCol;
    data[i*2 * 4 + 3] = bCol;

    //secondary --------
    let theta_s = Math.asin(Math.pow((9 - n*n) / 8, 0.5));
    let e_s = pi - 6 * Math.asin(Math.pow((9 - n*n) / 8, 0.5) / n) + 2 * theta_s;

    let d_s = rainbow_distance * Math.sin(e_s) * Math.cos(alpha_rad);

    data[(i*2 + 1) * 4 + 0] = d_s;
    data[(i*2 + 1) * 4 + 1] = rCol;
    data[(i*2 + 1) * 4 + 2] = gCol;
    data[(i*2 + 1) * 4 + 3] = bCol;


    //------------------

  }
  
  //prepare a texture to pass to the shader
  const rainbow_distance_rgb_bands = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, rainbow_distance_rgb_bands);

  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA32F,
    num_bands*2, 1, 0,
    gl.RGBA, gl.FLOAT, data
  );

  /* settings */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

  //bind
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, rainbow_distance_rgb_bands)
}