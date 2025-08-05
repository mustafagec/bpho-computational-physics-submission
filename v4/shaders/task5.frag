uniform float uValue;
uniform vec2 uResolution;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float brightness = step(uValue, uv.x);
  gl_FragColor = vec4(vec3(brightness), 1.0);
}
