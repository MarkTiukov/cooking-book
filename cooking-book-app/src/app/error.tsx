"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-[0_18px_52px_rgba(77,45,29,0.08)]">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[var(--soft)] text-[var(--accent-dark)]">
          <AlertTriangle size={25} aria-hidden="true" />
        </span>
        <h1 className="font-display mb-3 text-3xl font-bold text-[var(--ink)]">
          Не удалось прочитать рецепты
        </h1>
        <p className="mb-6 text-sm leading-6 text-[var(--muted)]">
          Проверьте пути к рецептам, каталогу блюд и справочникам, а также
          корректность YAML.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Попробовать снова
        </button>
      </div>
    </main>
  );
}
