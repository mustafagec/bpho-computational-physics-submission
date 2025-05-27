#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_focal_length;
uniform vec2 u_image_position;
uniform vec2 u_image_size;
uniform float u_viewport_size;

out vec4 outColor;

const float pi = 3.14159265358979323846264338328;

// Inverse mapping function
vec2 inverse_map(vec2 mapped_pos) {
    float X = mapped_pos.x;
    float Y = mapped_pos.y;
    float f = u_focal_length;

    if (abs(X) < 0.001) return vec2(0.0);

    float x = -X;
    float y = Y;
    
    return vec2(x, y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Dynamic scaling from viewport size
    float pixels_per_unit = u_resolution.y / u_viewport_size;
    float scale = 1.0 / pixels_per_unit;

    float aspect = u_resolution.x / u_resolution.y;
    vec2 world_size = vec2(aspect, 1.0) * u_viewport_size;
    vec2 world_pos = (uv - 0.5) * world_size;

    vec2 original_space = (uv - 0.5) * vec2(aspect, 1.0) * u_viewport_size;

    bool in_original_image = 
        original_space.x >= u_image_position.x && 
        original_space.x <= u_image_position.x + u_image_size.x &&
        original_space.y >= u_image_position.y && 
        original_space.y <= u_image_position.y + u_image_size.y;

    if (in_original_image) {
        vec2 image_uv = (original_space - u_image_position) / u_image_size;
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0);
        outColor = texture(u_image, image_uv);
        return;
    }

    vec2 obj_pos = inverse_map(world_pos);

    bool in_distorted_area = 
        obj_pos.x >= u_image_position.x && 
        obj_pos.x <= u_image_position.x + u_image_size.x &&
        obj_pos.y >= u_image_position.y && 
        obj_pos.y <= u_image_position.y + u_image_size.y;

    if (in_distorted_area) {
        vec2 image_uv = (obj_pos - u_image_position) / u_image_size;
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0);
        outColor = texture(u_image, image_uv);
        return;
    }

    //construction lines -----------------------------------------------------------

    /* mirror line */
    if (abs(world_pos.x) < 0.035) {
        outColor = vec4(0.1, 0.1, 0.9, 1.0);
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

    

    /* background */
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
}