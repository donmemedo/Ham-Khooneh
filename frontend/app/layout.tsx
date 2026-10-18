import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import Nav, { BottomNav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import { api, locale, type Me } from "@/lib/api";
import "./globals.css";

const vazir = localFont({ src: "./fonts/Vazirmatn.woff2", variable: "--font-vazir", weight: "100 900", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await locale();
  return { title: `${t.brand} — ${t.heroA} ${t.heroB}`, description: t.heroSub };
}

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f5f5f7" }, { media: "(prefers-color-scheme: dark)", color: "#000000" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { l, t } = await locale();
  const theme = (await cookies()).get("theme")?.value;
  const me = await api<Me>("/api/me");
  return (
    <html lang={l} dir={l === "fa" ? "rtl" : "ltr"} data-theme={theme === "light" || theme === "dark" ? theme : undefined} className={vazir.variable} suppressHydrationWarning>
      <body className="min-h-svh overflow-x-clip font-sans">
        <Providers l={l} me={me}>
          <Nav />
          {children}
          <footer className="border-t border-line py-10 text-center text-sm text-muted">© {new Date().toLocaleDateString(l === "fa" ? "fa-IR-u-ca-persian" : "en-US", { year: "numeric" })} {t.footer}</footer>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
