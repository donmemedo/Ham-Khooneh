import Link from "next/link";
import HostCalc from "@/components/HostCalc";
import Icon from "@/components/Icon";
import ListingCard from "@/components/ListingCard";
import Search from "@/components/Search";
import { api, img, locale, type City, type Listing } from "@/lib/api";
import { num } from "@/lib/i18n";

const TYPES = ["villa", "apartment", "suite", "ecolodge", "cabin"];
const TRUST_ICONS = ["shield", "lock", "camera", "chat"];

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { l, t } = await locale();
  const { city = "", type = "", guests = "1", check_in = "", check_out = "", sort = "" } = await searchParams;
  const dated = /^\d{4}-\d{2}-\d{2}$/.test(check_in) && /^\d{4}-\d{2}-\d{2}$/.test(check_out);
  const q = new URLSearchParams({ ...(city && { city }), ...(type && { type }), guests, sort, ...(dated && { check_in, check_out }) });
  const [cities, list] = await Promise.all([api<City[]>("/api/cities"), api<Listing[]>(`/api/listings?${q}`)]);
  const cityName = Object.fromEntries((cities ?? []).map((c) => [c.key, c[l]]));
  const href = (p: Record<string, string>) => {
    const s = new URLSearchParams({ city, type, guests: guests === "1" ? "" : guests, sort, ...(dated && { check_in, check_out }), ...p });
    for (const [k, v] of [...s]) if (!v) s.delete(k);
    return `/?${s}#stays`;
  };
  const chip = (on: boolean) => `shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${on ? "border-transparent bg-fg text-bg" : "border-line hover:border-fg/40"}`;

  return (
    <main>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="blob -top-40 start-[-10%] size-[38rem] bg-[var(--a1)]" />
          <div className="blob top-10 end-[-15%] size-[34rem] bg-[var(--a2)] [animation-delay:-6s]" />
          <div className="blob bottom-[-20rem] start-1/3 size-[36rem] bg-[var(--a3)] [animation-delay:-12s]" />
          <div className="noise absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg" />
        </div>
        <div className="mx-auto grid min-h-[92svh] max-w-7xl items-center gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="pop">
            <span className="glass inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm font-semibold">
              <span className="size-2 animate-pulse rounded-full bg-[var(--a1)]" />{t.eyebrow}
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
              {t.heroA}<br /><span className="grad">{t.heroB}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{t.heroSub}</p>
            <div className="mt-10"><Search cities={cities ?? []} city={city} guests={+guests || 1} dates={dated ? [check_in, check_out] : ["", ""]} /></div>
          </div>
          <div className="relative mx-auto hidden h-[30rem] w-full max-w-lg [perspective:1200px] sm:block">
            {[["323780", "start-0 top-8 w-[62%] -rotate-6", "0s"], ["258154", "end-0 top-0 w-[52%] rotate-6", "-2s"], ["2581922", "bottom-0 start-[22%] w-[56%] rotate-2", "-4s"]].map(([id, pos, d]) => (
              <div key={id} className={`float absolute ${pos}`} style={{ animationDelay: d }}>
                <img src={img(id)} alt="" className="aspect-[4/5] w-full rounded-[2rem] border-4 border-card object-cover shadow-2xl shadow-black/30 transition duration-500 hover:scale-105 hover:rotate-0" />
              </div>
            ))}
            <div className="glass float absolute -start-6 bottom-16 flex items-center gap-3 rounded-2xl border border-line p-3 pe-5 shadow-xl [animation-delay:-3s]">
              <span className="btn grid size-10 place-items-center rounded-xl"><Icon name="star" fill className="size-5" /></span>
              <span><b className="block text-lg leading-tight">{num(l, 4.9)}</b><span className="text-xs text-muted">{num(l, 2500)}+ {t.reviews}</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4 lg:gap-5">
        {t.trust.map(([h, p], i) => (
          <div key={h} className="reveal rounded-3xl border border-line bg-card p-5 sm:p-6">
            <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, var(--a${i + 1}), var(--a${((i + 1) % 4) + 1}))` }}>
              <Icon name={TRUST_ICONS[i]} className="size-5" />
            </span>
            <h3 className="mt-4 font-bold">{h}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{p}</p>
          </div>
        ))}
      </section>

      {/* DESTINATIONS */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <h2 className="reveal text-3xl font-black tracking-tight sm:text-4xl">{t.destinations}</h2>
        <p className="mt-2 text-muted">{t.destinationsSub}</p>
        <div className="no-bar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          {(cities ?? []).map((c) => (
            <Link key={c.key} href={`/?city=${c.key}#stays`} scroll={false} className="group relative aspect-[3/4] w-56 shrink-0 snap-start overflow-hidden rounded-[2rem] sm:w-64">
              <img src={img(c.image)} alt={c[l]} loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-2xl font-black">{c[l]}</h3>
                <p className="text-sm text-white/80">{num(l, c.count)} {t.listings}</p>
              </div>
              {city === c.key && <span className="absolute inset-0 rounded-[2rem] ring-4 ring-inset ring-[var(--a1)]" />}
            </Link>
          ))}
        </div>
      </section>

      {/* STAYS */}
      <section id="stays" className="mx-auto mt-16 max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{city ? `${t.staysIn} ${cityName[city] ?? ""}` : t.stays}</h2>
        <div className="no-bar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <Link href={href({ type: "" })} scroll={false} className={chip(!type)}>{t.all}</Link>
          {TYPES.map((k) => <Link key={k} href={href({ type: k })} scroll={false} className={chip(type === k)}>{t.types[k]}</Link>)}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {Object.keys(t.sort).map((k) => <Link key={k || "rec"} href={href({ sort: k })} scroll={false} className={chip(sort === k)}>{t.sort[k]}</Link>)}
        </div>
        {list?.length ? (
          <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((x) => <ListingCard key={x.id} x={x} city={cityName[x.city] ?? ""} query={dated ? `?check_in=${check_in}&check_out=${check_out}&guests=${guests}` : ""} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-line p-16 text-center">
            <p className="text-lg font-bold">{t.empty}</p>
            <Link href="/" className="mt-4 inline-block rounded-full bg-fg px-5 py-2.5 text-sm font-bold text-bg">{t.clear}</Link>
          </div>
        )}
      </section>

      {/* HOST */}
      <section id="host" className="mx-auto my-24 max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <div className="reveal relative isolate grid items-center gap-10 overflow-hidden rounded-[2.5rem] bg-[#0b0b12] p-8 text-white sm:p-12 lg:grid-cols-2 lg:p-16">
          <div className="blob -z-10 -top-32 end-0 size-96 bg-[var(--a2)]" />
          <div className="blob -z-10 -bottom-40 start-0 size-96 bg-[var(--a1)] [animation-delay:-8s]" />
          <div>
            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">{t.hostTitle}</h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-white/70">{t.hostSub}</p>
            <Link href="/host/new" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-black transition hover:scale-105">
              {t.addListing}<Icon name="arrow" className="size-4 rtl:rotate-180" />
            </Link>
          </div>
          <HostCalc />
        </div>
      </section>
    </main>
  );
}
