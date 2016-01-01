attribute vec2 a_position;
uniform vec2 u_dilation, u_translation, u_resolution;
uniform float u_pointSize;

void main() {
  vec2 translated = a_position + u_translation;
  vec2 dilated = translated / u_dilation / u_resolution;
  gl_Position = vec4(dilated.x + (1.0/(u_resolution.x*2.0)), dilated.y + (1.0/(u_resolution.y*2.0)), 0, 1);

  gl_PointSize = u_pointSize;
}
