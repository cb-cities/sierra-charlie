precision mediump float;

uniform sampler2D u_viewTexture;
uniform sampler2D u_otherTexture;
uniform float u_alpha;
varying vec2 v_texcoord;

void main() {
  gl_FragColor = vec4(texture2D(u_otherTexture, v_texcoord).rgb, u_alpha * texture2D(u_viewTexture, v_texcoord).a);
}
