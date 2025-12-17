
import * as companiesRepository from "./company.repository.js";
import type { CreateCompanyInput } from "./company.schemas.js";

export async function createCompany(data: CreateCompanyInput) {
  return companiesRepository.create({
    name: data.name,
    desiredProfit: data.desiredProfit,
  });
}
