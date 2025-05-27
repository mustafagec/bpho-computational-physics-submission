import { initRenderer, loadShaderFromURL } from './common.js';



function f_THz_to_rgb(frequency) {
  const colorMap = [
    { f: 790, rgb: [0.5, 0, 0] },   // Deep Red
    { f: 680, rgb: [1.0, 0.0, 0.0] }, // Red
    { f: 620, rgb: [1.0, 0.5, 0.0] }, // Orange
    { f: 600, rgb: [1.0, 1.0, 0.0] }, // Yellow
    { f: 530, rgb: [0.0, 1.0, 0.0] }, // Green
    { f: 510, rgb: [0.0, 1.0, 1.0] }, // Cyan
    { f: 480, rgb: [0.0, 0.0, 1.0] }, // Blue
    { f: 405, rgb: [0.5, 0.0, 1.0] }  // Violet
  ];

  if (frequency < 405 || frequency > 790) return [0, 0, 0];

  for (let i = 0; i < colorMap.length - 1; i++) {
    const f1 = colorMap[i].f;
    const f2 = colorMap[i + 1].f;
    const rgb1 = colorMap[i].rgb;
    const rgb2 = colorMap[i + 1].rgb;

    if (frequency >= f1 && frequency <= f2) {
      const t = (frequency - f2) / (f1 - f2);
      const r = rgb1[0] * t + rgb2[0] * (1 - t);
      const g = rgb1[1] * t + rgb2[1] * (1 - t);
      const b = rgb1[2] * t + rgb2[2] * (1 - t);
      return [r, g, b];
    }
  }

  return [0, 0, 0];
}


/* initial variables */
let pi = Math.PI

let c_point = [0, 0];//change to (w/2, h - r * cos(e) * sin(alpha))
let numBands = 50;
let alpha = pi/36; //5 deg
let viewport_scale = 6.0;
let data; // = new Float32Array(numBands*2 * 4); // vec4 per sample
let distance = 1.0;
let height = 0;
let spread = 0.2;

/* cpu computation */
function recompute_bands(gl) {
  //clear data
  data = new Float32Array(numBands*2 * 4);

  //recompute distance-rgb pair data
  for (let i = 0; i < numBands; i++) {
    //(distance, r, g, b)
    //data must be recomputed when a change is made to num_bands, distance (r), alpha
    
    let f_THz = 405 + (i / numBands) * 385;
    let f_PHz = f_THz / Math.pow(10, -3);

    const [rCol, gCol, bCol] = f_THz_to_rgb(f_THz);

    let n = Math.pow(Math.pow(1.731 - 0.261 * (f_PHz), -0.5) + 1, 0.5);

    //primary ----------
    let theta_p = Math.asin(Math.pow((4 - n*n) / 3, 0.5));
    let e_p = 4 * Math.asin(Math.pow((4 - n*n) / 3, 0.5)/ n) - 2 * theta_p;

    let d_p = distance * Math.sin(e_p) * Math.cos(alpha);

    
    data[i*2 * 4 + 0] = d_p;
    data[i*2 * 4 + 1] = rCol;
    data[i*2 * 4 + 2] = gCol;
    data[i*2 * 4 + 3] = bCol;

    //secondary --------
    let theta_s = Math.asin(Math.pow((9 - n*n) / 8, 0.5));
    let e_s = pi - 6 * Math.asin(Math.pow((9 - n*n) / 8, 0.5) / n) + 2 * theta_s;

    let d_s = distance * Math.sin(e_s) * Math.cos(alpha);

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
    numBands*2, 1, 0,
    gl.RGBA, gl.FLOAT, data
  );

  /* settings */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

  //bind
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, rainbow_distance_rgb_bands)
}

// alpha, h, r, freq vals, d vals, c_point

//------------------------------------------------------------------------


/* listeners */
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

//--------------------------------------------------------------------------

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


/* shader initialisation */
export async function loadRainbowShader(gl) {
  gl.getExtension('EXT_color_buffer_float');
  clearListeners();
  
  const vs = await loadShaderFromURL('shaders/base.vert');
  const fs = await loadShaderFromURL('shaders/rainbow.frag');
  const program = await initRenderer(gl, vs, fs);

  setupRainbowControls(gl, program);

  recompute_bands(gl);

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

/* input initialisation */
async function setupRainbowControls(gl, program) {
  /* uniform variables */ //to be passed to the shader
  const uBands = gl.getUniformLocation(program, "u_bands");
  const uBandSpread = gl.getUniformLocation(program, "u_band_spread");
  const uNumBands = gl.getUniformLocation(program, "u_num_bands");
  const uCPoint = gl.getUniformLocation(program, "u_c_point");
  const uViewportSize = gl.getUniformLocation(program, "u_viewport_size");


  /* html references */
  const alphaSlider = document.getElementById("alpha-slider");
  const alphaLabel = document.getElementById("alpha-value");

  const heightSlider = document.getElementById("height-slider");
  const heightLabel = document.getElementById("height-value");

  const distanceSlider = document.getElementById("distance-slider");
  const distanceLabel = document.getElementById("distance-value");

  const numBandsSlider = document.getElementById("num-bands-slider");
  const numBandsLabel = document.getElementById("num-bands-value");

  const spreadSlider = document.getElementById("spread-slider");
  const spreadLabel = document.getElementById("spread-value");


  /* listeners */
  addListener(alphaSlider, 'input', () => {
    alpha = parseFloat(alphaSlider.value);
    alphaLabel.textContent = alpha.toFixed(1);
    triggerDraw();
  });

  addListener(heightSlider, 'input', () => {
    height = parseFloat(heightSlider.value);
    heightLabel.textContent = height.toFixed(1);
    triggerDraw();
  });
  
  addListener(distanceSlider, 'input', () => {
    distance = parseFloat(distanceSlider.value);
    distanceLabel.textContent = distance.toFixed(1);
    triggerDraw();
  });

  addListener(numBandsSlider, 'input', () => {
    numBands = parseInt(numBandsSlider.value);
    numBandsLabel.textContent = numBands.toFixed(1);
    triggerDraw();
  });

  addListener(spreadSlider, 'input', () => {
    spread = parseFloat(spreadSlider.value);
    spreadLabel.textContent = spread.toFixed(1);
    triggerDraw();
  });

  function triggerDraw() {
    gl.useProgram(program);
    
    recompute_bands(gl);//replace to avoid redundant recomputation
    gl.uniform1i(uBands, 0);
    gl.uniform1f(uBandSpread, spread);
    gl.uniform1i(uNumBands, numBands);

    gl.uniform2fv(uCPoint, c_point);

    gl.uniform1f(uViewportSize, viewport_scale);

    gl.clear(gl.COLOR_BUFFER_BIT);
    drawQuad(gl, program);
  }
}