import { invoke } from "@tauri-apps/api/core";
import { getLocale, translate } from "./i18n-core";
import { findProvider, type ProviderId } from "./providers";

/** Strip trailing slashes for OpenAI-compatible base URLs. */
export function normalizeOpenAiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function hasTauriInvoke(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
}

function loc() {
  return getLocale();
}

/**
 * Validate a custom OpenAI-compatible endpoint.
 */
export async function validateCustomEndpoint(
  baseUrl: string,
  apiKey: string
): Promise<ValidateResult> {
  const base = normalizeOpenAiBaseUrl(baseUrl);
  if (!base) {
    return { ok: false, message: translate("validate.needUrl", loc()) };
  }
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { ok: false, message: translate("validate.needKey", loc()) };
  }

  const modelsUrl = `${base}/models`;

  if (hasTauriInvoke()) {
    try {
      await invoke("cmd_validate_endpoint", {
        url: modelsUrl,
        apiKey: trimmed,
      });
      return { ok: true };
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      return { ok: false, message: msg || translate("validate.unreachable", loc()) };
    }
  }

  try {
    const resp = await fetch("/api/validate-endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: modelsUrl, api_key: trimmed }),
    });
    const data = (await resp.json()) as { ok?: boolean; message?: string };
    if (data.ok) return { ok: true };
    return { ok: false, message: data.message || translate("validate.validationFailed", loc()) };
  } catch {
    try {
      const res = await fetch(modelsUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: translate("validate.badKey", loc()) };
      }
      if (res.status >= 500) {
        return {
          ok: false,
          message: translate("validate.badCode", loc(), { code: res.status }),
        };
      }
      return { ok: true };
    } catch {
      return {
        ok: false,
        message: translate("validate.network", loc()),
      };
    }
  }
}

export interface ValidateResult {
  ok: boolean;
  message?: string;
}

export async function validateKey(
  providerId: ProviderId,
  key: string
): Promise<ValidateResult> {
  const provider = findProvider(providerId);
  const l = loc();
  const trimmed = key.trim();
  if (!trimmed) return { ok: false, message: translate("validate.needKey", l) };

  if (provider.keyPrefixHint && !trimmed.startsWith(provider.keyPrefixHint)) {
    return {
      ok: false,
      message: translate("validate.keyPrefix", l, {
        label: provider.label,
        hint: provider.keyPrefixHint,
      }),
    };
  }

  try {
    const res = await fetch(provider.validateUrl, {
      method: "GET",
      headers: {
        Authorization: provider.validateAuth(trimmed),
        ...(provider.id === "anthropic"
          ? { "x-api-key": trimmed, "anthropic-version": "2023-06-01" }
          : {}),
      },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: translate("validate.badKey", l) };
    }
    if (!res.ok) {
      return {
        ok: false,
        message: translate("validate.providerStatus", l, {
          label: provider.label,
          code: res.status,
        }),
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: translate("validate.providerReach", l, { label: provider.label }),
    };
  }
}
