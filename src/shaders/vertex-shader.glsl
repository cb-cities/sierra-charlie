attribute vec2 a_position;
uniform vec2 u_scale, u_move;

void main() {
   vec2 moved = a_position + u_move;
   vec2 scaled = moved / u_scale;
   gl_Position = vec4(scaled, 0, 1);
}
