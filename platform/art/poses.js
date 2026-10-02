// Tư thế cơ bản cho nhân vật chibi (truyền vào tham số thứ năm của drawChibi).
// Mỗi tư thế nhận trạng thái nhân vật o = { t: đồng hồ riêng, walk: pha bước chân, st: thời gian trong trạng thái }
// và trả về các góc tay chân. Game ghép thêm tư thế riêng của mình (đòn đánh, kỹ năng) bên cạnh các tư thế này.
export const POSES = {
  idle: o => ({ bob: Math.sin(o.t * 4) * 1.5, armF: .3 + Math.sin(o.t * 4) * .05, armB: -.3, blink: (o.t % 3.2) < .12 }),
  run: o => ({ legF: Math.sin(o.walk) * .8, legB: -Math.sin(o.walk) * .8, armF: -Math.sin(o.walk) * .8, armB: Math.sin(o.walk) * .8, bob: Math.abs(Math.sin(o.walk)) * 4, lean: .08 }),
  air: () => ({ legF: .7, legB: -.2, armF: 2.3, armB: -2.1 }),
  land: () => ({ legF: .5, legB: -.5, bob: -4 }),
  dash: () => ({ lean: .45, legF: .9, legB: -.9, armF: -1.2, armB: -1.5 }),
  hurt: () => ({ lean: -.3, armF: 2.4, armB: -2.4, hurtFace: 1 }),
  guard: () => ({ armF: 2.6, armB: 2.3, legF: .45, legB: -.45, bob: -3 }),
  airkick: () => ({ legF: 1.4, legB: -.1, armF: -.8, armB: -1.4, lean: -.3 }),
  dead: o => ({ down: Math.min(1, o.st * 3), hurtFace: 1 }),
};
