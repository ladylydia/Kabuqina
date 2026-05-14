# Kabuqina Companion Window Design

| 属性 | 值 |
|------|-----|
| **Version** | 1.1 |
| **Date** | 2026-05-14 |
| **Status** | Draft |
| **Priority** | P1 |
| **Related Docs** | [Workbench UX Design](./2026-05-13-kabuqina-workbench-ux-design.md) |

---

## 1. Summary

Companion 窗口应 feels like a small, reliable Nana presence，而非拥挤的通知卡片。

**当前问题：** Minimize 按钮仅调用 `setNotice(null)`，清空通知状态但不改变窗口尺寸、可见性或模式。若窗口已显示 idle text，用户看不到任何可见反馈，产生「按钮坏了」的感知。

**方向：** Compact Pill Mode —— 点击 Minimize 将 Companion 收缩为更安静的药丸形态；Close 按钮继续保持为 Hide 动作。

---

## 2. Root Cause

| 项目 | 详情 |
|------|------|
| **位置** | `web/src/companion/CompanionWindow.tsx` |
| **问题代码** | `onClick={() => setNotice(null)}`（Minimize 按钮） |
| **影响** | 仅清空通知状态；窗口边界、可见性、模式均无变化；idle 状态下无视觉反馈。 |

---

## 3. Goals & Non-Goals

### 3.1 Goals

| # | 目标 | 优先级 |
|---|------|--------|
| G1 | Minimize 按钮将 Companion 窗口 visibly 收缩为 Compact Pill | P0 |
| G2 | Companion 保持可见、可拖拽、易于恢复 | P0 |
| G3 | Close 按钮保持为 Hide 动作，语义清晰不混淆 | P0 |
| G4 | 视觉层级优化：Companion 读取为 Nana 的轻量存在，而非密集 Toast | P1 |
| G5 | 避免从 Companion 交互中跳转至主 Dashboard | P1 |

### 3.2 Non-Goals

- ❌ 本阶段不构建完整浮动聊天窗口。
- ❌ 不新增 Gateway、Reminder 或 Notification 行为。
- ❌ 不使用 Native Minimize 作为主要行为（Companion 跳过任务栏，需保持可发现）。
- ❌ 不让 Close 与 Minimize 做相似的事。

---

## 4. Terminology

| 术语 | 定义 |
|------|------|
| **Expanded Mode** | Companion 正常展开状态，显示完整内容。 |
| **Compact Pill Mode** | 最小化后的紧凑药丸状态，仅显示 Nana 图标与短标签。 |
| **Hidden** | 完全隐藏，用户可通过主窗口标题栏或托盘菜单重新打开。 |
| **Nana Icon** | `/kabuqina_na_blue_48.png`，Companion 的品牌标识。 |

---

## 5. State Machine

### 5.1 状态定义

| 状态 | 可见性 | 尺寸 | 内容 |
|------|--------|------|------|
| `expanded` | ✅ 始终置顶 | `320×160` | 图标、标题、预览、操作按钮 |
| `compact` | ✅ 始终置顶 | `120×48` | Nana 图标、短状态标签 |
| `hidden` | ❌ 不可见 | — | — |

### 5.2 状态转换

| 当前状态 | 动作 | 目标状态 | 说明 |
|----------|------|----------|------|
| `expanded` | 点击 **Minimize** | `compact` | 收缩为 Pill，保留发现性。 |
| `expanded` | 点击 **Close** | `hidden` | 完全隐藏。 |
| `expanded` | 点击 **Open Main Chat** | `hidden` | 聚焦主窗口，Companion 隐藏。 |
| `compact` | 点击 **Pill Body** | `expanded` | 展开恢复。 |
| `compact` | 点击 **Close**（若有） | `hidden` | 完全隐藏。 |
| `hidden` | 点击托盘/主窗口 reopen | `expanded` | 默认以展开状态重现。 |

---

## 6. Approved Behavior

