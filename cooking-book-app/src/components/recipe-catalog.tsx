"use client";

import {
  ChefHat,
  CircleDashed,
  Clock3,
  CookingPot,
  Lightbulb,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type { CatalogItem, RecipeCategory, RecipeTag } from "@/lib/recipes";

const difficultyLabels = [
  "",
  "Элементарно",
  "Просто",
  "Средне",
  "Сложно",
  "Продвинуто",
];

type ItemKind = "all" | CatalogItem["kind"];

function pluralize(
  count: number,
  forms: [one: string, few: string, many: string],
) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

type RecipeCatalogProps = {
  items: CatalogItem[];
  categories: RecipeCategory[];
  tags: RecipeTag[];
};

export function RecipeCatalog({ items, categories, tags }: RecipeCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [kind, setKind] = useState<ItemKind>("all");
  const [isRefreshing, startRefresh] = useTransition();

  const categoryNames = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  const tagNames = useMemo(
    () => new Map(tags.map((item) => [item.id, item.name])),
    [tags],
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      recipe: items.filter((item) => item.kind === "recipe").length,
      idea: items.filter((item) => item.kind === "idea").length,
    }),
    [items],
  );

  const availableCategories = useMemo(
    () =>
      categories.filter((item) =>
        items.some((catalogItem) => catalogItem.categories.includes(item.id)),
      ),
    [categories, items],
  );

  const availableTags = useMemo(
    () =>
      tags.filter((item) =>
        items.some(
          (catalogItem) =>
            catalogItem.kind === "recipe" &&
            catalogItem.tags.includes(item.id),
        ),
      ),
    [items, tags],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");

    return items.filter((item) => {
      const matchesKind = kind === "all" || item.kind === kind;
      const matchesCategory =
        category === "all" || item.categories.includes(category);
      const matchesTag =
        tag === "all" ||
        (item.kind === "recipe" && item.tags.includes(tag));
      const itemDetails =
        item.kind === "recipe"
          ? item.tags.map((id) => tagNames.get(id) ?? id)
          : [item.note ?? "", ...item.variants];
      const searchableText = [
        item.title,
        ...itemDetails,
        ...item.categories.map((id) => categoryNames.get(id) ?? id),
      ]
        .join(" ")
        .toLocaleLowerCase("ru-RU");

      return (
        matchesKind &&
        matchesCategory &&
        matchesTag &&
        (!query || searchableText.includes(query))
      );
    });
  }, [category, categoryNames, items, kind, search, tag, tagNames]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setTag("all");
    setKind("all");
  };

  const hasFilters =
    search || category !== "all" || tag !== "all" || kind !== "all";

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[var(--accent)] text-white shadow-[0_8px_24px_rgba(214,83,52,0.22)]">
              <ChefHat size={22} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-display truncate text-xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-2xl">
                Моя книга рецептов
              </p>
              <p className="hidden text-xs text-[var(--muted)] sm:block sm:text-sm">
                Рецепты и идеи для меню
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full bg-[var(--soft)] px-3 py-1.5 text-sm font-semibold text-[var(--accent-dark)] sm:inline-flex">
              {items.length}{" "}
              {pluralize(items.length, ["блюдо", "блюда", "блюд"])}
            </span>
            <button
              type="button"
              onClick={() => startRefresh(() => router.refresh())}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:opacity-60"
              aria-label="Обновить каталог блюд"
              title="Обновить каталог"
              disabled={isRefreshing}
            >
              <RefreshCw
                size={17}
                className={isRefreshing ? "animate-spin" : undefined}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
        <div className="mb-7 max-w-3xl sm:mb-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Что приготовить сегодня
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-[var(--ink)] sm:text-5xl lg:text-6xl">
            Рецепты и идеи для домашнего меню
          </h1>
        </div>

        <div className="mb-8 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_10px_34px_rgba(77,45,29,0.05)] sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex min-w-0 flex-1 items-center">
              <span className="sr-only">Поиск по блюдам</span>
              <Search
                size={19}
                className="pointer-events-none absolute left-4 text-[var(--muted-light)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Найти блюдо"
                className="h-12 w-full rounded-[14px] border border-[var(--line)] bg-white pl-11 pr-4 text-base text-[var(--ink)] outline-none transition placeholder:text-[var(--muted-light)] focus:border-[var(--accent)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_14%,transparent)]"
              />
            </label>

            <label className="relative flex items-center lg:w-[260px]">
              <span className="sr-only">Категория</span>
              <SlidersHorizontal
                size={18}
                className="pointer-events-none absolute left-4 text-[var(--muted-light)]"
                aria-hidden="true"
              />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-[14px] border border-[var(--line)] bg-white pl-11 pr-10 text-base font-medium text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_14%,transparent)]"
              >
                <option value="all">Все категории</option>
                {availableCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 text-xs text-[var(--muted)]">
                ▾
              </span>
            </label>

            <label className="relative flex items-center lg:w-[240px]">
              <span className="sr-only">Тег</span>
              <Tag
                size={18}
                className="pointer-events-none absolute left-4 text-[var(--muted-light)]"
                aria-hidden="true"
              />
              <select
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-[14px] border border-[var(--line)] bg-white pl-11 pr-10 text-base font-medium text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_14%,transparent)]"
              >
                <option value="all">Все теги</option>
                {availableTags.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 text-xs text-[var(--muted)]">
                ▾
              </span>
            </label>
          </div>

          <div
            className="mt-3 grid grid-cols-3 gap-1 rounded-[14px] bg-[var(--card-accent)] p-1"
            role="group"
            aria-label="Тип записи"
          >
            {(
              [
                ["all", "Все"],
                ["recipe", "С рецептом"],
                ["idea", "Идеи"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                aria-pressed={kind === value}
                className={`min-w-0 cursor-pointer rounded-[10px] px-2 py-2.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:text-sm ${
                  kind === value
                    ? "bg-white text-[var(--ink)] shadow-[0_2px_9px_rgba(77,45,29,0.08)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <span>{label}</span>{" "}
                <span className="text-[var(--muted-light)]">{counts[value]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-[var(--muted)]" aria-live="polite">
            Найдено: {filteredItems.length}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-[var(--accent-dark)] transition hover:bg-[var(--soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <X size={15} aria-hidden="true" />
              Сбросить
            </button>
          )}
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            {filteredItems.map((item, index) => (
              <article
                key={`${item.kind}:${item.id}`}
                className="group flex min-h-[282px] flex-col overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_38px_rgba(77,45,29,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_46px_rgba(77,45,29,0.11)] sm:p-6"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                      item.kind === "recipe"
                        ? "bg-[var(--recipe-soft)] text-[var(--recipe)]"
                        : "bg-[var(--idea-soft)] text-[var(--idea)]"
                    }`}
                  >
                    {item.kind === "recipe" ? (
                      <CookingPot size={23} aria-hidden="true" />
                    ) : (
                      <Lightbulb size={23} aria-hidden="true" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.kind === "recipe"
                          ? "bg-[var(--recipe-soft)] text-[var(--recipe)]"
                          : "bg-[var(--idea-soft)] text-[var(--idea)]"
                      }`}
                    >
                      {item.kind === "recipe" ? "Есть рецепт" : "Идея"}
                    </span>
                    <span className="font-display text-xs font-bold text-[var(--muted-light)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {item.categories.slice(0, 3).map((categoryId) => (
                    <span
                      key={categoryId}
                      className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-dark)]"
                    >
                      {categoryNames.get(categoryId) ?? categoryId}
                    </span>
                  ))}
                </div>

                {item.kind === "recipe" && item.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.tags.map((tagId) => (
                      <span
                        key={tagId}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--tag-soft)] px-2.5 py-1 text-xs font-bold text-[var(--tag)]"
                      >
                        <Tag size={12} aria-hidden="true" />
                        {tagNames.get(tagId) ?? tagId}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="font-display mb-6 text-2xl font-bold leading-tight tracking-[-0.025em] text-[var(--ink)]">
                  {item.title}
                </h2>

                {item.kind === "recipe" ? (
                  <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-4 text-[var(--muted)]">
                    <div>
                      <dt className="sr-only">Время</dt>
                      <dd className="flex items-center gap-1.5 text-sm font-semibold">
                        <Clock3 size={15} aria-hidden="true" />
                        {item.time.total_minutes} мин
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Порции</dt>
                      <dd className="flex items-center gap-1.5 text-sm font-semibold">
                        <UsersRound size={15} aria-hidden="true" />
                        {item.servings}
                      </dd>
                    </div>
                    <div className="text-right">
                      <dt className="sr-only">Сложность</dt>
                      <dd className="truncate text-xs font-semibold sm:text-sm">
                        {difficultyLabels[item.difficulty] ?? item.difficulty}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="mt-auto border-t border-[var(--line)] pt-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[var(--idea)]">
                      <CircleDashed size={15} aria-hidden="true" />
                      В каталоге, рецепт не заполнен
                    </p>
                    {item.variants.length > 0 && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                        Варианты: {item.variants.join(", ")}
                      </p>
                    )}
                    {item.note && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                        {item.note}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-[300px] place-items-center rounded-[24px] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] px-6 text-center">
            <div className="max-w-sm py-12">
              <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[var(--soft)] text-[var(--accent-dark)]">
                <Search size={24} aria-hidden="true" />
              </span>
              <h2 className="font-display mb-2 text-2xl font-bold text-[var(--ink)]">
                Ничего не нашлось
              </h2>
              <p className="mb-5 text-sm leading-6 text-[var(--muted)]">
                Попробуйте изменить запрос, категорию или тип записи.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Показать все блюда
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
