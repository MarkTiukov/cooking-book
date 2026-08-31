import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

type CatalogItemBase = {
  id: string;
  title: string;
  categories: string[];
};

export type Recipe = CatalogItemBase & {
  kind: "recipe";
  servings: number;
  time: {
    prep_minutes: number;
    cook_minutes: number;
    total_minutes: number;
  };
  difficulty: number;
  tags: string[];
  allergens: string[];
  ingredientCount: number;
};

export type DishIdea = CatalogItemBase & {
  kind: "idea";
  note?: string;
  variants: string[];
  possibleDuplicateOf?: string;
};

export type CatalogItem = Recipe | DishIdea;

export type RecipeCategory = {
  id: string;
  name: string;
  kind: string;
};

export type RecipeTag = {
  id: string;
  name: string;
  description?: string;
};

const recipesDirectory = () =>
  process.env.RECIPES_DIR ?? path.resolve(process.cwd(), "..", "recipes");

const catalogDirectory = () =>
  process.env.CATALOG_DIR ?? path.resolve(process.cwd(), "..", "catalog");

const referenceDirectory = () =>
  process.env.REFERENCE_DIR ?? path.resolve(process.cwd(), "..", "reference");

function readFrontmatter(source: string, filename: string): Record<string, unknown> {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!match) {
    throw new Error(`В ${filename} не найден YAML frontmatter.`);
  }

  const value = parse(match[1]);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`В ${filename} некорректный YAML frontmatter.`);
  }

  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseRecipe(source: string, filename: string): Recipe {
  const data = readFrontmatter(source, filename);
  const time = data.time as Record<string, unknown> | undefined;
  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];

  if (
    typeof data.id !== "string" ||
    typeof data.title !== "string" ||
    typeof data.servings !== "number" ||
    typeof data.difficulty !== "number" ||
    !time ||
    typeof time.total_minutes !== "number"
  ) {
    throw new Error(`В ${filename} отсутствуют обязательные поля рецепта.`);
  }

  return {
    kind: "recipe",
    id: data.id,
    title: data.title,
    servings: data.servings,
    time: {
      prep_minutes:
        typeof time.prep_minutes === "number" ? time.prep_minutes : 0,
      cook_minutes:
        typeof time.cook_minutes === "number" ? time.cook_minutes : 0,
      total_minutes: time.total_minutes,
    },
    difficulty: data.difficulty,
    categories: asStringArray(data.categories),
    tags: asStringArray(data.tags),
    allergens: asStringArray(data.allergens),
    ingredientCount: ingredients.length,
  };
}

function parseDishIdeas(source: string): DishIdea[] {
  const document = parse(source) as { dishes?: unknown[] };

  if (!Array.isArray(document.dishes)) {
    throw new Error("В catalog/dishes.yaml отсутствует список dishes.");
  }

  return document.dishes.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Некорректная запись dishes[${index}].`);
    }

    const item = value as Record<string, unknown>;

    if (
      typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      item.status !== "idea" ||
      asStringArray(item.categories).length === 0
    ) {
      throw new Error(`В dishes[${index}] отсутствуют обязательные поля идеи.`);
    }

    return {
      kind: "idea",
      id: item.id,
      title: item.title,
      categories: asStringArray(item.categories),
      variants: asStringArray(item.variants),
      ...(typeof item.note === "string" ? { note: item.note } : {}),
      ...(typeof item.possible_duplicate_of === "string"
        ? { possibleDuplicateOf: item.possible_duplicate_of }
        : {}),
    };
  });
}

export async function getRecipes(): Promise<Recipe[]> {
  const directory = recipesDirectory();
  const filenames = (await fs.readdir(directory))
    .filter((filename) => filename.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "ru"));

  const recipes = await Promise.all(
    filenames.map(async (filename) => {
      const source = await fs.readFile(path.join(directory, filename), "utf8");
      return parseRecipe(source, filename);
    }),
  );

  return recipes.sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

export async function getDishIdeas(): Promise<DishIdea[]> {
  const source = await fs.readFile(
    path.join(catalogDirectory(), "dishes.yaml"),
    "utf8",
  );

  return parseDishIdeas(source).sort((a, b) =>
    a.title.localeCompare(b.title, "ru"),
  );
}

export async function getCatalogItems(): Promise<CatalogItem[]> {
  const [recipes, ideas] = await Promise.all([getRecipes(), getDishIdeas()]);

  return [...recipes, ...ideas].sort((a, b) =>
    a.title.localeCompare(b.title, "ru"),
  );
}

export async function getCategories(): Promise<RecipeCategory[]> {
  const source = await fs.readFile(
    path.join(referenceDirectory(), "categories.yaml"),
    "utf8",
  );
  const document = parse(source) as { categories?: unknown[] };

  if (!Array.isArray(document.categories)) {
    return [];
  }

  return document.categories.flatMap((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [];
    }

    const item = value as Record<string, unknown>;
    return typeof item.id === "string" && typeof item.name === "string"
      ? [
          {
            id: item.id,
            name: item.name,
            kind: typeof item.kind === "string" ? item.kind : "other",
          },
        ]
      : [];
  });
}

export async function getTags(): Promise<RecipeTag[]> {
  const source = await fs.readFile(
    path.join(referenceDirectory(), "tags.yaml"),
    "utf8",
  );
  const document = parse(source) as { tags?: unknown[] };

  if (!Array.isArray(document.tags)) {
    return [];
  }

  return document.tags.flatMap((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [];
    }

    const item = value as Record<string, unknown>;
    return typeof item.id === "string" && typeof item.name === "string"
      ? [
          {
            id: item.id,
            name: item.name,
            ...(typeof item.description === "string"
              ? { description: item.description }
              : {}),
          },
        ]
      : [];
  });
}
