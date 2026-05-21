# Kabuqina Figma Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new Figma design file containing Kabuqina style tokens, core components, and a polished chat home screen mockup.

**Architecture:** Use the Figma plugin API directly in a fresh design file. Build the file as editable Figma layers: one page, three top-level frames, reusable component examples, and one desktop mockup frame.

**Tech Stack:** Figma `create_new_file`, Figma `use_figma` Plugin API JavaScript, Figma screenshot/context validation.

---

### Task 1: Create Figma File

**Files:**
- Create remote Figma design file: `Kabuqina Style Direction`

- [ ] **Step 1: Resolve the Figma plan**

Run the Figma `whoami` tool and select the only available plan automatically. If multiple plans exist, stop and ask which team or organization to use.

- [ ] **Step 2: Create the blank design file**

Run `create_new_file` with `editorType: "design"` and `fileName: "Kabuqina Style Direction"`.

- [ ] **Step 3: Record identifiers**

Keep the returned `file_key` and `file_url` for the remaining tasks and final response.

### Task 2: Build Editable Visual System

**Files:**
- Modify remote Figma design file from Task 1

- [ ] **Step 1: Create the page and top-level sections**

Use `use_figma` to create or rename a page to `Kabuqina Style Direction`. Add three top-level frames named `Style Tokens`, `Core Components`, and `Chat Home Screen`.

- [ ] **Step 2: Add style tokens**

Create color swatches for `#5A4A6A`, `#8B7D9A`, `#B8A9C9`, `#E8DFF0`, `#FAF8FB`, and `#D4A574`. Add text notes for typography, radius, and shadows.

- [ ] **Step 3: Add component examples**

Create editable examples for navigation tabs, primary action button, quick action button, sidebar item, assistant chat bubble, user chat bubble, input composer, and workspace card.

- [ ] **Step 4: Add desktop mockup**

Create a `1660 x 930` frame with top bar, left sidebar, central chat area, and right workspace panel. Apply the agreed palette, soft shadows, low-contrast borders, and Chinese-first sample copy.

### Task 3: Validate

**Files:**
- Inspect remote Figma design file from Task 1

- [ ] **Step 1: Inspect node structure**

Use Figma metadata/context or `use_figma` readback to verify the three expected top-level frames exist.

- [ ] **Step 2: Capture screenshot**

Use Figma screenshot tooling for the main mockup or the full page. Verify it is nonblank and visually matches the requested soft lavender-pink style.

- [ ] **Step 3: Final report**

Return the Figma URL and summarize the created sections. Mention any validation limitation if screenshot capture is unavailable.
