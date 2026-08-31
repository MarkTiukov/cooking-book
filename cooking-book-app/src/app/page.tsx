import { connection } from "next/server";

import { RecipeCatalog } from "@/components/recipe-catalog";
import { getCatalogItems, getCategories, getTags } from "@/lib/recipes";

export default async function Home() {
  await connection();

  const [items, categories, tags] = await Promise.all([
    getCatalogItems(),
    getCategories(),
    getTags(),
  ]);

  return <RecipeCatalog items={items} categories={categories} tags={tags} />;
}
