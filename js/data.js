'use strict';
// Dữ liệu game: nhân vật nói, 6 ải (cốt truyện, đợt địch, bẫy), chỉ số địch và boss, đòn đánh, luyện công.

const SPK = {
  narr: { name: 'Sử quan' },
  hero: { name: 'Tiểu Hổ', short: 'Tiểu Hổ', look: 'hero' },
  master: { name: 'Đại Sơn (sư phụ thời trẻ)', short: 'Đại Sơn', look: 'master' },
  ttt: { name: 'Vua Trần Thái Tông', look: 'ttt' },
  ttd: { name: 'Thái sư Trần Thủ Độ', look: 'ttd' },
  letan: { name: 'Lê Tần', look: 'letan' },
  aju: { name: 'A Truật', look: 'bossAju' },
  villager: { name: 'Bà cụ làng Phù Ủng', look: 'villager' },
  pnl: { name: 'Phạm Ngũ Lão', look: 'pnl' },
  hdv: { name: 'Hưng Đạo Vương Trần Quốc Tuấn', look: 'hdv' },
  elder: { name: 'Bô lão điện Diên Hồng', look: 'elder' },
  tbt: { name: 'Trần Bình Trọng', look: 'tbt' },
  tqk: { name: 'Thượng tướng Trần Quang Khải', look: 'tqk' },
  tqt: { name: 'Hoài Văn hầu Trần Quốc Toản', look: 'tqt' },
  tkd: { name: 'Phó tướng Trần Khánh Dư', look: 'tkd' },
  bandit: { name: 'Hắc Hổ', look: 'bossBandit' },
  captain: { name: 'Vạn hộ quân Nguyên', look: 'bossCaptain' },
  toado: { name: 'Toa Đô', look: 'bossToaDo' },
  lyhang: { name: 'Lý Hằng', look: 'bossLyHang' },
  zhang: { name: 'Trương Văn Hổ', look: 'bossZhang' },
  omn: { name: 'Ô Mã Nhi', look: 'bossOMN' },
};

// Câu đồng đội hô trong trận
const ALLY_LINES = {
  pnl: ['Trai Phù Ủng đây!', 'Giáo đâm vào đùi còn chẳng sợ!', 'Sát Thát!', 'Tiểu Hổ, đỡ lưng cho ta!'],
  tqt: ['Phá cường địch, báo hoàng ân!', 'Anh em, theo cờ ta!', 'Ta tuy nhỏ nhưng chí không nhỏ!'],
  tkd: ['Lấy công chuộc tội!', 'Đánh chìm thuyền lương!', 'Một hạt gạo cũng không cho qua!'],
  letan: ['Đánh úp bến thuyền!', 'Giặc quen ngựa, không quen sông!', 'Đại Sơn, giữ sườn cho ta!'],
};

