import Empty from "@/components/Empty";
import { locale } from "@/lib/api";

export default async function NotFound() {
  const { t } = await locale();
  return <main className="mx-auto max-w-xl px-4 pb-16 pt-28"><Empty icon="globe" title={t.notFound} sub={t.notFoundSub} href="/" cta={t.home} /></main>;
}
