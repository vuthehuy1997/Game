export const W = 960, H = 540, GROUND_Y = 480;
export const ANCHOR = { x: 150, y: 380 };
// Tầm bắn xa nhất (góc 45°, kéo hết cỡ) ≈ (MAX_PULL·LAUNCH_K)²/GRAVITY — phải lớn hơn hẳn khoảng cách xa nhất
// tới mục tiêu trong LEVELS (≈670px ở màn cuối) để mọi màn đều có thể thắng được bằng một góc bắn hợp lý.
export const MAX_PULL = 90, LAUNCH_K = 7.5, GRAVITY = 600, DMG_K = 0.09, PROJ_R = 14;
export const BLAST_R = 70, BLAST_DMG = 26;
export const AMMO = {
  da: { name: 'Đá', desc: 'Đá sông, va chạm đâu đánh đó theo tốc độ.' },
  dau: { name: 'Tẩm dầu', desc: 'Nổ khi chạm, lan sát thương ra xung quanh.' },
};
export const AMMO_BUTTONS = [
  { kind: 'da', x: 16, y: 494, w: 110, h: 34, key: '1' },
  { kind: 'dau', x: 136, y: 494, w: 150, h: 34, key: '2' },
];
export const G = {
  mode: 'menu', level: -1, shotsLeft: 0, fireLeft: 0, ammo: 'da', wind: 0,
  won: false, stars: 0, settleT: 0, dragging: false, aim: { x: ANCHOR.x, y: ANCHOR.y }, t: 0, shake: 0,
};
export const blocks = [];
export const targets = [];
export let proj = null;
export function setProj(p) { proj = p; }
