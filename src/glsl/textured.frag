precision mediump float;

uniform sampler2D u_texture;
uniform float u_alpha;
varying vec2 v_texcoord;

void main() {
  gl_FragColor = vec4(texture2D(u_texture, v_texcoord).xyz, u_alpha);
}
