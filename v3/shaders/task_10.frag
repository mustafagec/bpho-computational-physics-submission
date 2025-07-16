#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_focal_length;
//uniform vec2 u_image_position;
uniform vec2 u_image_size;
uniform float u_rf;
uniform float u_arc_deg;
uniform float u_viewport_size;

out vec4 outColor;

//const float scale = 0.125f;

const float pi = 3.14159265358979323846264338328;


// inverse mapping function ------------------------------------------------------

vec2 inverse_map(vec2 mapped_pos) {
    float X = mapped_pos.x;
    float Y = mapped_pos.y;

    float Rf = u_rf;
    float arc_rad = u_arc_deg * pi / 180.0;
    float w = u_image_size.x;
    float h = u_image_size.y;

    float r = length(vec2(X, Y));
    float theta = atan(Y, X);

    float theta_shifted = theta + arc_rad / 2.0;

    // Reject points outside the arc
    if (theta_shifted < 0.0 || theta_shifted > arc_rad || r < 1.0 || r > 1.0 + Rf) {
        // Return invalid UV outside image bounds
        return vec2(-1.0, -1.0);
    }

    float x = theta_shifted / arc_rad * w;
    float y = (r - 1.0) / Rf * h;

    return vec2(x, y);
}

//---------------------------------------------------------------------------------

void main() {
    //vec2 u_image_position = vec2(0, 0);
    vec2 uv = gl_FragCoord.xy / u_resolution;

    //float vertical_world_size = 6.0;
    float pixels_per_unit = u_resolution.y / u_viewport_size; // pixels per world unit
    float scale = 1.0 / pixels_per_unit; // world units per pixel

    float aspect = u_resolution.x / u_resolution.y;
    vec2 world_size = vec2(aspect, 1.0) * u_viewport_size;

    vec2 world_pos = (uv - 0.5) * world_size;
    

    /* original image rendering */

    vec2 u_image_position = vec2(0.0, 0.0);

    float image_aspect = u_image_size.x / u_image_size.y;
    float circle_radius = 1.0;

    float diag = sqrt(image_aspect * image_aspect + 1.0);
    float full_diag = 2.0; // Diameter of unit circle, corners on circle radius=1

    float height = full_diag / diag;
    float width = image_aspect * height;

    vec2 image_display_size = vec2(width, height);

    bool in_original_image = 
        world_pos.x >= u_image_position.x - image_display_size.x / 2.0 &&
        world_pos.x <= u_image_position.x + image_display_size.x / 2.0 &&
        world_pos.y >= u_image_position.y - image_display_size.y / 2.0 &&
        world_pos.y <= u_image_position.y + image_display_size.y / 2.0;

    vec2 base_pos = u_image_position + vec2(0.0, -image_display_size.y / 2.0);
    vec2 shifted_pos = world_pos - base_pos;

    if (length(shifted_pos) < 0.05) {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
        return;
    }

    if (in_original_image) {
        // original image rendering remains the same
        vec2 image_uv = (world_pos - (u_image_position - image_display_size / 2.0)) / image_display_size;
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0); // Flip Y
        outColor = texture(u_image, image_uv);
        return;
    } else {
        // Shift world_pos by base_pos for mapping
        

        vec2 mapped_uv = inverse_map(vec2(-shifted_pos.y, shifted_pos.x));
        vec2 norm_uv = mapped_uv / u_image_size;
        norm_uv.y = 1.0 - norm_uv.y;

        if (all(greaterThanEqual(norm_uv, vec2(0.0))) && all(lessThanEqual(norm_uv, vec2(1.0)))) {
            outColor = texture(u_image, norm_uv);
            return;
        }
    }
    


    //construction lines -----------------------------------------------------------
    
    /* unit circle */
    //float dist = length((uv - 0.5) * 2.0);

    
    float border = 0.1 / u_resolution.x / scale;

    float dist = length(world_pos);

    if (dist >= 1.0 - border && dist <= 1.0 + border) {
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    /* gridlines */
    float spacing = 1.0;
    float line_thickness = 0.02;

    if (abs(mod(world_pos.x, spacing)) < line_thickness ||
        abs(mod(world_pos.y, spacing)) < line_thickness) {
        outColor = vec4(0.82, 0.85, 0.85, 1.0);
        return;
    }

    /* background colour */
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
}
/*
#version 300 es
precision mediump float;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);
  float theta = atan(uv.y - 0.5, uv.x - 0.5);
  outColor = vec4(abs(sin(theta * 5.0)), 0.5, 0.2, 1.0);
}
*/