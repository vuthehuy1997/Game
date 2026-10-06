// Sáu thời kỳ giữ thành Đại Việt qua các mốc lịch sử có ghi chép. Mỗi thời kỳ có một luật riêng (rule).
export const ERAS = [
  {
    name: 'Cổ Loa', king: 'An Dương Vương', year: 'khoảng 179 TCN', foe: 'quân Triệu Đà', gold: 140, rule: 'nho',
    ruleName: 'Nỏ thần', ruleText: 'Tháp nỏ bắn mạnh hơn 50%.',
    bg: ['#2d3a24', '#6b7f4e'], accent: '#c9a449',
    lore: 'Thành Cổ Loa xoáy trôn ốc ba vòng thành. Nỏ thần trong tay vua An Dương Vương, quân Triệu Đà kéo đến ngoài cổng.',
    waves: [
      [{ kind: 'bo', n: 6, gap: 1.2 }, { kind: 'ky', n: 2, gap: 2 }],
      [{ kind: 'bo', n: 8, gap: 1 }, { kind: 'ky', n: 3, gap: 1.5 }],
      [{ kind: 'bo', n: 10, gap: .9 }, { kind: 'ky', n: 4, gap: 1.2 }],
    ],
  },
  {
    name: 'Hoan Châu', king: 'Mai Thúc Loan', year: '722', foe: 'quân Đường', gold: 150, rule: 'ky',
    ruleName: 'Hố chông trước kỵ binh', ruleText: 'Hố chông gây gấp đôi sát thương cho kỵ binh.',
    bg: ['#2a2f3d', '#5b6478'], accent: '#d8b26a',
    lore: 'Năm 722, Mai Thúc Loan dấy binh ở Hoan Châu. Kỵ binh nhà Đường phi nước đại, phải đào hố chông để chặn ngựa.',
    waves: [
      [{ kind: 'ky', n: 5, gap: 1.4 }, { kind: 'bo', n: 6, gap: 1 }],
      [{ kind: 'ky', n: 7, gap: 1.1 }, { kind: 'bo', n: 8, gap: 1 }],
      [{ kind: 'ky', n: 9, gap: 1 }, { kind: 'bo', n: 10, gap: .9 }],
    ],
  },
  {
    name: 'Hoa Lư', king: 'Đinh Bộ Lĩnh', year: '968', foe: 'các sứ quân', gold: 160, rule: 'khien',
    ruleName: 'Lính khiên', ruleText: 'Lính khiên chịu một nửa sát thương từ tháp nỏ.',
    bg: ['#3a3424', '#8a7a4a'], accent: '#e0b354',
    lore: 'Loạn sứ quân kéo dài. Đinh Bộ Lĩnh dẹp loạn thống nhất đất nước, nhưng các sứ quân cố giữ thành bằng lính khiên dày đặc.',
    waves: [
      [{ kind: 'khien', n: 3, gap: 2 }, { kind: 'bo', n: 6, gap: 1 }],
      [{ kind: 'khien', n: 4, gap: 1.8 }, { kind: 'bo', n: 8, gap: 1 }],
      [{ kind: 'khien', n: 5, gap: 1.6 }, { kind: 'ky', n: 4, gap: 1.4 }],
    ],
  },
  {
    name: 'Thành Nhà Hồ', king: 'Hồ Quý Ly', year: '1406–1407', foe: 'quân Minh', gold: 170, rule: 'phao',
    ruleName: 'Thần công', ruleText: 'Thần công giặc bắn phá tường và tháp từ xa.',
    bg: ['#3d2e26', '#8a6248'], accent: '#e8a86a',
    lore: 'Thành Nhà Hồ bằng đá xanh vững chãi. Quân Minh đưa thần công vào trận, bắn phá tường thành từ xa.',
    waves: [
      [{ kind: 'phao', n: 3, gap: 2.2 }, { kind: 'bo', n: 7, gap: 1 }],
      [{ kind: 'phao', n: 4, gap: 2 }, { kind: 'khien', n: 4, gap: 1.6 }],
      [{ kind: 'phao', n: 5, gap: 1.8 }, { kind: 'bo', n: 10, gap: .9 }],
    ],
  },
  {
    name: 'Hà Nội 1873', king: 'Quân dân Hà Nội', year: '1873', foe: 'quân Pháp', gold: 180, rule: 'phao_tay',
    ruleName: 'Pháo Tây', ruleText: 'Pháo giặc bắn trúng một tháp nỏ ngẫu nhiên mỗi vài giây.',
    bg: ['#2b3238', '#55616b'], accent: '#c7d0d8',
    lore: 'Tháng 11 năm 1873, quân Pháp đánh thành Hà Nội. Súng pháo của giặc có tầm xa hơn nỏ của ta nhiều lần.',
    waves: [
      [{ kind: 'phao_tay', n: 2, gap: 3 }, { kind: 'bo', n: 8, gap: 1 }],
      [{ kind: 'phao_tay', n: 3, gap: 2.5 }, { kind: 'bo', n: 9, gap: .9 }],
      [{ kind: 'phao_tay', n: 3, gap: 2.5 }, { kind: 'khien', n: 4, gap: 1.6 }],
    ],
  },
  {
    name: 'Điện Biên Phủ', king: 'Quân ta giữ thành', year: '1954', foe: 'quân xâm lược', gold: 200, rule: 'hao',
    ruleName: 'Hào giao thông', ruleText: 'Lính đào hào tiến sát, tháp nỏ không thấy chúng cho đến khi chúng ra khỏi hào. Vạc dầu vẫn diệt được chúng trong hào.',
    bg: ['#2f3a2a', '#65775a'], accent: '#e5c26b',
    lore: 'Điện Biên Phủ, 1954: hào giao thông đưa bộ binh tiến sát từng cứ điểm. Ở thành này, giặc cũng đào hào tiến sát tường thành. Hãy dùng vạc dầu để diệt chúng khi chúng còn trong hào.',
    waves: [
      [{ kind: 'hao', n: 6, gap: 1.2 }, { kind: 'bo', n: 6, gap: 1 }],
      [{ kind: 'hao', n: 8, gap: 1 }, { kind: 'khien', n: 4, gap: 1.6 }],
      [{ kind: 'hao', n: 10, gap: .9 }, { kind: 'phao', n: 4, gap: 2 }],
    ],
  },
];

