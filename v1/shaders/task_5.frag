#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_focal_length;
uniform vec2 u_image_position;
uniform vec2 u_image_size;

out vec4 outColor;

const float scale = 0.125f;



// inverse mapping function ------------------------------------------------------

vec2 inverse_map(vec2 mapped_pos) {
    float X = mapped_pos.x;
    float Y = mapped_pos.y;
    float f = u_focal_length;

    if (abs(X) < 0.001) return vec2(0.0);
    

    // calculate the inverse of x,y --> X,Y

    float x = -X;
    float y = Y;
    
    return vec2(x, y);
}

//---------------------------------------------------------------------------------

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 world_pos = (uv - 0.5) * (1.0 / scale); 
    
    // Draw the original image
    vec2 original_space = (uv - 0.5) / scale; // Convert to -1 to 1 space
    
    // Check if we're in the original image area
    bool in_original_image = 
        original_space.x >= u_image_position.x && 
        original_space.x <= u_image_position.x + u_image_size.x &&
        original_space.y >= u_image_position.y && 
        original_space.y <= u_image_position.y + u_image_size.y;
    
    if (in_original_image) {
        //calculate texture coordinates for the original image
        vec2 image_uv = (original_space - u_image_position) / u_image_size;
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0); // Flip Y and normalize to 0-1
        outColor = texture(u_image, image_uv);
        return;
    }
    
    vec2 obj_pos = inverse_map(world_pos);
    
    bool in_distorted_area = 
        obj_pos.x >= u_image_position.x && 
        obj_pos.x <= u_image_position.x + u_image_size.x &&
        obj_pos.y >= u_image_position.y && 
        obj_pos.y <= u_image_position.y + u_image_size.y &&
        obj_pos.x > u_focal_length; // Points must be beyond focal length
    
    if (in_distorted_area) {
        // Calculate texture coordinates for the original image
        vec2 image_uv = (obj_pos - u_image_position) / u_image_size;
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0); // Flip Y and normalize to 0-1
        outColor = texture(u_image, image_uv);
        return;
    }
    
    //construction lines -----------------------------------------------------------

    /* blue focal line */
    if (abs(world_pos.x) < 0.03 && abs(world_pos.y) < 1.5) {
        outColor = vec4(0.0, 0.0, 1.0, 0.3);
        return;
    }
    
    /* focal points */
    if (length(world_pos - vec2(u_focal_length, 0.0)) < 0.05 || 
        length(world_pos - vec2(-u_focal_length, 0.0)) < 0.05) {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
        return;
    }
    
    /* background colour */
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
}