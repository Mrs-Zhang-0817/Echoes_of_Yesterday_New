# 《昨日重现》美术素材路径清单

> 生成时间：2026-07-29 | 用途：盘点可用美术素材，标记哪些已安装、哪些未使用
> **2026-07-29 17:55 更新**：第二~四节所列旧仓库素材已全部安装进 `assets/images/`（28 个文件，中文名照片/底图统一改为 ASCII 命名：`report_photo_chN.png`、`report_bg_chN.png`、`sign_panel_vN.png`、`main_menu_bg.jpg`）。`scene_maze_map.png` 已补回主 assets。已接入代码：Ch1 主界面底图、Ch10 报告底板、manifest 新增 mainMenuBg/reportBase/paperBase。另发现：旧仓库 `拼图.png` 原件完好（本地损坏版是复制事故），已存为 `puzzle_img_fixed.png`。剩余空缺见 `docs/missing-assets.md`。

---

## 一、当前项目已安装的素材

### `assets/images/`（主项目工作目录，10 个文件）

| 文件 | 尺寸 | 用途 | 代码引用状态 |
|------|------|------|-------------|
| `room_bg.png` | 1672×941 | 客厅场景 | ✅ `src/main.js` manifest → `game.images.room` |
| `scene_room.jpg` | — | 客厅场景 (JPEG) | ❌ 代码未引用，与 room_bg.png 冗余 |
| `desk_bg.png` | 1672×941 | 桌面特写 | ✅ `src/main.js` manifest → `game.images.desk` |
| `scene_desk.jpg` | — | 桌面特写 (JPEG) | ❌ 代码未引用，与 desk_bg.png 冗余 |
| `scene_puzzle.jpg` | — | 拼图底图（正品） | ✅ `src/main.js` + `src/main_new.js` → `game.images.puzzle` |
| `puzzle_img.png` | 1448×1086 | 拼图底图 | ❌ **文件损坏**（缺 IEND 块），已被 scene_puzzle.jpg 替代 |
| `拼图.png` | — | 与 puzzle_img.png 重复 | ❌ 冗余 + 损坏 |
| `桌面.png` | — | 与 desk_bg.png 重复 | ❌ 冗余 |
| `sign_scene.png` | 1448×1086 | 签字表单底板 (Ch8) | ✅ `src/main_new.js` manifest → `game.images.sign` |
| `tmp_客厅场景底图.png` | 840KB | 客厅场景备选 | ❌ 未引用 |

### `build_out/assets/images/`（构建产物，3 个文件）

| 文件 | 状态 |
|------|------|
| `scene_puzzle.jpg` | ✅ 构建时复制 |
| `sign_scene.png` | ✅ 构建时复制 |
| `scene_maze_map.png` | ⚠️ **仅存在于 build_out，主 assets/images/ 缺失**（被 src/main_new.js 引用但加载会失败） |

---

## 二、Echoes_of_Yesterday 旧仓库中可用但未安装的素材

以下素材在 `Echoes_of_Yesterday/` 旧仓库中存在，但**未被复制到当前项目 `assets/images/`**，也未在代码中引用。

### 1. 主界面素材（`Echoes_of_Yesterday/pictures/`）

| 文件 | 用途 | 建议接入关卡 |
|------|------|-------------|
| `主界面底图.jpg` | 游戏主菜单/封面底图 | Ch0 标题画面 / Ch1 开场 |
| `按钮图.png` | UI 按钮图形 | 全局 UI / 弹层按钮 |
| `书本翻页底图.png` | 书本翻开效果底图 | Ch10 记忆报告翻书效果 |

### 2. UI 系统素材（`Echoes_of_Yesterday/assets/ui/`）

| 文件 | 用途 | 建议接入 |
|------|------|---------|
| `backgrounds/paper_base.png` | 纸张纹理底图 | 全局弹层 / Ch8 签字 / Ch10 记忆报告 |
| `textures/paper_noise.png` | 纸张噪点纹理 | 叠加到暖旧纸张背景 |
| `frames/button_frame.png` | 按钮边框 | 全局按钮装饰 |

### 3. Ch1 记忆物品素材（`Echoes_of_Yesterday/assets/memory_items/chapter01/`）