/*
  Mỗi ải:
  - waves: đợt địch. {at: toạ độ kích hoạt, list: [...]} hoặc đợt giữ thành {survive: giây, pool, max, label}.
  - boss: đợt cuối có boss:true; bossTalk là hội thoại ngay trước khi boss xuất hiện.
  - ally: đồng đội đánh cùng. hazard: bẫy môi trường khi đang giao chiến.
  - par: mốc giây cho ấn Thần tốc. combo: chuỗi đòn cho ấn Liên hoàn.
  - side: ải ngoại truyện, nằm ngoài tiến trình chính, mở bằng mốc sao 'side'. tier: bậc sức mạnh của giặc (mặc định = thứ tự ải).
    hero: người chơi điều khiển ai (mặc định Tiểu Hổ).
*/
const STAGES = [
  {
    name: 'Làng Phù Ủng', year: 'Năm 1284', bg: 'village', len: 3300, par: 150, combo: 20, props: ['jar', 'crate'],
    waves: [
      { at: 420, list: ['bandit', 'bandit'] },
      { at: 1150, list: ['bandit', 'bandit', 'bandit:cap'] },
      { at: 1900, list: ['bandit', 'bandit', 'bandit', 'bandit:cap'] },
      { at: 2750, list: ['bossBandit', 'bandit', 'bandit'], boss: true },
    ],
    intro: [
      ['narr', 'Năm 1284. Nhà Nguyên đã nuốt trọn nhà Tống, nay lăm le tràn xuống phương Nam lần thứ hai. Khắp Đại Việt, trai tráng rèn võ chờ ngày giữ nước.'],
      ['hero', 'Ta là Tiểu Hổ, đệ tử võ đường Vạn Kiếp. Sư phụ sai ta đi khắp các làng tìm người tài về giúp Hưng Đạo Vương.'],
      ['villager', 'Cứu với! Bọn sơn tặc Hắc Hổ lại xuống làng cướp thóc. Giặc sắp đến mà chúng còn ức hiếp dân lành!'],
      ['hero', 'Bà cứ lui vào trong. Để đó cho cháu!'],
    ],
    bossTalk: [
      ['bandit', 'Thằng nhãi nào dám phá chuyện làm ăn của Hắc Hổ ta?'],
      ['hero', 'Giặc sắp tràn sang mà ngươi còn cướp của dân. Hôm nay ta dạy ngươi một bài học!'],
    ],
    outro: [
      ['bandit', 'Hự... Ta chịu thua. Từ nay xin bỏ nghề cướp, theo quân triều đình đánh giặc!'],
      ['narr', 'Bên đường, một chàng trai ngồi đan sọt, mải nghĩ đến nỗi đoàn quân của Hưng Đạo Vương đi qua mà chẳng tránh. Lính lấy giáo đâm vào đùi, chàng vẫn ngồi yên.'],
      ['hdv', 'Người kia! Giáo đâm vào đùi mà không hay biết, ngươi đang nghĩ gì vậy?'],
      ['pnl', 'Bẩm, tôi đang nghĩ một câu trong binh thư, chưa nghĩ ra nên không biết có giáo đâm.'],
      ['hdv', 'Người trai làng Phù Ủng này là tướng tài. Tên ngươi là gì?'],
      ['pnl', 'Tôi là Phạm Ngũ Lão. Xin được theo Đại vương giết giặc!'],
      ['hdv', 'Tiểu Hổ, ngươi cũng khá lắm. Ta thường tới bữa quên ăn, nửa đêm vỗ gối, chỉ căm tức chưa xả thịt lột da quân thù. Về Thăng Long cùng ta!'],
    ],
    card: { eyebrow: 'Sử ký · Năm 1284', title: 'Người đan sọt làng Phù Ủng', text: 'Phạm Ngũ Lão (1255–1320) người làng Phù Ủng, nay thuộc Hưng Yên. Tương truyền ông mải nghĩ binh thư đến nỗi bị giáo đâm vào đùi mà không biết. Hưng Đạo Vương thu nhận ông, về sau gả con gái cho. Cùng thời gian ấy, Hưng Đạo Vương soạn <b>Hịch tướng sĩ</b>, và quân sĩ thích lên cánh tay hai chữ <b>“Sát Thát”</b> (giết giặc Thát Đát) để tỏ quyết tâm.' },
  },
  {
    name: 'Thăng Long rực lửa', year: 'Đầu năm 1285', bg: 'citadel', len: 3800, par: 240, combo: 30, ally: 'pnl', props: ['crate', 'jar'],
    hazard: { kind: 'debris', every: [2.4, 3.8] },
    waves: [
      { at: 420, list: ['soldier', 'sword'] },
      { at: 1100, list: ['soldier', 'sword', 'archer', 'soldier:cap'] },
      { at: 1850, survive: 35, pool: ['soldier', 'archer', 'sword', 'soldier'], max: 4, label: 'Giữ cổng thành', sub: 'Cầm chân giặc 35 giây cho dân rút' },
      { at: 2600, list: ['shield', 'sword:cap', 'drummer', 'soldier'] },
      { at: 3250, list: ['bossCaptain', 'soldier', 'archer'], boss: true },
    ],
    intro: [
      ['narr', 'Trước đó ít lâu, vua Trần mời các bô lão khắp nước về điện Diên Hồng, hỏi nên hoà hay nên đánh.'],
      ['elder', 'Đánh! Đánh!'],
      ['narr', 'Tháng Giêng năm 1285, hơn năm mươi vạn quân Nguyên do Thoát Hoan cầm đầu tràn qua biên giới.'],
      ['hdv', 'Giặc đông và đang hăng. Ta tạm lui khỏi Thăng Long để giữ sức, chờ thời phản công. Tiểu Hổ, hãy chặn hậu cho dân chúng rút đi!'],
      ['pnl', 'Tiểu Hổ, ta theo ngươi! Để giặc thấy trai Phù Ủng đánh thế nào.'],
      ['hero', 'Có huynh đỡ lưng thì còn gì bằng! Coi chừng xà nhà cháy rơi xuống đấy.'],
    ],
    bossTalk: [
      ['captain', 'Kinh thành đã là của Đại Nguyên! Lũ các ngươi còn chạy đi đâu?'],
      ['pnl', 'Thành trống thì ngươi cứ lấy. Còn người Đại Việt thì đừng hòng!'],
    ],
    outro: [
      ['captain', 'Bọn Nam man này... sao đánh hoài không lui!'],
      ['narr', 'Tin dữ truyền về: tướng Trần Bình Trọng chặn giặc ở bãi Thiên Mạc, sa vào tay quân Nguyên. Giặc dụ hàng, hứa phong vương đất Bắc.'],
      ['tbt', 'Ta thà làm quỷ nước Nam, chứ không thèm làm vương đất Bắc!'],
      ['hero', 'Tướng quân... Tiểu Hổ xin khắc ghi lời ấy.'],
    ],
    card: { eyebrow: 'Sử ký · Năm 1285', title: 'Diên Hồng và Thiên Mạc', text: 'Hội nghị Diên Hồng do Thượng hoàng Trần Thánh Tông triệu tập để hỏi ý các bô lão, và câu trả lời đồng lòng là “Đánh!”. Đầu năm 1285, quân Nguyên chiếm Thăng Long nhưng triều Trần đã rút đi, để lại thành trống. Trần Bình Trọng bị bắt khi chặn hậu ở bãi Thiên Mạc; ông khước từ mọi lời dụ dỗ và bị giặc giết.' },
  },
  {
    name: 'Bến Hàm Tử, Tây Kết', year: 'Mùa hè 1285', bg: 'river', len: 3900, par: 230, combo: 35, ally: 'tqt', props: ['crate', 'jar'],
    waves: [
      { at: 420, list: ['soldier', 'archer', 'sword'] },
      { at: 1100, list: ['shield', 'archer', 'sword:cap'] },
      { at: 1800, list: ['lancer', 'heavy', 'archer', 'drummer'] },
      { at: 2550, list: ['shield', 'lancer', 'heavy', 'archer:cap', 'soldier:cmd'] },
      { at: 3350, list: ['bossToaDo', 'archer', 'soldier:cap'], boss: true },
    ],
    intro: [
      ['tqt', 'Ta là Trần Quốc Toản! Không được dự bàn việc nước ở Bình Than, ta về tụ họp trai tráng, dựng cờ “Phá cường địch, báo hoàng ân”!'],
      ['tqt', 'Quân ta vừa thắng lớn ở Hàm Tử. Giờ phải chặn đạo quân Toa Đô từ phương Nam kéo lên!'],
      ['tqk', 'Ta đánh Chương Dương, các ngươi giữ bến sông Tây Kết. Đừng để Toa Đô hội quân với Thoát Hoan.'],
      ['hero', 'Bọn Khiếp Tiết đội mũ đỏ lao giáo rất xa. Gặp chúng thì phải lướt né!'],
    ],
    bossTalk: [
      ['toado', 'Ta đánh từ Chiêm Thành ra đây, lũ nhãi nhép dám cản đường sao?'],
      ['tqt', 'Cờ “Phá cường địch” đây! Anh em, xông lên!'],
    ],
    outro: [
      ['narr', 'Toa Đô tử trận ở Tây Kết. Cùng lúc, Trần Quang Khải phá giặc ở Chương Dương rồi thu lại Thăng Long.'],
      ['tqk', 'Đoạt sáo Chương Dương độ, Cầm Hồ Hàm Tử quan. Thái bình tu trí lực, Vạn cổ thử giang san.'],
      ['hero', 'Thái bình rồi phải gắng sức, non nước ấy ngàn thu... Ta sẽ nhớ mãi.'],
    ],
    card: { eyebrow: 'Sử ký · Năm 1285', title: 'Chương Dương, Hàm Tử, Tây Kết', text: 'Mùa hè 1285, quân Trần phản công: Trần Nhật Duật cùng Trần Quốc Toản thắng ở Hàm Tử, Trần Quang Khải đánh Chương Dương rồi khôi phục Thăng Long, Toa Đô bị giết ở Tây Kết. Sau chiến thắng, Trần Quang Khải làm bài thơ <i>Tụng giá hoàn kinh sư</i>:', poem: '“Đoạt sáo Chương Dương độ,\nCầm Hồ Hàm Tử quan.\nThái bình tu trí lực,\nVạn cổ thử giang san.”' },
  },
  {
    name: 'Rừng Vạn Kiếp', year: 'Mùa hè 1285', bg: 'forest', len: 4000, par: 260, combo: 40, ally: 'pnl', props: ['crate', 'jar'],
    waves: [
      { at: 420, list: ['soldier', 'lancer', 'sword'] },
      { at: 1100, list: ['archer', 'archer', 'lancer:cap', 'sword'] },
      { at: 1850, survive: 30, pool: ['soldier', 'lancer', 'archer', 'sword', 'heavy'], max: 5, label: 'Phục kích!', sub: 'Đánh tan đoàn quân tháo chạy trong 30 giây' },
      { at: 2650, list: ['shield', 'lancer', 'heavy', 'drummer', 'sword:cmd'] },
      { at: 3450, list: ['bossLyHang', 'lancer:cap', 'archer'], boss: true },
    ],
    intro: [
      ['narr', 'Thua liền mấy trận, Thoát Hoan tháo chạy về phương Bắc theo ngả Vạn Kiếp.'],
      ['hdv', 'Phạm Ngũ Lão, ngươi cùng Tiểu Hổ phục binh trong rừng Vạn Kiếp. Giặc qua sông thì đổ ra đánh!'],
      ['pnl', 'Anh em nằm im, chờ tiếng chiêng lệnh!'],
      ['hero', 'Trời tối rồi. Đom đóm bay đầy rừng... Giặc tới!'],
    ],
    bossTalk: [
      ['lyhang', 'Ta là Lý Hằng, hộ giá Trấn Nam vương! Kẻ nào cản đường, tên độc sẽ tiễn kẻ đó!'],
      ['hero', 'Muốn về nước thì bước qua Tiểu Hổ trước đã!'],
    ],
    outro: [
      ['lyhang', 'Tên... tên có độc... Vương gia, chạy mau!'],
      ['narr', 'Lý Hằng trúng tên độc mà chết. Thoát Hoan sợ hãi, phải chui vào ống đồng, sai quân khiêng chạy thoát về nước.'],
      ['pnl', 'Chạy nhanh thật! Nhưng giặc còn quay lại, ta phải sẵn sàng.'],
    ],
    card: { eyebrow: 'Sử ký · Năm 1285', title: 'Vạn Kiếp và chiếc ống đồng', text: 'Mùa hè 1285, đạo quân của Thoát Hoan rút chạy qua vùng Vạn Kiếp thì bị quân Trần phục kích. Tướng Nguyên Lý Hằng trúng tên độc, về đến nơi thì chết. Theo sử cũ, Thoát Hoan phải chui vào ống đồng cho quân lính khiêng mới thoát được về nước. Cuộc xâm lược lần thứ hai thất bại.' },
  },
  {
    name: 'Biển Vân Đồn', year: 'Cuối năm 1287', bg: 'sea', len: 3900, par: 250, combo: 45, ally: 'tkd', props: ['crate', 'crate', 'jar'],
    hazard: { kind: 'firerain', every: [3.2, 4.6] },
    waves: [
      { at: 420, list: ['soldier', 'potter', 'sword'] },
      { at: 1100, list: ['shield', 'potter', 'archer', 'sword:cap'] },
      { at: 1800, list: ['lancer', 'potter', 'heavy', 'drummer'] },
      { at: 2550, list: ['shield:cap', 'heavy', 'potter', 'lancer', 'archer', 'potter:cmd'] },
      { at: 3300, list: ['bossZhang', 'potter', 'shield:cap'], boss: true },
    ],
    intro: [
      ['narr', 'Cuối năm 1287, quân Nguyên kéo sang lần thứ ba. Một đoàn thuyền lương khổng lồ do Trương Văn Hổ chỉ huy theo đường biển vào tiếp tế.'],
      ['tkd', 'Ta là Trần Khánh Dư. Lần trước để chiến thuyền giặc lọt qua Vân Đồn, Thượng hoàng tha tội cho ta lập công. Lần này, một hạt gạo cũng không cho qua!'],
      ['hero', 'Tiểu Hổ xin nhảy sang thuyền giặc trước! Coi chừng lũ ném hũ lửa, chỗ nào cháy thì tránh ra.'],
    ],
    bossTalk: [
      ['zhang', 'Thuyền lương của Đại Nguyên mà ai dám động vào? Ném hỏa pháo!'],
      ['tkd', 'Đánh chìm hết! Không để lại một thuyền!'],
    ],
    outro: [
      ['zhang', 'Lương thảo mất hết rồi... Chạy! Chạy về Quỳnh Châu!'],
      ['narr', 'Trương Văn Hổ bỏ thuyền trốn thoát. Lương thảo chìm xuống biển. Mấy chục vạn quân Nguyên đóng ở Vạn Kiếp lâm cảnh đói, phải tính đường rút.'],
      ['tkd', 'Giặc đói thì ắt phải chạy. Mau báo tin về cho Hưng Đạo Vương!'],
    ],
    card: { eyebrow: 'Sử ký · Cuối năm 1287', title: 'Trận Vân Đồn', text: 'Trần Khánh Dư trấn giữ Vân Đồn nhưng không chặn nổi chiến thuyền của Ô Mã Nhi, bị Thượng hoàng triệu về hỏi tội rồi tha cho lập công. Ông phục binh đánh tan đoàn thuyền lương của Trương Văn Hổ theo sau; phần lớn lương thảo chìm xuống biển, Trương Văn Hổ trốn thoát. Mất lương, quân Nguyên buộc phải rút, mở đường cho trận Bạch Đằng.' },
  },
  {
    name: 'Sông Bạch Đằng', year: 'Tháng 4 năm 1288', bg: 'bachdang', len: 4200, par: 300, combo: 50, ally: 'pnl', props: ['crate'],
    hazard: { kind: 'bolt', every: [3, 4.5] },
    waves: [
      { at: 420, list: ['soldier', 'sword', 'archer', 'soldier:cap'] },
      { at: 1100, list: ['shield', 'lancer', 'heavy', 'archer', 'drummer'] },
      { at: 1800, list: ['heavy:cap', 'potter', 'archer', 'sword', 'lancer'] },
      { at: 2600, list: ['shield:cmd', 'heavy', 'lancer:cap', 'potter', 'archer', 'sword'] },
      { at: 3600, list: ['bossOMN', 'shield:cap', 'archer'], boss: true },
    ],
    intro: [
      ['narr', 'Tháng 3 năm Mậu Tý (1288). Hết lương, quân Nguyên chia đường rút về. Đạo thủy quân của Ô Mã Nhi theo sông Bạch Đằng ra biển.'],
      ['hdv', 'Ta cho đóng cọc gỗ đầu bịt sắt dưới lòng sông. Nước triều lên thì cọc chìm, nước rút thì cọc nhô lên.'],
      ['hdv', 'Dụ thuyền giặc vào lúc triều cường, đánh lúc nước ròng. Tiểu Hổ, xông lên bắt sống Ô Mã Nhi!'],
      ['hdv', 'Khi cọc nhô lên, hãy đứng sao cho bãi cọc nằm giữa ngươi và hắn. Hắn lao tới là mắc cọc.'],
      ['pnl', 'Quân bộ đã mai phục hai bên bờ. Chỉ chờ nước ròng!'],
    ],
    bossTalk: [
      ['omn', 'Hừ! Lần trước ta thua, lần này quyết san bằng nước Nam!'],
      ['hero', 'Sông này từng nhấn chìm quân Nam Hán. Hôm nay đến lượt các ngươi!'],
    ],
    outro: [
      ['omn', 'Cọc... cọc ở đâu ra thế này!? Thuyền vỡ hết rồi!'],
      ['narr', 'Nước ròng. Hàng trăm chiến thuyền Nguyên mắc cọc, vỡ tan. Ô Mã Nhi bị bắt sống. Cuộc xâm lược lần thứ ba sụp đổ.'],
      ['hdv', 'Tiểu Hổ, ngươi đã lớn thật rồi. Nhưng nhớ lấy: phải khoan thư sức dân để làm kế sâu rễ bền gốc.'],
      ['hero', 'Đệ tử xin ghi lòng. Võ công để giữ nước, không phải để hơn thua.'],
    ],
    card: { eyebrow: 'Sử ký · 9 tháng 4 năm 1288', title: 'Trận Bạch Đằng', text: 'Ngày 8 tháng 3 năm Mậu Tý (9/4/1288), Hưng Đạo Vương dùng trận địa cọc trên sông Bạch Đằng, lặp lại cách Ngô Quyền phá quân Nam Hán năm 938. Hạm đội Nguyên bị tiêu diệt, Ô Mã Nhi bị bắt. Ba lần kháng chiến chống Nguyên Mông (1258, 1285, 1288) của nhà Trần được gọi là <b>Hào khí Đông A</b>, vì chữ Trần (陳) ghép từ chữ Đông (東) và bộ A (阝).' },
  },
  {
    name: 'Đông Bộ Đầu', year: 'Tháng Giêng 1258', bg: 'dongbodau', len: 3800, par: 240, combo: 30, side: true, tier: 1, hero: 'master', ally: 'letan', props: ['crate', 'jar'],
    waves: [
      { at: 420, list: ['soldier', 'archer', 'sword'] },
      { at: 1100, list: ['archer', 'archer', 'sword:cap', 'soldier'] },
      { at: 1850, survive: 30, pool: ['archer', 'sword', 'soldier', 'lancer'], max: 4, label: 'Đánh úp bến thuyền', sub: 'Giữ chân giặc 30 giây cho thuyền quân ta cập bến' },
      { at: 2600, list: ['lancer', 'archer', 'drummer', 'sword:cap', 'soldier'] },
      { at: 3250, list: ['bossAju', 'archer', 'lancer'], boss: true },
    ],
    intro: [
      ['narr', 'Sư phụ kể: “Hồi ta bằng tuổi con, giặc Mông Cổ đã sang một lần rồi.” Tháng Giêng năm 1258, tướng Ngột Lương Hợp Thai từ Vân Nam đánh xuống Đại Việt.'],
      ['narr', 'Vua Trần Thái Tông đích thân cầm quân ở Bình Lệ Nguyên, nhưng thế giặc mạnh, phải lui. Lê Tần lấy ván thuyền che tên cho vua. Triều đình rời Thăng Long.'],
      ['ttt', 'Thế giặc như vậy, nên đánh hay nên hàng?'],
      ['ttd', 'Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo!'],
      ['narr', 'Giặc vào Thăng Long chỉ thấy thành trống, thiếu lương. Đêm 24 tháng Chạp, quân Trần ngược sông Hồng đánh úp bến Đông Bộ Đầu.'],
      ['letan', 'Đại Sơn, theo ta! Giặc quen đánh trên lưng ngựa, đêm nay ta đánh chúng trên bến sông.'],
      ['master', 'Xin theo tướng quân. Cung thủ chúng bắn xa lắm, phải đổi làn mà áp sát!'],
    ],
    bossTalk: [
      ['aju', 'Vó ngựa Mông Cổ đã đạp khắp thiên hạ. Một bến sông nhỏ mà đòi cản ta?'],
      ['letan', 'Ngựa các ngươi không quen sông nước phương Nam đâu. Đánh!'],
    ],
    outro: [
      ['aju', 'Rút! Rút về Vân Nam!'],
      ['narr', 'Thua ở Đông Bộ Đầu, quân Mông Cổ bỏ Thăng Long chạy về Vân Nam. Chạy vội đến nỗi không kịp cướp phá, dân gọi mỉa là “giặc Phật”. Qua trại Quy Hóa, chúng còn bị chủ trại Hà Bổng tập kích.'],
      ['master', 'Gần ba mươi năm sau, chúng lại sang. Vì thế ta mới dạy con: võ công là để giữ nước.'],
      ['hero', 'Đệ tử hiểu rồi, thưa sư phụ.'],
    ],
    card: { eyebrow: 'Sử ký · Năm 1258', title: 'Đông Bộ Đầu và “giặc Phật”', text: 'Kháng chiến lần thứ nhất (1258): quân Mông Cổ do Ngột Lương Hợp Thai chỉ huy từ Vân Nam tiến xuống. Sau trận Bình Lệ Nguyên, triều Trần rút khỏi Thăng Long. Khi vua Trần Thái Tông hỏi kế, Thái sư Trần Thủ Độ đáp: <b>“Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo”</b>. Ngày 29 tháng 1 năm 1258 (24 tháng Chạp năm Đinh Tỵ), quân Trần phản công ở Đông Bộ Đầu, giặc phải rút về nước. Lê Tần sau được ban tên Lê Phụ Trần. A Truật là con trai Ngột Lương Hợp Thai, có theo cha trong chiến dịch này; nhân vật Đại Sơn và cuộc đối đầu ở bến sông là phần hư cấu của game.' },
  },
];

