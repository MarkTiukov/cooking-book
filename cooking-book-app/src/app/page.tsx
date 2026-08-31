import { connection } from "next/server";

import { RecipeCatalog } from "@/components/recipe-catalog";
import {
  getCatalogItems,
  getCategories,
  getTags,
  getUnits,
} from "@/lib/recipes";

export default async function Home() {
  await connection();

  const [items, categories, tags, units] = await Promise.all([
    getCatalogItems(),
    getCategories(),
    getTags(),
    getUnits(),
  ]);

  return (
    <RecipeCatalog
      items={items}
      categories={categories}
      tags={tags}
      units={units}
    />
  );
}
