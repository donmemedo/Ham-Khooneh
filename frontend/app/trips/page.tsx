import Empty from "@/components/Empty";
import TripCard from "@/components/TripCard";
import { api, locale, requireMe, type Booking } from "@/lib/api";

export default async function Trips() {
  await requireMe("/trips");
  const { t } = await locale();
  const trips = (await api<Booking[]>("/api/me/bookings")) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter((b) => b.check_out > today).reverse();
  const past = trips.filter((b) => b.check_out <= today);
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
      <h1 className="pop text-4xl font-black tracking-tight">{t.nav.trips}</h1>
      {!trips.length && <Empty icon="bag" title={t.noTrips} sub={t.noTripsSub} href="/" cta={t.explore} />}
      {[[t.upcoming, upcoming], [t.past, past]].map(([title, list]) => (list as Booking[]).length > 0 && (
        <section key={title as string} className="mt-10">
          <h2 className="text-xl font-black">{title as string}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">{(list as Booking[]).map((b) => <TripCard key={b.code} b={b} />)}</div>
        </section>
      ))}
    </main>
  );
}
