precision mediump float;

uniform sampler2D u_texture;
uniform float u_alpha;
varying vec2 v_texcoord;

void main() {
  gl_FragColor = vec4(0.6, 0.6, 0.6, u_alpha);
}
