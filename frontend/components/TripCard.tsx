"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Booking } from "@/lib/api";
import { errText, send } from "@/lib/client";
import { num } from "@/lib/i18n";
import { img } from "@/lib/img";
import { fmtDate } from "./Calendar";
import Icon from "./Icon";
import { useT } from "./Providers";
import Status from "./Status";

export default function TripCard({ b }: { b: Booking }) {
  const { l, t } = useT();
  const router = useRouter();
  const cancelDlg = useRef<HTMLDialogElement>(null);
  const reviewDlg = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(path: string, body?: unknown, dlg?: HTMLDialogElement | null) {
    setErr(""); setBusy(true);
    const r = await send(path, body);
    setBusy(false);
    if (!r.ok) return setErr(errText(t, r.data.detail));
    dlg?.close();
    router.refresh();
  }

  const dlgCls = "m-auto w-[min(92vw,28rem)] rounded-[2rem] border border-line bg-card p-7 text-fg shadow-2xl";
  return (
    <article className="reveal overflow-hidden rounded-3xl border border-line bg-card">
      <Link href={`/listings/${b.listing_id}`} className="flex gap-4 p-4">
        <img src={img(b.images[0])} alt="" className="size-24 shrink-0 rounded-2xl object-cover sm:size-28" />
        <div className="min-w-0 flex-1">
          <Status status={b.status} label={t.status[b.status]} />
          <h3 className="mt-2 truncate font-bold">{b.title[l]}</h3>
          <p className="text-sm text-muted">{b.area[l]} · {fmtDate(l, b.check_in)} – {fmtDate(l, b.check_out)}</p>
          <p className="mt-1 text-sm"><b>{num(l, b.total)}</b> {t.toman} · <span dir="ltr" className="text-muted">{b.code}</span></p>
        </div>
      </Link>
      {(b.can_cancel || b.can_review) && (
        <div className="flex gap-2 border-t border-line p-3">
          {b.can_review && <button onClick={() => { setErr(""); reviewDlg.current?.showModal(); }} className="btn flex-1 rounded-xl py-2.5 text-sm font-bold">{t.writeReview}</button>}
          {b.can_cancel && <button onClick={() => { setErr(""); cancelDlg.current?.showModal(); }} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-[var(--a3)] hover:bg-[var(--a3)]/10">{t.cancel}</button>}
        </div>
      )}

      <dialog ref={cancelDlg} className={dlgCls}>
        <p className="text-lg font-bold">{t.cancelConfirm}</p>
        {err && <p role="alert" className="mt-3 text-sm font-semibold text-[var(--a3)]">{err}</p>}
        <div className="mt-6 flex gap-2">
          <button disabled={busy} onClick={() => act(`/api/bookings/${b.code}/cancel`, undefined, cancelDlg.current)} className="flex-1 rounded-2xl bg-[var(--a3)] py-3 font-bold text-white disabled:opacity-60">{t.yes}</button>
          <button onClick={() => cancelDlg.current?.close()} className="flex-1 rounded-2xl border border-line py-3 font-bold">{t.no}</button>
        </div>
      </dialog>

      <dialog ref={reviewDlg} className={dlgCls}>
        <form onSubmit={(e) => { e.preventDefault(); act(`/api/bookings/${b.code}/review`, { rating, text }, reviewDlg.current); }}>
          <p className="text-xl font-black">{t.reviewTitle}</p>
          <div className="mt-4 flex gap-1" dir="ltr">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={String(n)} className="transition hover:scale-110">
                <Icon name="star" fill={n <= rating} className={`size-9 ${n <= rating ? "text-[var(--a4)]" : "text-muted/40"}`} />
              </button>
            ))}
          </div>
          <textarea required minLength={3} maxLength={600} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.reviewPh}
            className="mt-4 w-full rounded-2xl border border-line bg-bg/60 p-4 outline-none focus:border-accent" />
          {err && <p role="alert" className="mt-2 text-sm font-semibold text-[var(--a3)]">{err}</p>}
          <div className="mt-4 flex gap-2">
            <button disabled={busy} className="btn flex-1 rounded-2xl py-3 font-bold disabled:opacity-60">{t.send}</button>
            <button type="button" onClick={() => reviewDlg.current?.close()} className="rounded-2xl border border-line px-5 py-3 font-bold">{t.no}</button>
          </div>
        </form>
      </dialog>
    </article>
  );
}