### 6.1 Expanded Mode

**布局：**
- Nana 图标或通知图标（`Bell`）。
- 标题（单行，truncate）。
- 短预览文本（最多 2 行，line-clamp-2）。
- 操作控件：Open Main Chat、Minimize to Pill、Hide Companion。

**交互：**
- 非控件区域可拖拽（`data-tauri-drag-region` + `startDragging()`）。
- 控件区域阻止拖拽冒泡（`onMouseDown={stopPropagation}`）。

### 6.2 Compact Pill Mode

**布局：**
- 收缩为较小宽度和高度。
- Nana 图标保持可见。
- 若空间允许，显示短 idle/status 标签（如「Nana」或「待机中」）。
- 隐藏长预览文本与次要视觉重量。

**交互：**
- 保持 always-on-top。
- 保持可拖拽。
- 点击 Pill Body 或显式 Expand Affordance 恢复至 Expanded。

### 6.3 Hide Companion

- Close 按钮继续隐藏 Companion 窗口。
- 用户可从主窗口标题栏或托盘菜单重新打开。

### 6.4 Open Main Chat

- 聚焦主 Kabuqina 窗口。
- 隐藏 Companion。
- 与现有行为一致（`cmd_focus_main_window`）。

---

## 7. Window Sizing & Resizing

### 7.1 固定尺寸（Phase 1）

| 模式 | 宽度 | 高度 | 圆角 | 备注 |
|------|------|------|------|------|
| Expanded | `320px` | `160px` | `12px` (`rounded-xl`) | 近似当前尺寸 |
| Compact | `120px` | `48px` | `24px` (`rounded-3xl`) | Pill 形态，图标+标签 |

### 7.2 Tauri API 建议

**前端调用：**

```typescript
// 切换 Companion 模式
await invoke("cmd_set_companion_mode", { mode: "compact" | "expanded" });

// 隐藏（已有）
await invoke("cmd_hide_companion");

// 聚焦主窗口（已有）
await invoke("cmd_focus_main_window");
```

**Rust 侧（`tauri/src/`）需暴露：**

