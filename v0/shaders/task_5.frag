#version 300 es
precision mediump float;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);
  float r = length(uv - 0.5);
  outColor = vec4(vec3(r), 1.0);
}
