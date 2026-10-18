"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useT } from "./Providers";

const setCookie = (k: string, v: string) => (document.cookie = `${k}=${v};path=/;max-age=31536000;samesite=lax`);

export default function Nav() {
  const { l, t, me } = useT();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 12);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  function toggleTheme(e: React.MouseEvent) {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.style.setProperty("--x", e.clientX + "px");
    root.style.setProperty("--y", e.clientY + "px");
    const apply = () => { root.dataset.theme = dark ? "light" : "dark"; setCookie("theme", root.dataset.theme); };
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  }

  function toggleLang() {
    const next = l === "fa" ? "en" : "fa";
    setCookie("locale", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "fa" ? "rtl" : "ltr";
    router.refresh();
  }

  const icon = "grid size-10 place-items-center rounded-full hover:bg-line";
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "glass border-b border-line" : ""}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <span className="btn grid size-9 place-items-center rounded-xl text-lg">ه</span>
          <span className="text-lg">{t.brand}</span>
        </Link>
        <div className="ms-auto flex items-center gap-1">
          <Link href={me?.is_host ? "/host" : "/host/new"} className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-line sm:block">{me?.is_host ? t.dashboard : t.becomeHost}</Link>
          <Link href="/favorites" className={`${icon} hidden sm:grid`} aria-label={t.nav.favorites}><Icon name="heart" /></Link>
          <Link href="/trips" className={`${icon} hidden sm:grid`} aria-label={t.nav.trips}><Icon name="bag" /></Link>
          <button onClick={toggleLang} className="grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-bold hover:bg-line" aria-label="language">{t.lang}</button>
          <button onClick={toggleTheme} className={icon} aria-label={t.theme}>
            <Icon name="sun" className="i-sun size-5" />
            <Icon name="moon" className="i-moon size-5" />
          </button>
          {me ? (
            <Link href="/account" aria-label={t.nav.account} className="btn ms-1 hidden size-10 place-items-center rounded-full font-black sm:grid">{me.name[0]}</Link>
          ) : (
            <Link href="/login" className="ms-1 hidden rounded-full bg-fg px-5 py-2.5 text-sm font-bold text-bg transition hover:opacity-85 sm:block">{t.login}</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

const HIDE_TABS = ["/listings/", "/login", "/host/new"];

export function BottomNav() {
  const { t } = useT();
  const path = usePathname();
  if (HIDE_TABS.some((p) => path.startsWith(p))) return null;
  const tabs: [string, string, string][] = [["/", "search", t.nav.explore], ["/favorites", "heart", t.nav.favorites], ["/trips", "bag", t.nav.trips], ["/host", "home", t.nav.host], ["/account", "user", t.nav.account]];
  return (
    <>
      <div className="h-20 sm:hidden" />
      <nav className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line pb-[env(safe-area-inset-bottom)] sm:hidden">
        {tabs.map(([href, ic, label]) => {
          const on = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${on ? "text-accent" : "text-muted"}`}>
              <Icon name={ic} fill={on && ic === "heart"} className={`size-6 transition ${on ? "scale-110" : ""}`} />{label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
