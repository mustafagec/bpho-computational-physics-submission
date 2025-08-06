uniform sampler2D uBands; //(distance, r, g, b)
uniform float uBandSpread;
uniform int uNumBands;

uniform vec2 uCPoint;



/* constants */

const float width = 800.0;
const float height = 600.0;
const float aspect = width / height;



void main() {
    vec2 uv = (gl_FragCoord.xy / vec2(width, height)) * 2.0 - 1.0;

    vec2 world_scale = vec2(aspect, 1.0) * 6.0;//uViewportScale;
    vec2 pos = uv * world_scale;

    /* horizon */
    if ((abs(uv.y) < 0.0035) && mod(pos.x, 0.5) < 0.25) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }

    //colour calculations ----------------

    int total_bands = uNumBands * 2;

    vec3 colour_sum = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < 256; ++i) {
        if (i >= total_bands) break;
        
        float u = float(i) / float(total_bands - 1);
        vec4 band = texture(uBands, vec2(u, 0.5));

        float f_d = band.r; // radius of maximum brightness for a given frequency
        vec3 f_rgb = band.gba;

        float px_d = length(pos - uCPoint); //distance of pixel from c_point
        float delta = px_d - f_d;
        //clamp weight
        float weight = exp(-pow(delta / uBandSpread, 2.0));
        colour_sum.rgb += f_rgb * weight;
    }

    gl_FragColor = vec4(clamp(colour_sum.rgb, 0.0, 1.0), 1.0);
}