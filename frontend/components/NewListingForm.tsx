"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { City } from "@/lib/api";
import { errText, faDigits, send } from "@/lib/client";
import { num } from "@/lib/i18n";
import Icon from "./Icon";
import { useT } from "./Providers";

const COMMISSION = 0.1;
const MAX_PHOTOS = 8, MAX_BYTES = 5 * 1024 * 1024;

export default function NewListingForm({ cities }: { cities: City[] }) {
  const { l, t } = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ title: "", city: cities[0]?.key ?? "", type: "villa", area: "", description: "", guests: 2, bedrooms: 1, baths: 1, price: "", instant: true });
  const [amenities, setAmenities] = useState<string[]>(["wifi"]);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []); // free previews on unmount

  const set = (k: keyof typeof f, v: string | number | boolean) => setF({ ...f, [k]: v });
  const price = +faDigits(f.price) || 0;

  function addFiles(list: FileList | null) {
    setErr("");
    const ok = [...(list ?? [])].filter((x) => /^image\/(jpeg|png|webp)$/.test(x.type) && x.size <= MAX_BYTES);
    if (ok.length < (list?.length ?? 0)) setErr(t.errors.bad_photo);
    setPhotos((p) => [...p, ...ok.map((file) => { const url = URL.createObjectURL(file); urls.current.push(url); return { file, url }; })].slice(0, MAX_PHOTOS));
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (step === 2 && !photos.length) return setErr(t.errors.photos_count);
    if (step < 3) return setStep(step + 1);
    publish();
  }

  async function publish() {
    const fd = new FormData();
    Object.entries({ ...f, price }).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append("amenities", amenities.join(","));
    photos.forEach((p) => fd.append("photos", p.file));
    setBusy(true);
    const r = await send<{ id: number }>("/api/host/listings", fd);
    setBusy(false);
    if (!r.ok) return setErr(errText(t, r.data.detail));
    router.push(`/listings/${r.data.id}`);
    router.refresh();
  }

  const input = "mt-2 w-full rounded-2xl border border-line bg-bg/60 px-4 py-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-[var(--a1)]/20";
  const label = "block text-sm font-bold";
  const counter = (k: "guests" | "bedrooms" | "baths", label: string, min: number) => (
    <div className="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
      <span className="font-semibold">{label}</span>
      <span className="flex items-center gap-3">
        <button type="button" disabled={f[k] <= min} onClick={() => set(k, f[k] - 1)} className="grid size-8 place-items-center rounded-full border border-line disabled:opacity-30">−</button>
        <b className="w-6 text-center tabular-nums">{num(l, f[k])}</b>
        <button type="button" disabled={f[k] >= 20} onClick={() => set(k, f[k] + 1)} className="grid size-8 place-items-center rounded-full border border-line disabled:opacity-30">+</button>
      </span>
    </div>
  );

  return (
    <form onSubmit={nextStep} className="glass reveal mt-8 rounded-[2rem] border border-line p-6 shadow-2xl shadow-black/10 sm:p-8">
      <ol className="grid grid-cols-4 gap-2">
        {t.step.map((s, i) => (
          <li key={s}>
            <span className={`block h-1.5 rounded-full transition-all duration-500 ${i <= step ? "btn" : "bg-line"}`} />
            <span className={`mt-2 block text-xs font-bold ${i === step ? "" : "text-muted"}`}>{s}</span>
          </li>
        ))}
      </ol>

      <div key={step} className="pop mt-8 space-y-5">
        {step === 0 && <>
          <label className={label}>{t.listingTitle}<input required minLength={3} maxLength={80} placeholder={t.titlePh} value={f.title} onChange={(e) => set("title", e.target.value)} className={input} /></label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={label}>{t.city}<select value={f.city} onChange={(e) => set("city", e.target.value)} className={input}>{cities.map((c) => <option key={c.key} value={c.key}>{c[l]}</option>)}</select></label>
            <label className={label}>{t.areaLabel}<input required minLength={2} maxLength={60} value={f.area} onChange={(e) => set("area", e.target.value)} className={input} /></label>
          </div>
          <fieldset><legend className={label}>{t.type}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {Object.entries(t.types).map(([k, v]) => (
                <button type="button" key={k} onClick={() => set("type", k)} className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${f.type === k ? "border-transparent bg-fg text-bg" : "border-line hover:border-fg/40"}`}>{v}</button>
              ))}
            </div>
          </fieldset>
        </>}

        {step === 1 && <>
          <label className={label}>{t.description}<textarea required minLength={20} maxLength={2000} rows={5} placeholder={t.descPh} value={f.description} onChange={(e) => set("description", e.target.value)} className={input} /></label>
          <fieldset><legend className={label}>{t.capacity}</legend>
            <div className="mt-2 grid gap-2">{counter("guests", t.guests, 1)}{counter("bedrooms", t.bedrooms, 0)}{counter("baths", t.baths, 1)}</div>
          </fieldset>
          <fieldset><legend className={label}>{t.amenities}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(t.amenity).map(([k, v]) => {
                const on = amenities.includes(k);
                return <button type="button" key={k} aria-pressed={on} onClick={() => setAmenities(on ? amenities.filter((a) => a !== k) : [...amenities, k])}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? "border-transparent bg-[var(--a1)]/15 text-accent" : "border-line"}`}>{on && <Icon name="check" className="size-4" />}{v}</button>;
              })}
            </div>
          </fieldset>
        </>}

        {step === 2 && <>
          <p className="text-sm text-muted">{t.photosSub}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p, i) => (
              <div key={p.url} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                <img src={p.url} alt="" className="aspect-square size-full object-cover" />
                <button type="button" onClick={() => setPhotos(photos.filter((x) => x !== p))} aria-label="remove" className="absolute end-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white"><Icon name="x" className="size-4" /></button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                className={`grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line text-muted transition hover:border-accent hover:text-accent ${photos.length ? "" : "col-span-2 row-span-2"}`}>
                <span className="flex flex-col items-center gap-2 text-sm font-bold"><Icon name="image" className="size-8" />{t.addPhotos}</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </>}

        {step === 3 && <>
          <label className={label}>{t.nightly} ({t.toman})
            <input required dir="ltr" inputMode="numeric" placeholder="2000000" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d۰-۹]/g, ""))} className={`${input} text-2xl font-black tracking-wide`} />
          </label>
          <div className="rounded-2xl bg-[var(--a1)]/10 p-4">
            <p className="text-sm text-muted">{t.youEarn}</p>
            <p className="text-2xl font-black text-accent">{num(l, Math.round(price * (1 - COMMISSION)))} {t.toman}</p>
            <p className="text-xs text-muted">{t.afterFee}</p>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line p-4">
            <span><b className="flex items-center gap-1.5"><Icon name="bolt" className="size-4 text-accent" />{t.instantLabel}</b><span className="text-sm text-muted">{t.instantSub}</span></span>
            <input type="checkbox" checked={f.instant} onChange={(e) => set("instant", e.target.checked)} className="size-6 accent-[var(--a2)]" />
          </label>
        </>}
      </div>

      {err && <p role="alert" className="pop mt-5 rounded-2xl bg-[var(--a3)]/10 px-4 py-3 text-sm font-semibold text-[var(--a3)]">{err}</p>}
      <div className="mt-8 flex gap-3">
        {step > 0 && <button type="button" onClick={() => { setErr(""); setStep(step - 1); }} className="rounded-2xl border border-line px-6 font-bold">{t.prev}</button>}
        <button disabled={busy} className="btn h-14 flex-1 rounded-2xl text-lg font-bold disabled:opacity-60">{step < 3 ? t.next : busy ? t.publishing : t.publish}</button>
      </div>
    </form>
  );
}
