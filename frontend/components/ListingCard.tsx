"use client";
import Link from "next/link";
import type { Listing } from "@/lib/api";
import { num } from "@/lib/i18n";
import { img } from "@/lib/img";
import Heart from "./Heart";
import Icon from "./Icon";
import { useT } from "./Providers";

export default function ListingCard({ x, city, query = "" }: { x: Listing; city: string; query?: string }) {
  const { l, t } = useT();
  return (
    <Link href={`/listings/${x.id}${query}`} className="group reveal block">
      <div className="relative overflow-hidden rounded-3xl bg-line">
        <div className="no-bar flex aspect-[4/3.6] snap-x snap-mandatory overflow-x-auto">
          {x.images.map((im, i) => (
            <img key={im} src={img(im)} alt={i ? "" : x.title[l]} loading="lazy" draggable={false}
              className="size-full shrink-0 snap-center object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/10" />
        {x.superhost && <span className="glass absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-bold">{t.superhost}</span>}
        <Heart id={x.id} className="absolute end-2 top-2" />
        <span className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
          {x.images.map((im) => <span key={im} className="size-1.5 rounded-full bg-white/80 first:bg-white" />)}
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{x.title[l]}</h3>
          <p className="text-sm text-muted">{city} · {x.area[l]}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold"><Icon name="star" fill className="size-4 text-[var(--a4)]" />{num(l, x.rating)}</span>
      </div>
      <p className="mt-1 px-1 text-sm"><b className="text-base">{num(l, x.price)}</b> {t.toman} <span className="text-muted">/ {t.perNight}</span></p>
    </Link>
  );
}
