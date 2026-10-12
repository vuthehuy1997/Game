// Dò tia kiểu DDA (Digital Differential Analysis), cách dựng hình giả-3D cổ điển của Wolfenstein 3D:
// từ vị trí người chơi, dò từng ô lưới theo một góc cho tới khi gặp tường, không cần GPU/WebGL.
export function castRay(grid, px, py, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  let mapX = Math.floor(px), mapY = Math.floor(py);
  const deltaX = Math.abs(1 / (cos || 1e-9)), deltaY = Math.abs(1 / (sin || 1e-9));
  let stepX, sideDistX, stepY, sideDistY;
  if (cos < 0) { stepX = -1; sideDistX = (px - mapX) * deltaX; } else { stepX = 1; sideDistX = (mapX + 1 - px) * deltaX; }
  if (sin < 0) { stepY = -1; sideDistY = (py - mapY) * deltaY; } else { stepY = 1; sideDistY = (mapY + 1 - py) * deltaY; }
  let side = 0, hit = '#';
  for (let i = 0; i < 64; i++) {
    if (sideDistX < sideDistY) { sideDistX += deltaX; mapX += stepX; side = 0; } else { sideDistY += deltaY; mapY += stepY; side = 1; }
    const row = grid[mapY];
    const c = row ? row[mapX] : undefined;
    if (c === undefined) { hit = '#'; break; }
    if (c !== '.') { hit = c; break; }
  }
  // dist: khoảng cách dọc theo tia (chưa hiệu chỉnh mắt cá); caller tự nhân cos(lệch góc) để ra khoảng cách vuông góc
  const raw = side === 0 ? (sideDistX - deltaX) : (sideDistY - deltaY);
  return { dist: Math.max(.0001, raw), side, hit };
}
