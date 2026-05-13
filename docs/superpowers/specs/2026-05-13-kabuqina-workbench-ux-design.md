# Kabuqina Workbench UX Design

Date: 2026-05-13

## Summary

Kabuqina's main chat should evolve from a simple messenger into a personal AI workbench. The product should keep Nana conversational and approachable, but the screen should feel like a place where the user brings materials, tracks work, and receives useful outputs.

The selected direction is a three-column workbench:

- Left rail: durable navigation and work history.
- Center: live chat and active work stream.
- Right panel: current workspace context.

The three columns must be flexible. Like Codex or Cursor, users should be able to collapse side panels and focus the center chat when they want uninterrupted conversation or writing space.

This is not a B2B agent task board. The mission-board direction was rejected because it makes tasks primary in a way that better fits enterprise agent management than Kabuqina's current personal assistant positioning.

## Goals

- Make chat feel taskful and workspace-like without turning it into a project-management app.
- Keep the shell UI as the primary product experience instead of sending users into the Hermes dashboard.
- Give users a stable place to see current materials, task state, outputs, and useful actions.
- Let users collapse the left rail and right workspace panel independently.
- Provide a focus mode where the center chat becomes the dominant workspace.
- Preserve the existing friendly Nana tone while adding stronger work affordances.
- Improve first-run UI polish so onboarding hands users into the workbench with confidence.

## Non-Goals

- Do not build a full kanban board, multi-agent control room, or enterprise task console.
- Do not make Hermes dashboard access a primary call to action.
- Do not duplicate Settings, Capability, or full session history inside the right workspace panel.
- Do not redesign the frozen `hermes_core/` UI.

## Information Architecture

### Left Rail

The left rail owns durable product areas and history:

- New work / new chat.
- Recent work or sessions.
- Reminders.
- Capability.
- Export, if it remains a durable secondary area.

Capability belongs in the left rail because users should understand it as a product area, not a transient control inside one chat. The left rail should stay narrow and scannable.

### Center Work Stream

The center remains the primary live conversation surface. It should show:

- Current work title or inferred task summary.
- Chat messages.
- Compact action/result cards inside assistant messages when Nana creates reminders, uses files, captures screenshots, or produces exports.
- Agent progress while tools are running.
- Input composer with file attachment, screenshot, voice, and send/stop controls.

The center should not become visually empty or purely decorative. Empty state prompts should emphasize useful work starts: add a file, capture the screen, organize desktop, create a reminder, or ask Nana to draft something.

### Top Actions

Settings should stay in a top position because that matches current user expectations. The previous "Open console" action should be removed from primary chat surfaces. If console/dashboard access remains, it should live under advanced diagnostics in Settings.

### Flexible Panel Behavior

The default desktop layout is three columns, but the user should not feel trapped in a dense control surface. The layout should support:

- Left rail collapse: hides labels and history detail, leaving a compact navigation strip or a reopen control.
- Right workspace collapse: hides the context panel while preserving the center chat width.
- Focus mode: collapses both side areas and gives the center chat the most space. Settings remains reachable from the top, and Capability/Workspace can be reopened without leaving chat.
- Restorable state: returning from focus should restore the user's previous panel choices where practical.

The first implementation can use fixed expanded widths and animated collapse states. Resizable panel widths can be a later enhancement if the fixed widths feel too rigid after use.

### Right Workspace Panel

The right panel answers: "What is Nana working with right now?"

It owns four sections:

- Current goal: one-line editable or inferred task summary, plus next step or waiting state.
- Materials: attached files, screenshots, selected folders, and relevant local paths.
- Outputs: reminders created, generated drafts, exported items, and recent deliverables from the active work.
- Quick actions: add file, capture screen, organize desktop, and other context-aware actions.

The panel should not become a general settings drawer. It should stay tied to the active work stream.

## Key States

### Empty Workbench

When there are no messages, the center should invite the user to start work, while the right panel shows empty contextual affordances:

- Add files or folders.
- Capture the screen.
- Start from common tasks.
- Create a reminder.

### Active Work

When a conversation has messages or attachments:

- The center shows the chat and progress.
- The right panel summarizes goal, materials, outputs, and next step.
- The left rail keeps history available without competing with active work.

### Running Agent

When Nana is working:

- Progress remains visible in the center work stream.
- The right panel may highlight the current step or the material being used.
- Stop remains easy to reach in the composer.

### Focused Chat

When the user enters focus mode:

- The center chat and composer become visually dominant.
- The left rail and right workspace panel collapse out of the way.
- A compact affordance remains to reopen Capability/navigation and Workspace context.
- Running progress, stop, attachments, screenshot, voice, and send controls remain available.

### Narrow Window

On smaller widths, the right workspace panel collapses behind a Workspace button or drawer. The center chat stays primary. The left rail may reduce to icons or a compact navigation surface if needed. Focus mode should still be available as a simple "chat first" layout.

## Onboarding Direction

Onboarding should be improved mostly as a UI and confidence pass:

- Stronger first screen with product identity and safety cues.
- Clearer provider/key forms with calmer status feedback.
- A ready screen that leads into the workbench, not into the dashboard.
- Progress indicators that feel meaningful rather than abstract.

The onboarding architecture does not need a large behavioral redesign for this phase.

## Error Handling And Recovery

- If no API key is saved, the workbench should route users to onboarding or Settings with clear language.
- If the local helper is still starting, keep a calm loading state and avoid showing an empty broken workspace.
- If attachment, screenshot, voice, reminder, or export actions fail, show scoped errors near the action and keep the user's typed input intact.
- If the workspace panel has no content, show constructive empty states rather than placeholders.
- If Hermes dashboard access is needed for diagnostics, label it as advanced and explain why a user is leaving the shell.

## Implementation Notes

- The likely first implementation target is `web/src/chat/ChatPage.tsx` plus new presentational components for the right workspace panel.
- `ChatSidebar` should evolve into the left rail, with Capability added as a first-class navigation item.
- Add local UI state for panel visibility and focus mode, likely alongside existing UI preference helpers.
- `ChatMessageList` and `ChatInput` should keep their core behavior but be tuned for the workbench layout.
- Existing routes for `/settings`, `/capabilities`, `/settings/cron`, and `/export` should remain native shell routes.
- Avoid touching `hermes_core/` for this UX pass.

## Testing And Verification

- Add focused UI tests or component-level checks for layout states where practical.
- Keep existing chat UX tests passing.
- Run `npm run lint` and `npm run build` in `web/`.
- Use the browser to visually verify desktop and narrow-window layouts.
- Verify expanded, left-collapsed, right-collapsed, and focused chat states.
- Verify that Settings and Capability navigation works from the new shell structure.
- Verify that temporary brainstorming files under `.superpowers/` are not tracked.