/*
  Địch thường: hp, tốc độ, tầm đánh, sát thương, thời gian vung đòn (wind), xp khi hạ.
  ranged: cung thủ. block: đỡ đòn phía trước. lunge: lao giáo từ xa. pot: ném hũ lửa.
  combo: số nhát chém liên tiếp. armor: không bị khựng bởi đòn nhẹ. support: lính trống tăng sức quân bạn.
  Boss: rank (Tướng / Đại tướng), moves dùng từ đầu, moves2 mở khi dưới 50% máu,
  Đại tướng (grand) có thêm giai đoạn 3 dưới 25% máu: đánh dồn dập và dùng chiêu "fury" (chém liên hoàn).
*/
const EDEF = {
  bandit:  { name: 'Sơn tặc', hp: 34, spd: 125, reach: 60, dmg: 7, wind: .38, coins: [2, 4], xp: 6 },
  soldier: { name: 'Lính giáo', hp: 44, spd: 112, reach: 86, dmg: 9, wind: .42, coins: [3, 5], xp: 8 },
  sword:   { name: 'Lính kiếm', hp: 40, spd: 145, reach: 66, dmg: 7, wind: .3, combo: 2, coins: [3, 5], xp: 8 },
  archer:  { name: 'Cung thủ', hp: 30, spd: 105, ranged: true, dmg: 8, wind: .6, coins: [3, 6], xp: 8 },
  shield:  { name: 'Lính khiên', hp: 80, spd: 78, reach: 64, dmg: 11, wind: .5, block: true, coins: [5, 8], xp: 12 },
  lancer:  { name: 'Khiếp Tiết', hp: 58, spd: 128, reach: 90, dmg: 12, wind: .42, lunge: true, coins: [5, 8], xp: 12 },
  potter:  { name: 'Hỏa pháo thủ', hp: 36, spd: 100, ranged: true, pot: true, dmg: 9, wind: .65, coins: [4, 7], xp: 10 },
  heavy:   { name: 'Lính đao lớn', hp: 115, spd: 70, reach: 108, dmg: 17, wind: .8, armor: true, coins: [6, 10], xp: 16 },
  drummer: { name: 'Lính trống trận', hp: 42, spd: 100, support: true, coins: [5, 8], xp: 12 },
  bossAju:     { boss: true, rank: 'Tướng', name: 'A Truật', hp: 520, spd: 170, reach: 100, dmg: 14, moves: ['charge', 'volley', 'slam'], moves2: ['summon', 'volley'], summon: ['archer:cap', 'sword'], coins: [60, 60], xp: 130 },
  bossBandit:  { boss: true, rank: 'Đầu lĩnh', name: 'Hắc Hổ', hp: 330, spd: 150, reach: 92, dmg: 12, moves: ['charge', 'slam'], moves2: ['summon'], summon: ['bandit', 'bandit:cap'], coins: [40, 40], xp: 80 },
  bossCaptain: { boss: true, rank: 'Tướng', name: 'Vạn hộ quân Nguyên', hp: 440, spd: 150, reach: 100, dmg: 13, moves: ['charge', 'slam'], moves2: ['volley', 'summon'], summon: ['soldier:cap', 'archer'], coins: [55, 55], xp: 110 },
  bossToaDo:   { boss: true, rank: 'Đại tướng', grand: true, name: 'Toa Đô, Nguyên soái', hp: 600, spd: 160, reach: 118, dmg: 15, moves: ['charge', 'slam', 'volley'], moves2: ['summon', 'fury'], summon: ['shield', 'archer:cap', 'lancer'], coins: [70, 70], xp: 150 },
  bossLyHang:  { boss: true, rank: 'Tướng', name: 'Lý Hằng', hp: 600, spd: 175, reach: 104, dmg: 15, moves: ['charge', 'poison', 'slam'], moves2: ['summon', 'volley'], summon: ['lancer:cap', 'archer'], coins: [80, 80], xp: 150 },
  bossZhang:   { boss: true, rank: 'Tướng', name: 'Trương Văn Hổ', hp: 640, spd: 150, reach: 122, dmg: 15, moves: ['slam', 'pots', 'charge'], moves2: ['summon', 'pots'], summon: ['potter:cap', 'shield'], coins: [90, 90], xp: 160 },
  bossOMN:     { boss: true, rank: 'Đại tướng', grand: true, name: 'Ô Mã Nhi', hp: 820, spd: 170, reach: 124, dmg: 16, moves: ['charge', 'slam', 'volley'], moves2: ['tide', 'summon', 'tide', 'fury'], summon: ['shield:cap', 'lancer', 'potter'], coins: [110, 110], xp: 220, phase2: { banner: 'Nước ròng!', sub: 'Cọc nhô lên: dụ Ô Mã Nhi lao vào bãi cọc cùng làn', tideOut: true } },
};
// Cấp bậc của lính thường: ghi trong đợt địch dạng 'soldier:cap' (đội trưởng) hoặc 'soldier:cmd' (chỉ huy)
const RANKS = {
  n:   { label: '', hp: 1, dmg: 1, sc: 1, coin: 1, xp: 1 },
  cap: { label: 'Đội trưởng', hp: 2.2, dmg: 1.3, sc: 1.14, coin: 2, xp: 2.5 },
  cmd: { label: 'Chỉ huy', hp: 3.6, dmg: 1.5, sc: 1.27, coin: 3.5, xp: 5 },
};

