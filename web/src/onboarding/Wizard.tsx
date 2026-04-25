import { Routes, Route, Navigate } from "react-router-dom";
import { Welcome } from "./steps/Welcome";
import { PickBrain } from "./steps/PickBrain";
import { GetAccessPass } from "./steps/GetAccessPass";
import { ShellFrame } from "./ShellFrame";

/**
 * First-run onboarding. After API key (pass) the app goes to `/chat`.
 * Old `/onboarding/vibe` and `/onboarding/done` URLs redirect to chat.
 */
export function Wizard() {
  return (
    <ShellFrame>
      <Routes>
        <Route path="welcome" element={<Welcome />} />
        <Route path="brain" element={<PickBrain />} />
        <Route path="pass" element={<GetAccessPass />} />
        <Route path="vibe" element={<Navigate to="/chat" replace />} />
        <Route path="done" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<Navigate to="welcome" replace />} />
      </Routes>
    </ShellFrame>
  );
}
