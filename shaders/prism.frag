#version 300 es
precision highp float;

in vec2 a_position;

uniform vec2 u_position;
uniform float u_scale;

out vec2 v_texCoord;

void main() {
  vec2 scaled = a_position * u_scale + u_position;
  gl_Position = vec4(scaled, 0.0, 1.0);
  v_texCoord = a_position * 0.5 + 0.5;
}
