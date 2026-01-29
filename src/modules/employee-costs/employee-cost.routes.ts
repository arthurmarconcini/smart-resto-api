
import type { FastifyInstance } from "fastify";
import * as employeeCostController from "./employee-cost.controller.js";

export async function employeeCostRoutes(server: FastifyInstance) {
  server.post("/companies/:companyId/employee-costs", employeeCostController.create);
  server.get("/companies/:companyId/employee-costs", employeeCostController.list);
  server.put("/companies/:companyId/employee-costs/:id", employeeCostController.update);
  server.delete("/companies/:companyId/employee-costs/:id", employeeCostController.remove);
}
