"use client";
import { useState } from "react";
import { num } from "@/lib/i18n";
import { useT } from "./Providers";

const COMMISSION = 0.1; // business plan: 10% host commission

export default function HostCalc() {
  const { l, t } = useT();
  const [price, setPrice] = useState(3_000_000);
  const [nights, setNights] = useState(12);
  const income = Math.round(price * nights * (1 - COMMISSION));
  return (
    <div className="glass rounded-[2rem] border border-white/15 p-6 text-white sm:p-8" style={{ background: "rgb(255 255 255 / .08)" }}>
      <label className="block">
        <span className="flex justify-between text-sm text-white/70"><span>{t.nightly}</span><b className="text-white">{num(l, price)} {t.toman}</b></span>
        <input type="range" min={500_000} max={15_000_000} step={100_000} value={price} onChange={(e) => setPrice(+e.target.value)} className="mt-3 w-full" />
      </label>
      <label className="mt-6 block">
        <span className="flex justify-between text-sm text-white/70"><span>{t.nightsMonth}</span><b className="text-white">{num(l, nights)}</b></span>
        <input type="range" min={1} max={30} value={nights} onChange={(e) => setNights(+e.target.value)} className="mt-3 w-full" />
      </label>
      <div className="mt-8 border-t border-white/15 pt-6">
        <p className="text-sm text-white/70">{t.monthly}</p>
        <p className="mt-1 text-4xl font-black tracking-tight tabular-nums sm:text-5xl">{num(l, income)} <span className="text-lg font-bold text-white/70">{t.toman}</span></p>
        <p className="mt-1 text-xs text-white/60">{t.afterFee}</p>
      </div>
    </div>
  );
}
