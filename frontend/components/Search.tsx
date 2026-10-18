"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { City } from "@/lib/api";
import { num } from "@/lib/i18n";
import { DatesField } from "./Calendar";
import Icon from "./Icon";
import { useT } from "./Providers";

export default function Search({ cities, city = "", guests = 1, dates = ["", ""] }: { cities: City[]; city?: string; guests?: number; dates?: [string, string] }) {
  const { l, t } = useT();
  const router = useRouter();
  const [c, setC] = useState(city);
  const [g, setG] = useState(guests);
  const [d, setD] = useState<[string, string]>(dates);
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams({ ...(c && { city: c }), ...(g > 1 && { guests: String(g) }), ...(d[1] && { check_in: d[0], check_out: d[1] }) });
    router.push(`/?${q}#stays`, { scroll: false });
    document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" });
  };
  const step = "grid size-8 place-items-center rounded-full border border-line text-lg leading-none hover:bg-line disabled:opacity-30";
  return (
    <form onSubmit={go} className="glass flex w-full max-w-3xl flex-col gap-1 rounded-[2rem] border border-line p-2 shadow-2xl shadow-black/10 sm:flex-row sm:items-center sm:rounded-full">
      <label className="flex flex-1 items-center gap-3 rounded-full px-5 py-3 hover:bg-line">
        <Icon name="pin" className="size-5 shrink-0 text-accent" />
        <span className="flex flex-1 flex-col">
          <span className="text-xs font-bold">{t.where}</span>
          <select value={c} onChange={(e) => setC(e.target.value)} className="-ms-1 w-full cursor-pointer appearance-none bg-transparent text-sm text-muted outline-none">
            <option value="">{t.anywhere}</option>
            {cities.map((x) => <option key={x.key} value={x.key}>{x[l]}</option>)}
          </select>
        </span>
      </label>
      <span className="hidden h-8 w-px bg-line sm:block" />
      <div className="flex flex-1 items-center gap-3 rounded-full px-5 py-3 hover:bg-line">
        <Icon name="calendar" className="size-5 shrink-0 text-accent" />
        <DatesField value={d} onChange={setD} className="min-w-0 flex-1 text-start" />
      </div>
      <span className="hidden h-8 w-px bg-line sm:block" />
      <div className="flex items-center gap-3 rounded-full px-5 py-3">
        <Icon name="users" className="size-5 shrink-0 text-accent" />
        <span className="flex flex-col"><span className="text-xs font-bold">{t.guests}</span><span className="text-sm text-muted">{num(l, g)}</span></span>
        <span className="ms-auto flex gap-2">
          <button type="button" className={step} disabled={g <= 1} onClick={() => setG(g - 1)} aria-label="-">−</button>
          <button type="button" className={step} disabled={g >= 12} onClick={() => setG(g + 1)} aria-label="+">+</button>
        </span>
      </div>
      <button className="btn flex h-14 items-center justify-center gap-2 rounded-full px-7 font-bold">
        <Icon name="search" className="size-5" />
        {t.search}
      </button>
    </form>
  );
}
