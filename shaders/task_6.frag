#version 300 es
precision mediump float;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);
  float theta = atan(uv.y - 0.5, uv.x - 0.5);
  outColor = vec4(abs(sin(theta * 5.0)), 0.5, 0.2, 1.0);
}
