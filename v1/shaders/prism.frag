#version 300 es
precision mediump float;

#define MAX_LINES 5000  // 50 beams × 50 frequencies × 3 segments

uniform float u_prism_alpha;
uniform float u_theta_i;

uniform float u_viewport_scale;

uniform sampler2D u_beam_texture;
uniform int u_segment_count;

out vec4 outColor;


//constants ----------------------------------------------


const float aspect = 800.0 / 600.0;

//const float pi = 3.14159265358979323846264338328;

const vec4 prism_colour = vec4(32.0/255.0, 31.0/255.0, 36.0/255.0, 1.0);
const float prism_height = 4.0;

const float normal_marker_length = 0.7;
const float normal_thickness = 0.031;
const vec4 normal_colour = vec4(0.8, 0.8, 0.85, 1.0);


const float beam_thickness = 0.04;
const float edge_softness = 0.02;

//---------------------------------------------------------

vec3 get_segment_data(int i, out vec2 start, out vec2 end) {
    float tex_height = float(u_segment_count);
    float y = (float(i) + 0.5) / tex_height;

    vec4 tex1 = texture(u_beam_texture, vec2(0.25, y)); // first texel
    vec4 tex2 = texture(u_beam_texture, vec2(0.75, y)); // second texel

    start = tex1.xy;
    end = tex1.zw;
    return tex2.rgb;
}


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

    return ((y >= -(h/2.0 + 0.2))&&(y<=x/(tan(u_prism_alpha/2.0)) + h/2.0)&&(y<=-x/(tan(u_prism_alpha/2.0)) + h/2.0));
}


void main() {
    vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);
    
    vec2 world_size = vec2(aspect, 1.0) * u_viewport_scale;
    vec2 world_pos = (uv - 0.5) * world_size;
    
    vec3 accumulatedColor = vec3(0.0);
    float alphaSum = 0.0;

    //render rays ------------------------------------------------
    
    for (int i = 0; i < MAX_LINES; i++) {
        if (i >= u_segment_count) break;

        vec2 start, end;
        vec3 color = get_segment_data(i, start, end);

        vec2 ab = end - start;
        vec2 ap = world_pos - start;

        float ab_len2 = dot(ab, ab);
        if (ab_len2 > 0.0) {
            float t = clamp(dot(ap, ab) / ab_len2, 0.0, 1.0);
            vec2 closest = start + t * ab;
            float dist = length(world_pos - closest);

            float half_thickness = beam_thickness * 0.5;
            float alpha = smoothstep(half_thickness + edge_softness, half_thickness, dist);

            accumulatedColor += alpha * color;
            alphaSum += alpha;
        }
    }

    if (alphaSum > 0.0) {
        accumulatedColor = accumulatedColor / 20.0;
        outColor = vec4(accumulatedColor, 1.0);
        return;
    }
    

    /* background colour */
    outColor = within_prism(world_pos) ? prism_colour : vec4(0.0, 0.0, 0.0, 1.0);
}