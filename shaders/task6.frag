uniform sampler2D uImage;
uniform vec2 uResolution;
uniform float uFocalLength;
uniform float uImageScale;
uniform vec2 uImagePosition;
uniform float uViewportScale;


const float pi = 3.14159265358979323846264338328;

vec2 inverse_map(vec2 mapped_pos) {
    float X = mapped_pos.x;
    float Y = mapped_pos.y;
    float f = uFocalLength;

    if (abs(X - f) < 0.001) return vec2(0.0);

    float x = f / (1.0 - f / (-X));
    float y = Y * x / X;

    return vec2(x, y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    float screenAspect = uResolution.x / uResolution.y;
    vec2 world_size = vec2(screenAspect, 1.0) * uViewportScale;
    vec2 world_pos = (uv - 0.5) * world_size;

    // Compute image aspect from texture size
    vec2 imageSize = vec2(textureSize(uImage, 0));
    float imageAspect = imageSize.x / imageSize.y;

    // Compute image scale in X and Y, preserving aspect
    vec2 imageWorldScale = vec2(uImageScale * imageAspect, uImageScale);

    // Check if pixel is inside original image bounds
    bool in_original_image =
        world_pos.x >= uImagePosition.x &&
        world_pos.x <= uImagePosition.x + imageWorldScale.x &&
        world_pos.y >= uImagePosition.y &&
        world_pos.y <= uImagePosition.y + imageWorldScale.y;

    if (in_original_image) {
        vec2 image_uv = (world_pos - uImagePosition) / imageWorldScale;
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0);
        image_uv = clamp(image_uv, 0.0, 1.0);
        gl_FragColor = texture(uImage, image_uv);
        return;
    }

    // For pixels outside original image, apply inverse thin lens mapping
    vec2 obj_pos = inverse_map(world_pos);

    bool in_distorted_area =
        obj_pos.x >= uImagePosition.x &&
        obj_pos.x <= uImagePosition.x + imageWorldScale.x &&
        obj_pos.y >= uImagePosition.y &&
        obj_pos.y <= uImagePosition.y + imageWorldScale.y;

    if (in_distorted_area) {
        vec2 image_uv = (obj_pos - uImagePosition) / imageWorldScale;
        image_uv = image_uv * vec2(1.0, -1.0) + vec2(0.0, 1.0);
        image_uv = clamp(image_uv, 0.0, 1.0);
        gl_FragColor = texture(uImage, image_uv);
        return;
    }

    // Lens line
    if (abs(world_pos.x) < 0.02 && abs(world_pos.y) < 1.5) {
        gl_FragColor = vec4(0.1, 0.1, 0.9, 1.0);
        return;
    }

    // Focal points
    if (length(world_pos - vec2(uFocalLength, 0.0)) < 0.05 ||
        length(world_pos - vec2(-uFocalLength, 0.0)) < 0.05) {
        gl_FragColor = vec4(0.95, 0.1, 0.1, 1.0);
        return;
    }

    // Grid lines
    float spacing = 1.0;
    float line_thickness = 0.02;
    if (abs(mod(world_pos.x, spacing)) < line_thickness ||
        abs(mod(world_pos.y, spacing)) < line_thickness) {
        gl_FragColor = vec4(0.82, 0.85, 0.85, 1.0);
        return;
    }

    // Background
    gl_FragColor = vec4(1.0);
}
