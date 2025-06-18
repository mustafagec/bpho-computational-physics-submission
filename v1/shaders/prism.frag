#version 300 es
precision mediump float;

uniform float u_prism_alpha;
uniform float u_theta_i;

uniform float u_viewport_scale;

out vec4 outColor;


//constants ----------------------------------------------


const float aspect = 800.0 / 600.0;

const float pi = 3.14159265358979323846264338328;

const vec4 prism_colour = vec4(0.15, 0.15, 0.16, 1.0);
const float prism_height = 4.0;

const float normal_marker_length = 0.7;
const float normal_thickness = 0.031;
const vec4 normal_colour = vec4(0.8, 0.8, 0.85, 1.0);


const float beam_thickness = 0.25;
const int beam_subdivisions = 20;

//---------------------------------------------------------


bool within_line(vec2 pos, vec2 start, vec2 end, float thickness, bool is_dashed) {
    float dash_length = 0.05;
    float gap_length = 0.025;

    //vector from start to end and from start to pos
    vec2 ab = end - start;
    vec2 ap = pos - start;

    float ab_len2 = dot(ab, ab);
    if (ab_len2 == 0.0) return false;

    float t = dot(ap, ab) / ab_len2;

    //clamp t to segment bounds [0,1]
    if (t < 0.0 || t > 1.0) return false;

    //closest point on the line segment
    vec2 closest = start + t * ab;

    //check perpendicular distance to line
    float dist = length(pos - closest);
    if (dist > (thickness / 2.0)) return false;

    if (is_dashed) {
        float total_cycle = dash_length + gap_length;
        float proj_length = length(ab) * t;
        float position_in_cycle = mod(proj_length, total_cycle);
        return position_in_cycle < dash_length;
    }

    return true;
}


bool within_prism(vec2 pos) {
    float x = pos.x;
    float y = pos.y;
    float h = prism_height;

    return ((y >= -h/2.0)&&(y<=x/(tan(u_prism_alpha/2.0)) + h/2.0)&&(y<=-x/(tan(u_prism_alpha/2.0)) + h/2.0));
}

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);
    
    vec2 world_size = vec2(aspect, 1.0) * u_viewport_scale;
    vec2 world_pos = (uv - 0.5) * world_size;



    //calculate central point where the ray leaves the prism (c_point_t)
    



    /* point calculations */
    

    //render rays ------------------------------------------------
    
    /* ray of incidence */


    /* internal ray */


    /* transmitted ray */

    //render normals ---------------------------------------------

    /* incident normal markers */
    vec2 c_point = vec2(-prism_height/2.0 * tan(u_prism_alpha / 2.0), 0.0);
    float delta_x = normal_marker_length * cos(u_prism_alpha / 2.0);
    float delta_y = normal_marker_length * sin(u_prism_alpha / 2.0);
    vec2 normal_start = vec2(c_point.x - delta_x, c_point.y + delta_y);
    vec2 normal_end = vec2(c_point.x + delta_x, c_point.y - delta_y);

    if (within_line(world_pos, normal_start, normal_end, normal_thickness, true)) {
        outColor = normal_colour;
        return;
    }

    /* background colour */
    outColor = within_prism(world_pos) ? prism_colour : vec4(0.0, 0.0, 0.0, 1.0);
}