import { initRenderer, loadShaderFromURL } from './common.js';

export async function loadDistortionShader(gl, mapName) {
  const vs = await loadShaderFromURL('shaders/base.vert');
  const fs = await loadShaderFromURL(`shaders/${mapName}.frag`);
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
