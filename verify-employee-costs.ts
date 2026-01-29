
import { prisma } from "./src/lib/prisma";
import { getFinancialForecast } from "./src/modules/finance/finance.service";
import { updateCompanySettings, getCompanySettings } from "./src/modules/companies/company.service";
import { createEmployeeCost } from "./src/modules/employee-costs/employee-cost.service";
import { createExpense } from "./src/modules/finance/finance.service";

async function runVerification() {
  console.log("Starting verification...");

  // 1. Create a Test Company
  const company = await prisma.company.create({
    data: {
      name: "Test Company Employee Costs",
      monthlyFixedCost: 1000, 
      desiredProfit: 5000,
    }
  });
  console.log("Created Company:", company.id);

  try {
    // 2. Enable Manual Employee Cost
    await updateCompanySettings(company.id, {
      manualEmployeeCostEnabled: true
    });
    console.log("Enabled manualEmployeeCostEnabled");

    // 3. Add Employee Cost
    // 20 days * 100 = 2000 total
    await createEmployeeCost({
      name: "John Doe",
      role: "Chef",
      workedDays: 20,
      dailyRate: 100
    }, company.id);
    console.log("Created Employee Cost (2000)");

    // 4. Add Fixed Expense
    // 500
    await createExpense({
      description: "Rent",
      amount: 500,
      dueDate: new Date(),
      status: "PAID",
      category: "FIXED",
      isRecurring: false
    }, company.id);
    console.log("Created Fixed Expense (500)");

    // 5. Check Settings
    const settings = await getCompanySettings(company.id);
    console.log("Settings Total Employee Cost:", settings.totalEmployeeCost);
    
    if (settings.totalEmployeeCost !== 2000) {
      throw new Error(`Expected totalEmployeeCost 2000, got ${settings.totalEmployeeCost}`);
    }

    // 6. Check Forecast
    // Total Fixed Cost should be: 1000 (Generic) + 500 (Expense) + 2000 (Employee) = 3500
    const forecast = await getFinancialForecast(company.id);
    console.log("Forecast Total Fixed Cost:", forecast.breakDown.totalFixedCost);
    console.log("Forecast Breakdown:", forecast.breakDown);

    if (forecast.breakDown.totalFixedCost !== 3500) {
      throw new Error(`Expected totalFixedCost 3500, got ${forecast.breakDown.totalFixedCost}`);
    }

    console.log("Verification SUCCESS!");

  } catch (error) {
    console.error("Verification FAILED:", error);
  } finally {
    // Cleanup
    await prisma.employeeCost.deleteMany({ where: { companyId: company.id } });
    await prisma.expense.deleteMany({ where: { companyId: company.id } });
    await prisma.company.delete({ where: { id: company.id } });
    console.log("Cleanup done.");
  }
}

runVerification();
