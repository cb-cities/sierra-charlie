precision mediump float;

uniform sampler2D u_viewTexture;
uniform sampler2D u_modelTexture;
uniform float u_alpha;
varying vec2 v_texcoord;

void main() {
  float viewAlpha = texture2D(u_viewTexture, v_texcoord).a;
  vec4 modelColor = texture2D(u_modelTexture, v_texcoord);
  float fragAlpha = u_alpha * viewAlpha * modelColor.a;
  gl_FragColor = vec4(modelColor.rgb, fragAlpha);
}
