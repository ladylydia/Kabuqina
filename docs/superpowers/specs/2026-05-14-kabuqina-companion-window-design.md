# Kabuqina Companion Window Design

Date: 2026-05-14

## Summary

Kabuqina's companion window should feel like a small, reliable Nana presence rather than a cramped notification card. Its minimize control currently appears broken because it only clears the active notice text. The approved direction is a compact pill mode: clicking the minimize button shrinks the companion into a quieter pill, while the close button continues to hide the companion.

## Root Cause

The current companion minimize button in `web/src/companion/CompanionWindow.tsx` calls `setNotice(null)`. This clears the current notification state but does not change the companion window size, visibility, or mode. If the window is already showing the idle text, the user sees no visible effect.

## Goals

- Make the minimize button visibly reduce the companion window into a compact pill.
- Keep the companion visible, draggable, and easy to restore.
- Preserve the close button as the hide action.
- Improve the visual hierarchy so the companion reads as Nana's lightweight presence, not a dense toast.
- Avoid sending users to the main dashboard from companion interactions.

## Non-Goals

- Do not build a full floating chat window in this phase.
- Do not add new gateway, reminder, or notification behavior.
- Do not use native minimize as the primary behavior because the companion skips the taskbar and should remain discoverable.
- Do not make the close button and minimize button do similar things.

## Approved Behavior

### Expanded Mode

Expanded mode is the normal companion state. It should show:

- Nana icon or notification icon.
- Title.
- Short preview text.
- Open main chat action.
- Minimize to compact pill.
- Hide companion.

The expanded window should remain draggable from non-control areas.

### Compact Pill Mode

Compact pill mode is entered by clicking the minimize button. It should:

- Shrink the companion window to a smaller width and height.
- Keep Nana's icon visible.
- Show a short idle/status label if space allows.
- Hide long preview text and secondary visual weight.
- Remain always-on-top and draggable.
- Expand back to normal mode when the user clicks the pill body or an explicit expand affordance.

### Hide Companion

The close button should continue to hide the companion window. The user can reopen it from the main window title bar or the tray menu.

### Open Main Chat

The open action should focus the main Kabuqina window and hide the companion, matching the existing model.

## Window Sizing

The first implementation can use two fixed sizes:

- Expanded: approximately the current companion size.
- Compact: a smaller pill sized around the Nana icon and short label.

The Rust companion controller should expose a way to resize the companion window for expanded and compact modes, or the frontend should call the Tauri window API directly if that remains simpler and reliable. The implementation should avoid CSS-only shrinking if the native window bounds remain large and invisible hit areas stay on screen.

## Visual Direction

- Use a calmer pill shape with a clear Nana icon.
- Keep controls small but reachable.
- Use familiar icons: message/open, minimize/collapse, close.
- Avoid dense text in compact mode.
- Keep hover and focus states visible.
- Ensure text never overflows its container.

## Error Handling

- If resizing fails, the button should still switch the frontend visual state and log the failure for debugging.
- If focusing the main window fails, keep the companion visible and avoid losing the user's context.
- If no notice exists, minimize should still enter compact mode.

## Testing And Verification

- Add a small behavior test for companion mode state if practical.
- Verify the minimize control changes visible state when a notice exists and when idle text is shown.
- Verify the close button still hides the companion.
- Verify the pill can be expanded back to normal.
- Verify drag still works in both expanded and compact modes.
- Verify the main-window open action still focuses the main window and hides the companion.
