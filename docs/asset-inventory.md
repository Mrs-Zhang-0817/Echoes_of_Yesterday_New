# 《昨日重现》美术素材清单（2026-07-29 最终版）

## 一、当前 `assets/images/`（19 个文件，已全部接入代码）

### 场景底图
| 文件 | 大小 | 用途 | 使用关卡 |
|------|------|------|---------|
| `main_menu_bg.jpg` | 2.4MB | 主界面底图（室内场景） | Ch1 镜前 |
| `desk_bg.jpg` | 2.5MB | 餐桌/厨房场景照 | Ch6 餐桌 |
| `ch8_corridor.jpg` | 400KB | 走廊场景（签字关卡氛围） | Ch8 签字 |
| `ch9_balcony.jpg` | 576KB | 阳台场景（风铃关卡） | Ch9 风铃 |
| `ch10_livingroom.jpg` | 447KB | 客厅晨光场景 | Ch10 终章 |

### 交互物件
| 文件 | 大小 | 用途 | 使用关卡 |
|------|------|------|---------|
| `scene_puzzle.jpg` | 419KB | 拼图照片（接女儿） | Ch2 拼图 |
| `sign_scene.png` | 2.3MB | 签字表单底板 | Ch8 签字 |
| `ch8_mirror_wall.png` | 115KB | 墙上镜子框 | Ch8 (备用) |
| `ch8_mirror_stranger.png` | 164KB | 镜中陌生人 | Ch8 (备用) |
| `ch8_crack.png` | 57KB | 镜面裂纹叠加 | Ch8 (备用) |
| `ch8_hourglass.png` | 43KB | 沙漏 | Ch8 (备用) |
| `ch8_radio.png` | 66KB | 收音机 | Ch8 (备用) |
| `ch9_pipes.png` | 118KB | 风铃管组 | Ch9 风铃 |
| `ch9_notebook.png` | 232KB | 翻开的笔记本 | Ch9 (备用) |
| `ch10_porridge.png` | 54KB | 热粥碗 | Ch10 终章 |

### UI / 纹理
| 文件 | 大小 | 用途 | 使用关卡 |
|------|------|------|---------|
| `paper_base.png` | 2.6MB | 纸张纹理底图 | Ch8 签字纸张 |
| `paper_noise.png` | 2.3MB | 纸张噪点叠加 | Ch8 签字纸张 |
| `button_frame.png` | 1.8MB | 按钮边框 | 全局 (备用) |
| `report_base.png` | 2.6MB | 记忆报告底板 | Ch10 报告页 |

## 二、各关卡美术接入状态

| 关卡 | 状态 | 使用素材 |
|------|------|---------|
| Ch1 镜前 | ✅ 已接入 | `main_menu_bg.jpg` — 室内场景 + 暗色遮罩 + 程序化镜框/裂纹/粒子 |
| Ch2 拼图 | ✅ 已接入 | `scene_puzzle.jpg` — 拼图照片切割 + 灰度/褪色效果 |
| Ch3 迷宫 | ✅ 程序化 | 道路网格 + 建筑块 + 噪点 + 暗角（替代缺失的 mazeMap） |
| Ch4 警局 | ✅ 程序化 | 自绘警局场景（电话/表格/手环），优化质量高，保持不动 |
| Ch5 归家 | ✅ 程序化 | 自绘夜景/电梯场景，扫描动画精致，保持不动 |
| Ch6 餐桌 | ✅ 已接入 | `desk_bg.jpg` — 餐桌场景 + 暗色遮罩 + 程序化碗/蒸汽/粒子 |
| Ch7 夜醒 | ✅ 程序化 | 纯黑极简风格，核心美学不能替换 |
| Ch8 签字 | ✅ 已接入 | `ch8_corridor.jpg` — 走廊氛围，`sign_scene.png` — 签字表单，`paper_base.png` + `paper_noise.png` — 纸张纹理 |
| Ch9 风铃 | ✅ 已接入 | `ch9_balcony.jpg` — 阳台场景，`ch9_pipes.png` — 风铃管组（替代程序化窗框） |
| Ch10 终章 | ✅ 已接入 | `ch10_livingroom.jpg` — 客厅场景，`ch10_porridge.png` — 热粥碗图，`report_base.png` — 报告底板 |

## 三、已删除的冗余/损坏文件

| 文件 | 原因 |
|------|------|
| `puzzle_img.png` | PNG 损坏（缺 IEND 块），已被 scene_puzzle.jpg 替代 |
| `拼图.png` | 冗余副本，同样损坏 |
| `桌面.png` | 冗余副本 |
| `room_bg.png` | 旧 manifest 用，新代码不引用 |
| `scene_room.jpg` | 同上（JPEG 版） |
| `scene_desk.jpg` | 已用更精确命名的 desk_bg.jpg |
| `tmp_客厅场景底图.png` | 未引用 |
| `scene_maze_map.png` | 4.4MB，改为程序化渲染 |

## 四、素材来源

| 来源目录 | 迁入文件 |
|---------|---------|
| `.uploads/ch08/` | ch8_corridor, ch8_mirror_wall, ch8_mirror_stranger, ch8_crack, ch8_hourglass, ch8_radio |
| `.uploads/ch09/` | ch9_balcony, ch9_pipes, ch9_notebook |
| `.uploads/ch10/` | ch10_livingroom, ch10_porridge |
| `Echoes_of_Yesterday/pictures/` | main_menu_bg.jpg |
| `Echoes_of_Yesterday/assets/images/` | desk_bg.jpg (原名 scene_desk.jpg) |
| `Echoes_of_Yesterday/assets/ui/` | paper_base.png, paper_noise.png, button_frame.png |
| `Echoes_of_Yesterday/MemoryReport/BackgroundLayer/` | report_base.png |
