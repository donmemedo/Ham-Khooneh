import Link from "next/link";
import Empty from "@/components/Empty";
import { ListingRow, ReservationRow } from "@/components/HostRows";
import Icon from "@/components/Icon";
import { api, locale, requireMe, type HostData } from "@/lib/api";
import { num } from "@/lib/i18n";

export default async function Host() {
  await requireMe("/host");
  const { l, t } = await locale();
  const d = await api<HostData>("/api/host");
  if (!d) return null;
  const stats: [string, string, string][] = [
    ["wallet", t.earnings, `${num(l, d.stats.earnings)} ${t.toman}`],
    ["calendar", t.upcomingRes, num(l, d.stats.upcoming)],
    ["bolt", t.pendingRes, num(l, d.stats.pending)],
    ["star", t.avgRating, d.stats.rating ? num(l, d.stats.rating) : "—"],
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
      <div className="pop flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t.dashboard}</h1>
          <p className="mt-2 text-muted">{t.dashSub}</p>
        </div>
        <Link href="/host/new" className="btn inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold"><Icon name="plus" className="size-5" />{t.addListing}</Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([ic, label, v], i) => (
          <div key={label} className="reveal relative overflow-hidden rounded-3xl border border-line bg-card p-5">
            <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, var(--a${i + 1}), var(--a${((i + 1) % 4) + 1}))` }}><Icon name={ic} className="size-5" /></span>
            <p className="mt-4 text-sm text-muted">{label}</p>
            <p className="mt-1 text-xl font-black tabular-nums sm:text-2xl">{v}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-black">{t.reservations}</h2>
        {d.reservations.length ? (
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">{d.reservations.map((b) => <ReservationRow key={b.code} b={b} />)}</div>
        ) : <p className="mt-4 text-muted">{t.noRes}</p>}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-black">{t.myListings}</h2>
        {d.listings.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">{d.listings.map((x) => <ListingRow key={x.id} x={x} />)}</div>
        ) : <Empty icon="home" title={t.noListings} sub={t.noListingsSub} href="/host/new" cta={t.addListing} />}
      </section>
    </main>
  );
}
