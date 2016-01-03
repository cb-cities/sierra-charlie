// world coordinates
//   x ranges from 489000 to 573000
//   y ranges from 148000 to 209000
//   one tile is 1000 units
attribute vec2 a_position;

uniform vec2 u_dilation, u_translation, u_resolution;
uniform float u_pointSize;

void main() {
  // translated
  //   x ranges from 0 to 84000
  //   y ranges from 0 to 61000
  //   one tile is 1000 units
  vec2 translated = a_position - u_translation;

  vec2 dilated = translated / u_dilation / u_resolution;

  vec2 pixelFit = vec2(1.0 / (u_resolution.x * 2.0), 1.0 / (u_resolution.y * 2.0));

  vec2 pixelFitted = dilated + pixelFit;

  gl_Position = vec4(pixelFitted, 0, 1);

  gl_PointSize = u_pointSize;
}
