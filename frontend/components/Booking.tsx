"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Booking as B, Range } from "@/lib/api";
import { errText, send } from "@/lib/client";
import { num } from "@/lib/i18n";
import { DatesField, nightsBetween } from "./Calendar";
import Icon from "./Icon";
import { useT } from "./Providers";

type Props = { id: number; price: number; maxGuests: number; fee: number; booked: Range[]; instant: boolean; isMine: boolean; initial: [string, string]; initialGuests: number };

export default function Booking({ id, price, maxGuests, fee, booked, instant, isMine, initial, initialGuests }: Props) {
  const { l, t, me } = useT();
  const router = useRouter();
  const path = usePathname();
  const [dates, setDates] = useState<[string, string]>(initial);
  const [g, setG] = useState(Math.min(Math.max(initialGuests, 1), maxGuests));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<B | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);

  const [ci, co] = dates;
  const nights = ci && co ? nightsBetween(ci, co) : 0;
  const subtotal = price * nights;
  const serviceFee = Math.round(subtotal * fee);
  const next = `${path}?check_in=${ci}&check_out=${co}&guests=${g}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return router.push(`/login?next=${encodeURIComponent(next)}`);
    setErr("");
    setBusy(true);
    const r = await send<B>("/api/bookings", { listing_id: id, check_in: ci, check_out: co, guests: g });
    setBusy(false);
    if (!r.ok) return setErr(errText(t, r.data.detail));
    setDone(r.data);
    dlg.current?.showModal();
    router.refresh();
  }

  const box = "rounded-2xl border border-line bg-bg/60 px-4 py-2.5 transition focus-within:border-accent";
  return (
    <>
      <form id="book" onSubmit={submit} className="glass scroll-mt-24 rounded-[2rem] border border-line p-6 shadow-2xl shadow-black/10">
        <p className="text-2xl font-black">{num(l, price)} <span className="text-base font-semibold text-muted">{t.toman} / {t.perNight}</span></p>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Icon name={instant ? "bolt" : "calendar"} className="size-3.5 text-accent" />{instant ? t.instantNote : t.requestNote}
        </p>
        <div className="mt-5 grid gap-2">
          <DatesField value={dates} onChange={(v) => { setDates(v); setErr(""); }} booked={booked} className={`${box} text-start hover:border-fg/30`} />
          <label className={box}><span className="block text-xs font-bold">{t.guests}</span>
            <select value={g} onChange={(e) => setG(+e.target.value)} className="w-full bg-transparent text-sm outline-none">
              {Array.from({ length: maxGuests }, (_, i) => <option key={i} value={i + 1}>{num(l, i + 1)} {t.people}</option>)}
            </select>
          </label>
        </div>
        {err && <p role="alert" className="pop mt-4 rounded-2xl bg-[var(--a3)]/10 px-4 py-3 text-sm font-semibold text-[var(--a3)]">{err}</p>}
        {isMine ? (
          <Link href="/host" className="mt-5 grid h-14 place-items-center rounded-2xl bg-fg font-bold text-bg">{t.ownListing} · {t.manage}</Link>
        ) : (
          <button disabled={busy || nights < 1} className="btn mt-5 h-14 w-full rounded-2xl text-lg font-bold disabled:opacity-60">
            {busy ? t.reserving : !me ? t.loginToBook : t.reserve}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-muted">{t.noCharge}</p>
        {nights > 0 && (
          <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{num(l, price)} × {num(l, nights)} {t.nights}</dt><dd>{num(l, subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{t.serviceFee} ({num(l, fee * 100)}٪)</dt><dd>{num(l, serviceFee)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-black"><dt>{t.total}</dt><dd>{num(l, subtotal + serviceFee)} {t.toman}</dd></div>
          </dl>
        )}
      </form>

      <div className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-line px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <p className="font-black">{num(l, price)} <span className="text-sm font-semibold text-muted">{t.toman} / {t.perNight}</span></p>
        <a href="#book" className="btn rounded-full px-7 py-3 font-bold">{t.reserve}</a>
      </div>

      <dialog ref={dlg} className="m-auto w-[min(92vw,26rem)] rounded-[2rem] border border-line bg-card p-8 text-center text-fg shadow-2xl">
        <span className="btn mx-auto grid size-16 place-items-center rounded-full"><Icon name={done?.status === "pending" ? "calendar" : "check"} className="size-8" /></span>
        <h3 className="mt-5 text-2xl font-black">{done?.status === "pending" ? t.requestSent : t.booked}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{done?.status === "pending" ? t.requestSub : t.bookedSub}</p>
        <p className="mt-5 text-xs text-muted">{t.code}</p>
        <p dir="ltr" className="grad text-3xl font-black tracking-widest">{done?.code}</p>
        <Link href="/trips" className="btn mt-6 block rounded-2xl py-3.5 font-bold">{t.viewTrips}</Link>
        <form method="dialog"><button className="mt-2 w-full rounded-2xl py-3 font-bold text-muted hover:text-fg">{t.done}</button></form>
      </dialog>
    </>
  );
}
