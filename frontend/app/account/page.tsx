import AccountForms from "@/components/AccountForms";
import Icon from "@/components/Icon";
import { api, locale, requireMe, type Ticket } from "@/lib/api";

export default async function Account() {
  const me = await requireMe("/account");
  const { t } = await locale();
  const tickets = (await api<Ticket[]>("/api/me/tickets")) ?? [];
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6">
      <div className="pop flex items-center gap-5">
        <span className="btn grid size-20 shrink-0 place-items-center rounded-full text-3xl font-black">{me.name[0]}</span>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{me.name}</h1>
          <p dir="ltr" className="text-muted rtl:text-end">{me.phone}</p>
          <p className={`mt-1 inline-flex items-center gap-1 text-sm font-bold ${me.verified ? "text-accent" : "text-[var(--a4)]"}`}>
            <Icon name="shield" className="size-4" />{me.verified ? t.verified : t.unverified}
          </p>
        </div>
      </div>
      <AccountForms me={me} tickets={tickets} />
    </main>
  );
}
