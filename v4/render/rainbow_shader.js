

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
export function recompute_bands(gl) {
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





// input initialisation ------------------------------------------------------------------- //

export async function setupRainbowControls(gl, program, activeListeners) {
  function addListener(target, event, handler) {
    target.addEventListener(event, handler);
    activeListeners.push({ target, event, handler });
  }

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