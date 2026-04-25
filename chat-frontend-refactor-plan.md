# Plan: Chat 前端组件拆分与 UI 调优

## 1. 目标

将 web/src/chat/ChatPage.tsx 中耦合的侧边栏、消息列表、消息气泡、输入框逻辑拆分为独立组件，并同步优化 UI 精致度。最终达到：
- 代码职责清晰，单文件行数控制在 150 行以内；
- 视觉层级与现代聊天产品对齐（Claude / ChatGPT 风格）；
- 后续新增功能（Streaming、代码复制、标题编辑等）可直接在对应组件内扩展。

## 2. 现状

当前所有聊天 UI 与状态集中在 web/src/chat/ChatPage.tsx（~444 行）：
- Sidebar 会话列表（新建、切换、删除、激活态）
- 消息滚动区（空状态、用户/助手消息渲染、底部自动滚动）
- 输入区（textarea、发送按钮、Enter/Shift+Enter 快捷键、loading 态）
- 状态管理：sessions、activeSessionId、messages、input、sending、hermesReady、bootErr

其余文件：
- web/src/chat/ChatMarkdown.tsx：已独立，负责 Markdown 渲染，本次不拆。
- web/src/chat/chat-api.ts：API 封装，本次不改接口，仅调整 import 路径。

## 3. 拆分后目录结构

```
web/src/chat/
  index.ts              # 统一导出（可选，方便外部引用）
  chat-api.ts           # 保持不动
  ChatMarkdown.tsx      # 保持不动
  ChatPage.tsx          # 布局骨架 + 状态管理（~130 行）
  ChatSidebar.tsx       # 侧边栏：会话列表 + 新建/删除（~110 行）
  ChatMessageList.tsx   # 消息滚动容器 + 空状态 + 自动滚动（~70 行）
  ChatMessage.tsx       # 单条消息气泡（~60 行）
  ChatInput.tsx         # 输入区（~80 行）
```

## 4. 各组件职责与 Props 接口

### 4.1 ChatPage.tsx

**职责**：页面级布局（flex 分左右）、核心状态管理、数据流转（通过 props 向下传递）。

保留状态：
- hermesReady, bootErr
- sessions, activeSessionId, messages
- input, sending

保留逻辑：
- 初始化轮询、加载会话列表、加载消息、发送消息、新建会话、删除会话、切换会话

布局骨架：
```tsx
<div className="h-full w-full flex flex-col">
  {/* header 内联 */}
  <div className="flex-1 flex min-h-0">
    <ChatSidebar ... />
    <main className="flex-1 flex flex-col min-w-0">
      <ChatMessageList ... />
      <ChatInput ... />
    </main>
  </div>
</div>
```

### 4.2 ChatSidebar.tsx

**Props**：
```ts
interface Props {
  sessions: SessionRow[];
  activeSessionId: string | null;
  loading?: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}
```

**职责**：
- 渲染新对话按钮
- 渲染可滚动会话列表
- 每项显示标题/预览（截断 + title tooltip）
- 当前项高亮、hover 显示删除按钮
- 空状态提示（暂无历史会话）

### 4.3 ChatMessageList.tsx

**Props**：
```ts
interface Props {
  messages: UiMsg[];
  sending: boolean;
}
```

**职责**：
- 可滚动消息容器
- 遍历渲染 ChatMessage
- 发送中时在末尾显示打字指示器
- 空状态：居中大标题 + 快捷提示 pills
- 自动滚动到底部

### 4.4 ChatMessage.tsx

**Props**：
```ts
interface Props {
  role: "user" | "assistant";
  text: string;
}
```

**职责**：
- 根据 role 决定对齐方向（user 右 / assistant 左）
- 用户消息：深色气泡，plain text
- 助手消息：浅色气泡 + 细边框，内部调用 ChatMarkdown
- 气泡样式统一：圆角、最大宽度限制、适当内边距

### 4.5 ChatInput.tsx

**Props**：
```ts
interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}
```

**职责**：
- 受控 textarea（resize: none，行数自适应，最多 8 行）
- 快捷键：Enter 发送，Shift+Enter 换行
- 发送按钮（根据 disabled 和 value.trim() 控制可用态）
- 底部提示文案

### 4.6 ChatHeader

v1 先不独立组件，直接内联在 ChatPage.tsx 顶部。若后续增加会话标题编辑、模型选择器、更多菜单，再拆出 ChatHeader.tsx。

## 5. UI 调优要点（拆分同步执行）

### 5.1 配色与质感
- 延续现有 zinc 色系，不引入新主题变量
- 助手消息气泡增加 shadow-sm 和更柔和的边框
- 用户消息保持 bg-zinc-900 text-white，圆角统一为 rounded-2xl
- 输入区增加白色背景 + 顶部细阴影，与消息区形成层级分离

### 5.2 代码块
- 在 ChatMarkdown.tsx 中优化 pre 组件：
  - 深色背景 + rounded-xl
  - 顶部增加标题栏（语言标识 + 复制按钮占位，v1.1 实现复制）
  - overflow-x-auto + 内边距 p-4

### 5.3 侧边栏
- 会话项：rounded-lg + 紧凑内边距 px-3 py-2
- 激活态：左侧主题色指示条 + 背景高亮
- 标题截断使用 truncate，并给 button 加 title 属性
- 删除按钮保持文字 x，hover 时显示

### 5.4 空状态
- 居中大标题：开启新对话
- 3 个快捷提示 pill 按钮（可点击填入输入框）
- 图标使用简单的 SVG，不引入新图标库

### 5.5 打字指示器
- 替换目前的 ... 文本为动态跳动圆点（3 个圆点依次缩放）
- 组件名 TypingIndicator，内联在 ChatMessageList 中或独立文件

## 6. 迁移步骤（实施顺序）

1. **备份**：复制 ChatPage.tsx 为 ChatPage.tsx.bak
2. **新建组件文件**：按 4.2~4.5 创建空文件并写好 Props 接口
3. **逐段迁移**：
   - 先拆 ChatSidebar（逻辑最独立，与主状态交互最少）
   - 再拆 ChatInput（逻辑独立，props 简单）
   - 再拆 ChatMessage（纯展示，无状态）
   - 最后拆 ChatMessageList（需要整合 ChatMessage + TypingIndicator）
4. **精简 ChatPage**：删除已迁移的 JSX，仅保留状态管理和布局骨架
5. **UI 调优**：逐个组件调整 Tailwind 样式
6. **验证**：确保功能与拆分前完全一致（发送、切换、删除、新建、Markdown、快捷键）

## 7. 类型与接口调整

将以下类型从 ChatPage.tsx 提升到 chat-api.ts（或独立 chat-types.ts）：

```ts
export interface SessionRow {
  id: string;
  title?: string;
  preview?: string;
  created_at?: string;
}

export interface UiMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
}
```

所有组件统一从 chat-api.ts 导入，避免循环依赖。

## 8. 风险与注意事项

- **功能回归**：拆分过程中不得改变任何业务逻辑。所有事件回调、状态更新顺序保持原样。
- **样式冲突**：ChatMarkdown.tsx 中的自定义 components 对象可能依赖外层 chat-md 类名，需确认拆分后 CSS 作用域不受影响。
- **自动滚动**：scroll-to-bottom 逻辑目前在 ChatPage 内联，迁移到 ChatMessageList 后需用 ref 或 useEffect 重新验证。
- **暗色模式**：所有新样式必须同时写 dark: 变体，避免暗色下出现白块或对比度问题。
- **无新增依赖**：本次拆分不引入新的 npm 包，只使用现有 Tailwind + react-markdown 体系。
