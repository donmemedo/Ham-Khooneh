"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useT } from "./Providers";

const KEY = "favs";
export const readFavs = (): number[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };

export default function Heart({ id, className = "" }: { id: number; className?: string }) {
  const { t } = useT();
  const [on, setOn] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => setOn(readFavs().includes(id)), [id]);
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !on;
    setOn(next);
    setN(n + 1);
    try { localStorage.setItem(KEY, JSON.stringify(next ? [...readFavs(), id] : readFavs().filter((x) => x !== id))); } catch {}
  };
  return (
    <button onClick={toggle} aria-label={t.save} aria-pressed={on} className={`grid size-10 place-items-center rounded-full ${className}`}>
      <Icon key={n} name="heart" fill={on} className={`size-6 drop-shadow ${on ? "beat text-[var(--a3)]" : "text-white"}`} />
    </button>
  );
}