export const BUILD = {
  wall: { name: 'Tường đá', cost: 30, sell: 15, hp: 150, block: true, short: 'Tường' },
  tower: { name: 'Tháp nỏ', cost: 45, sell: 22, hp: 90, block: true, range: 320, cd: 1.1, dmg: 18, short: 'Tháp' },
  pit: { name: 'Hố chông', cost: 20, sell: 10, hp: 1, block: false, dmg: 30, short: 'Hố' },
  fire: { name: 'Vạc dầu', cost: 35, sell: 17, hp: 1, block: false, dmg: 40, radius: 90, cd: 6, short: 'Vạc' },
};

export const ENEMY = {
  bo: { name: 'Lính bộ', hp: 60, spd: 38, dmg: 9, gold: 8 },
  ky: { name: 'Kỵ binh', hp: 48, spd: 95, dmg: 11, gold: 12 },
  khien: { name: 'Lính khiên', hp: 130, spd: 30, dmg: 9, gold: 16, shield: true },
  phao: { name: 'Thần công', hp: 80, spd: 24, dmg: 16, gold: 18, range: 220 },
  phao_tay: { name: 'Pháo Tây', hp: 100, spd: 20, dmg: 0, gold: 22, shellEvery: 3, shellDmg: 35 },
  hao: { name: 'Lính hào', hp: 70, spd: 120, dmg: 7, gold: 12, trench: true },
};

export const STAR_THRESHOLDS = [70, 35];
export const WAVE_BONUS = 40;
export const INCOME = 2;
export const GATE_MAX = 100;
