import type { dicts } from "./i18n";

/** Browser → same-origin /api (proxied to FastAPI). Never throws. */
export async function send<R = unknown>(path: string, body?: unknown, method = "POST"): Promise<{ ok: boolean; data: R & { detail?: unknown } }> {
  try {
    const r = await fetch(path, {
      method,
      ...(body instanceof FormData ? { body } : body !== undefined && { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
    });
    return { ok: r.ok, data: await r.json().catch(() => ({})) };
  } catch {
    return { ok: false, data: {} as R & { detail?: unknown } };
  }
}

/** Maps a FastAPI error (string code or pydantic list) to localized text. */
export function errText(t: (typeof dicts)["fa"], detail: unknown) {
  if (typeof detail === "string") return t.errors[detail] ?? t.errors.generic;
  const loc = JSON.stringify(detail ?? "");
  const field = ["phone", "national_id", "code", "name", "text", "message", "subject", "price", "title", "description", "area"].find((f) => loc.includes(`"${f}"`));
  return (field && t.errors[field]) || t.errors.generic;
}

export const faDigits = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
