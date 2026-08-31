#!/usr/bin/env python3
"""Validate reference data, dish ideas, and every flat recipe file."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
RECIPES_DIR = ROOT / "recipes"
REFERENCE_DIR = ROOT / "reference"
CATALOG_FILE = ROOT / "catalog" / "dishes.yaml"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class ValidationError(Exception):
    pass


def load_yaml(path: Path):
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise ValidationError(f"{path.relative_to(ROOT)}: cannot read YAML: {exc}") from exc


def load_recipe(path: Path):
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.DOTALL)
    if not match:
        raise ValidationError("missing or malformed YAML frontmatter")
    try:
        data = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        raise ValidationError(f"invalid YAML frontmatter: {exc}") from exc
    if not isinstance(data, dict):
        raise ValidationError("frontmatter must be a mapping")
    return data, match.group(2)


def require_number(value, field: str, *, allow_zero: bool = False):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValidationError(f"{field} must be a number")
    if value < 0 or (value == 0 and not allow_zero):
        comparison = "non-negative" if allow_zero else "positive"
        raise ValidationError(f"{field} must be {comparison}")


def validate_recipe(
    path: Path,
    category_ids: set[str],
    tag_ids: set[str],
    unit_ids: set[str],
    ingredient_ids: set[str],
):
    data, body = load_recipe(path)
    recipe_id = data.get("id")
    if not isinstance(recipe_id, str) or not SLUG.fullmatch(recipe_id):
        raise ValidationError("id must be a lowercase ASCII slug")
    if recipe_id != path.stem:
        raise ValidationError(f"id '{recipe_id}' must match filename '{path.stem}'")
    if not isinstance(data.get("title"), str) or not data["title"].strip():
        raise ValidationError("title must be a non-empty string")
    require_number(data.get("servings"), "servings")

    time = data.get("time")
    if not isinstance(time, dict):
        raise ValidationError("time must be a mapping")
    for field in ("prep_minutes", "cook_minutes", "total_minutes"):
        require_number(time.get(field), f"time.{field}", allow_zero=True)
    if time["total_minutes"] < max(time["prep_minutes"], time["cook_minutes"]):
        raise ValidationError("time.total_minutes cannot be shorter than prep or cook time")

    difficulty = data.get("difficulty")
    if isinstance(difficulty, bool) or not isinstance(difficulty, int) or not 1 <= difficulty <= 5:
        raise ValidationError("difficulty must be an integer from 1 to 5")

    categories = data.get("categories")
    if not isinstance(categories, list) or not categories:
        raise ValidationError("categories must be a non-empty list")
    unknown_categories = sorted(set(categories) - category_ids)
    if unknown_categories:
        raise ValidationError(f"unknown categories: {', '.join(unknown_categories)}")

    tags = data.get("tags", [])
    if not isinstance(tags, list):
        raise ValidationError("tags must be a list")
    if len(tags) != len(set(tags)):
        raise ValidationError("tags must not contain duplicates")
    unknown_tags = sorted(set(tags) - tag_ids)
    if unknown_tags:
        raise ValidationError(f"unknown tags: {', '.join(unknown_tags)}")

    ingredients = data.get("ingredients")
    if not isinstance(ingredients, list) or not ingredients:
        raise ValidationError("ingredients must be a non-empty list")
    seen_ingredients: set[str] = set()
    for index, ingredient in enumerate(ingredients, start=1):
        prefix = f"ingredients[{index}]"
        if not isinstance(ingredient, dict):
            raise ValidationError(f"{prefix} must be a mapping")
        ingredient_id = ingredient.get("id")
        if not isinstance(ingredient_id, str) or ingredient_id not in ingredient_ids:
            raise ValidationError(f"{prefix}.id is absent from reference/ingredients.yaml")
        if ingredient_id in seen_ingredients:
            raise ValidationError(f"duplicate ingredient id: {ingredient_id}")
        seen_ingredients.add(ingredient_id)
        if not isinstance(ingredient.get("name"), str) or not ingredient["name"].strip():
            raise ValidationError(f"{prefix}.name must be a non-empty string")
        unit = ingredient.get("unit")
        if unit not in unit_ids:
            raise ValidationError(f"{prefix}.unit is unknown: {unit}")
        amount = ingredient.get("amount")
        if unit == "to-taste":
            if amount is not None:
                raise ValidationError(f"{prefix}.amount must be null for to-taste")
        else:
            require_number(amount, f"{prefix}.amount")

    if not re.search(r"^## Приготовление\s*$", body, re.MULTILINE):
        raise ValidationError("body must contain the '## Приготовление' section")
    if not re.search(r"^\d+[.)]\s+\S", body, re.MULTILINE):
        raise ValidationError("cooking section must contain numbered steps")


def validate_dish_ideas(
    records,
    category_ids: set[str],
    tag_ids: set[str],
    recipe_ids: set[str],
) -> list[str]:
    errors: list[str] = []
    seen_ids: set[str] = set()
    seen_titles: set[str] = set()
    all_idea_ids = {
        item.get("id") for item in records if isinstance(item, dict) and isinstance(item.get("id"), str)
    }

    for index, item in enumerate(records, start=1):
        prefix = f"catalog/dishes.yaml: dishes[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{prefix} must be a mapping")
            continue
        dish_id = item.get("id")
        if not isinstance(dish_id, str) or not SLUG.fullmatch(dish_id):
            errors.append(f"{prefix}.id must be a lowercase ASCII slug")
        elif dish_id in seen_ids:
            errors.append(f"{prefix}: duplicate id {dish_id!r}")
        else:
            seen_ids.add(dish_id)
        if dish_id in recipe_ids:
            errors.append(f"{prefix}: id {dish_id!r} already exists as a full recipe")

        title = item.get("title")
        if not isinstance(title, str) or not title.strip():
            errors.append(f"{prefix}.title must be a non-empty string")
        else:
            normalized_title = " ".join(title.casefold().split())
            if normalized_title in seen_titles:
                errors.append(f"{prefix}: duplicate title {title!r}")
            seen_titles.add(normalized_title)

        if item.get("status") != "idea":
            errors.append(f"{prefix}.status must be 'idea'")
        categories = item.get("categories")
        if not isinstance(categories, list) or not categories:
            errors.append(f"{prefix}.categories must be a non-empty list")
        else:
            unknown = sorted(set(categories) - category_ids)
            if unknown:
                errors.append(f"{prefix}: unknown categories: {', '.join(unknown)}")

        tags = item.get("tags", [])
        if not isinstance(tags, list):
            errors.append(f"{prefix}.tags must be a list")
        else:
            unknown = sorted(set(tags) - tag_ids)
            if unknown:
                errors.append(f"{prefix}: unknown tags: {', '.join(unknown)}")

        variants = item.get("variants")
        if variants is not None and (
            not isinstance(variants, list)
            or not variants
            or any(not isinstance(value, str) or not value.strip() for value in variants)
        ):
            errors.append(f"{prefix}.variants must be a non-empty list of strings")

        duplicate_of = item.get("possible_duplicate_of")
        if duplicate_of is not None and duplicate_of not in recipe_ids | all_idea_ids:
            errors.append(f"{prefix}.possible_duplicate_of points to unknown id {duplicate_of!r}")

    return errors


def main() -> int:
    errors: list[str] = []
    try:
        categories_data = load_yaml(REFERENCE_DIR / "categories.yaml") or {}
        tags_data = load_yaml(REFERENCE_DIR / "tags.yaml") or {}
        units_data = load_yaml(REFERENCE_DIR / "units.yaml") or {}
        ingredients_data = load_yaml(REFERENCE_DIR / "ingredients.yaml") or {}
        catalog_data = load_yaml(CATALOG_FILE) or {}

        category_ids = {item["id"] for item in categories_data.get("categories", [])}
        tag_records = tags_data.get("tags", [])
        tag_ids = {item["id"] for item in tag_records}
        unit_ids = {item["id"] for item in units_data.get("units", [])}
        ingredient_records = ingredients_data.get("ingredients", [])
        ingredient_ids = {item["id"] for item in ingredient_records}
        department_ids = {item["id"] for item in ingredients_data.get("departments", [])}

        if len(tag_ids) != len(tag_records):
            errors.append("reference/tags.yaml: duplicate tag ids")
        for item in tag_records:
            if not SLUG.fullmatch(str(item.get("id", ""))):
                errors.append(f"reference/tags.yaml: invalid id {item.get('id')!r}")
            if not isinstance(item.get("name"), str) or not item["name"].strip():
                errors.append(f"reference/tags.yaml: tag {item.get('id')!r} has invalid name")

        if len(ingredient_ids) != len(ingredient_records):
            errors.append("reference/ingredients.yaml: duplicate ingredient ids")
        for item in ingredient_records:
            if not SLUG.fullmatch(str(item.get("id", ""))):
                errors.append(f"reference/ingredients.yaml: invalid id {item.get('id')!r}")
            if item.get("department") not in department_ids:
                errors.append(
                    f"reference/ingredients.yaml: ingredient {item.get('id')!r} has unknown department"
                )

        nested_recipes = [path for path in RECIPES_DIR.rglob("*.md") if path.parent != RECIPES_DIR]
        for path in nested_recipes:
            errors.append(f"{path.relative_to(ROOT)}: nested recipe files are not allowed")

        recipe_ids: set[str] = set()
        for path in sorted(RECIPES_DIR.glob("*.md")):
            try:
                data, _ = load_recipe(path)
                recipe_id = data.get("id")
                if recipe_id in recipe_ids:
                    errors.append(f"{path.relative_to(ROOT)}: duplicate recipe id {recipe_id!r}")
                if isinstance(recipe_id, str):
                    recipe_ids.add(recipe_id)
                validate_recipe(path, category_ids, tag_ids, unit_ids, ingredient_ids)
            except (OSError, ValidationError) as exc:
                errors.append(f"{path.relative_to(ROOT)}: {exc}")

        dish_records = catalog_data.get("dishes", [])
        if not isinstance(dish_records, list):
            errors.append("catalog/dishes.yaml: dishes must be a list")
            dish_records = []
        errors.extend(validate_dish_ideas(dish_records, category_ids, tag_ids, recipe_ids))
    except ValidationError as exc:
        errors.append(str(exc))

    if errors:
        print("Recipe validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    recipe_count = len(list(RECIPES_DIR.glob("*.md")))
    idea_count = len((load_yaml(CATALOG_FILE) or {}).get("dishes", []))
    print(f"Recipe validation passed: {recipe_count} recipe(s), {idea_count} idea(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
