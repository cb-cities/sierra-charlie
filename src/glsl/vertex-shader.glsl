attribute vec2 vertex;
uniform vec2 center, scaleRatio, clientSize;
uniform float pointSize;

void main() {
  vec2 translated = vertex - center;
  vec2 dilated = translated / scaleRatio;
  vec2 pixelFitted = dilated + vec2(1.0 / (clientSize.x * 2.0), 1.0 / (clientSize.y * 2.0));
  gl_Position = vec4(pixelFitted, 0, 1);
  gl_PointSize = pointSize;
}
