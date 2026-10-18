const TONE: Record<string, string> = { pending: "var(--a4)", confirmed: "var(--a1)", declined: "var(--a3)", cancelled: "var(--muted)" };

export default function Status({ status, label }: { status: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: TONE[status], background: `color-mix(in oklab, ${TONE[status]} 14%, transparent)` }}>
      <span className="size-1.5 rounded-full" style={{ background: TONE[status] }} />{label}
    </span>
  );
}
