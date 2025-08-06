import { vec2, mat2 } from 'https://esm.sh/gl-matrix@3.4.3';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const prism_height = 4.0;
let viewport_scale = 14.0;
let alpha_rad = 60.0 * Math.PI / 180.0;
let theta_i_rad = 16.7 * Math.PI / 180.0;
const beam_width = 0.1;
const beam_count = 25;
const frequencies_count = 10;
let beam_segments = [];

// === COLOR MAPPING ===
function f_THz_to_rgb(frequency) {
  const colorMap = [
    { f: 405, rgb: [0.5, 0.0, 0.0] },
    { f: 480, rgb: [1.0, 0.0, 0.0] },
    { f: 510, rgb: [1.0, 127 / 255.0, 0.0] },
    { f: 530, rgb: [1.0, 1.0, 0.0] },
    { f: 600, rgb: [0.0, 1.0, 0.0] },
    { f: 620, rgb: [0.0, 1.0, 1.0] },
    { f: 680, rgb: [0.0, 0.0, 1.0] },
    { f: 790, rgb: [127 / 255.0, 0.0, 1.0] }
  ];

  for (let i = 0; i < colorMap.length - 1; i++) {
    const f1 = colorMap[i].f;
    const f2 = colorMap[i + 1].f;
    const rgb1 = colorMap[i].rgb;
    const rgb2 = colorMap[i + 1].rgb;

    if (frequency >= f1 && frequency <= f2) {
      const t = (frequency - f1) / (f2 - f1);
      return [
        rgb1[0] * (1 - t) + rgb2[0] * t,
        rgb1[1] * (1 - t) + rgb2[1] * t,
        rgb1[2] * (1 - t) + rgb2[2] * t
      ];
    }
  }

  return [0, 0, 0];
}

function cw_rot(p, theta) {
  const rot = mat2.fromValues(Math.cos(theta), -Math.sin(theta), Math.sin(theta), Math.cos(theta));
  return vec2.transformMat2(vec2.create(), p, rot);
}

function raycast(ray_origin, ray_dir, line_a, line_b) {
  const r = vec2.clone(ray_origin);
  const d = vec2.clone(ray_dir);
  const a = vec2.clone(line_a);
  const b = vec2.clone(line_b);

  const v = vec2.sub(vec2.create(), b, a);
  const denom = d[0] * v[1] - d[1] * v[0];
  if (Math.abs(denom) < 1e-10) return null;

  const diff = vec2.sub(vec2.create(), a, r);
  const t = (diff[0] * v[1] - diff[1] * v[0]) / denom;
  if (t <= 0) return null;

  const intersection = vec2.scaleAndAdd(vec2.create(), r, d, t);
  const normal = vec2.normalize(vec2.create(), vec2.fromValues(-v[1], v[0]));
  return { point: intersection, normal };
}

