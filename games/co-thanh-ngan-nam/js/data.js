// Sáu thời kỳ giữ thành Đại Việt qua các mốc lịch sử có ghi chép. Mỗi thời kỳ có một luật riêng (rule)
// và một bộ quân địch riêng gồm 3 cấp (tiers, từ thấp đến cao). Khóa trong troops là vai trò dùng trong waves.
// Cờ vai trò: cav (kỵ binh, bị hố chông gấp đôi ở luật ky), shield (chịu một nửa tháp nỏ),
// range (đánh từ xa), cannon (vẽ pháo), shellEvery/shellDmg (pháo bắn tháp), trench (đào hào, ẩn khỏi tháp).
const troop = (name, hp, spd, dmg, gold, extra, look) => ({ name, hp, spd, dmg, gold, ...extra, look });

export const ERAS = [
  {
    name: 'Cổ Loa', king: 'An Dương Vương', year: 'khoảng 179 TCN', foe: 'quân Triệu Đà', gold: 140, rule: 'nho',
    ruleName: 'Nỏ thần', ruleText: 'Tháp nỏ bắn mạnh hơn 50%.',
    bg: ['#2d3a24', '#6b7f4e'], accent: '#c9a449',
    lore: 'Thành Cổ Loa xoáy trôn ốc ba vòng thành. Nỏ thần trong tay vua An Dương Vương, quân Triệu Đà kéo đến ngoài cổng.',
    tiers: ['bo', 'cung', 'tuong'],
    troops: {
      bo: troop('Lính giáo đồng', 60, 38, 9, 8, {}, { skin: '#c99a6a', hair: '#1c1410', shirt: '#6b5a3a', trim: '#a88a4a', pants: '#3a2e22', belt: '#8a6a3a', hat: 'bandana', band: '#8a6a3a', weapon: 'spear' }),
      cung: troop('Cung thủ Triệu', 45, 34, 7, 10, { range: 170 }, { skin: '#d8a878', hair: '#1c1410', shirt: '#3a5a3a', trim: '#c9a449', pants: '#2a2a20', belt: '#8a6a3a', hat: 'nonla', weapon: 'bow' }),
      tuong: troop('Tướng Triệu', 150, 30, 14, 20, { shield: true }, { skin: '#e0b48a', hair: '#201810', shirt: '#8a2a2a', trim: '#e9b949', pants: '#2a2020', belt: '#e9b949', hat: 'helmet', helm: '#9a7a3a', plume: '#b3261e', shield: 1, weapon: 'saber' }),
    },
    waves: [
      [{ kind: 'bo', n: 6, gap: 1.2 }, { kind: 'cung', n: 2, gap: 2 }],
      [{ kind: 'bo', n: 8, gap: 1 }, { kind: 'cung', n: 3, gap: 1.5 }],
      [{ kind: 'bo', n: 8, gap: .9 }, { kind: 'tuong', n: 1, gap: 2 }, { kind: 'cung', n: 4, gap: 1.2 }],
    ],
  },
  {
    name: 'Hoan Châu', king: 'Mai Thúc Loan', year: '722', foe: 'quân Đường', gold: 150, rule: 'ky',
    ruleName: 'Hố chông trước kỵ binh', ruleText: 'Hố chông gây gấp đôi sát thương cho kỵ binh.',
    bg: ['#2a2f3d', '#5b6478'], accent: '#d8b26a',
    lore: 'Năm 722, Mai Thúc Loan dấy binh ở Hoan Châu. Kỵ binh nhà Đường phi nước đại, phải đào hố chông để chặn ngựa.',
    tiers: ['bo', 'nu', 'ky'],
    troops: {
      bo: troop('Bộ binh Đường', 60, 38, 9, 8, {}, { skin: '#e3b98f', hair: '#201810', shirt: '#2e4a7a', trim: '#c9a449', pants: '#2a2a33', belt: '#c9a449', hat: 'helmet', helm: '#5a6a8a', plume: '#b3261e', weapon: 'spear' }),
      nu: troop('Cung nỏ Đường', 45, 34, 7, 10, { range: 190 }, { skin: '#e3b98f', hair: '#201810', shirt: '#2e4a7a', trim: '#c9a449', pants: '#2a2a33', belt: '#c9a449', hat: 'helmet', helm: '#4a5a6a', plume: '#c7d0d8', weapon: 'bow' }),
      ky: troop('Kỵ binh Đường', 48, 95, 11, 12, { cav: true }, { skin: '#e3b98f', hair: '#201810', shirt: '#5a3a2a', trim: '#c9a449', pants: '#2a2020', belt: '#c99a4a', hat: 'helmet', helm: '#2e4a7a', plume: '#e9b949', weapon: 'spear' }),
    },
    waves: [
      [{ kind: 'ky', n: 5, gap: 1.4 }, { kind: 'bo', n: 6, gap: 1 }],
      [{ kind: 'ky', n: 6, gap: 1.2 }, { kind: 'nu', n: 4, gap: 1.2 }, { kind: 'bo', n: 6, gap: 1 }],
      [{ kind: 'ky', n: 9, gap: 1 }, { kind: 'nu', n: 5, gap: 1 }, { kind: 'bo', n: 8, gap: .9 }],
    ],
  },
  {
    name: 'Hoa Lư', king: 'Đinh Bộ Lĩnh', year: '968', foe: 'các sứ quân', gold: 160, rule: 'khien',
    ruleName: 'Lính khiên', ruleText: 'Lính khiên chịu một nửa sát thương từ tháp nỏ.',
    bg: ['#3a3424', '#8a7a4a'], accent: '#e0b354',
    lore: 'Loạn sứ quân kéo dài. Đinh Bộ Lĩnh dẹp loạn thống nhất đất nước, nhưng các sứ quân cố giữ thành bằng lính khiên dày đặc.',
    tiers: ['dao', 'khien', 'tuong'],
    troops: {
      dao: troop('Lính đao sứ quân', 70, 60, 10, 12, {}, { skin: '#d8ae80', hair: '#201810', shirt: '#5a3a2a', trim: '#a0844a', pants: '#3a3020', belt: '#a0844a', hat: 'bandana', band: '#8a3a2a', weapon: 'saber' }),
      khien: troop('Lính khiên sứ quân', 130, 30, 9, 16, { shield: true }, { skin: '#e0b48a', hair: '#201810', shirt: '#4a4f5c', trim: '#9aa0ac', pants: '#2a2a33', belt: '#9aa0ac', hat: 'helmet', helm: '#8a8f9a', plume: '#b3261e', shield: 1, weapon: 'saber' }),
      tuong: troop('Sứ quân', 160, 28, 14, 22, { shield: true }, { skin: '#e0b48a', hair: '#201810', shirt: '#3a3424', trim: '#e0b354', pants: '#2a2a22', belt: '#e0b354', hat: 'mu', mu: '#3a3424', weapon: 'club' }),
    },
    waves: [
      [{ kind: 'khien', n: 3, gap: 2 }, { kind: 'dao', n: 6, gap: 1 }],
      [{ kind: 'khien', n: 4, gap: 1.8 }, { kind: 'dao', n: 8, gap: 1 }],
      [{ kind: 'khien', n: 4, gap: 1.6 }, { kind: 'tuong', n: 1, gap: 2 }, { kind: 'dao', n: 6, gap: 1 }],
    ],
  },
  {
    name: 'Thành Nhà Hồ', king: 'Hồ Quý Ly', year: '1406–1407', foe: 'quân Minh', gold: 170, rule: 'phao',
    ruleName: 'Thần công', ruleText: 'Thần công giặc bắn phá tường và tháp từ xa.',
    bg: ['#3d2e26', '#8a6248'], accent: '#e8a86a',
    lore: 'Thành Nhà Hồ bằng đá xanh vững chãi. Quân Minh đưa thần công vào trận, bắn phá tường thành từ xa.',
    tiers: ['ky', 'hoa', 'thancong'],
    troops: {
      ky: troop('Kỵ binh Minh', 60, 90, 11, 12, { cav: true }, { skin: '#e3b98f', hair: '#201810', shirt: '#2a4a7a', trim: '#c9a449', pants: '#2a2a33', belt: '#c9a449', hat: 'helmet', helm: '#3a3f4a', plume: '#2f6b57', weapon: 'spear' }),
      hoa: troop('Hỏa súng Minh', 50, 30, 8, 12, { range: 200 }, { skin: '#e3b98f', hair: '#201810', shirt: '#2a4a7a', trim: '#c9a449', pants: '#2a2a33', belt: '#c9a449', hat: 'helmet', helm: '#4a4a4a', plume: '#c7d0d8' }),
      thancong: troop('Thần công Minh', 80, 24, 16, 18, { range: 240, cannon: true }, { skin: '#e0b48a', hair: '#201810', shirt: '#3a4a3a', trim: '#c9a449', pants: '#2a2a2a', belt: '#c9a449', hat: 'helmet', helm: '#3a3f4a', plume: '#2f6b57' }),
    },
    waves: [
      [{ kind: 'thancong', n: 3, gap: 2.2 }, { kind: 'ky', n: 7, gap: 1 }],
      [{ kind: 'thancong', n: 4, gap: 2 }, { kind: 'hoa', n: 4, gap: 1.6 }],
      [{ kind: 'thancong', n: 5, gap: 1.8 }, { kind: 'hoa', n: 6, gap: 1 }, { kind: 'ky', n: 4, gap: 1.2 }],
    ],
  },
  {
    name: 'Hà Nội 1873', king: 'Quân dân Hà Nội', year: '1873', foe: 'quân Pháp', gold: 180, rule: 'phao_tay',
    ruleName: 'Pháo Tây', ruleText: 'Pháo giặc bắn trúng một tháp nỏ ngẫu nhiên mỗi vài giây.',
    bg: ['#2b3238', '#55616b'], accent: '#c7d0d8',
    lore: 'Tháng 11 năm 1873, quân Pháp đánh thành Hà Nội. Súng pháo của giặc có tầm xa hơn nỏ của ta nhiều lần.',
    tiers: ['le', 'sung', 'phao_tay'],
    troops: {
      le: troop('Lính lê dương', 70, 40, 9, 8, {}, { skin: '#f0cfae', hair: '#6a4a2a', shirt: '#2e3a52', trim: '#c7d0d8', pants: '#2a2a33', belt: '#c7d0d8', hat: 'helmet', helm: '#4a5a6a', plume: '#c7d0d8', weapon: 'spear' }),
      sung: troop('Súng trường Pháp', 55, 34, 7, 10, { range: 180 }, { skin: '#f0cfae', hair: '#6a4a2a', shirt: '#3a4a5a', trim: '#c7d0d8', pants: '#2a2a33', belt: '#c7d0d8', hat: 'helmet', helm: '#55606a', plume: '#c7d0d8' }),
      phao_tay: troop('Pháo Tây', 100, 20, 0, 22, { shellEvery: 3, shellDmg: 35, cannon: true }, { skin: '#f0cfae', hair: '#6a4a2a', shirt: '#2e3a52', trim: '#c7d0d8', pants: '#2a2a33', belt: '#c7d0d8', hat: 'helmet', helm: '#4a5a6a', plume: '#c7d0d8' }),
    },
    waves: [
      [{ kind: 'phao_tay', n: 2, gap: 3 }, { kind: 'le', n: 8, gap: 1 }],
      [{ kind: 'phao_tay', n: 3, gap: 2.5 }, { kind: 'le', n: 6, gap: .9 }, { kind: 'sung', n: 3, gap: 1.2 }],
      [{ kind: 'phao_tay', n: 3, gap: 2.5 }, { kind: 'sung', n: 4, gap: 1.6 }, { kind: 'le', n: 4, gap: 1 }],
    ],
  },
  {
    name: 'Điện Biên Phủ', king: 'Quân ta giữ thành', year: '1954', foe: 'quân xâm lược', gold: 200, rule: 'hao',
    ruleName: 'Hào giao thông', ruleText: 'Lính đào hào tiến sát, tháp nỏ không thấy chúng cho đến khi chúng ra khỏi hào. Vạc dầu vẫn diệt được chúng trong hào.',
    bg: ['#2f3a2a', '#65775a'], accent: '#e5c26b',
    lore: 'Điện Biên Phủ, 1954: hào giao thông đưa bộ binh tiến sát từng cứ điểm. Ở thành này, giặc cũng đào hào tiến sát tường thành. Hãy dùng vạc dầu để diệt chúng khi chúng còn trong hào.',
    tiers: ['sung', 'hao', 'phao'],
    troops: {
      sung: troop('Lính súng trường', 55, 34, 7, 10, { range: 180 }, { skin: '#d8ae80', hair: '#201810', shirt: '#4a5a3a', trim: '#a0844a', pants: '#3a3020', belt: '#a0844a', hat: 'helmet', helm: '#5a6a4a', plume: '#8a6a3a' }),
      hao: troop('Lính đào hào', 70, 120, 7, 12, { trench: true }, { skin: '#d8ae80', hair: '#201810', shirt: '#6a5a3a', trim: '#a0844a', pants: '#3a3020', belt: '#a0844a', hat: 'bandana', band: '#6a5a3a' }),
      phao: troop('Pháo binh', 80, 24, 16, 18, { range: 240, cannon: true }, { skin: '#e0b48a', hair: '#201810', shirt: '#3a4a3a', trim: '#c9a449', pants: '#2a2a2a', belt: '#c9a449', hat: 'helmet', helm: '#3a3f4a', plume: '#2f6b57' }),
    },
    waves: [
      [{ kind: 'hao', n: 6, gap: 1.2 }, { kind: 'sung', n: 6, gap: 1 }],
      [{ kind: 'hao', n: 8, gap: 1 }, { kind: 'sung', n: 4, gap: 1.6 }],
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

export const STAR_THRESHOLDS = [70, 35];
export const WAVE_BONUS = 40;
export const INCOME = 2;
export const GATE_MAX = 100;