```rust
#[tauri::command]
fn cmd_set_companion_mode(
    window: tauri::WebviewWindow,
    mode: String,
) -> Result<(), String> {
    let (width, height) = match mode.as_str() {
        "compact" => (120, 48),
        "expanded" => (320, 160),
        _ => return Err("invalid mode".into()),
    };
    window
        .set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

**约束：**
- 避免纯 CSS 收缩（若 native window bounds 保持较大，不可见 hit area 仍留在屏幕上）。
- 必须通过 Tauri window API 实际调整窗口尺寸。
- 若 Rust 命令不可用，前端应 fallback 至 `getCurrentWindow().setSize()`，并记录降级日志。

---

## 8. Visual Direction

| Token | Expanded | Compact |
|-------|----------|---------|
| **形状** | 圆角矩形 | Pill（高度接近全圆角） |
| **背景** | `bg-white/90 dark:bg-zinc-950/90` + `backdrop-blur` | 同上，可略微提高不透明度至 `95%` |
| **边框** | `border-white/70 dark:border-zinc-700/70` | 可去除或减弱至 `border-white/40` |
| **阴影** | `shadow-2xl shadow-zinc-950/15` | `shadow-lg shadow-zinc-950/10`（更小更轻） |
| **图标尺寸** | `h-10 w-10` 容器内 `h-6 w-6` | `h-8 w-8` 容器内 `h-5 w-5` |
| **标题** | `text-sm font-semibold` | 隐藏 |
| **预览** | `text-[11px] leading-4` | 隐藏 |
| **控件** | 三按钮垂直排列 | 隐藏或仅保留 Close 小圆点 |
| **动画** | — | 尺寸变化 `200ms ease-out` |

**通用原则：**
- 控件小而可达。
- 图标语义：MessageCircle（打开聊天）、Minus/ChevronDown（最小化）、X（关闭）。
- Compact 模式避免密集文本。
- Hover 与 Focus 状态保持可见。
- 文本永不溢出容器（`truncate`、`line-clamp`、固定尺寸）。

---

## 9. Workbench Integration

Companion 与主 Workbench 的联动规则：

| 场景 | Companion 行为 | Workbench 行为 |
|------|----------------|----------------|
| 用户点击 Companion「Open Main Chat」 | `hidden` | 恢复至上一次的布局状态（而非强制 Default 三列）。若上次为 Focus Mode，保持 Focus Mode。 |
| 主窗口进入 Focus Mode | 不影响 | Center 最大化 |
| 主窗口宽度 `< 768px` | 不影响 | Narrow 布局 |
| Companion 处于 `compact`，用户收到新通知 | 可选：短暂脉冲/徽标提示，或保持安静直至用户主动查看 | 若主窗口可见，聊天流内显示对应消息 |

---

## 10. Error Handling

| 场景 | 降级策略 |
|------|----------|
| 窗口尺寸调整失败 | 按钮仍切换前端视觉状态（如 CSS class），并记录 `console.error` / Rust 日志供调试。 |
| 聚焦主窗口失败 | Companion 保持可见，避免丢失用户上下文。 |
| 无 notice 时点击 Minimize | 仍进入 `compact` 模式（行为一致，不依赖 notice 存在）。 |
| Rust command `cmd_set_companion_mode` 未注册 | Frontend fallback 至 `getCurrentWindow().setSize()`；双路径均失败则仅记录日志。 |

---

## 11. Implementation Notes

### 11.1 前端改动（`web/src/companion/CompanionWindow.tsx`）

1. **新增状态：** `const [mode, setMode] = useState<"expanded" | "compact">("expanded");`
2. **替换 Minimize Handler：**
   ```typescript
   const minimize = async () => {
     try {
       await invoke("cmd_set_companion_mode", { mode: "compact" });
     } catch (e) {
       console.error("Failed to resize companion:", e);
       // Fallback: at least update local state for CSS
     }
     setMode("compact");
   };
   ```
3. **Pill Body Click Handler：**
   ```typescript
   const expand = async () => {
     try {
       await invoke("cmd_set_companion_mode", { mode: "expanded" });
     } catch (e) {
       console.error("Failed to resize companion:", e);
     }
     setMode("expanded");
   };
   ```
4. **条件渲染：** 根据 `mode` 切换外层容器尺寸类与内容布局。

### 11.2 Rust 改动

- 在 `tauri/src/` 中注册 `cmd_set_companion_mode` command。
- Companion window 初始化时确保 `skip_taskbar` 与 `always_on_top` 保持现有行为。

---

## 12. Testing & Verification

### 12.1 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| AC1 | 点击 Minimize 后，Companion 从 `320×160` 收缩为 `120×48` 的 Pill | 视觉检查 + 窗口边界检查 |
| AC2 | Pill 模式下 Nana 图标可见，长预览文本隐藏 | 视觉检查 |
| AC3 | Pill 点击后恢复 Expanded，尺寸与内容正确还原 | 视觉检查 |
| AC4 | Close 按钮在任何模式下均隐藏 Companion | 功能测试 |
| AC5 | Expanded 与 Compact 模式下拖拽均正常工作 | 手动拖拽测试 |
| AC6 | 点击「Open Main Chat」聚焦主窗口并隐藏 Companion | 功能测试 |
| AC7 | 无 notice 时点击 Minimize 仍进入 Compact（不依赖通知存在） | 功能测试 |
| AC8 | 尺寸调整失败时前端状态仍切换，并输出错误日志 | 模拟失败 + 控制台检查 |

### 12.2 回归测试

- 现有通知监听（`desktop-delivery` event）不受影响。
- 现有 `cmd_hide_companion` 与 `cmd_focus_main_window` 行为不变。
- `npm run lint` 与 `npm run build` 零错误。
