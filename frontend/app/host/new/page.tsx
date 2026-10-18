import NewListingForm from "@/components/NewListingForm";
import { api, locale, requireMe, type City } from "@/lib/api";

export default async function NewListing() {
  await requireMe("/host/new");
  const { t } = await locale();
  const cities = (await api<City[]>("/api/cities")) ?? [];
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6">
      <h1 className="pop text-4xl font-black tracking-tight">{t.newTitle}</h1>
      <p className="mt-2 text-muted">{t.newSub}</p>
      <NewListingForm cities={cities} />
    </main>
  );
}