// Liên hoàn quyền: thời lượng, khung ra đòn a0..a1, độ rộng, sát thương, đẩy lùi, lao tới
const ATK = [null,
  { dur: .25, a0: .06, a1: .15, w: 60, dmg: 8, kb: 150, lunge: 140 },
  { dur: .29, a0: .08, a1: .18, w: 70, dmg: 9, kb: 170, lunge: 150 },
  { dur: .44, a0: .13, a1: .26, w: 84, dmg: 16, kb: 60, lunge: 280, heavy: true },   // hất thẳng lên để đánh tiếp (tung hứng)
];

const UPS = [
  { k: 'atk', name: 'Quyền cước', desc: 'Mọi đòn mạnh hơn 20%.' },
  { k: 'hp', name: 'Khí huyết', desc: 'Thêm 25 sinh lực tối đa.' },
  { k: 'mp', name: 'Nội công', desc: 'Thêm 15 nội lực, hồi nội lực nhanh hơn.' },
];
const upCost = lv => 30 + lv * 25;

// Địa danh trên bản đồ hành quân (toạ độ gần đúng, mang tính minh hoạ), theo thứ tự ải
const MAP_POINTS = [
  { place: 'Phù Ủng', lat: 20.80, lon: 106.12 },
  { place: 'Thăng Long', lat: 21.03, lon: 105.85 },
  { place: 'Hàm Tử, Tây Kết', lat: 20.87, lon: 105.98 },
  { place: 'Vạn Kiếp', lat: 21.12, lon: 106.38 },
  { place: 'Vân Đồn', lat: 21.07, lon: 107.42 },
  { place: 'Bạch Đằng', lat: 20.92, lon: 106.78 },
  { place: 'Đông Bộ Đầu', lat: 21.17, lon: 105.73 },
];