// === BEAM GENERATOR ===
function generatePrismBeamSegments() {
  beam_segments.length = 0;

  const screen_bl = vec2.fromValues(-2 / 3 * viewport_scale, -0.5 * viewport_scale);
  const screen_br = vec2.fromValues(2 / 3 * viewport_scale, -0.5 * viewport_scale);
  const screen_tl = vec2.fromValues(-2 / 3 * viewport_scale, 0.5 * viewport_scale);
  const screen_tr = vec2.fromValues(2 / 3 * viewport_scale, 0.5 * viewport_scale);

  const prism_c = vec2.fromValues(0.0, prism_height / 2);
  const prism_l = vec2.fromValues(-prism_height * Math.tan(alpha_rad / 2), -prism_height / 2);
  const prism_r = vec2.fromValues(prism_height * Math.tan(alpha_rad / 2), -prism_height / 2);

  const p0 = vec2.fromValues(-prism_height / 2 * Math.tan(alpha_rad / 2), 0.0);
  const n0 = vec2.fromValues(-Math.cos(alpha_rad / 2), Math.sin(alpha_rad / 2));

  const rayStart = raycast(p0, cw_rot(n0, -theta_i_rad), screen_tl, screen_bl);
  if (!rayStart) return [];

  const p1 = rayStart.point;

  for (let i = 0; i < beam_count; i++) {
    const vertical_width = 2 * beam_width / (2 * Math.cos(alpha_rad / 2 - theta_i_rad));
    const origin_y = (p1[1] - vertical_width / 2) + i / beam_count * vertical_width;
    const origin = vec2.fromValues(-2 / 3 * viewport_scale, origin_y);

    for (let j = 0; j < frequencies_count; j++) {
      const f_THz = 790.0 - (j / frequencies_count) * 385.0;
      const f_PHz = f_THz / 1000.0;

      const n = Math.pow(1 + 1 / Math.pow(1.731 - 0.261 * f_PHz * f_PHz, 0.5), 0.5);
      const theta_r = Math.asin(Math.sin(theta_i_rad) / n);
      const theta_t = Math.asin(
        Math.sqrt(n * n - Math.pow(Math.sin(theta_i_rad), 2)) * Math.sin(alpha_rad) -
        Math.sin(theta_i_rad) * Math.cos(alpha_rad)
      );

      let dir1 = cw_rot(n0, -theta_i_rad);
      vec2.scale(dir1, dir1, -1.0);
      let hit1 = raycast(origin, dir1, prism_l, prism_c);
      if (!hit1) continue;
      const p2 = hit1.point;

      let hit2 = raycast(p2, cw_rot(vec2.scale(vec2.create(), n0, -1), -theta_r), prism_c, prism_r);
      if (!hit2) continue;
      const p3 = hit2.point;

      let hit3 = raycast(p3, cw_rot(hit2.normal, theta_t), screen_br, screen_tr);
      if (!hit3) continue;
      const p4 = hit3.point;

      const color = f_THz_to_rgb(f_THz);
      beam_segments.push({ start: origin, end: p2, color });
      beam_segments.push({ start: p2, end: p3, color });
      beam_segments.push({ start: p3, end: p4, color });
    }
  }

  return beam_segments;
}

// === THREE.JS TEXTURE CREATOR ===
function createBeamDataTexture(segments) {
  const floatsPerSegment = 8;
  const texWidth = 2;
  const texHeight = segments.length;

  const data = new Float32Array(texWidth * texHeight * 4); // RGBA32F

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const offset = i * 8;
    data[offset + 0] = seg.start[0];
    data[offset + 1] = seg.start[1];
    data[offset + 2] = seg.end[0];
    data[offset + 3] = seg.end[1];
    data[offset + 4] = seg.color[0];
    data[offset + 5] = seg.color[1];
    data[offset + 6] = seg.color[2];
    data[offset + 7] = 0.0;
  }

  const texture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat, THREE.FloatType);
  texture.needsUpdate = true;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  return { texture, count: segments.length };
}

// === EXPORTS ===
export function getPrismBeamTexture(params) {
  if (params) updatePrismParams(params);
  const segments = generatePrismBeamSegments();
  return createBeamDataTexture(segments);
}

export function setPrismUniforms(material, uniforms) {
  material.uniforms.u_prism_alpha.value = alpha_rad;
  material.uniforms.u_theta_i.value = theta_i_rad;
  material.uniforms.u_viewport_scale.value = viewport_scale;

  if (uniforms?.segment_count !== undefined) {
    material.uniforms.u_segment_count.value = beam_segments.length;
  }
}

export function updatePrismParams({ alphaDeg, thetaIDeg, viewportScale }) {
  if (viewportScale) viewport_scale = viewportScale;
  if (alphaDeg) alpha_rad = alphaDeg * Math.PI / 180.0;
  if (thetaIDeg) theta_i_rad = thetaIDeg * Math.PI / 180.0;
}
