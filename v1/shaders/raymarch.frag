#version 300 es
precision mediump float;


uniform float iTime;
uniform vec3 iResolution;

uniform float fov;
uniform float radius_1;
uniform float radius_2;

uniform int fract_toggle;


out vec4 outColor;


/* constants */

const float pi = 3.14159265358979323846264338328;

const int max_marches = 380;
const float max_ray_dist = 100.0;


//camera transformation functions ---------------------------------------

mat3 rotation_y(float theta) {
    return mat3(
        cos(theta), 0.0, -sin(theta),
        0.0, 1.0, 0.0,
        sin(theta), 0.0, cos(theta)
    );
}

mat3 rotation_x(float theta) {
    return mat3(
        1.0, 0.0, 0.0,
        0.0, cos(theta), -sin(theta),
        0.0, sin(theta), cos(theta)
    );
}

void get_camera_ray(vec2 uv, out vec3 ray_origin, out vec3 ray_dir) {
    float aspect = iResolution.x / iResolution.y;

    float fov_rad = radians(fov);
    float focal_length = 1.0 / tan(fov_rad / 2.0);

    vec3 forward = normalize(vec3(uv * vec2(aspect, 1.0), focal_length));

    float angle = iTime * 2.0 * pi / 5.0;
    mat3 cam_rot = rotation_y(angle);
    vec3 cam_pos = vec3(0.0, 0.0, -3.0);

    ray_origin = cam_rot * cam_pos;
    ray_dir = normalize(cam_rot * forward);
}


//sdf functions ---------------------------------------------------------

float torus_sdf(vec3 p, float r_1, float r_2) {
    mat3 torus_rotation = rotation_x(pi / 2.0);
    p = torus_rotation * p;

    //repetition
    if (fract_toggle == 1) {
        vec3 cellSize = vec3(6.0);
        p = fract(p / cellSize) * cellSize - 0.5 * cellSize;
    }

    vec2 q = vec2(length(p.xz) - r_1, p.y);
    return length(q) - r_2;
}

float scene_sdf(vec3 p) {
    return torus_sdf(p, radius_1, radius_2);
}

vec3 estimate_normal(vec3 p) {
    float eps = 0.001;
    return normalize(vec3(
        scene_sdf(p + vec3(eps, 0.0, 0.0)) - scene_sdf(p - vec3(eps, 0.0, 0.0)),
        scene_sdf(p + vec3(0.0, eps, 0.0)) - scene_sdf(p - vec3(0.0, eps, 0.0)),
        scene_sdf(p + vec3(0.0, 0.0, eps)) - scene_sdf(p - vec3(0.0, 0.0, eps))
    ));
}



//main ------------------------------------------------------------------


void main() {
    vec2 uv = (gl_FragCoord.xy / iResolution.xy) * 2.0 - 1.0;

    vec3 ray_origin, ray_dir;
    get_camera_ray(uv, ray_origin, ray_dir);
    
    float d_sum = 0.0;
    vec3 hit_pos;
    bool hit = false;
    
    //march
    for (int i = 0; i < max_marches; i++) {
        vec3 pos = ray_origin + ray_dir * d_sum;
        
        float d = scene_sdf(pos);
        d_sum += d;
        
        if (d < 0.001) {
            hit_pos = pos;
            hit = true;
            break;
        }
        if (d_sum > max_ray_dist) break;
    }
    
    vec3 col = vec3(0.0);
    
    if (hit) {
        vec3 normal = estimate_normal(hit_pos);

        //lighting
        vec3 light_pos = vec3(2.0, 4.0, -2.0);
        vec3 light_color = vec3(1.0);//vec3(1.0, 0.95, 0.8);
        vec3 light_dir = normalize(light_pos - hit_pos);


        //apply lighting models -----------------------------------------
        
        //Lambertian diffuse
        float diff = max(dot(normal, light_dir), 0.0);

        //Phong specular
        vec3 view_dir = normalize(ray_origin - hit_pos);
        vec3 reflect_dir = reflect(-light_dir, normal);
        float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0); // shininess = 32

        vec3 base_color = vec3(1.0, 0.8, 0.65);
        col = base_color * diff + light_color * spec * 0.5;
    }

    outColor = vec4(col, 1.0);
}

