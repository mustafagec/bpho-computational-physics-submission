import { initRenderer, loadShaderFromURL } from './common.js';

function render(gl, program, time) {
    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (window.__sendRaymarchUniforms) {
        window.__sendRaymarchUniforms(time);
    }

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}


let fov_deg = 70.0;
let radius_1 = 1.0;
let radius_2 = 0.5;

let raymarchActive = false;

let activeListeners = [];
function addListener(target, event, handler) {
    target.addEventListener(event, handler);
    activeListeners.push({ target, event, handler });
}

function startRaymarchingRenderLoop(gl, program) {
  function renderFrame(time) {
    if (!raymarchActive) return; // ❗ Stop rendering if inactive
    render(gl, program, time);
    requestAnimationFrame(renderFrame);
  }

  raymarchActive = true;
  requestAnimationFrame(renderFrame);
}

export async function loadRaymarchShader(gl) {
    const vs = await loadShaderFromURL('shaders/base.vert'); // passthrough vertex shader
    const fs = await loadShaderFromURL('shaders/raymarch.frag'); // your raymarching frag shader
    const program = await initRenderer(gl, vs, fs);

    setupRaymarchControls(gl, program);

    const position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    startRaymarchingRenderLoop(gl, program);
}


function setupRaymarchControls(gl, program) {
    const fovSlider = document.getElementById('fov-slider');
    const fovLabel = document.getElementById('fov-value');

    const r1Slider = document.getElementById('r1-slider');
    const r1Label = document.getElementById('r1-value');

    const r2Slider = document.getElementById('r2-slider');
    const r2Label = document.getElementById('r2-value');

    const uFov = gl.getUniformLocation(program, 'fov');
    const uR1 = gl.getUniformLocation(program, 'radius_1')
    const uR2 = gl.getUniformLocation(program, 'radius_2')

    const fractCheckbox = document.getElementById('fract-toggle');
    const uFractToggle = gl.getUniformLocation(program, 'fract_toggle');

    let fract_toggle = false;
    addListener(fractCheckbox, 'change', () => {
        fract_toggle = fractCheckbox.checked;
    });

    addListener(fovSlider, 'input', () => {
        fov_deg = parseFloat(fovSlider.value);
        fovLabel.textContent = `${fov_deg.toFixed(1)}°`;
    });

    addListener(r1Slider, 'input', () => {
        radius_1 = parseFloat(r1Slider.value);
        r1Label.textContent = `${radius_1.toFixed(2)}`;
    });

    addListener(r2Slider, 'input', () => {
        radius_2 = parseFloat(r2Slider.value);
        r2Label.textContent = `${radius_2.toFixed(2)}`;
    });

    


    const uTime = gl.getUniformLocation(program, 'iTime');
    const uRes = gl.getUniformLocation(program, 'iResolution');

    function sendUniforms(time) {
        gl.useProgram(program);
        gl.uniform1f(uFov, fov_deg);
        gl.uniform1f(uR1, radius_1);
        gl.uniform1f(uR2, radius_2);
        gl.uniform1f(uTime, time * 0.001);
        gl.uniform3f(uRes, gl.canvas.width, gl.canvas.height, 1.0);
        gl.uniform1i(uFractToggle, fract_toggle ? 1 : 0);
    }

    window.__sendRaymarchUniforms = sendUniforms;
}

window.__stopRaymarching = () => {
  raymarchActive = false;
};