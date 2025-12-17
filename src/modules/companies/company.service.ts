
import * as companiesRepository from "./company.repository";
import type { CreateCompanyInput } from "./company.schemas";

export async function createCompany(data: CreateCompanyInput) {
  return companiesRepository.create({
    name: data.name,
    desiredProfit: data.desiredProfit,
  });
}