/* ---------------- Kỹ năng & cây kỹ năng ----------------
   3 nhánh × 3 bậc. Học bậc sau cần bậc trước cùng nhánh ≥ 1. Mỗi cấp tốn 1 điểm kỹ năng (nhận khi lên cấp).
   slot: kỹ năng chủ động gán vào phím (1 K · 2 L · 3 I · 4 O · 5 H). Kỹ năng không có slot là nội công bị động. */
const SKILLS = {
  lienhoan: { name: 'Liên Hoàn Quyền', branch: 0, tier: 0, desc: 'Đòn đánh thường (J) mạnh hơn.', lv: ['Sát thương +15%', 'Sát thương +30%, ra đòn nhanh hơn', 'Sát thương +45%, đòn thứ ba tung sóng quyền'] },
  xoay:     { name: 'Toàn Phong Cước', branch: 0, tier: 1, slot: 2, key: 'L', mp: 18, cd: [3.2, 2.7, 2.2], desc: 'Xoay người đá liên hoàn quanh mình.', lv: ['Đá năm cú quanh người', 'Sát thương +30%', 'Cuốn giặc lại gần'] },
  diachan:  { name: 'Địa Chấn Quyền', branch: 0, tier: 2, slot: 5, key: 'H', mp: 30, cd: [7, 6, 5], desc: 'Đấm xuống đất, chấn động cả ba làn.', lv: ['Đánh ngã giặc quanh mình', 'Sát thương +30%', 'Vùng chấn động rộng hơn'] },
  chuong:   { name: 'Chưởng Long Biên', branch: 1, tier: 0, slot: 1, key: 'K', mp: 20, cd: [1, .9, .8], desc: 'Phóng chưởng xuyên thấu, phá khiên.', lv: ['Một chưởng', 'Sát thương +30%', 'Phóng liền hai chưởng'] },
  thietbo:  { name: 'Thiết Bố Sam', branch: 1, tier: 1, slot: 4, key: 'O', mp: 12, cd: [4, 3.4, 2.8], desc: 'Vận công đỡ đòn; bị đánh trúng thì phản đòn.', lv: ['Đỡ 0,6 giây', 'Đỡ 0,8 giây', 'Phản đòn mạnh gấp đôi'] },
  haokhi:   { name: 'Hào Khí Đông A', branch: 1, tier: 2, desc: 'Nộ đầy nhanh hơn, tuyệt kỹ Sát Thát mạnh hơn.', lv: ['Nộ +25%, tuyệt kỹ +30%', 'Nộ +50%, tuyệt kỹ +60%', 'Nộ +75%, tuyệt kỹ +90%'] },
  thanphap: { name: 'Lăng Ba Bộ', branch: 2, tier: 0, desc: 'Lướt (Shift) hồi nhanh hơn.', lv: ['Hồi lướt nhanh hơn', 'Lướt xuyên qua gây sát thương', 'Hồi lướt rất nhanh'] },
  hoxung:   { name: 'Bạch Hổ Xung', branch: 2, tier: 1, slot: 3, key: 'I', mp: 22, cd: [4, 3.4, 2.8], desc: 'Lao như hổ vồ, húc văng mọi kẻ trên đường.', lv: ['Lao một quãng ngắn', 'Sát thương +30%', 'Lao xa hơn'] },
  phicuoc:  { name: 'Phi Long Cước', branch: 2, tier: 2, desc: 'Đá trên không (nhảy rồi J) mạnh hơn.', lv: ['Phi cước +40%', 'Nhảy được hai lần', 'Phi cước +80%'] },
};
const BRANCHES = ['Ngoại công', 'Nội công', 'Thân pháp'];
const ACTIVE = ['chuong', 'xoay', 'hoxung', 'thietbo', 'diachan']; // theo thứ tự phím 1..5
const xpNeed = lv => 50 + lv * 35;

