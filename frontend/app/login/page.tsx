import LoginForm from "@/components/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/"; // no open redirects
  return (
    <main className="relative isolate grid min-h-svh place-items-center overflow-hidden px-4 py-24">
      <div className="blob -z-10 -top-32 start-[-10%] size-[30rem] bg-[var(--a1)]" />
      <div className="blob -z-10 bottom-[-12rem] end-[-10%] size-[30rem] bg-[var(--a2)] [animation-delay:-7s]" />
      <LoginForm next={safe} />
    </main>
  );
}
