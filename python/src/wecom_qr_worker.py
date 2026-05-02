"""
HermesDesk Route C: run WeCom scan-to-create QR flow in a short-lived child process.

Spawned by Tauri with the same bundled ``python.exe`` as ``desktop_entrypoint.py``.
Writes ``wecom_qr_progress.json`` and ``wecom_qr_result.json`` under ``HERMESDESK_DATA_DIR``.

Env (required):
  HERMESDESK_BUNDLE_DIR, HERMESDESK_DATA_DIR, HERMESDESK_WORKSPACE
"""

from __future__ import annotations

import json
import os
import sys
import traceback
from pathlib import Path


def _wire_sys_path() -> None:
    here = Path(__file__).resolve().parent
    for sub in ("hermes", "site-packages"):
        p = here / sub
        if p.is_dir():
            sys.path.insert(0, str(p))


def _data_dir() -> Path:
    return Path(os.environ["HERMESDESK_DATA_DIR"])


def _write_progress(obj: dict) -> None:
    path = _data_dir() / "wecom_qr_progress.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def _write_result(obj: dict) -> None:
    path = _data_dir() / "wecom_qr_result.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    _wire_sys_path()
    data_dir = _data_dir()
    hermes_home = data_dir / "hermes-home"
    hermes_home.mkdir(parents=True, exist_ok=True)
    os.environ["HERMES_HOME"] = str(hermes_home)

    _write_progress({"phase": "starting", "message": None})

    try:
        from gateway.platforms.wecom import qr_scan_for_bot_info

        _write_progress({"phase": "connecting", "message": "Fetching QR code from WeCom..."})

        result = qr_scan_for_bot_info()

        if not result:
            _write_result({"ok": False, "error": "QR scan timed out or was cancelled"})
            return 1

        bot_id = result["bot_id"]
        secret = result["secret"]

        from hermes_cli.config import save_env_value

        save_env_value("WECOM_BOT_ID", bot_id)
        save_env_value("WECOM_SECRET", secret)
        save_env_value("WECOM_DM_POLICY", "open")
        save_env_value("WECOM_ALLOW_ALL_USERS", "true")
        save_env_value("WECOM_ALLOWED_USERS", "")

        _write_result({
            "ok": True,
            "bot_id": bot_id,
        })
        _write_progress({"phase": "done", "message": "WeCom bot created successfully"})
        return 0

    except BaseException as e:
        _write_result({
            "ok": False,
            "error": str(e),
            "traceback": traceback.format_exc()[-4000:],
        })
        _write_progress({"phase": "error", "message": str(e)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