/* ---------------- Thử thách & mốc sao ----------------
   Mỗi ải có 3 ấn. r = kết quả trận (time, maxCombo, diff = độ khó thấp nhất đã dùng trong trận). Ấn mới đạt thưởng CH_COINS văn. */
const CH_COINS = 40;
const CHALS = [
  { id: 'speed', name: 'Thần tốc', desc: st => `Thắng trong ${fmtTime(st.par)}`, ok: (r, st) => r.time <= st.par },
  { id: 'combo', name: 'Liên hoàn', desc: st => `Đánh chuỗi ${st.combo} đòn không bị ngắt`, ok: (r, st) => r.maxCombo >= st.combo },
  { id: 'hard', name: 'Hổ tướng', desc: () => 'Thắng ở độ khó Khó', ok: r => r.diff >= 2 },
];
// Tổng số sao mở dần phần thưởng vĩnh viễn cho ô lưu
const MILESTONES = [
  { need: 4, id: 'coin', name: 'Túi gấm', desc: 'Tiền nhặt được nhiều hơn 20%' },
  { need: 6, id: 'side', name: 'Chuyện xưa', desc: 'Mở ải ngoại truyện Đông Bộ Đầu (1258)' },
  { need: 9, id: 'rage', name: 'Khí thế', desc: 'Vào trận có sẵn 40 hào khí' },
  { need: 13, id: 'sp', name: 'Bí kíp', desc: 'Thêm 1 điểm kỹ năng' },
  { need: 17, id: 'armor', name: 'Giáp Sát Thát', desc: 'Giảm 10% sát thương phải chịu' },
];
const totalStars = sv => (sv.stars || []).reduce((a, b) => a + (b || 0), 0);
const ms = id => totalStars(S) >= MILESTONES.find(m => m.id === id).need;

