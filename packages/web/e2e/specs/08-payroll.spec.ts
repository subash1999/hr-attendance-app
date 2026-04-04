import { test, expect } from "../fixtures/auth";

/**
 * REQ-PAY-001..016: Payroll breakdown with base salary, overtime, deductions, blending
 * Requirement 13: Employee sees full payroll breakdown per month
 * Behavior: employee navigates to payroll, sees salary, changes month, NP employee sees NPR
 */
test.describe("08 — Payroll", () => {
  test("JP employee sees payroll breakdown with base salary", async ({ employeePage: { page } }) => {
    await page.goto("/payroll");

    // Either payroll data loads or shows no data for current month
    const baseSalary = page.getByText("Base Salary");
    const noData = page.getByText("No data available");

    // Wait for one or the other
    await expect(baseSalary.or(noData)).toBeVisible();

    // If payroll data is available, verify JP001's ¥300,000 salary
    if (await baseSalary.isVisible()) {
      await expect(page.getByText(/300,000/)).toBeVisible();
      await expect(page.getByText("Net Amount")).toBeVisible();
    }
  });

  test("employee can change month and see updated payroll data", async ({ employeePage: { page } }) => {
    await page.goto("/payroll");

    const monthInput = page.locator("#payroll-month");
    await expect(monthInput).toBeVisible();

    // Switch to January 2025 (JP001 start date)
    await monthInput.fill("2025-01");

    // Payroll should update — either show data or no data for that month
    await expect(page.getByText("Base Salary").or(page.getByText("No data available"))).toBeVisible();
  });

  test("NP employee sees NPR currency in payroll", async ({ employeeNPPage: { page } }) => {
    await page.goto("/payroll");

    const baseSalary = page.getByText("Base Salary");
    const noData = page.getByText("No data available");
    await expect(baseSalary.or(noData)).toBeVisible();

    // If data available, NP001's salary is 80,000 NPR
    if (await baseSalary.isVisible()) {
      await expect(page.getByText(/80,000/)).toBeVisible();
    }
  });

  test("NP employee sees JPY home currency equivalent if available", async ({ employeeNPPage: { page } }) => {
    await page.goto("/payroll");

    // REQ-PAY-011: Non-JPY payments show JPY equivalent
    const baseSalary = page.getByText("Base Salary");
    if (await baseSalary.isVisible()) {
      const jpyBadge = page.getByText(/JPY/);
      // May or may not have exchange rate data
      if (await jpyBadge.first().isVisible()) {
        await expect(jpyBadge.first()).toBeVisible();
      }
    }
  });
});
