attribute vec2 a_position;
uniform vec2 u_center;
uniform vec2 u_scaleRatio;
uniform float u_pointSize;

void main() {
  gl_Position = vec4((a_position - u_center) * u_scaleRatio, 0, 1);
  gl_PointSize = u_pointSize;
}