/* ---------------- Võ đài (chế độ chơi lại) ----------------
   Một "ải" tạm, không nằm trong STAGES: một khung hình, các đợt nối nhau, không có sao hay ấn.
   endless: đợt sinh vô tận bằng gen(n), cứ 5 đợt một tướng, giặc mạnh dần theo tier. Kỷ lục = số đợt đã qua.
   rush: lần lượt đấu cả 7 tướng. Kỷ lục = thời gian nhanh nhất. */
const BOSS_ORDER = ['bossBandit', 'bossAju', 'bossCaptain', 'bossToaDo', 'bossLyHang', 'bossZhang', 'bossOMN'];
const RUSH_BONUS = 100;
function endlessWave(n) {
  const tier = Math.min(10, n * .6);
  if ((n + 1) % 5 === 0) return { at: 0, tier, boss: true, list: [BOSS_ORDER[((n + 1) / 5 - 1) % BOSS_ORDER.length], 'soldier', 'archer'] };
  const pool = ['bandit', 'soldier', 'sword', 'archer'].concat(n >= 3 ? ['shield', 'lancer'] : [], n >= 6 ? ['heavy', 'potter'] : []);
  const list = Array.from({ length: Math.min(3 + (n >> 1), 7) }, () => pick(pool));
  if (n % 3 === 2) list[0] += ':cap';
  if (n >= 8 && n % 4 === 0) list[1] += ':cmd';
  if (n >= 6 && n % 2 === 0) list.push('drummer');
  return { at: 0, tier, list };
}
function makeArena(kind) {
  return kind === 'endless'
    ? { arena: kind, label: 'Thí luyện', name: 'Thí luyện Vạn Kiếp', sub: 'Trụ được bao nhiêu đợt?', bg: 'forest', len: W, tier: 0, waves: [], gen: endlessWave }
    : { arena: kind, label: 'Đấu tướng', name: 'Đấu tướng', sub: `Hạ lần lượt ${BOSS_ORDER.length} tướng giặc`, bg: 'citadel', len: W, tier: 0,
        waves: BOSS_ORDER.map((b, k) => ({ at: 0, tier: Math.max(0, k - 1), boss: true, list: [b] })) };
}

