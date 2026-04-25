# HermesDesk roadmap

**Last updated:** 2026-04-21

This file tracks **intentional, product-level** work. Bugfix triage lives in issues and changelogs (for example `CHANGES_*.md` in the repo root).

---

## 1. Chat UI + backend session / gateway (tracked separately)

**Status:** not started (planning)

**Problem statement**

HermesDesk ships a **Tauri shell** (`web/`) for onboarding and settings, then loads **Hermes’ web app** (served by embedded Python) in WebView2. The upstream Hermes surface includes **CLI, TUI, gateway, and web**; the desk bundle **strips** several entry points (see `python/overlays/strip_shims.py`). What remains in the local HTTP UI is primarily an **admin / status / management** experience. **End-user chat in the window** is therefore a **separate product track**: it is not implied by “seeing the dashboard” and should not be folded into unrelated fixes (onboarding, API validation, or navigation timing).

**In scope (this track)**

- A **dedicated chat experience** in the product (where it lives: shell vs Hermes web — TBD).
- A **session model** that matches that UI (create / list / resume conversation, error surfaces).
- A **runtime path for model traffic** consistent with the bundle: e.g. **restore or replace gateway**-style behavior, or an explicit **HTTP/WS contract** the UI calls into embedded Python — chosen and documented in `docs/architecture.md` when the track starts.

**Explicitly out of scope for this track (unless revised later)**

- Rebranding the existing Hermes web app as “chat” without a product decision.
- One-off hacks that only open URLs without a supported chat stack.

**Candidate directions** (pick one in design; may combine)

| Direction | Notes |
| --- | --- |
| **Re-enable gateway / TUI path (partial unpick from strip)** | Brings upstream patterns closer; Windows and packaging impact need a pass. |
| **New web chat in Tauri shell** | Full control of UX; must define API against embedded Python. |
| **New web chat under Hermes `hermes/web/`** | Aligns with existing serve model; still needs session + transport design. |

**Dependencies**

- Stable **BYO key / provider** and **onboarding** story (separate work).
- Clear **security** boundary for any new loopback or WS surface (see `docs/safety.md`).

**References**

- `CHANGES_2026-04-22.md` — current limitation: admin UI vs chat; gateway stripped.
- `docs/architecture.md` — system diagram and component boundaries.

---

## 2. Other ongoing themes (not a full backlog)

- **Onboarding & provider validation** — Tauri IPC vs post-`location.replace` behavior; keep validation on a path that can reach Rust or a trusted local proxy (`CHANGES_2026-04-21.md`).
- **“Configured” detection** — align keyring, `settings.json`, and UI so users are not sent past onboarding with stale state.
- **Build / Windows** — file locks during `cargo` + bundled Python (e.g. `os error 32`); antivirus exclusions; `build_bundle.ps1` hardening (see `CHANGES_2026-04-21.md` notes).

---

## 简体中文摘要

**「聊天界面 + 后端会话/网关」** 在路线图中作为 **独立事项** 跟踪：当前桌面包对 Hermes 做了裁剪，本地 Web 更偏管理/状态，**窗口内可对话** 需要单独的产品与工程方案（恢复网关 / 壳内新聊天页 / 在 Hermes 前端扩展等），**不应**与 onboarding、API 校验等短期问题混为同一类「修 bug」。

上方英文小节为正式范围说明；本文件与 `docs/architecture.md` 随实现更新。
