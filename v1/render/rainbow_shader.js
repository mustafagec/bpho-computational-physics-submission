import { initRenderer, loadShaderFromURL } from './common.js';


//replace c_point logic with a second buffer handling offsets in the shader
//pass the offset data for each frequency


function f_THz_to_rgb(frequency) {
/*
  const c = 299792.458; // speed of light in nm/THz
  const wavelength = c / freq_THz;

  // Limit to visible spectrum
  if (wavelength < 380 || wavelength > 780) return [0, 0, 0];

  // CIE 1931 2° Standard Observer color matching functions
  // Data sample (should be extended for more accuracy)
  const cieData = [
    { wl: 380, x: 0.0014, y: 0.0000, z: 0.0065 },
    { wl: 390, x: 0.0042, y: 0.0001, z: 0.0201 },
    { wl: 400, x: 0.0143, y: 0.0004, z: 0.0679 },
    { wl: 410, x: 0.0435, y: 0.0012, z: 0.2074 },
    { wl: 420, x: 0.1344, y: 0.0040, z: 0.6456 },
    { wl: 430, x: 0.2839, y: 0.0116, z: 1.3856 },
    { wl: 440, x: 0.3483, y: 0.0230, z: 1.7471 },
    { wl: 450, x: 0.3362, y: 0.0380, z: 1.7721 },
    { wl: 460, x: 0.2908, y: 0.0600, z: 1.6692 },
    { wl: 470, x: 0.1954, y: 0.0910, z: 1.2876 },
    { wl: 480, x: 0.0956, y: 0.1390, z: 0.8130 },
    { wl: 490, x: 0.0320, y: 0.2080, z: 0.4652 },
    { wl: 500, x: 0.0049, y: 0.3230, z: 0.2720 },
    { wl: 510, x: 0.0093, y: 0.5030, z: 0.1582 },
    { wl: 520, x: 0.0633, y: 0.7100, z: 0.0782 },
    { wl: 530, x: 0.1655, y: 0.8620, z: 0.0422 },
    { wl: 540, x: 0.2904, y: 0.9540, z: 0.0203 },
    { wl: 550, x: 0.4334, y: 0.9950, z: 0.0087 },
    { wl: 560, x: 0.5945, y: 0.9950, z: 0.0039 },
    { wl: 570, x: 0.7621, y: 0.9520, z: 0.0021 },
    { wl: 580, x: 0.9163, y: 0.8700, z: 0.0017 },
    { wl: 590, x: 1.0263, y: 0.7570, z: 0.0011 },
    { wl: 600, x: 1.0622, y: 0.6310, z: 0.0008 },
    { wl: 610, x: 1.0026, y: 0.5030, z: 0.0003 },
    { wl: 620, x: 0.8544, y: 0.3810, z: 0.0002 },
    { wl: 630, x: 0.6424, y: 0.2650, z: 0.0000 },
    { wl: 640, x: 0.4479, y: 0.1750, z: 0.0000 },
    { wl: 650, x: 0.2835, y: 0.1070, z: 0.0000 },
    { wl: 660, x: 0.1649, y: 0.0610, z: 0.0000 },
    { wl: 670, x: 0.0874, y: 0.0320, z: 0.0000 },
    { wl: 680, x: 0.0468, y: 0.0170, z: 0.0000 },
    { wl: 690, x: 0.0227, y: 0.0082, z: 0.0000 },
    { wl: 700, x: 0.0114, y: 0.0041, z: 0.0000 },
    { wl: 710, x: 0.0058, y: 0.0021, z: 0.0000 },
    { wl: 720, x: 0.0029, y: 0.0010, z: 0.0000 },
    { wl: 730, x: 0.0014, y: 0.0005, z: 0.0000 },
    { wl: 740, x: 0.0007, y: 0.0002, z: 0.0000 },
    { wl: 750, x: 0.0003, y: 0.0001, z: 0.0000 },
    { wl: 760, x: 0.0002, y: 0.0001, z: 0.0000 },
    { wl: 770, x: 0.0001, y: 0.0000, z: 0.0000 },
    { wl: 780, x: 0.0000, y: 0.0000, z: 0.0000 }
  ];

  // Linear interpolation between data points
  function interpolateCIE(wl) {
    for (let i = 0; i < cieData.length - 1; i++) {
      const a = cieData[i];
      const b = cieData[i + 1];
      if (wl >= a.wl && wl <= b.wl) {
        const t = (wl - a.wl) / (b.wl - a.wl);
        return {
          x: a.x * (1 - t) + b.x * t,
          y: a.y * (1 - t) + b.y * t,
          z: a.z * (1 - t) + b.z * t,
        };
      }
    }
    return { x: 0, y: 0, z: 0 };
  }

  // Get interpolated CIE XYZ
  const { x, y, z } = interpolateCIE(wavelength);

  // Convert XYZ to linear sRGB
  let r =  3.2406*x - 1.5372*y - 0.4986*z;
  let g = -0.9689*x + 1.8758*y + 0.0415*z;
  let b =  0.0557*x - 0.2040*y + 1.0570*z;

  // Gamma correction and clamp
  function gammaCorrect(v) {
    v = Math.max(0, v);
    return v <= 0.0031308
      ? 12.92 * v
      : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  }

  return [gammaCorrect(r), gammaCorrect(g), gammaCorrect(b)];
}*/
  /*const colorMap = [
    { f: 405, rgb: [0.5, 0.0, 0.0] },  // Deep Red
    { f: 480, rgb: [1.0, 0.0, 0.0] },  // Red
    { f: 510, rgb: [1.0, 0.5, 0.0] },  // Orange
    { f: 530, rgb: [1.0, 1.0, 0.0] },  // Yellow
    { f: 600, rgb: [0.0, 1.0, 0.0] },  // Green
    { f: 620, rgb: [0.0, 1.0, 1.0] },  // Cyan
    { f: 680, rgb: [0.0, 0.0, 1.0] },  // Blue
    { f: 790, rgb: [0.5, 0.0, 1.0] },  // Violet
  ];*/
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

/* initial variables */
let pi = Math.PI

let w = 800;
let h = 600;

let observer_height = 0;

let numBands = 50;
let alpha_deg = 5; //5 deg
let viewport_scale = w/100;
let data; // = new Float32Array(numBands*2 * 4); // vec4 per sample
let rainbow_distance = 8.0;
let c_point = [0, 0];
//let c_point = [0, -h/2 + height - rainbow_distance * Math.cos(epsilon) * Math.sin(alpha)];//change to (w/2, h - r * cos(e) * sin(alpha))

let spread = 0.005; //rendering contant

/* cpu computation */
function recompute_bands(gl) {
  //clear data
  data = new Float32Array(numBands*2 * 4);

  let alpha_rad = alpha_deg * pi/180;

  //recompute distance-rgb pair data
  for (let i = 0; i < numBands; i++) {
    //(distance, r, g, b)
    //data must be recomputed when a change is made to num_bands, distance (r), alpha
    
    let f_THz = 790.0 - (i / numBands) * 385.0;
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
    numBands*2, 1, 0,
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

//--------------------------------------------------------------------------------------


/* shader initialisation */

export async function loadRainbowShader(gl) {
  if (!gl.getExtension('EXT_color_buffer_float')) {
    console.error('EXT_color_buffer_float not supported!');
  }
  if (!gl.getExtension('OES_texture_float_linear')) {
    console.error('OES_texture_float_linear not supported!');
  }

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


// input initialisation ------------------------------------------------------------------- //

async function setupRainbowControls(gl, program) {

  const uBands = gl.getUniformLocation(program, "u_bands");
  const uBandSpread = gl.getUniformLocation(program, "u_band_spread");
  const uNumBands = gl.getUniformLocation(program, "u_num_bands");
  const uCPoint = gl.getUniformLocation(program, "u_c_point");
  const uViewportScale = gl.getUniformLocation(program, "u_viewport_scale");
  //const uRainbowDistance = gl.getUniformLocation(program, "u_rainbow_distance");


  //html references ---------------------------------------------------------------

  const viewportScaleSlider = document.getElementById("viewport-scale");
  const viewportScaleLabel = document.getElementById("viewport-scale-value");

  const alphaSlider = document.getElementById("alpha-slider");
  const alphaLabel = document.getElementById("alpha-value");

  const heightSlider = document.getElementById("height-slider");
  const heightLabel = document.getElementById("height-value");

  const numBandsSlider = document.getElementById("num-bands-slider");
  const numBandsLabel = document.getElementById("num-bands-value");

  const spreadSlider = document.getElementById("spread-slider");
  const spreadLabel = document.getElementById("spread-value");

  const rainbowDistanceSlider = document.getElementById("rainbow-distance-slider");
  const rainbowDistanceLabel = document.getElementById("rainbow-distance-value");



  //listeners ---------------------------------------------------------------------

  addListener(viewportScaleSlider, 'input', () => {
    viewport_scale = parseFloat(viewportScaleSlider.value);
    viewportScaleLabel.textContent = viewport_scale.toFixed(1);
    triggerDraw();
  });

  addListener(alphaSlider, 'input', () => {
    alpha_deg = parseFloat(alphaSlider.value);
    c_point = [0, -rainbow_distance * Math.sin(alpha_deg * pi/180.0) + observer_height];
    alphaLabel.textContent = alpha_deg.toFixed(1);
    recompute_bands(gl);
    triggerDraw();
  });

  addListener(heightSlider, 'input', () => {
    observer_height = parseFloat(heightSlider.value);
    c_point = [0, -rainbow_distance * Math.sin(alpha_deg * pi/180.0) + observer_height];
    heightLabel.textContent = observer_height.toFixed(1);
    triggerDraw();
  });

  addListener(numBandsSlider, 'input', () => {
    numBands = parseInt(numBandsSlider.value);
    numBandsLabel.textContent = numBands.toFixed(1);
    recompute_bands(gl);
    triggerDraw();
  });

  addListener(spreadSlider, 'input', () => {
    spread = parseFloat(spreadSlider.value);
    spreadLabel.textContent = spread.toFixed(3);
    recompute_bands(gl);
    triggerDraw();
  });

  addListener(rainbowDistanceSlider, 'input', () => {
    rainbow_distance = parseFloat(rainbowDistanceSlider.value);
    rainbowDistanceLabel.textContent = rainbow_distance.toFixed(1);
    recompute_bands(gl);
    triggerDraw();
  });

  //rendering ----------------------------------------------------------------------------- //

  function triggerDraw() {
    gl.useProgram(program);
    
    gl.uniform1i(uBands, 0);
    gl.uniform1f(uBandSpread, spread);
    gl.uniform1i(uNumBands, numBands);

    gl.uniform2fv(uCPoint, c_point);

    gl.uniform1f(uViewportScale, viewport_scale);

    //gl.uniform1f(uRainbowDistance, rainbow_distance);

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