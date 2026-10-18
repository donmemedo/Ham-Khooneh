"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Me, Ticket } from "@/lib/api";
import { errText, faDigits, send } from "@/lib/client";
import { fmtDate } from "./Calendar";
import Icon from "./Icon";
import { useT } from "./Providers";

const input = "mt-2 w-full rounded-2xl border border-line bg-bg/60 px-4 py-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-[var(--a1)]/20";
const card = "reveal mt-6 rounded-[2rem] border border-line bg-card p-6 sm:p-8";

function useAction() {
  const { t } = useT();
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(path: string, body: unknown, okText: string, method = "POST") {
    setBusy(true); setMsg(null);
    const r = await send(path, body, method);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.ok ? okText : errText(t, r.data.detail) });
    if (r.ok) router.refresh();
    return r.ok;
  }
  const note = msg && <p role="status" className={`pop mt-3 text-sm font-semibold ${msg.ok ? "text-accent" : "text-[var(--a3)]"}`}>{msg.text}</p>;
  return { run, busy, note };
}

export default function AccountForms({ me, tickets }: { me: Me; tickets: Ticket[] }) {
  const { l, t } = useT();
  const router = useRouter();
  const [name, setName] = useState(me.name);
  const [nid, setNid] = useState("");
  const [ticket, setTicket] = useState({ subject: "", message: "", booking_code: "" });
  const profile = useAction(), verify = useAction(), support = useAction();

  return (
    <>
      <form className={card} onSubmit={(e) => { e.preventDefault(); profile.run("/api/me", { name }, t.saved, "PATCH"); }}>
        <h2 className="text-xl font-black">{t.profile}</h2>
        <label className="mt-5 block text-sm font-bold">{t.yourName}<input required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>
        <button disabled={profile.busy} className="mt-5 rounded-full bg-fg px-6 py-3 font-bold text-bg disabled:opacity-60">{t.saveChanges}</button>
        {profile.note}
      </form>

      <form className={card} onSubmit={async (e) => { e.preventDefault(); if (await verify.run("/api/me", { national_id: faDigits(nid) }, t.verified, "PATCH")) setNid(""); }}>
        <h2 className="flex items-center gap-2 text-xl font-black"><Icon name="shield" className="size-5 text-accent" />{t.verifyId}</h2>
        <p className="mt-1 text-sm text-muted">{t.verifySub}</p>
        {me.national_id && <p dir="ltr" className="mt-3 font-bold tracking-widest text-accent rtl:text-end">{me.national_id}</p>}
        <label className="mt-4 block text-sm font-bold">{t.nationalId}
          <input required dir="ltr" inputMode="numeric" maxLength={10} value={nid} onChange={(e) => setNid(e.target.value)} placeholder="0012345678" className={`${input} tracking-widest`} />
        </label>
        <button disabled={verify.busy} className="btn mt-5 rounded-full px-6 py-3 font-bold disabled:opacity-60">{t.verifyId}</button>
        {verify.note}
      </form>

      <form className={card} onSubmit={async (e) => { e.preventDefault(); if (await support.run("/api/support", { ...ticket, booking_code: ticket.booking_code || null }, t.ticketSent)) setTicket({ subject: "", message: "", booking_code: "" }); }}>
        <h2 className="flex items-center gap-2 text-xl font-black"><Icon name="chat" className="size-5 text-accent" />{t.support}</h2>
        <p className="mt-1 text-sm text-muted">{t.supportSub}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">{t.subject}<input required minLength={3} maxLength={120} value={ticket.subject} onChange={(e) => setTicket({ ...ticket, subject: e.target.value })} className={input} /></label>
          <label className="block text-sm font-bold">{t.bookingCode}<input dir="ltr" maxLength={20} placeholder="HE-XXXXXX" value={ticket.booking_code} onChange={(e) => setTicket({ ...ticket, booking_code: e.target.value.toUpperCase() })} className={input} /></label>
        </div>
        <label className="mt-4 block text-sm font-bold">{t.message}<textarea required minLength={10} maxLength={2000} rows={4} value={ticket.message} onChange={(e) => setTicket({ ...ticket, message: e.target.value })} className={input} /></label>
        <button disabled={support.busy} className="mt-5 rounded-full bg-fg px-6 py-3 font-bold text-bg disabled:opacity-60">{t.sendTicket}</button>
        {support.note}
        {tickets.length > 0 && (
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {tickets.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0"><p className="font-bold">{x.subject}</p><p className="line-clamp-2 text-sm text-muted">{x.message}</p></div>
                <div className="shrink-0 text-end text-xs"><p className="font-bold text-[var(--a4)]">{t.ticketStatus[x.status] ?? x.status}</p><p className="text-muted">{fmtDate(l, x.created.slice(0, 10))}</p></div>
              </li>
            ))}
          </ul>
        )}
      </form>

      <button onClick={async () => { await send("/api/auth/logout"); router.replace("/"); router.refresh(); }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-[2rem] border border-line py-4 font-bold text-[var(--a3)] hover:bg-[var(--a3)]/10">
        <Icon name="logout" className="size-5 rtl:rotate-180" />{t.logout}
      </button>
    </>
  );
}
