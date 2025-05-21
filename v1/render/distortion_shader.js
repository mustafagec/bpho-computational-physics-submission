import { initRenderer, loadShaderFromURL } from './common.js';

export async function loadDistortionShader(gl, mapName) {
  const vs = await loadShaderFromURL('shaders/base.vert');
  let fs;
  
  if (mapName === 'lens_distortion') {
    fs = await loadShaderFromURL('shaders/lens_distortion.frag');
    await loadLensDistortionShader(gl, vs, fs);
    return;
  } else {
    fs = await loadShaderFromURL(`shaders/${mapName}.frag`);
  }
  
  const program = await initRenderer(gl, vs, fs);

  // Draw fullscreen quad
  const position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,   1, -1,   -1, 1,
    -1, 1,    1, -1,    1, 1,
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

async function loadLensDistortionShader(gl, vs, fs) {
  const program = await initRenderer(gl, vs, fs);
  
  // Create a fullscreen quad
  const position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,   1, -1,   -1, 1,
    -1, 1,    1, -1,    1, 1,
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  
  // Set up uniform locations
  const u_resolution = gl.getUniformLocation(program, 'u_resolution');
  const u_focal_length = gl.getUniformLocation(program, 'u_focal_length');
  const u_image_position = gl.getUniformLocation(program, 'u_image_position');
  const u_image_size = gl.getUniformLocation(program, 'u_image_size');
  const u_image = gl.getUniformLocation(program, 'u_image');
  
  // Load the image
  const image = new Image();
  image.src = '../assets/waifu.jpg'; // Replace with your actual image path
  
  // Initial values
  let focal_length = 1.5;
  const imagePosition = [focal_length + 1.0, -0.5]; // [x, y]
  let imageSize = [2.0, 1.0]; // [width, height]
  
  // Set up slider controls
  const focalLengthSlider = document.getElementById('focal-length');
  const focalLengthValue = document.getElementById('focal-length-value');
  const imageWidthSlider = document.getElementById('image-width');
  const imageWidthValue = document.getElementById('image-width-value');
  const imageHeightSlider = document.getElementById('image-height');
  const imageHeightValue = document.getElementById('image-height-value');
  
  focalLengthSlider.addEventListener('input', () => {
    focal_length = parseFloat(focalLengthSlider.value);
    focalLengthValue.textContent = focal_length.toFixed(1);
    redraw();
  });
  
  imageWidthSlider.addEventListener('input', () => {
    imageSize[0] = parseFloat(imageWidthSlider.value);
    imageWidthValue.textContent = imageSize[0].toFixed(1);
    redraw();
  });
  
  imageHeightSlider.addEventListener('input', () => {
    imageSize[1] = parseFloat(imageHeightSlider.value);
    imageHeightValue.textContent = imageSize[1].toFixed(1);
    redraw();
  });
  
  function redraw() {
    gl.uniform1f(u_focal_length, focal_length);
    gl.uniform2fv(u_image_position, imagePosition);
    gl.uniform2fv(u_image_size, imageSize);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  image.onload = () => {
    // Create and bind a texture
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Upload the image to the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    // Set uniform values
    gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(u_focal_length, focal_length);
    gl.uniform2fv(u_image_position, imagePosition);
    gl.uniform2fv(u_image_size, imageSize);
    gl.uniform1i(u_image, 0); // Use texture unit 0
    
    // Draw the scene
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    // Add keyboard controls
    window.addEventListener('keydown', (event) => {
      const step = 0.1;
      switch(event.key) {
        case 'ArrowLeft':
          imagePosition[0] -= step;
          break;
        case 'ArrowRight':
          imagePosition[0] += step;
          break;
        case 'ArrowUp':
          imagePosition[1] += step;
          break;
        case 'ArrowDown':
          imagePosition[1] -= step;
          break;
        default:
          return;
      }
      
      // Update uniforms and redraw
      redraw();
    });
  };
  
  // Error handling
  image.onerror = () => {
    console.error("Failed to load image");
    
    // Create a fallback texture with a color gradient
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Create a 256x256 gradient image
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const r = x / size * 255;
        const g = y / size * 255;
        const b = 100;
        const a = 255;
        const idx = (y * size + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }
    
    // Upload the data to the texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    
    // Set initial uniform values
    gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(u_focal_length, focal_length);
    gl.uniform2fv(u_image_position, imagePosition);
    gl.uniform2fv(u_image_size, imageSize);
    gl.uniform1i(u_image, 0);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    // Add keyboard controls
    window.addEventListener('keydown', (event) => {
      const step = 0.1;
      switch(event.key) {
        case 'ArrowLeft':
          imagePosition[0] -= step;
          break;
        case 'ArrowRight':
          imagePosition[0] += step;
          break;
        case 'ArrowUp':
          imagePosition[1] += step;
          break;
        case 'ArrowDown':
          imagePosition[1] -= step;
          break;
        default:
          return;
      }
      
      // Update uniforms and redraw
      redraw();
    });
  };
}