"use client";
import { useMemo, useRef, useState } from "react";
import type { Range } from "@/lib/api";
import { fill, num } from "@/lib/i18n";
import Icon from "./Icon";
import { useT } from "./Providers";

// All dates are ISO "YYYY-MM-DD", computed in UTC so no timezone/DST drift.
const DAY = 864e5;
export const isoToday = () => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10); };
export const addDays = (s: string, n: number) => new Date(Date.parse(s) + n * DAY).toISOString().slice(0, 10);
export const nightsBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
export const fmtDate = (l: string, s: string, o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  s ? new Date(s).toLocaleDateString(l === "fa" ? "fa-IR-u-ca-persian" : "en-US", { ...o, timeZone: "UTC" }) : "";

type Month = { key: string; label: string; offset: number; days: { iso: string; n: number }[] };

/** Months (Jalali in fa, Gregorian in en) covering the next `count` months from today. */
function useMonths(count: number): Month[] {
  const { l } = useT();
  return useMemo(() => {
    const cal = l === "fa" ? "persian" : "gregory";
    const parts = new Intl.DateTimeFormat(`en-US-u-ca-${cal}-nu-latn`, { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" });
    const label = new Intl.DateTimeFormat(l === "fa" ? "fa-IR-u-ca-persian" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    const get = (iso: string) => Object.fromEntries(parts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
    let d = isoToday();
    d = addDays(d, 1 - +get(d).day); // first day of this month
    const out: Month[] = [];
    for (;;) {
      const p = get(d), key = `${p.year}-${p.month}`;
      if (out.at(-1)?.key !== key) {
        if (out.length === count) break;
        const wd = new Date(d).getUTCDay(); // 0 = Sunday; fa weeks start Saturday
        out.push({ key, label: label.format(new Date(d)), offset: l === "fa" ? (wd + 1) % 7 : wd, days: [] });
      }
      out.at(-1)!.days.push({ iso: d, n: +p.day });
      d = addDays(d, 1);
    }
    return out;
  }, [l, count]);
}

export function RangeCalendar({ value, onChange, booked = [] }: { value: [string, string]; onChange: (v: [string, string]) => void; booked?: Range[] }) {
  const { l } = useT();
  const months = useMonths(12);
  const [page, setPage] = useState(0);
  const [ci, co] = value;
  const today = isoToday();
  const isBooked = (d: string) => booked.some((b) => b.check_in <= d && d < b.check_out);
  const blockedBetween = (a: string, b: string) => booked.some((x) => x.check_in < b && a < x.check_out);
  const week = l === "fa" ? ["ش", "ی", "د", "س", "چ", "پ", "ج"] : ["S", "M", "T", "W", "T", "F", "S"];

  const pick = (d: string) => {
    if (!ci || co || d <= ci || blockedBetween(ci, d)) onChange([d, ""]);
    else onChange([ci, d]);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setPage(Math.max(0, page - 1))} disabled={!page} className="grid size-9 place-items-center rounded-full hover:bg-line disabled:opacity-25" aria-label="prev">
          <Icon name="arrow" className="size-4 ltr:rotate-180" />
        </button>
        <button type="button" onClick={() => setPage(Math.min(months.length - 2, page + 1))} disabled={page >= months.length - 2} className="grid size-9 place-items-center rounded-full hover:bg-line disabled:opacity-25" aria-label="next">
          <Icon name="arrow" className="size-4 rtl:rotate-180" />
        </button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {months.slice(page, page + 2).map((m, mi) => (
          <div key={m.key} className={mi ? "hidden sm:block" : ""}>
            <p className="-mt-11 mb-5 text-center font-bold">{m.label}</p>
            <div className="grid grid-cols-7 text-center text-xs text-muted">{week.map((w, i) => <span key={i} className="py-1">{w}</span>)}</div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: m.offset }, (_, i) => <span key={"e" + i} />)}
              {m.days.map(({ iso, n }) => {
                // a booked night can still be someone's check-out day
                const checkoutOk = ci && !co && iso > ci && !blockedBetween(ci, iso);
                const off = iso < today || (isBooked(iso) && !checkoutOk);
                const edge = iso === ci || iso === co;
                const inside = ci && co && iso > ci && iso < co;
                return (
                  <button key={iso} type="button" disabled={off} onClick={() => pick(iso)}
                    className={`relative aspect-square text-sm font-semibold transition ${inside ? "bg-[var(--a1)]/15" : ""} ${iso === ci && co ? "rounded-s-full bg-[var(--a1)]/15" : ""} ${iso === co ? "rounded-e-full bg-[var(--a1)]/15" : ""} disabled:cursor-not-allowed disabled:text-muted/40 ${isBooked(iso) && iso >= today ? "line-through" : ""}`}>
                    <span className={`grid size-full place-items-center rounded-full ${edge ? "btn" : off ? "" : "hover:ring-2 hover:ring-fg/30"}`}>{num(l, n)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A field showing the chosen range; opens the calendar in a modal. */
export function DatesField({ value, onChange, booked, className = "" }: { value: [string, string]; onChange: (v: [string, string]) => void; booked?: Range[]; className?: string }) {
  const { l, t } = useT();
  const dlg = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<[string, string]>(value);
  const [ci, co] = value;
  const n = ci && co ? nightsBetween(ci, co) : 0;
  return (
    <>
      <button type="button" onClick={() => { setDraft(value); dlg.current?.showModal(); }} className={className}>
        <span className="block text-xs font-bold">{t.dates}</span>
        <span className="block truncate text-sm text-muted">{ci && co ? `${fmtDate(l, ci)} – ${fmtDate(l, co)} · ${fill(t.nightsCount, { n: num(l, n) })}` : t.addDates}</span>
      </button>
      <dialog ref={dlg} onClick={(e) => e.target === dlg.current && dlg.current?.close()} className="m-auto w-[min(94vw,44rem)] rounded-[2rem] border border-line bg-card p-6 text-fg shadow-2xl">
        <p className="mb-6 text-center text-sm text-muted">
          {draft[0] ? `${fmtDate(l, draft[0], { weekday: "short", day: "numeric", month: "long" })} ${l === "fa" ? "←" : "→"} ${draft[1] ? fmtDate(l, draft[1], { weekday: "short", day: "numeric", month: "long" }) : "…"}` : t.addDates}
        </p>
        <RangeCalendar value={draft} onChange={setDraft} booked={booked} />
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <button type="button" onClick={() => setDraft(["", ""])} className="rounded-full px-4 py-2 text-sm font-bold underline-offset-4 hover:underline">{t.clearDates}</button>
          <button type="button" disabled={!!draft[0] && !draft[1]} onClick={() => { onChange(draft); dlg.current?.close(); }} className="btn rounded-full px-8 py-3 font-bold disabled:opacity-50">{t.apply}</button>
        </div>
      </dialog>
    </>
  );
}
