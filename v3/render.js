import { initRenderer, loadShaderFromURL } from './render/common.js';

import { drawQuad, setupDistortionControls } from './render/distortion_shader.js';
import { setupPrismControls } from './render/prism_shader.js';
import { setupRainbowControls, recompute_bands } from './render/rainbow_shader.js';
import { raymarchActive, setupRaymarchControls, startRaymarchingRenderLoop } from './render/raymarching_shader.js';
// replace these with setupControls() functions, generalise setupControls at the end
// make setupControls() export for now
// do a minor cleanup, then focus on tasks 8,9 then 3
// visit rainbow at the end
// start on video on thursday latest


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


export async function loadShader(gl, shader) {
    const vs = await loadShaderFromURL(`shaders/base.vert`);
    const fs = await loadShaderFromURL(`shaders/${shader}.frag`);
    const program = await initRenderer(gl, vs, fs);

    //shader = (shader === "distortion") ? sub_task : shader;

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
            case 'task_5':
            case 'task_6_7':
            case 'task_8':
            case 'task_9':
            case 'task_10':
                setupDistortionControls(gl, program, shader, activeListeners);
                break;
            case 'prism':
                setupPrismControls(gl, program, activeListeners);
                break;
            case 'rainbow':
                setupRainbowControls(gl, program, activeListeners);
        }

        //setupControls(gl, program, shader);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (shader.slice(0, 4) === 'task') drawQuad(gl, program);
    }
}