| 文件 | 用途 |
|------|------|
| `memory_001.png` | 镜前记忆物品 1 |
| `memory_002.png` | 镜前记忆物品 2 |
| `memory_003.png` | 镜前记忆物品 3 |
| `memory_004.png` | 镜前记忆物品 4 |
| `memory_005.png` | 镜前记忆物品 5 |
| `memory_items.json` | 物品元数据（名称、描述、位置） |

→ **可直接用于 Ch1「镜前」的点击热区互动**

### 4. 签字表单面板（`Echoes_of_Yesterday/美术素材/`）

| 文件 | 用途 |
|------|------|
| `签字单面板 (1).png` | 签字表单备选版本 1 |
| `签字单面板 (2).png` | 签字表单备选版本 2 |

→ 当前项目已用 `sign_scene.png`，这两个是备选/替换方案

### 5. 记忆恢复报告素材（`Echoes_of_Yesterday/MemoryReport/`）

**底板：**
| 文件 | 用途 |
|------|------|
| `BackgroundLayer/report_base.png` | 报告底板 |

**章节照片（PhotoLayer）：**
| 文件 | 对应关卡 |
|------|---------|
| `PhotoLayer/chapter_memory_photo/ch3.png` | Ch3 迷途 |
| `PhotoLayer/chapter_memory_photo/ch4.png` | Ch4 警局 |
| `PhotoLayer/chapter_memory_photo/ch6.png` | Ch6 温暖日常 |
| `PhotoLayer/chapter_memory_photo/ch9.png` | Ch9 风铃 |

**档案页相片（高分辨率）：**
| 文件 | 对应关卡 |
|------|---------|
| `档案页相片/ch2.PNG` | Ch2 接女儿 |
| `档案页相片/ch3.PNG` | Ch3 迷途 |
| `档案页相片/ch4.PNG` | Ch4 警局 |
| `档案页相片/ch6.PNG` | Ch6 温暖日常 |
| `档案页相片/ch9.PNG` | Ch9 风铃 |

### 6. 记忆报告新底图（`Echoes_of_Yesterday/记忆恢复报告新底图/`）

| 文件 | 用途 |
|------|------|
| `第二章.png` | Ch2 单独底图 |
| `第三章.png` | Ch3 单独底图 |
| `第五章.png` | Ch5 单独底图 |
| `memorybutton1.jpg` | 报告按钮 1 |
| `memorybutton2.png` | 报告按钮 2 |
| `memorybutton3.png` | 报告按钮 3 |
| `memorybutton1-transparent.png` | 透明按钮 1 |
| `memorybutton2-transparent.png` | 透明按钮 2 |
| `memorybutton3-transparent.png` | 透明按钮 3 |

### 7. 设计参考图（`Echoes_of_Yesterday/Design_Document/Reference_Image/`）

| 文件 | 用途 |
|------|------|
| `memory_report_ui.png` | 记忆报告 UI 设计稿 |
| `main_menu_ui.png` | 主菜单 UI 设计稿 |
| `typography_reference.png` | 排版参考 |

→ 这些不是游戏素材，是设计参考，不需要安装到项目中

---

## 三、汇总：建议复用的素材清单

### 🔴 高优先级（可直接用于未完成关卡）

| 素材 | 来源路径 | 建议用途 |
|------|---------|---------|
| `主界面底图.jpg` | `Echoes_of_Yesterday/pictures/` | Ch0 标题 / Ch1 开场 |
| `memory_001~005.png` + json | `Echoes_of_Yesterday/assets/memory_items/chapter01/` | Ch1 镜前点击热区 |
| `report_base.png` | `Echoes_of_Yesterday/MemoryReport/BackgroundLayer/` | Ch10 记忆报告底板 |
| `ch2~ch9.PNG/png` | `Echoes_of_Yesterday/MemoryReport/档案页相片/` 或 `PhotoLayer/` | Ch10 记忆报告照片层 |
| `scene_maze_map.png` | `build_out/assets/images/` | Ch3 迷宫背景（补到主 assets/images/） |

### 🟡 中优先级（增强现有关卡）

