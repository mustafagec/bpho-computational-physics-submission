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
    float R = 1.0;//u_focal_length;

    if (abs(X) < 0.001) return vec2(0.0);

    
    X = -X;
    Y = -Y;

    float alpha = 0.5 * atan(Y, X); 
    float numerator = R * (Y * cos(alpha) - X * sin(alpha));
    float denominator = Y - R * sin(alpha);
    float k = numerator / denominator;

    //float x = -k / cos(2.0 * alpha);
    float y = -k * sin(2.0 * alpha);

    //float alpha = 0.5 * atan(Y/X);
    //float x = (cos(2.0 * alpha) * (Y*cos(alpha) - X*sin(alpha))) / (Y - sin(alpha));
    float x = y/Y * X;
    
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

    /* half unit circle */
    float border = 0.0125 / u_resolution.x / scale;

    float dist = length(world_pos);
    float r = 0.5;

    if ((dist >= r - border && dist <= r + border) && (world_pos.x >= 0.0)) {
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    /* gridlines */
    float spacing = 0.25;
    float line_thickness = 0.008;

    if (abs(mod(world_pos.x, spacing)) < line_thickness ||
        abs(mod(world_pos.y, spacing)) < line_thickness) {
        outColor = vec4(0.82, 0.85, 0.85, 1.0);
        return;
    }

    

    /* background */
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
}