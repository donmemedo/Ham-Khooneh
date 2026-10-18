const P: Record<string, string> = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  heart: "M12 21s-7.5-4.6-9.5-9.3C1.1 8.3 3.3 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.7 0 5.9 3.8 4.5 7.2C19.5 16.4 12 21 12 21Z",
  star: "m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8L12 2.5Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  users: "M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 9v-1.5a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  check: "M20 6 9 17l-5-5",
  shield: "M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Zm-3.5-10.5 2.5 2.5 4.5-5",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 1 1 8 0v4",
  camera: "M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  user: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 0 1 16 0",
  bag: "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 7h16v13H4zM4 12h16",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6 6 18",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01",
  logout: "M15 17l5-5-5-5M20 12H9M12 21H5V3h7",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  wallet: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3zM3 7l12-4v4M16.5 13.5h.01",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-10-10h20M12 2c2.8 3 4 6.4 4 10s-1.2 7-4 10c-2.8-3-4-6.4-4-10s1.2-7 4-10Z",
};

export default function Icon({ name, className = "size-5", fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[name]} />
    </svg>
  );
}
