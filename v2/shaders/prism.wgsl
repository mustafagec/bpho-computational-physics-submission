@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -3.0),
        vec2<f32>(3.0, 1.0),
        vec2<f32>(-1.0, 1.0),
    );
    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(0.2, 0.8, 0.4, 1.0); // any color
}

