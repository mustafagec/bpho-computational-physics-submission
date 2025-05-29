#version 300 es
precision mediump float;

//uniform float u_alpha;
//uniform float u_theta_i;

uniform float u_viewport_scale;

out vec4 outColor;

/*const float h = 1.0;

const float aspect = 800.0 / 600.0;
*/
const float u_theta_i = 5.0;
//const float u_viewport_scale = 6.0;


const float pi = 3.14159265358979323846264338328;

const float u_alpha = 45.0;

int within_triangle(vec2 pos) {
    float x = pos.x;
    float y = pos.y;
    float h = 2.0;
    float u_alpha_rad = u_alpha * pi/180.0;
    //float u_alpha = 5.0 * pi/180.0;
    return ((y >= -h/2.0)&&(y<=x/(tan(u_alpha_rad/2.0)) + h/2.0)&&(y<=-x/(tan(u_alpha_rad/2.0)) + h/2.0)) ? 1 : 0;
    //return (y > 0.0) ? 1 : 0;
    //return (x*x+y*y < 1.0)?1:0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);
    
    float aspect = 800.0 / 600.0;
    vec2 world_size = vec2(aspect, 1.0) * u_viewport_scale;
    vec2 world_pos = (uv - 0.5) * world_size;

    // render rays
    // if within ray_thickness radius of a ray, add it to pixel sum

    //render prism
    if (within_triangle(world_pos) == 1) {
        outColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }

    /* background colour */
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
}