
import * as categoriesRepository from "./categories.repository";
import type { CreateCategoryInput } from "./categories.schemas";

export async function createCategory(data: CreateCategoryInput) {
  return categoriesRepository.create({
    name: data.name,
    company: { connect: { id: data.companyId } },
  });
}

export async function getCategory(id: string) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
        throw new Error(`Category not found: ${id}`);
    }
    return category;
}

export async function listCategories() {
    return categoriesRepository.findAll();
}
