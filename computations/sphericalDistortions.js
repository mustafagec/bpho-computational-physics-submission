
export function updateTask(
  taskId,
  data, width, height,
  imageScale, viewportScale,
  imageData, imageWidth, imageHeight,
  imagePos, mapFn
) {
  const aspect = width / height;
  const [px, py] = imagePos;
  const imgAsp = imageWidth / imageHeight;
  const scaleX = imageScale * imgAsp;
  const scaleY = imageScale;
  const spacing = 0.5;
  const lineThickness = 0.005;


  //background + grid -----------------------------------------------------

  for (let j = 0; j < height; j++) {
    const v   = (j + 0.5) / height;
    const wy  = (v - 0.5) * viewportScale;
    for (let i = 0; i < width; i++) {
      const u   = (i + 0.5) / width;
      const wx  = (u - 0.5) * aspect * viewportScale;
      const idx = (j * width + i) * 4;

      const mx = wx - spacing * Math.floor(wx / spacing);
      const my = wy - spacing * Math.floor(wy / spacing);

      if (mx < lineThickness || my < lineThickness) {
        data[idx    ] = 0.82 * 255;
        data[idx + 1] = 0.85 * 255;
        data[idx + 2] = 0.85 * 255;
        data[idx + 3] = 255;
      } else {
        data[idx    ] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
  }

  function sample(idx, uImg, vImg) {
    // clamp to [0..1]
    uImg = Math.min(Math.max(uImg, 0), 1);
    vImg = Math.min(Math.max(vImg, 0), 1);
    // **remove** `vImg = 1 - vImg;`
    const xi = Math.floor(uImg * (imageWidth  - 1));
    const yj = Math.floor(vImg * (imageHeight - 1));
    const im = (yj * imageWidth + xi) * 4;
    data[idx    ] = imageData[im    ];
    data[idx + 1] = imageData[im + 1];
    data[idx + 2] = imageData[im + 2];
    data[idx + 3] = imageData[im + 3];
  }

  //draw original image
  for (let j = 0; j < imageHeight; j++) {
    for (let i = 0; i < imageWidth; i++) {
      const uImg = i / (imageWidth  - 1);
      const vImg = j / (imageHeight - 1);
      const wx   = px + uImg * scaleX;
      const wy   = py + (1 - vImg) * scaleY;
      const u    = wx / (aspect * viewportScale) + 0.5;
      const v    = wy / viewportScale + 0.5;
      const x    = Math.floor(u * width);
      const y    = Math.floor(v * height);
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      sample((y * width + x) * 4, uImg, vImg);
    }
  }

  //draw mapped image on top
  for (let j = 0; j < imageHeight; j++) {
    for (let i = 0; i < imageWidth; i++) {
      const uImg = i / (imageWidth  - 1);
      const vImg = j / (imageHeight - 1);
      const srcX = px + uImg * scaleX;
      const srcY = py + (1 - vImg) * scaleY;
      const [dx, dy] = mapFn(srcX, srcY);
      const u    = dx / (aspect * viewportScale) + 0.5;
      const v    = dy / viewportScale + 0.5;
      const x    = Math.floor(u * width);
      const y    = Math.floor(v * height);
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      sample((y * width + x) * 4, uImg, vImg);
    }
  }

  //draw a circle
  const radius        = 0.5;
  const circleThresh  = 0.005;
  for (let j = 0; j < height; j++) {
    const v   = (j + 0.5) / height;
    const wy  = (v - 0.5) * viewportScale;
    for (let i = 0; i < width; i++) {
      const u   = (i + 0.5) / width;
      const wx  = (u - 0.5) * aspect * viewportScale;
      const idx = (j * width + i) * 4;
      const d   = Math.hypot(wx, wy);
      // only draw the outline where wx ≤ 0 (left half)
      if (taskId == '8') {
        if (wx <= 0 && Math.abs(d - radius) < circleThresh) {
          data[idx    ] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      } else {
        if (wx >= 0 && Math.abs(d - radius) < circleThresh) {
          data[idx    ] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
      
    }
  }
}