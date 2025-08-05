import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const geometry = new THREE.PlaneGeometry(2, 2);
let quad = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
scene.add(quad);

const slidersDiv = document.getElementById('sliders');
let currentUniforms = {};
let animationId = null;

function loadShader(taskId) {
  return fetch(`shaders/task${taskId}.frag`).then(res => res.text());
}

function createShaderSliders(uniforms) {
  slidersDiv.innerHTML = '';
  currentUniforms = uniforms;

  Object.entries(uniforms).forEach(([name, uniform]) => {
    if (name === 'uResolution' || name === 'uTime') return;
    const container = document.createElement('div');
    container.className = 'slider-container';

    const label = document.createElement('label');
    label.textContent = `${name}: `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = uniform.min ?? 0;
    slider.max = uniform.max ?? 1;
    slider.step = uniform.step ?? 0.01;
    slider.value = uniform.value;

    slider.oninput = () => {
      uniform.value = parseFloat(slider.value);
      updateShaderOnce();
    };

    container.appendChild(label);
    container.appendChild(slider);
    slidersDiv.appendChild(container);
  });
}

function createCpuSliders(uniforms) {
  slidersDiv.innerHTML = '';
  Object.entries(uniforms).forEach(([name, uniform]) => {
    const container = document.createElement('div');
    container.className = 'slider-container';

    const label = document.createElement('label');
    label.textContent = `${name}: `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = uniform.min;
    slider.max = uniform.max;
    slider.step = uniform.step;
    slider.value = uniform.value;

    slider.oninput = () => {
      uniform.value = parseFloat(slider.value);
      if (uniform.onChange) uniform.onChange();
    };

    container.appendChild(label);
    container.appendChild(slider);
    slidersDiv.appendChild(container);
  });
}


function updateShaderOnce() {
  renderer.render(scene, camera);
}

function stopAnimationLoop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function runShaderTask(taskId) {
  stopAnimationLoop();

  let uniforms = {
    uViewportScale: { value: 0.5, min: 0, max: 1, step: 0.01 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  };

  switch (taskId) {
    case '5':
      uniforms.uImageScale = { value: 0.5, min: 0, max: 1, step: 0.01 };
      break;
    case '6':
      uniforms.uImageScale = { value: 0.5, min: 0, max: 1, step: 0.01 };
      uniforms.uFocalLength = { value: 0.5, min: 0, max: 1, step: 0.01 };
      break;
    case '10':
      uniforms.uRf = { value: 0.5, min: 0, max: 1, step: 0.01 };
      uniforms.uArc = { value: 0.5, min: 0, max: 1, step: 0.01 };
      break;
    case '11':
      uniforms.uAntiSolarAngle = { value: 0.5, min: 0, max: 1, step: 0.01 };
      uniforms.uHeight = { value: 0.5, min: 0, max: 1, step: 0.01 };
      uniforms.uDistance= { value: 0.5, min: 0, max: 1, step: 0.01 };
      break;
    case '12':
      uniforms.uThetaI = { value: 0.5, min: 0, max: 1, step: 0.01 };
      uniforms.uAlpha = { value: 0.5, min: 0, max: 1, step: 0.01 };
      break;
  }
  
  createShaderSliders(uniforms);

  loadShader(taskId).then(fragmentShader => {
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader
    });

    quad.material = mat;
    updateShaderOnce();
  });
}

function runCpuTask(taskId) {
  stopAnimationLoop();

  const uniforms = {
    uImageScale: { value: 0.5, min: 0.1, max: 2.0, step: 0.01 },
    uViewportScale: { value: 0.5, min: 0.1, max: 2.0, step: 0.01 }
  };

  createCpuSliders(uniforms);

  const width = 256;
  const height = 256;
  const size = width * height;
  const data = new Uint8Array(4 * size);
  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);

  function updateTexture() {
    const imageScale = uniforms.uImageScale.value;
    const viewportScale = uniforms.uViewportScale.value;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        const cx = Math.floor(x * imageScale * viewportScale) % 32 < 16;
        const cy = Math.floor(y * imageScale * viewportScale) % 32 < 16;
        const checker = cx ^ cy;

        data[i]     = checker ? 255 : 0;
        data[i + 1] = checker ? 255 : 100;
        data[i + 2] = 150;
        data[i + 3] = 255;
      }
    }

    tex.needsUpdate = true;
    updateShaderOnce();
  }

  // Attach update triggers to uniforms
  Object.values(uniforms).forEach(uniform => {
    uniform.onChange = updateTexture;
  });

  quad.material = new THREE.MeshBasicMaterial({ map: tex });

  // ✅ Trigger initial update after setup
  updateTexture();
}


function runChallengeShader() {
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    fov: { value: 70.0, min: 30, max: 120, step: 1 },
    radius_1: { value: 0.5, min: 0, max: 1, step: 0.01 },
    radius_2: { value: 0.25, min: 0, max: 1, step: 0.01 }
  };

  createShaderSliders(uniforms);

  loadShader('challenge').then(fragmentShader => {
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader
    });

    quad.material = mat;

    function animate(t) {
      uniforms.uTime.value = t * 0.001;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    }

    animate(0);
  });
}

document.querySelectorAll('#buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const task = btn.dataset.task;

    if (task === 'challenge') {
      runChallengeShader();
    } else if (task === '8' || task === '9') {
      runCpuTask(task);
    } else {
      runShaderTask(task);
    }
  });
});
