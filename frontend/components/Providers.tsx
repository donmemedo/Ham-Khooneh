"use client";
import { createContext, useContext } from "react";
import type { Me } from "@/lib/api";
import { dicts, type Locale } from "@/lib/i18n";

const Ctx = createContext<{ l: Locale; me: Me | null }>({ l: "fa", me: null });
export const Providers = ({ l, me, children }: { l: Locale; me: Me | null; children: React.ReactNode }) => <Ctx.Provider value={{ l, me }}>{children}</Ctx.Provider>;
export function useT() {
  const { l, me } = useContext(Ctx);
  return { l, t: dicts[l], me };
}
