

export function addListener(target, event, handler, activeListeners) {
  target.addEventListener(event, handler);
  activeListeners.push({ target, event, handler });
}

export function clearListeners(activeListeners) {
  for (const { target, event, handler } of activeListeners) {
    target.removeEventListener(event, handler);
  }
  activeListeners = [];
}


export function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}


export async function initRenderer(gl, vsSource, fsSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader link error:', gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);
  return program;
}

export async function loadShaderFromURL(url) {
  const response = await fetch(url);
  return response.text();
}