| 素材 | 来源路径 | 建议用途 |
|------|---------|---------|
| `paper_base.png` | `Echoes_of_Yesterday/assets/ui/backgrounds/` | Ch8 签字纸张纹理增强 |
| `paper_noise.png` | `Echoes_of_Yesterday/assets/ui/textures/` | 全局纸张效果叠加 |
| `button_frame.png` | `Echoes_of_Yesterday/assets/ui/frames/` | 全局按钮装饰 |
| `签字单面板 (1)/(2).png` | `Echoes_of_Yesterday/美术素材/` | Ch8 签字表单备选替换 |
| `按钮图.png` | `Echoes_of_Yesterday/pictures/` | 全局 UI 按钮 |
| `书本翻页底图.png` | `Echoes_of_Yesterday/pictures/` | Ch10 翻书展示效果 |
| `第二章/三章/五章.png` | `Echoes_of_Yesterday/记忆恢复报告新底图/` | Ch10 报告各章节底图 |
| `memorybutton1~3` 系列 | `Echoes_of_Yesterday/记忆恢复报告新底图/` | Ch10 报告交互按钮 |

### 🟢 低优先级（纯视觉增强）

| 素材 | 说明 |
|------|------|
| `Echoes_of_Yesterday/assets/ui/icons/` | 图标占位目录（空） |
| `Echoes_of_Yesterday/assets/ui/effects/` | 特效占位目录（空） |
| Design_Document 参考图 | 仅设计参考，不安装到项目 |

---

## 四、素材迁移步骤（建议）

```bash
# 1. 高优先级 - Ch1 + Ch3 + Ch10
cp "Echoes_of_Yesterday/pictures/主界面底图.jpg" assets/images/
cp Echoes_of_Yesterday/assets/memory_items/chapter01/memory_00*.png assets/images/
cp Echoes_of_Yesterday/assets/memory_items/chapter01/memory_items.json assets/images/
cp Echoes_of_Yesterday/MemoryReport/BackgroundLayer/report_base.png assets/images/
cp Echoes_of_Yesterday/MemoryReport/档案页相片/*.PNG assets/images/
cp build_out/assets/images/scene_maze_map.png assets/images/

# 2. 中优先级 - UI 增强
cp Echoes_of_Yesterday/assets/ui/backgrounds/paper_base.png assets/images/
cp Echoes_of_Yesterday/assets/ui/textures/paper_noise.png assets/images/
cp Echoes_of_Yesterday/assets/ui/frames/button_frame.png assets/images/
cp "Echoes_of_Yesterday/美术素材/签字单面板 (1).png" assets/images/
cp "Echoes_of_Yesterday/美术素材/签字单面板 (2).png" assets/images/
cp Echoes_of_Yesterday/pictures/按钮图.png assets/images/
cp Echoes_of_Yesterday/pictures/书本翻页底图.png assets/images/
cp Echoes_of_Yesterday/记忆恢复报告新底图/第二章.png assets/images/
cp Echoes_of_Yesterday/记忆恢复报告新底图/第三章.png assets/images/
cp Echoes_of_Yesterday/记忆恢复报告新底图/第五章.png assets/images/
cp Echoes_of_Yesterday/记忆恢复报告新底图/memorybutton* assets/images/
```

---

## 五、注意事项

1. **`puzzle_img.png` 和 `拼图.png` 文件损坏**（缺 IEND 块），不应使用。已用 `scene_puzzle.jpg` 替代。
2. **`scene_maze_map.png`** 在 `build_out/assets/images/` 中存在但主 `assets/images/` 缺失，导致代码引用时加载失败、Loader 回退到 1×1 棕色占位像素。
3. **`room_bg.png` 与 `scene_room.jpg`**、**`desk_bg.png` 与 `scene_desk.jpg`** 内容相同但格式不同，建议统一使用一份，删除冗余。
4. **`tmp_客厅场景底图.png`** 已存在但未被引用，可能是为 Ch1 准备但忘了接入。
5. 所有素材路径在代码 manifest 中声明后才能被 Loader 加载，仅放到 `assets/images/` 不会自动生效。
6. 抖音互动空间 zip 包限制 8MB，当前 `assets/images/` 约 16.4MB（含冗余），需要精简到 8MB 以内才能上传。
