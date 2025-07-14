#version 300 es
precision mediump float;

uniform sampler2D u_bands; //(distance, r, g, b)
uniform int u_num_bands; //slider caps at 256

uniform float u_c_point_y;

uniform float u_viewport_scale;

//uniform float u_rainbow_distance;

out vec4 outColor;


/* constants */

const float width = 800.0;
const float height = 600.0;
const float aspect = width / height;

const float band_spread = 0.005;

void main() {
    vec2 uv = (gl_FragCoord.xy / vec2(width, height)) * 2.0 - 1.0;

    vec2 world_scale = vec2(aspect, 1.0) * u_viewport_scale;
    vec2 pos = uv * world_scale;

    /* horizon */
    if ((abs(uv.y) < 0.0035) && mod(pos.x, 0.5) < 0.25) {
        outColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }

    //colour calculations ----------------

    int total_bands = u_num_bands * 2;

    vec3 colour_sum = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < 256; ++i) {
        if (i >= total_bands) break;
        
        float u = float(i) / float(total_bands - 1);
        vec4 band = texture(u_bands, vec2(u, 0.5));

        float f_d = band.r; // radius of maximum brightness for a given frequency
        vec3 f_rgb = band.gba;

        float px_d = length(pos - vec2(0, u_c_point_y)); //distance of pixel from c_point
        float delta = px_d - f_d;
        //clamp weight
        float weight = exp(-pow(delta / band_spread, 2.0));
        colour_sum.rgb += f_rgb * weight;
    }

    outColor = vec4(clamp(colour_sum.rgb, 0.0, 1.0), 1.0);
    //outColor = vec4(0.0, 0.0, 0.0, 1.0);
}