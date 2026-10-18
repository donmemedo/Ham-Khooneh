import Link from "next/link";
import { notFound } from "next/navigation";
import Booking from "@/components/Booking";
import Heart from "@/components/Heart";
import Icon from "@/components/Icon";
import { api, img, locale, type City, type ListingDetail } from "@/lib/api";
import { num } from "@/lib/i18n";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const initial: [string, string] = ISO.test(sp.check_in ?? "") && ISO.test(sp.check_out ?? "") ? [sp.check_in!, sp.check_out!] : ["", ""];
  const { l, t } = await locale();
  const [x, cities] = await Promise.all([api<ListingDetail>(`/api/listings/${+id || 0}`), api<City[]>("/api/cities")]);
  if (!x) notFound();
  const city = cities?.find((c) => c.key === x.city)?.[l] ?? "";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-20 sm:px-6 lg:pb-20">
      <Link href="/#stays" className="inline-flex items-center gap-1.5 rounded-full py-2 text-sm font-semibold text-muted hover:text-fg">
        <Icon name="arrow" className="size-4 ltr:rotate-180" />{t.back}
      </Link>
      <div className="pop mt-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{x.title[l]}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <Icon name="star" fill className="size-4 text-[var(--a4)]" /><b className="text-fg">{num(l, x.rating)}</b>
            · {num(l, x.reviews_count)} {t.reviews} · <Icon name="pin" className="size-4" />{city}، {x.area[l]}
          </p>
        </div>
        <Heart id={x.id} className="shrink-0 bg-black/40 backdrop-blur" />
      </div>

      <div className="no-bar pop -mx-4 mt-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:h-[28rem] sm:grid-cols-4 sm:grid-rows-2 sm:overflow-hidden sm:rounded-[2rem] sm:px-0">
        {x.images.map((im, i) => (
          <img key={im} src={img(im)} alt={i ? "" : x.title[l]} className={`aspect-[4/3] w-[88%] shrink-0 snap-center rounded-3xl object-cover transition duration-500 hover:brightness-110 sm:aspect-auto sm:size-full sm:rounded-none ${i === 0 ? "sm:col-span-2 sm:row-span-2" : i === 1 ? "sm:col-span-2" : ""}`} />
        ))}
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0">
          <div className="flex items-center gap-4 border-b border-line pb-8">
            <span className="btn grid size-14 shrink-0 place-items-center rounded-full text-xl font-black">{x.host[l][0]}</span>
            <div>
              <p className="font-bold">{t.hostedBy} {x.host[l]}</p>
              <p className="text-sm text-muted">{num(l, x.host.years)} {t.yearsHosting}{x.host.verified && ` · ${t.verified}`}{x.superhost && ` · ${t.superhost}`}{x.instant && ` · ${t.instant}`}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-line py-8">
            {[`${t.upTo} ${num(l, x.guests)} ${t.people}`, `${num(l, x.bedrooms)} ${t.bedrooms}`, `${num(l, x.baths)} ${t.baths}`, t.types[x.type]].map((s) => (
              <span key={s} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold">{s}</span>
            ))}
          </div>
          <section className="border-b border-line py-8">
            <h2 className="text-xl font-black">{t.about}</h2>
            <p className="mt-3 leading-8 text-muted">{x.description[l]}</p>
          </section>
          <section className="border-b border-line py-8">
            <h2 className="text-xl font-black">{t.amenities}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {x.amenities.map((a) => (
                <li key={a} className="flex items-center gap-3 rounded-2xl bg-card p-3 text-sm font-semibold">
                  <span className="grid size-8 place-items-center rounded-xl bg-[var(--a1)]/15 text-accent"><Icon name="check" className="size-4" /></span>{t.amenity[a]}
                </li>
              ))}
            </ul>
          </section>
          <section className="py-8">
            <h2 className="flex items-center gap-2 text-xl font-black"><Icon name="star" fill className="size-5 text-[var(--a4)]" />{num(l, x.rating)} · {num(l, x.reviews_count)} {t.reviews}</h2>
            {!x.reviews.length && <p className="mt-4 text-muted">{t.reviewsEmpty}</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {x.reviews.map((r, i) => (
                <figure key={i} className="reveal rounded-3xl border border-line bg-card p-5">
                  <figcaption className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-fg font-bold text-bg">{r.name[l][0]}</span>
                    <span><b className="block text-sm">{r.name[l]}</b><span className="text-xs text-[var(--a4)]">{"★".repeat(r.rating)}</span></span>
                  </figcaption>
                  <blockquote className="mt-3 text-sm leading-7 text-muted">{r.text[l]}</blockquote>
                </figure>
              ))}
            </div>
          </section>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Booking id={x.id} price={x.price} maxGuests={x.guests} fee={x.guest_fee} booked={x.booked} instant={x.instant} isMine={x.is_mine} initial={initial} initialGuests={+(sp.guests ?? 1) || 1} />
        </aside>
      </div>
    </main>
  );
}
