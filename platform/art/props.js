// Đồ vật đặt trên sân: vò sành, thùng gỗ.
import { ell } from './draw.js';
import { FB } from '../ui/theme.js';

// Vò sành và thùng gỗ đập được
export function drawProp(c, p) {
  const x = p.x, y = p.gy + 2, sh = p.shake > 0 ? Math.sin(p.shake * 80) * 3 : 0;
  ell(c, x, y, 22, 5, 'rgba(0,0,0,.25)');
  c.save(); c.translate(x + sh, y);
  if (p.kind === 'jar') {
    c.fillStyle = '#8a5a34'; c.beginPath(); c.moveTo(-12, -44); c.quadraticCurveTo(-26, -30, -16, 0); c.lineTo(16, 0); c.quadraticCurveTo(26, -30, 12, -44); c.closePath(); c.fill();
    c.fillStyle = '#6b4226'; c.fillRect(-13, -50, 26, 7);
    c.strokeStyle = '#c9a36b'; c.lineWidth = 2; c.beginPath(); c.moveTo(-18, -24); c.quadraticCurveTo(0, -18, 18, -24); c.stroke();
    c.fillStyle = '#b3261e'; c.fillRect(-7, -36, 14, 10); c.fillStyle = '#f4e7c9'; c.font = `9px ${FB}`; c.textAlign = 'center'; c.fillText('rượu', 0, -28);
  } else {
    c.fillStyle = '#9a6a3a'; c.fillRect(-22, -42, 44, 42);
    c.strokeStyle = '#6b4424'; c.lineWidth = 3; c.strokeRect(-22, -42, 44, 42);
    c.beginPath(); c.moveTo(-22, -42); c.lineTo(22, 0); c.moveTo(22, -42); c.lineTo(-22, 0); c.stroke();
  }
  c.restore();
}
