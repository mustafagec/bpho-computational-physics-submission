#version 300 es
precision mediump float;

uniform sampler2D u_bands; //(distance, r, g, b)
uniform float u_band_spread;
uniform int u_num_bands; //slider caps at 256

uniform vec2 u_c_point;

uniform float u_viewport_scale;

out vec4 outColor;


/* constants */

const float width = 800.0;
const float height = 600.0;

const float aspect = width / height;



void main() {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
    
    vec2 uv = (gl_FragCoord.xy / vec2(width, height)) * 2.0 - 1.0;

    /* scaling to world size */
    vec2 world_scale = vec2(aspect, 1.0) * u_viewport_scale;
    vec2 pos = uv * world_scale;


    //colour calculations ----------------

    vec4 colour_sum = vec4(0.0, 0.0, 0.0, 1.0);
    for (int i = 0; i < 256; ++i) {
        if (i >= u_num_bands * 2) break;
        
        float u = float(i) / float(u_num_bands*2 - 1);
        vec4 band = texture2D(u_bands, vec2(u, 0.5));

        float f_d = band.r; // radius of maximum brightness for a given frequency
        vec3 f_rgb = band.gba;

        float px_d = length(pos - u_c_point); //distance of pixel from c_point
        float delta = px_d - f_d;
        //clamp weight
        float weight = exp(-pow(delta / u_band_spread, 2));
        colour_sum += f_rgb * weight;
    }
    //clamp colour sum
    outColor = colour_sum;
    //outColor = vec4(0.0, 0.0, 0.0, 1.0);
}