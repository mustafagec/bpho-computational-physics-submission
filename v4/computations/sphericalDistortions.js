
export function updateTask8(
  data, width, height,
  imageScale, viewportScale,
  imageData, imageWidth, imageHeight,
  imagePos, mapFn
) {
  const aspect    = width / height;
  const [px, py]  = imagePos;
  const imgAsp    = imageWidth / imageHeight;
  const scaleX    = imageScale * imgAsp;
  const scaleY    = imageScale;
  const spacing       = 1.0;
  const lineThickness = 0.02;

  // 1) draw background + grid
  for (let j = 0; j < height; j++) {
    const v = (j + 0.5) / height, wy = (v - 0.5) * viewportScale;
    for (let i = 0; i < width; i++) {
      const u = (i + 0.5) / width, wx = (u - 0.5) * aspect * viewportScale;
      const idx = (j * width + i) * 4;

      // mod like GLSL: m = wx - spacing*floor(wx/spacing)
      const mx = wx - spacing * Math.floor(wx / spacing);
      const my = wy - spacing * Math.floor(wy / spacing);

      if (mx < lineThickness || my < lineThickness) {
        // gridline
        data[idx    ] = 0.82 * 255;
        data[idx + 1] = 0.85 * 255;
        data[idx + 2] = 0.85 * 255;
        data[idx + 3] = 255;
      } else {
        // white background
        data[idx    ] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
  }

  // helper to sample source image into data[idx..]
  function sample(idx, uImg, vImg) {
    uImg = Math.min(Math.max(uImg, 0), 1);
    vImg =  Math.min(Math.max(vImg, 0), 1);  // flip Y
    const xi = Math.floor(uImg * (imageWidth  - 1));
    const yj = Math.floor(vImg * (imageHeight - 1));
    const im = (yj * imageWidth + xi) * 4;
    data[idx    ] = imageData[im    ];
    data[idx + 1] = imageData[im + 1];
    data[idx + 2] = imageData[im + 2];
    data[idx + 3] = imageData[im + 3];
  }

  // 2) draw original image
  for (let j = 0; j < imageHeight; j++) {
    for (let i = 0; i < imageWidth; i++) {
      const uImg = i / (imageWidth  - 1);
      const vImg = j / (imageHeight - 1);
      const wx = px + uImg * scaleX;
      const wy = py + (1 - vImg) * scaleY;
      const u = wx / (aspect * viewportScale) + 0.5;
      const v = wy / viewportScale + 0.5;
      const x = Math.floor(u * width);
      const y = Math.floor(v * height);
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      sample((y * width + x) * 4, uImg, vImg);
    }
  }

  // 3) draw mapped image on top
  for (let j = 0; j < imageHeight; j++) {
    for (let i = 0; i < imageWidth; i++) {
      const uImg = i / (imageWidth  - 1);
      const vImg = j / (imageHeight - 1);
      const srcX = px + uImg * scaleX;
      const srcY = py + (1 - vImg) * scaleY;
      const [dx, dy] = mapFn(srcX, srcY);
      const u = dx / (aspect * viewportScale) + 0.5;
      const v = dy / viewportScale + 0.5;
      const x = Math.floor(u * width);
      const y = Math.floor(v * height);
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      sample((y * width + x) * 4, uImg, vImg);
    }
  }
}

export function updateTask9(data, width, height, imageScale, viewportScale) {
  // your Task 9 pixel logic goes here, e.g. spherical mapping…
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // …calculate RGBA at data[(y*width + x)*4 + 0..3]
    }
  }
}