/* ---------------- Tuyệt học: chọn một trong ba ----------------
   Mở ở cấp PATH_LV. Chọn lần đầu miễn phí, đổi sang đường khác tốn PATH_COST văn. Lưu ở S.path. */
const PATH_LV = 6, PATH_COST = 30;
const PATHS = [
  { id: 'manh', name: 'Mãnh Hổ', branch: 'Ngoại công', desc: 'Chuỗi đòn càng dài đánh càng đau: mỗi đòn trong chuỗi +2% sát thương, tối đa +40%.' },
  { id: 'tam', name: 'Tĩnh Tâm', branch: 'Nội công', desc: 'Kỹ năng tốn ít hơn 30% nội lực. Mỗi tên giặc bị hạ hồi 6 nội lực.' },
  { id: 'yen', name: 'Phi Yến', branch: 'Thân pháp', desc: 'Lướt xuyên qua một đòn đánh thì thời gian chậm lại, lướt hồi ngay và được 15 hào khí.' },
];
const skillCost = id => Math.round(SKILLS[id].mp * (S.path === 'tam' ? .7 : 1));

/* ---------------- Hành trang: mua ở võ đường, dùng trong trận ----------------
   S.bag[id] = số đang có. Đã dùng là mất, kể cả khi thua trận. */
const ITEMS = [
  { id: 'banh', key: 'Q', slot: 'i1', name: 'Bánh chưng', desc: 'Hồi 40% sinh lực và giải độc.', cost: 25, max: 3 },
  { id: 'ruou', key: 'E', slot: 'i2', name: 'Rượu nếp', desc: 'Thêm 50 hào khí và hồi đầy nội lực.', cost: 30, max: 2 },
];
