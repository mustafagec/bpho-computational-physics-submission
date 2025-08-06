import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { recomputeBands } from './computations/rainbow.js';
import { getPrismBeamTexture } from './computations/prism.js';
import { updateTask } from './computations/sphericalDistortions.js';

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
/*const imageTexture = textureLoader.load('assets/image.jpg');
imageTexture.flipY = false;

// after your TextureLoader finishes:
const img = imageTexture.image; // HTMLImageElement
const off = document.createElement('canvas');
off.width  = img.width;
off.height = img.height;
const ctx = off.getContext('2d');
ctx.drawImage(img, 0, 0);
const imageData = ctx.getImageData(0, 0, img.width, img.height).data;*/

//const textureLoader = new THREE.TextureLoader();
let imageTexture = null;
let imageData = null;
let imageWidth = 0, imageHeight = 0;

textureLoader.load(
  'assets/image.jpg',
  texture => {
    imageTexture = texture;
    imageTexture.flipY = false;

    const imgEl = texture.image; // HTMLImageElement
    imageWidth  = imgEl.width;
    imageHeight = imgEl.height;

    // draw into offscreen canvas to grab RGBA pixel buffer
    const off = document.createElement('canvas');
    off.width  = imageWidth;
    off.height = imageHeight;
    const ctx = off.getContext('2d');
    ctx.drawImage(imgEl, 0, 0);
    imageData = ctx.getImageData(0, 0, imageWidth, imageHeight).data;
  },
  undefined,
  err => console.error('Failed to load image.jpg', err)
);


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
    if (name == 'uImagePosition') return;
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
      uniforms.uImageScale = { value: 0.8, min: 0, max: 10, step: 0.01 };
      uniforms.uImage = { value: imageTexture };
      uniforms.uImagePosition = { value: new THREE.Vector2(0.5, 0), min: -1, max: 1, step: 0.01 };
      break;
    case '6':
      uniforms.uImageScale = { value: 0.3, min: 0, max: 10, step: 0.01 };
      uniforms.uImage = { value: imageTexture };
      uniforms.uImagePosition = { value: new THREE.Vector2(0.9, 0), min: -1, max: 1, step: 0.01 };
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
    uViewportScale: { value: 2.0, min: 0.1, max: 14.0, step: 0.01 },
    uImageScale:    { value: 0.25, min: 0.01, max: 1.0, step: 0.01 },
    uImagePosition:{ value: new THREE.Vector2(0.05, -0.025), min: -1, max:1, step:0.01 }
  };

  createCpuSliders(uniforms);
  currentUniforms = uniforms;

  //const width = 256, height = 256;
  const width  = window.innerWidth;
  const height = window.innerHeight;
  const data  = new Uint8Array(4 * width * height);
  const tex   = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  //tex.magFilter = THREE.NearestFilter;
  //tex.minFilter = THREE.NearestFilter;
  //tex.flipY = true;

  quad.material = new THREE.MeshBasicMaterial({ map: tex });

  function updateTexture() {
    const imgS = uniforms.uImageScale.value;
    const vpS  = uniforms.uViewportScale.value;

    const posX = uniforms.uImagePosition.value.x;
    const posY = uniforms.uImagePosition.value.y;

    
    updateTask(
      taskId,
      data, width, height,
      imgS, vpS,
      imageData, imageWidth, imageHeight,
      [ posX, posY ],
      (x, y) => {
        let X, Y;
        const R = 0.5;
        switch(taskId) {
          case '8':
            const d = Math.sqrt(R*R - y*y);
            const theta = Math.atan(y / d);
            const m = Math.tan(2*theta);
            X = -(m*d - y)/(y/x + m);
            Y = (y/x)*X;
            break;
          case '9':
            const a = 0.5 * Math.atan(y/x);
            const k = x / Math.cos(2 * a);
            Y = k * Math.sin(a) / (k/R - Math.cos(a) + x/y * Math.sin(a));
            X = x * Y/y;
          break;
        }
        return [X, Y];
      }
    );

    tex.needsUpdate = true;
    updateShaderOnce();
  }

  Object.values(uniforms).forEach(u => u.onChange = updateTexture);

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


//dragging listeners ---------------------------------------------------------------------

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };

  // Store the current image position (clone to avoid reference issues)
  if (currentUniforms.uImagePosition?.value instanceof THREE.Vector2) {
    initialImagePosition = currentUniforms.uImagePosition.value.clone();
  }
});

renderer.domElement.addEventListener('mousemove', e => {
  if (!isDragging || !initialImagePosition) return;

  const dx = (e.clientX - dragStart.x) / window.innerWidth;
  const dy = (e.clientY - dragStart.y) / window.innerHeight;
  const aspect = window.innerWidth / window.innerHeight;
  const vpS   = currentUniforms.uViewportScale?.value ?? 1.0;

  const worldDx = dx * aspect * vpS;
  const worldDy = -dy * vpS;

  const newPos = initialImagePosition.clone().add(new THREE.Vector2(worldDx, worldDy));
  currentUniforms.uImagePosition.value.copy(newPos);

  if (typeof currentUniforms.uImagePosition.onChange === 'function') {
    currentUniforms.uImagePosition.onChange();
  } else {
    updateShaderOnce();
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  dragStart = null;
  initialImagePosition = null;
});


//button listeners -----------------------------------------------------------------------

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
