import Link from "next/link";
import Icon from "./Icon";

export default function Empty({ icon, title, sub, href, cta }: { icon: string; title: string; sub: string; href: string; cta: string }) {
  return (
    <div className="reveal mt-8 rounded-[2rem] border border-dashed border-line p-12 text-center">
      <span className="btn mx-auto grid size-16 place-items-center rounded-2xl"><Icon name={icon} className="size-8" /></span>
      <p className="mt-5 text-xl font-black">{title}</p>
      <p className="mt-2 text-muted">{sub}</p>
      <Link href={href} className="mt-6 inline-block rounded-full bg-fg px-6 py-3 font-bold text-bg transition hover:scale-105">{cta}</Link>
    </div>
  );
}
