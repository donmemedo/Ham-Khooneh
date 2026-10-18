"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Booking, HostData } from "@/lib/api";
import { errText, faDigits, send } from "@/lib/client";
import { num } from "@/lib/i18n";
import { img } from "@/lib/img";
import { fmtDate } from "./Calendar";
import Icon from "./Icon";
import { useT } from "./Providers";
import Status from "./Status";

function useSend() {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async (path: string, body?: unknown, method = "POST") => {
    setBusy(true); setErr("");
    const r = await send(path, body, method);
    setBusy(false);
    if (!r.ok) setErr(errText(t, r.data.detail));
    else router.refresh();
    return r.ok;
  };
  return { go, busy, err };
}

export function ReservationRow({ b }: { b: Booking }) {
  const { l, t } = useT();
  const { go, busy, err } = useSend();
  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <img src={img(b.images[0])} alt="" className="size-14 rounded-2xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{b.guest_name} {b.guest_verified && <Icon name="shield" className="inline size-4 text-accent" />}<span className="font-normal text-muted"> · {b.title[l]}</span></p>
        <p className="text-sm text-muted">{fmtDate(l, b.check_in)} – {fmtDate(l, b.check_out)} · {num(l, b.guests)} {t.people} · {t.payout}: <b className="text-fg">{num(l, b.payout)}</b></p>
        {err && <p className="text-sm font-semibold text-[var(--a3)]">{err}</p>}
      </div>
      {b.status === "pending" ? (
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => go(`/api/host/bookings/${b.code}/confirm`)} className="btn rounded-full px-5 py-2 text-sm font-bold disabled:opacity-60">{t.accept}</button>
          <button disabled={busy} onClick={() => go(`/api/host/bookings/${b.code}/decline`)} className="rounded-full border border-line px-5 py-2 text-sm font-bold hover:bg-line disabled:opacity-60">{t.decline}</button>
        </div>
      ) : <Status status={b.status} label={t.status[b.status]} />}
    </div>
  );
}

export function ListingRow({ x }: { x: HostData["listings"][number] }) {
  const { l, t } = useT();
  const { go, busy, err } = useSend();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(x.price));
  return (
    <article className={`reveal overflow-hidden rounded-3xl border border-line bg-card transition ${x.active ? "" : "opacity-70"}`}>
      <Link href={`/listings/${x.id}`} className="relative block">
        <img src={img(x.images[0])} alt="" className="aspect-[16/8] w-full object-cover" />
        <span className={`glass absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${x.active ? "text-accent" : "text-muted"}`}>{x.active ? t.active : t.paused}</span>
      </Link>
      <div className="p-5">
        <h3 className="truncate text-lg font-bold">{x.title[l]}</h3>
        <p className="mt-1 text-sm text-muted">
          <Icon name="star" fill className="inline size-3.5 text-[var(--a4)]" /> {num(l, x.rating)} · {num(l, x.bookings)} {t.bookingsCount} · {t.earnings}: <b className="text-fg">{num(l, x.earnings)}</b>
        </p>
        {editing ? (
          <form className="mt-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (await go(`/api/host/listings/${x.id}`, { price: +faDigits(price) }, "PATCH")) setEditing(false); }}>
            <input autoFocus dir="ltr" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-line bg-bg/60 px-3 py-2 outline-none focus:border-accent" />
            <button disabled={busy} className="btn rounded-xl px-4 text-sm font-bold">{t.saveChanges}</button>
          </form>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-2">
            <button onClick={() => setEditing(true)} className="rounded-xl px-2 py-1 text-start hover:bg-line">
              <span className="block text-xs text-muted">{t.price} · {t.editPrice}</span><b>{num(l, x.price)}</b> <span className="text-sm text-muted">{t.toman}</span>
            </button>
            <button disabled={busy} onClick={() => go(`/api/host/listings/${x.id}`, { active: !x.active }, "PATCH")} className="rounded-full border border-line px-4 py-2 text-sm font-bold hover:bg-line disabled:opacity-60">
              {x.active ? t.pause : t.resume}
            </button>
          </div>
        )}
        {err && <p className="mt-2 text-sm font-semibold text-[var(--a3)]">{err}</p>}
      </div>
    </article>
  );
}
