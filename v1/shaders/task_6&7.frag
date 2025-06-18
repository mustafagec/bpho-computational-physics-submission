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

vec2 inverse_map(vec2 mapped_pos) {
    float X = mapped_pos.x;
    float Y = mapped_pos.y;
    float f = u_focal_length;

    if (abs(X - f) < 0.001) return vec2(0.0);

    float x = f / (1.0 - f/(X));
    float y = Y * x/X; 

    /*
    X = xf/(f-x)
    f-x = xf/X
    f/x - 1 = f/X
    1/(f/X + 1) = x/f
    x = f/(f/X + 1)
    
    -X = xf/(f-x)
    X = xf/(x-f)
    x-f = xf/X
    1-f/x = f/X
    f/(1-f/X) = x
    */


    /*
    map_to(x, y):
    X = (-f / (x - f)) * x * np.where(x > f, 1, 0)
    Y = y/x * X * np.where(x > f, 1, 0)
    */

    return vec2(x, y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    float aspect = u_resolution.x / u_resolution.y;
    vec2 world_size = vec2(aspect, 1.0) * u_viewport_size;
    vec2 world_pos = (uv - 0.5) * world_size;

    // Check if pixel is inside original image bounds (in world coordinates)
    bool in_original_image = 
        world_pos.x >= u_image_position.x &&
        world_pos.x <= u_image_position.x + u_image_size.x &&
        world_pos.y >= u_image_position.y &&
        world_pos.y <= u_image_position.y + u_image_size.y;

    if (in_original_image) {
        // Sample original image directly without distortion
        vec2 image_uv = (world_pos - u_image_position) / u_image_size;
        // Flip Y because texture origin is bottom-left but world_pos Y is up
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0);
        image_uv = clamp(image_uv, 0.0, 1.0);
        outColor = texture(u_image, image_uv);
        return;
    }

    // For pixels outside original image, apply inverse thin lens mapping
    vec2 obj_pos = inverse_map(world_pos);

    bool in_distorted_area = 
        obj_pos.x >= u_image_position.x &&
        obj_pos.x <= u_image_position.x + u_image_size.x &&
        obj_pos.y >= u_image_position.y &&
        obj_pos.y <= u_image_position.y + u_image_size.y;

    if (in_distorted_area) {
        vec2 image_uv = (obj_pos - u_image_position) / u_image_size;
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0);
        image_uv = clamp(image_uv, 0.0, 1.0);
        outColor = texture(u_image, image_uv);
        return;
    }

    // Draw construction lines

    // Blue focal line
    if (abs(world_pos.x) < 0.02 && abs(world_pos.y) < 1.5) {
        outColor = vec4(0.1, 0.1, 0.9, 1.0);
        return;
    }

    // Focal points (red)
    if (length(world_pos - vec2(u_focal_length, 0.0)) < 0.05 || 
        length(world_pos - vec2(-u_focal_length, 0.0)) < 0.05) {
        outColor = vec4(0.95, 0.1, 0.1, 1.0);
        return;
    }

    // Grid lines
    float spacing = 1.0;
    float line_thickness = 0.02;

    if (abs(mod(world_pos.x, spacing)) < line_thickness ||
        abs(mod(world_pos.y, spacing)) < line_thickness) {
        outColor = vec4(0.82, 0.85, 0.85, 1.0);
        return;
    }

    // Background
    outColor = vec4(1.0);
}
