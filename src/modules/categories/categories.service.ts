
import * as categoriesRepository from "./categories.repository.js";
import type { CreateCategoryInput, listCategoriesQuery, UpdateCategoryInput } from "./categories.schemas.js";
import { Prisma } from "@prisma/client";

export async function createCategory(data: CreateCategoryInput) {
  return categoriesRepository.create({
    name: data.name,
    company: { connect: { id: data.companyId } },
  });
}

export async function getCategory(id: string, companyId: string) {
    const category = await categoriesRepository.findById(id, companyId);
    if (!category) {
        throw new Error(`Category not found: ${id}`);
    }
    return category;
}

export async function listCategories(companyId: string, query: listCategoriesQuery) {
    const { page, limit, search } = query;
    return categoriesRepository.findAll(companyId, {
      page,
      limit,
      ...(search ? { search } : {}),
    });
}

export async function updateCategory(id: string, companyId: string, data: UpdateCategoryInput) {
    await getCategory(id, companyId);
    
    // exactOptionalPropertyTypes: true fix
    // We must ensure we don't pass explicit undefined for optional fields
    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;

    return categoriesRepository.update(id, companyId, updateData);
}

export async function deleteCategory(id: string, companyId: string) {
    await getCategory(id, companyId);
    return categoriesRepository.deleteCategory(id, companyId);
}
