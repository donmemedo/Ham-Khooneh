"use client";
import { useEffect, useState } from "react";
import Empty from "@/components/Empty";
import ListingCard from "@/components/ListingCard";
import { useT } from "@/components/Providers";
import type { City, Listing } from "@/lib/api";
import { readFavs } from "@/components/Heart";
import { send } from "@/lib/client";

// ponytail: favorites live in localStorage (work without login); sync to the account when multi-device matters
export default function Favorites() {
  const { l, t } = useT();
  const [list, setList] = useState<Listing[] | null>(null);
  const [cities, setCities] = useState<Record<string, string>>({});
  useEffect(() => {
    const ids = readFavs();
    send<City[]>("/api/cities", undefined, "GET").then((r) => r.ok && setCities(Object.fromEntries(r.data.map((c) => [c.key, c[l]]))));
    if (!ids.length) return setList([]);
    send<Listing[]>(`/api/listings?ids=${ids.join(",")}`, undefined, "GET").then((r) => setList(r.ok ? r.data : []));
  }, [l]);
  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6">
      <h1 className="pop text-4xl font-black tracking-tight">{t.nav.favorites}</h1>
      {list?.length === 0 && <Empty icon="heart" title={t.noFavs} sub={t.noFavsSub} href="/" cta={t.explore} />}
      <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list === null
          ? Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[4/3.6] animate-pulse rounded-3xl bg-line" />)
          : list.map((x) => <ListingCard key={x.id} x={x} city={cities[x.city] ?? ""} />)}
      </div>
    </main>
  );
}
