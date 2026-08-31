"use client";

import {
  AlertTriangle,
  BookOpen,
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
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import type {
  CatalogItem,
  Recipe,
  RecipeCategory,
  RecipeTag,
  RecipeUnit,
} from "@/lib/recipes";

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
  units: RecipeUnit[];
};

const allergenLabels: Record<string, string> = {
  egg: "Яйца",
  gluten: "Глютен",
  milk: "Молочные продукты",
  mustard: "Горчица",
  nuts: "Орехи",
  sesame: "Кунжут",
  soy: "Соя",
};

const compactUnitLabels: Record<string, string> = {
  g: "г",
  kg: "кг",
  ml: "мл",
  l: "л",
  tsp: "ч. л.",
  tbsp: "ст. л.",
  item: "шт.",
};

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

type RecipeDialogProps = {
  recipe: Recipe;
  categoryNames: Map<string, string>;
  tagNames: Map<string, string>;
  unitNames: Map<string, string>;
  onClose: () => void;
};

function RecipeDialog({
  recipe,
  categoryNames,
  tagNames,
  unitNames,
  onClose,
}: RecipeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(43,33,27,0.62)] p-0 backdrop-blur-[3px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`recipe-title-${recipe.id}`}
        className="relative mx-auto min-h-dvh w-full bg-[var(--surface)] shadow-[0_30px_100px_rgba(43,33,27,0.3)] sm:min-h-0 sm:max-w-5xl sm:overflow-hidden sm:rounded-[30px]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-5 py-4 backdrop-blur-xl sm:px-8">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--recipe)]">
            <BookOpen size={17} aria-hidden="true" />
            Полный рецепт
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-label="Закрыть рецепт"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pb-12 pt-7 sm:px-8 sm:pb-14 sm:pt-9 lg:px-12">
          <div className="mb-7 max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              {recipe.categories.map((categoryId) => (
                <span
                  key={categoryId}
                  className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-bold text-[var(--accent-dark)]"
                >
                  {categoryNames.get(categoryId) ?? categoryId}
                </span>
              ))}
              {recipe.tags.map((tagId) => (
                <span
                  key={tagId}
                  className="rounded-full bg-[var(--tag-soft)] px-3 py-1 text-xs font-bold text-[var(--tag)]"
                >
                  {tagNames.get(tagId) ?? tagId}
                </span>
              ))}
            </div>
            <h2
              id={`recipe-title-${recipe.id}`}
              className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-[var(--ink)] sm:text-5xl"
            >
              {recipe.title}
            </h2>
          </div>

          <dl className="mb-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-[var(--card-accent)] p-4">
              <dt className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted-light)]">
                Подготовка
              </dt>
              <dd className="font-display text-xl font-bold text-[var(--ink)]">
                {recipe.time.prep_minutes} мин
              </dd>
            </div>
            <div className="rounded-2xl bg-[var(--card-accent)] p-4">
              <dt className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted-light)]">
                Готовка
              </dt>
              <dd className="font-display text-xl font-bold text-[var(--ink)]">
                {recipe.time.cook_minutes} мин
              </dd>
            </div>
            <div className="rounded-2xl bg-[var(--card-accent)] p-4">
              <dt className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted-light)]">
                Всего
              </dt>
              <dd className="font-display text-xl font-bold text-[var(--ink)]">
                {recipe.time.total_minutes} мин
              </dd>
            </div>
            <div className="rounded-2xl bg-[var(--card-accent)] p-4">
              <dt className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted-light)]">
                Порции
              </dt>
              <dd className="font-display text-xl font-bold text-[var(--ink)]">
                {recipe.servings}
              </dd>
            </div>
          </dl>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-14">
            <section aria-labelledby={`ingredients-title-${recipe.id}`}>
              <h3
                id={`ingredients-title-${recipe.id}`}
                className="font-display mb-5 text-3xl font-bold text-[var(--ink)]"
              >
                Ингредиенты
              </h3>
              <ul className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-white">
                {recipe.ingredients.map((ingredient) => (
                  <li
                    key={`${ingredient.id}:${ingredient.name}`}
                    className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] px-4 py-3.5 last:border-b-0 sm:px-5"
                  >
                    <span className="font-medium text-[var(--ink)]">
                      {ingredient.name}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-[var(--accent-dark)]">
                      {ingredient.amount === null
                        ? unitNames.get(ingredient.unit) ?? ingredient.unit
                        : `${numberFormatter.format(ingredient.amount)} ${
                            compactUnitLabels[ingredient.unit] ??
                            unitNames.get(ingredient.unit) ??
                            ingredient.unit
                          }`}
                    </span>
                  </li>
                ))}
              </ul>

              {recipe.allergens.length > 0 && (
                <div className="mt-5 rounded-[18px] bg-[var(--idea-soft)] p-4 text-sm text-[var(--ink)]">
                  <p className="mb-2 flex items-center gap-2 font-bold text-[var(--idea)]">
                    <AlertTriangle size={16} aria-hidden="true" />
                    Аллергены
                  </p>
                  <p className="leading-6">
                    {recipe.allergens
                      .map((allergen) => allergenLabels[allergen] ?? allergen)
                      .join(", ")}
                  </p>
                </div>
              )}
            </section>

            <section aria-labelledby={`steps-title-${recipe.id}`}>
              <h3
                id={`steps-title-${recipe.id}`}
                className="font-display mb-5 text-3xl font-bold text-[var(--ink)]"
              >
                Приготовление
              </h3>
              <ol className="space-y-5">
                {recipe.steps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="font-display grid size-9 shrink-0 place-items-center rounded-full bg-[var(--recipe-soft)] text-lg font-bold text-[var(--recipe)]">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-[15px] leading-7 text-[var(--ink)] sm:text-base">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>

              {recipe.notes && (
                <div className="mt-8 rounded-[20px] border border-[var(--line)] bg-[var(--card-accent)] p-5">
                  <h3 className="font-display mb-2 text-xl font-bold text-[var(--ink)]">
                    Примечания
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-6 text-[var(--muted)]">
                    {recipe.notes}
                  </p>
                </div>
              )}

              {recipe.source?.startsWith("http") && (
                <a
                  href={recipe.source}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-bold text-[var(--accent-dark)] underline decoration-[var(--line-strong)] underline-offset-4 transition hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Источник рецепта
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecipeCatalog({
  items,
  categories,
  tags,
  units,
}: RecipeCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [kind, setKind] = useState<ItemKind>("all");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  const categoryNames = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  const tagNames = useMemo(
    () => new Map(tags.map((item) => [item.id, item.name])),
    [tags],
  );

  const unitNames = useMemo(
    () => new Map(units.map((item) => [item.id, item.name])),
    [units],
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
                role={item.kind === "recipe" ? "button" : undefined}
                tabIndex={item.kind === "recipe" ? 0 : undefined}
                aria-label={
                  item.kind === "recipe"
                    ? `Открыть рецепт «${item.title}»`
                    : undefined
                }
                onClick={() => {
                  if (item.kind === "recipe") setSelectedRecipe(item);
                }}
                onKeyDown={(event) => {
                  if (
                    item.kind === "recipe" &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    setSelectedRecipe(item);
                  }
                }}
                className={`group flex min-h-[282px] flex-col overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_38px_rgba(77,45,29,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_46px_rgba(77,45,29,0.11)] sm:p-6 ${
                  item.kind === "recipe"
                    ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                    : ""
                }`}
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
                  <div className="mt-auto border-t border-[var(--line)] pt-4">
                    <dl className="grid grid-cols-3 gap-3 text-[var(--muted)]">
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
                    <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[var(--recipe)]">
                      <BookOpen size={15} aria-hidden="true" />
                      Открыть рецепт
                    </p>
                  </div>
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

      {selectedRecipe && (
        <RecipeDialog
          recipe={selectedRecipe}
          categoryNames={categoryNames}
          tagNames={tagNames}
          unitNames={unitNames}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </main>
  );
}
