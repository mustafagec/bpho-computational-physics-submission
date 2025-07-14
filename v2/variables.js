
//preset variable values



//not user facing, not sent to shader
export const task_vars = {
  task_5: {},
  task_6_7: {},
  task_8: {},
  task_9: {},
  task_10: {},
  prism: {},
  rainbow: {data: null},
  raymarch: {}
};



//uniforms ------------------------------------------------------------------------

//user facing, sent to shader
export const task_dynamic_vars = {
  task_5: {viewport_scale: 6.0, image_scale: 0.3},
  task_6_7: {viewport_scale: 6.0, image_scale: 0.3, focal_length: 1.5},
  task_8: {viewport_scale: 6.0, image_scale: 0.3, radius: 1.0},
  task_9: {viewport_scale: 6.0, image_scale: 0.3, radius: 1.0},
  task_10: {viewport_scale: 6.0, rf: 1.0, arc_deg: 45.0},
  prism: {viewport_scale: 6.0, prism_alpha: 60.0, theta_i_deg: 5.0},
  rainbow: {viewport_scale: 6.0, alpha_deg: 5.0, rainbow_distance: 8.0, observer_height: 0.0},
  raymarch: {fov_deg: 70.0, r_0: 1.0, r_1: 1.0}
}

//not user facing, sent to shader
export const task_uniforms = {
  task_5: {},
  task_6_7: {},
  task_8: {},
  task_9: {},
  task_10: {},
  prism: {},
  rainbow: {num_bands: 50, c_point_y: 0.0},
  raymarch: {}
}