import { initRenderer, loadShaderFromURL } from './common.js';

import { loadDistortionShader } from './render/distortion_shader.js';
import { loadPrismShader } from './render/prism_shader.js';
import { loadRainbowShader } from './render/rainbow_shader.js';
import { loadRaymarchShader } from './render/raymarching_shader.js';
// replace these with setupControls() functions, generalise setupControls at the end



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
        switch (shader) {
            case 'distortion':
                setupDistortionControls(gl, program);
                break;
            case 'prism':

                break;
            case 'rainbow':
                
        }

        setupControls(gl, program, shader);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}