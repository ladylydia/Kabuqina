"""Pin default model / provider for HermesDesk from Tauri-provided env.

Hermes reads ``config.yaml`` ``model`` (string or dict). The shell passes:

    HERMESDESK_MODEL               optional default model id
    HERMESDESK_INFERENCE_PROVIDER  optional, e.g. ``custom`` for OpenAI-compatible URLs
    HERMESDESK_API_BASE_URL        custom chat/completions base (typically ends with /v1)

If ``model.base_url`` is never written, ``provider: custom`` with an empty ``providers:`` block
can break or confuse resolution for code paths that only read YAML. The API key still comes from
the Tauri bridge; this overlay syncs non-secret routing fields on every Python boot.
"""

from __future__ import annotations

import logging
import os

log = logging.getLogger("hermesdesk.model")


def install() -> None:
    model = os.environ.get("HERMESDESK_MODEL", "").strip()
    inf = os.environ.get("HERMESDESK_INFERENCE_PROVIDER", "").strip()
    api_base = os.environ.get("HERMESDESK_API_BASE_URL", "").strip()

    if not model and not inf and not api_base:
        return

    try:
        from hermes_cli.config import load_config, save_config  # type: ignore
    except Exception as e:
        log.warning("hermes_cli.config not importable; skipping model seed (%s)", e)
        return

    try:
        cfg = load_config() or {}
    except Exception as e:
        log.warning("could not load config for model seed (%s)", e)
        cfg = {}

    if inf == "custom":
        prev = cfg.get("model")
        default_model = model
        prev_base = ""
        if isinstance(prev, dict):
            if not default_model:
                d = prev.get("default")
                if isinstance(d, str) and d.strip():
                    default_model = d.strip()
            prev_base = (str(prev.get("base_url") or prev.get("baseurl") or "")).strip()
        elif isinstance(prev, str) and prev.strip():
            if not default_model:
                default_model = prev.strip()
        if not default_model:
            default_model = "gpt-4o-mini"

        new_block: dict = {
            "default": default_model,
            "provider": "custom",
        }
        if api_base:
            new_block["base_url"] = api_base
        elif prev_base:
            new_block["base_url"] = prev_base

        if isinstance(prev, dict):
            cfg["model"] = {**prev, **new_block}
        else:
            cfg["model"] = new_block
    elif model:
        prev = cfg.get("model")
        if isinstance(prev, dict):
            cfg["model"] = {**prev, "default": model}
        else:
            cfg["model"] = model

    try:
        save_config(cfg)
        m = cfg.get("model")
        has_bu = bool(
            api_base
            or (isinstance(m, dict) and str(m.get("base_url") or "").strip())
        )
        log.info(
            "HermesDesk model seed applied (inference=%r model=%r base_url_set=%s)",
            inf,
            model,
            has_bu,
        )
    except Exception:
        log.exception("failed to save Hermes model seed")
