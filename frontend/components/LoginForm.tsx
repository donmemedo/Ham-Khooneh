"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errText, faDigits, send } from "@/lib/client";
import { fill, num } from "@/lib/i18n";
import Icon from "./Icon";
import { useT } from "./Providers";

type Otp = { is_new: boolean; dev_code: string | null };

export default function LoginForm({ next }: { next: string }) {
  const { l, t } = useT();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState<Otp | null>(null);
  const [wait, setWait] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!wait) return;
    const id = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(""); setBusy(true);
    const r = await send<Otp>("/api/auth/otp", { phone: faDigits(phone) });
    setBusy(false);
    if (!r.ok) return setErr(errText(t, r.data.detail));
    setOtp(r.data); setCode(""); setWait(60);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const r = await send("/api/auth/verify", { phone: faDigits(phone), code: faDigits(code), name: name.trim() || null });
    setBusy(false);
    if (!r.ok) return setErr(errText(t, r.data.detail));
    router.replace(next);
    router.refresh();
  }

  const input = "w-full rounded-2xl border border-line bg-bg/60 px-4 py-3.5 text-lg outline-none transition focus:border-accent focus:ring-4 focus:ring-[var(--a1)]/20";
  return (
    <div className="glass pop w-full max-w-md rounded-[2rem] border border-line p-8 shadow-2xl shadow-black/10">
      <span className="btn grid size-14 place-items-center rounded-2xl"><Icon name={otp ? "lock" : "user"} className="size-7" /></span>
      <h1 className="mt-6 text-3xl font-black tracking-tight">{t.loginTitle}</h1>
      <p className="mt-2 leading-7 text-muted">{otp ? fill(t.codeSent, { p: phone }) : t.loginSub}</p>

      {!otp ? (
        <form onSubmit={requestCode} className="mt-8">
          <label className="block text-sm font-bold">{t.phone}
            <input autoFocus required type="tel" dir="ltr" inputMode="numeric" autoComplete="tel" placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${input} mt-2 tracking-widest`} />
          </label>
          {err && <p role="alert" className="pop mt-3 text-sm font-semibold text-[var(--a3)]">{err}</p>}
          <button disabled={busy} className="btn mt-6 h-14 w-full rounded-2xl text-lg font-bold disabled:opacity-60">{t.sendCode}</button>
          <p className="mt-5 text-center text-xs text-muted">{t.demo}</p>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8">
          {otp.dev_code && <p className="mb-4 rounded-2xl border border-dashed border-[var(--a1)] bg-[var(--a1)]/10 px-4 py-2.5 text-center text-sm font-bold">{fill(t.devCode, { c: otp.dev_code })}</p>}
          <label className="block text-sm font-bold">{t.otp}
            <input autoFocus required dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={5} placeholder="•••••" value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d۰-۹]/g, ""))} className={`${input} mt-2 text-center text-2xl tracking-[.6em]`} />
          </label>
          {otp.is_new && (
            <label className="mt-4 block text-sm font-bold">{t.yourName}
              <span className="block text-xs font-normal text-muted">{t.newUser}</span>
              <input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-2`} />
            </label>
          )}
          {err && <p role="alert" className="pop mt-3 text-sm font-semibold text-[var(--a3)]">{err}</p>}
          <button disabled={busy || code.length < 5} className="btn mt-6 h-14 w-full rounded-2xl text-lg font-bold disabled:opacity-60">{t.verify}</button>
          <div className="mt-4 flex justify-between text-sm font-semibold">
            <button type="button" onClick={() => { setOtp(null); setErr(""); }} className="text-muted hover:text-fg">{t.editPhone}</button>
            <button type="button" disabled={wait > 0 || busy} onClick={() => requestCode()} className="text-accent disabled:text-muted">
              {wait ? fill(t.resendIn, { s: num(l, wait) }) : t.resend}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
