export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="h-[85px] border-b border-[var(--line)] bg-[var(--surface)]" />
      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mb-10 h-28 max-w-2xl animate-pulse rounded-[24px] bg-[var(--card-accent)]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-[270px] animate-pulse rounded-[24px] border border-[var(--line)] bg-[var(--surface)]"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
