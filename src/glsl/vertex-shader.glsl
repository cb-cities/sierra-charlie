attribute vec2 a_position;
uniform vec2 u_translation, u_dilation, u_resolution;
uniform float u_pointSize;

void main() {
  vec2 translated = a_position - u_translation;
  vec2 dilated = translated / u_dilation / u_resolution;
  vec2 pixelFitted = dilated + vec2(1.0 / (u_resolution.x * 2.0), 1.0 / (u_resolution.y * 2.0));
  gl_Position = vec4(pixelFitted, 0, 1);
  gl_PointSize = u_pointSize;
}
