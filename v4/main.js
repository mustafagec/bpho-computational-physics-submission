import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { recomputeBands } from './computations/rainbow.js';
import { getPrismBeamTexture } from './computations/prism.js';


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

const textureLoader = new THREE.TextureLoader();
const imageTexture = textureLoader.load('assets/image.jpg');
imageTexture.flipY = false;

let isDragging = false;
let dragStart = null;
let initialImagePosition = null;



function loadShader(taskId) {
  return fetch(`shaders/task${taskId}.frag`).then(res => res.text());
}

function createShaderSliders(uniforms) {
  slidersDiv.innerHTML = '';
  currentUniforms = uniforms;

  Object.entries(uniforms).forEach(([name, uniform]) => {
    if (name === 'uResolution' || name === 'uTime' || name === 'uImage' || name === 'uImagePosition' || name === 'uImageSize' || name === 'uNumBands' || name === 'uBands' || name === 'uCPoint' || name === 'uBandSpread' || name === 'uBeamTexture' || name === 'uSegmentCount') return;
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
      if (typeof uniform.onChange === 'function') {
        uniform.onChange();
      } else {
        updateShaderOnce();
      }
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
    //universal sliders
    uViewportScale: { value: 7.0, min: 0, max: 14, step: 0.01 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  };

  switch (taskId) {
    case '5':
      uniforms.uImageScale = { value: 0.5, min: 0, max: 10, step: 0.01 };
      uniforms.uImage = { value: imageTexture };
      uniforms.uImagePosition = { value: new THREE.Vector2(-0.5, -0.5), min: -1, max: 1, step: 0.01 };
      break;
    case '6':
      uniforms.uImageScale = { value: 0.3, min: 0, max: 10, step: 0.01 };
      uniforms.uImage = { value: imageTexture };
      uniforms.uImagePosition = { value: new THREE.Vector2(-0.5, -0.5), min: -1, max: 1, step: 0.01 };
      uniforms.uFocalLength = { value: 1.5, min: 0, max: 3.0, step: 0.01 };
      break;
    case '10':
      uniforms.uViewportScale = { value: 10.0, min: 1, max: 40, step: 0.01 },
      uniforms.uImage = { value: imageTexture };
      uniforms.uRf = { value: 2.0, min: 0.01, max: 15.0, step: 0.01 };
      uniforms.uArc = { value: 90.0, min: 0, max: 360, step: 1 };

      // Get actual image size
      const imgWidth = imageTexture.image?.width ?? 512;
      const imgHeight = imageTexture.image?.height ?? 512;
      uniforms.uImageSize = {
        value: new THREE.Vector2(imgWidth, imgHeight)
      };
      break;
    case '11':
      uniforms.uAntiSolarAngle = { value: 5, min: 0, max: 90, step: 0.01 };
      uniforms.uHeight = { value: 0, min: 0, max: 5, step: 0.01 };
      uniforms.uDistance = { value: 8, min: 0, max: 30, step: 0.01 };
      uniforms.uNumBands = { value: 50, min: 0, max: 128, step: 1 };
      delete uniforms.uViewportScale;

      const updateBands = () => {
        const { texture, cPoint, spread, numBands } = recomputeBands({
          numBands: uniforms.uNumBands.value,
          alphaDeg: uniforms.uAntiSolarAngle.value,
          rainbowDistance: uniforms.uDistance.value,
          observerHeight: uniforms.uHeight.value
        });

        uniforms.uBands = { value: texture };
        uniforms.uCPoint = { value: cPoint };
        uniforms.uBandSpread = { value: spread };
        uniforms.uNumBands = { value: numBands };

        updateShaderOnce();
      };

      // Add `.onChange` callbacks for each relevant uniform
      ['uAntiSolarAngle', 'uHeight', 'uDistance', 'uNumBands'].forEach(key => {
        const uniform = uniforms[key];
        if (uniform) {
          const originalValue = uniform.value;
          uniform.onChange = updateBands;
        }
      });

      updateBands(); // Initial setup
      break;
    
      // --- define your base-uniforms object as you do now ---
      const baseUniforms = {
        // screen resolution so uv = gl_FragCoord.xy / uResolution works
        uResolution:    { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uThetaI:        { value: 16.7, min: 0, max: 70,   step: 0.01 },
        uPrismAlpha:    { value: 60,   min: 0, max: 60,   step: 0.01 },
        uViewportScale: { value: 14,   min: 0, max: 24,   step: 0.01 },
        uBeamTexture:   { value: null },
        uSegmentCount:  { value: 0 }
      };


      loadShader(taskId).then(fragmentShader => {
        const mat = new THREE.ShaderMaterial({
          uniforms: baseUniforms,
          vertexShader:   `void main() { gl_Position = vec4(position,1.0); }`,
          fragmentShader
        });
        quad.material = mat;

        // **now** grab the material’s uniforms
        const liveUniforms = mat.uniforms;
        currentUniforms = liveUniforms;

        // rebuild sliders so they target liveUniforms
        createShaderSliders(liveUniforms);

        // hook your beam‐generator on the *same* live uniforms
        const updatePrismBeams = () => {
          const {texture, count} = getPrismBeamTexture({
            alphaDeg:      liveUniforms.uPrismAlpha.value,
            thetaIDeg:     liveUniforms.uThetaI.value,
            viewportScale: liveUniforms.uViewportScale.value
          });
          liveUniforms.uBeamTexture.value  = texture;
          liveUniforms.uSegmentCount.value = count;
          updateShaderOnce();
        };

        ['uThetaI','uPrismAlpha','uViewportScale']
          .forEach(k => liveUniforms[k].onChange = updatePrismBeams);

        updatePrismBeams();
      });
      return;
    case '12': 
      uniforms.uThetaI = { value: 16.7,     min: 0,  max: 70,  step: 0.01 };
      uniforms.uPrismAlpha = { value: 60,       min: 0,  max: 60,  step: 0.01 };
      uniforms.uViewportScale = { value: 14.0,     min: 4,  max: 24,  step: 0.01 };
      uniforms.uBeamTexture = { value: null };
      uniforms.uSegmentCount = { value: 0 };

      loadShader(taskId).then(fragmentShader => {
        const material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader:   `void main(){ gl_Position = vec4(position,1.0); }`,
          fragmentShader
        });
        quad.material = material;

        currentUniforms = material.uniforms;
        createShaderSliders(currentUniforms);

        const updatePrismBeams = () => {
          const { texture, count } = getPrismBeamTexture({
            alphaDeg:      currentUniforms.uPrismAlpha.value,
            thetaIDeg:     currentUniforms.uThetaI.value,
            viewportScale: currentUniforms.uViewportScale.value
          });
          currentUniforms.uBeamTexture.value  = texture;
          currentUniforms.uSegmentCount.value = count;
          updateShaderOnce();
        };

        ['uThetaI','uPrismAlpha','uViewportScale']
          .forEach(key => currentUniforms[key].onChange = updatePrismBeams);

        updatePrismBeams();
      });
      return;
    

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
    uViewportScale: { value: 0.5, min: 0.1, max: 2.0, step: 0.01 },
    uImageScale: { value: 0.5, min: 0.1, max: 2.0, step: 0.01 }
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

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };

  // Store the current image position (clone to avoid reference issues)
  if (currentUniforms.uImagePosition?.value instanceof THREE.Vector2) {
    initialImagePosition = currentUniforms.uImagePosition.value.clone();
  }
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (!isDragging || !initialImagePosition) return;

  const dx = (e.clientX - dragStart.x) / window.innerWidth;
  const dy = (e.clientY - dragStart.y) / window.innerHeight;

  // World scale based on viewport
  const screenAspect = window.innerWidth / window.innerHeight;
  const viewportScale = currentUniforms.uViewportScale?.value ?? 1.0;

  const worldDx = dx * screenAspect * viewportScale;
  const worldDy = -dy * viewportScale; // Invert Y for world coords

  const newPos = initialImagePosition.clone().add(new THREE.Vector2(worldDx, worldDy));
  currentUniforms.uImagePosition.value.copy(newPos);

  updateShaderOnce(); // Rerender
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  dragStart = null;
  initialImagePosition = null;
});


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
