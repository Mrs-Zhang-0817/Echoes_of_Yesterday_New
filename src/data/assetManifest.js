// 所有关卡需要预加载的美术资源清单
// 素材已统一迁移至 assets/art/ 目录（按章节分类 + 语义化命名）
const assetManifest = {
  // ---- 全局 UI ----
  mainMenuBg:  './assets/art/ui/main-menu-bg.jpg',
  deskBg:      './assets/art/ui/scene-desk.jpg',
  paperBase:   './assets/art/ui/paper-base.jpg',
  paperNoise:  './assets/art/ui/paper-noise.jpg',
  buttonFrame: './assets/art/ui/btn-frame.jpg',
  reportBase:  './assets/art/ui/report-base.jpg',

  puzzle:      './assets/art/ui/scene-puzzle.jpg',
  sign:        './assets/art/ui/sign-scene.jpg',

  // ---- Ch02 接女儿放学 ----
  ch2_tinbox_open:  './assets/art/ch02-puzzle/tinbox-open.jpg',
  ch2_key_inside:   './assets/art/ch02-puzzle/key-inside.jpg',
  ch2_candy_inside: './assets/art/ch02-puzzle/candy-inside.jpg',
  ch2_flashback_01: './assets/art/ch02-puzzle/flashback-01.jpg',
  ch2_flashback_02: './assets/art/ch02-puzzle/flashback-02.jpg',
  ch2_flashback_03: './assets/art/ch02-puzzle/flashback-03.jpg',
  ch2_flashback_04: './assets/art/ch02-puzzle/flashback-04.jpg',
  ch2_flashback_05: './assets/art/ch02-puzzle/flashback-05.jpg',

  // ---- Ch03 迷途 ----
  ch3_bg_old_community: './assets/art/ch03-maze/old-community-bg.jpg',
  ch3_map_phone:        './assets/art/ch03-maze/map-phone.png',
  ch3_cityup_01:        './assets/art/ch03-maze/cityup-01.jpg',
  ch3_cityup_02:        './assets/art/ch03-maze/cityup-02.jpg',
  ch3_cityup_03:        './assets/art/ch03-maze/cityup-03.jpg',
  ch3_cityup_04:        './assets/art/ch03-maze/cityup-04.jpg',
  ch3_bg_city_street:   './assets/art/ch03-maze/city-street-bg.jpg',
  ch3_bg_school_gate:   './assets/art/ch03-maze/school-gate-bg.jpg',
  ch3_npc_passerby:     './assets/art/ch03-maze/npc-passerby.png',
  ch3_red_scarf_girl:   './assets/art/ch03-maze/red-scarf-girl.png',

  // ---- Ch04 警局 ----
  ch4_phone:    './assets/art/ch04-police/phone.jpg',
  ch4_police_01:'./assets/art/ch04-police/scene-01.jpg',
  ch4_police_02:'./assets/art/ch04-police/scene-02.jpg',
  ch4_police_03:'./assets/art/ch04-police/scene-03.jpg',
  ch4_police_04:'./assets/art/ch04-police/scene-04.jpg',
  ch4_police_05:'./assets/art/ch04-police/scene-05.jpg',
  ch4_police_06:'./assets/art/ch04-police/scene-06.jpg',
  ch4_police_07:'./assets/art/ch04-police/scene-07.jpg',
  ch4_police_08:'./assets/art/ch04-police/scene-08.jpg',

  // ---- Ch05 归家迷途 ----
  ch5_bg_elevator:            './assets/art/ch05-elevator/elevator-bg.jpg',
  ch5_elevator_sunflower_panel:'./assets/art/ch05-elevator/sunflower-panel.jpg',
  ch5_sunflower_sticker:       './assets/art/ch05-elevator/sunflower-sticker.jpg',

  // ---- Ch06 餐桌上的博弈 ----
  ch6_bg_diningroom: './assets/art/ch06-dinner/diningroom-bg.jpg',
  ch6_bowl_noodles:  './assets/art/ch06-dinner/bowl-noodles.png',

  // ---- Ch07 惊悚夜醒 ----
  ch7_bg_bedroom_night: './assets/art/ch07-night/bedroom-dark-bg.jpg',
  ch7_flashlight_beam:  './assets/art/ch07-night/flashlight-beam.jpg',
  ch7_hallucination_shadow:'./assets/art/ch07-night/hallucination-shadow.jpg',
  ch7_door_lock:        './assets/art/ch07-night/door-lock.jpg',

  // ---- Ch08 走廊的镜子 ----
  ch8_corridor:     './assets/art/ch08-mirror/corridor-bg.jpg',
  ch8_mirror_wall:  './assets/art/ch08-mirror/mirror-wall.png',
  ch8_mirror_stranger:'./assets/art/ch08-mirror/mirror-stranger.png',
  ch8_crack:        './assets/art/ch08-mirror/crack.png',
  ch8_hourglass:    './assets/art/ch08-mirror/hourglass.png',
  ch8_radio:        './assets/art/ch08-mirror/radio.png',
  ch8_mirror_smile: './assets/art/ch08-mirror/mirror-smile.png',
  ch8_radio_knob:   './assets/art/ch08-mirror/radio-knob.png',

  // ---- Ch09 风铃 ----
  ch9_balcony:              './assets/art/ch09-chime/balcony-bg.jpg',
  ch9_pipes:                './assets/art/ch09-chime/pipes.png',
  ch9_notebook:             './assets/art/ch09-chime/notebook.png',
  ch9_notebook_glyphs:      './assets/art/ch09-chime/notebook-glyphs.png',
  ch9_father_building_chime:'./assets/art/ch09-chime/father-building-chime.jpg',

  // ---- Ch10 认出 ----
  ch10_livingroom:              './assets/art/ch10-reunion/livingroom-bg.jpg',
  ch10_porridge:                './assets/art/ch10-reunion/porridge-bowl.png',
  ch10_daughter_porridge_closeup:'./assets/art/ch10-reunion/daughter-porridge-closeup.jpg',
  ch10_father_daughter_embrace:  './assets/art/ch10-reunion/father-daughter-embrace.jpg',

  // 终章档案右页医学知识卡
  medical_ch10: './assets/art/medical-photos/photo-ch10.jpg',

  // —— 漫画场景 ——
  comic_ch01_01: './assets/art/ch01-mirror/comic-01.jpg',
  comic_ch01_02: './assets/art/ch01-mirror/comic-02.jpg',
  comic_ch01_03: './assets/art/ch01-mirror/comic-03.jpg',
  comic_ch01_04: './assets/art/ch01-mirror/comic-04.jpg',
  comic_ch01_05: './assets/art/ch01-mirror/comic-05.jpg',

  comic_ch02_01: './assets/art/ch02-puzzle/comic-01.jpg',
  comic_ch02_02: './assets/art/ch02-puzzle/comic-02.jpg',
  comic_ch02_03: './assets/art/ch02-puzzle/comic-03.jpg',
  comic_ch02_04: './assets/art/ch02-puzzle/comic-04.jpg',

  comic_ch03_01: './assets/art/ch03-maze/comic-01.jpg',
  comic_ch03_02: './assets/art/ch03-maze/comic-02.jpg',
  comic_ch03_03: './assets/art/ch03-maze/comic-03.jpg',
  comic_ch03_04: './assets/art/ch03-maze/comic-04.jpg',
  comic_ch03_05: './assets/art/ch03-maze/comic-05.jpg',
  comic_ch03_06: './assets/art/ch03-maze/comic-06.jpg',
  comic_ch03_07: './assets/art/ch03-maze/comic-07.jpg',
  comic_ch03_08: './assets/art/ch03-maze/comic-08.jpg',

  comic_ch04_01: './assets/art/ch04-police/comic-01.jpg',
  comic_ch04_02: './assets/art/ch04-police/comic-02.jpg',
  comic_ch04_03: './assets/art/ch04-police/comic-03.jpg',
  comic_ch04_04: './assets/art/ch04-police/comic-04.jpg',
  comic_ch04_05: './assets/art/ch04-police/comic-05.jpg',
  comic_ch04_06: './assets/art/ch04-police/comic-06.jpg',

  comic_ch05_01: './assets/art/ch05-elevator/comic-01.jpg',
  comic_ch05_02: './assets/art/ch05-elevator/comic-02.jpg',
  comic_ch05_03: './assets/art/ch05-elevator/comic-03.jpg',
  comic_ch05_04: './assets/art/ch05-elevator/comic-04.jpg',
  comic_ch05_05: './assets/art/ch05-elevator/comic-05.jpg',
  comic_ch05_06: './assets/art/ch05-elevator/comic-06.jpg',
  comic_ch05_07: './assets/art/ch05-elevator/comic-07.jpg',

  comic_ch06_01: './assets/art/ch06-dinner/comic-01.jpg',
  comic_ch06_02: './assets/art/ch06-dinner/comic-02.jpg',
  comic_ch06_03: './assets/art/ch06-dinner/comic-03.jpg',
  comic_ch06_04: './assets/art/ch06-dinner/comic-04.jpg',

  comic_ch08_01: './assets/art/ch08-mirror/comic-01.jpg',
  comic_ch09_01: './assets/art/ch09-chime/comic-01.jpg',
};

export default assetManifest;