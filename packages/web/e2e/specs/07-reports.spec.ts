import { todayDate } from "@hr-attendance-app/types";
import { test, expect } from "../fixtures/auth";
import * as db from "../fixtures/db";

/**
 * REQ-REPORT-001..005: Daily reports with references, versions, warnings
 * Requirement 18: Submit reports, view history, JIRA/GitHub references
 * Behavior: employee submits report, sees it in history, re-submits to create version
 */
test.describe("07 — Reports", () => {
  test.beforeAll(() => {
    db.resetSeedData();
  });

  test("employee with no reports sees empty history", async ({ employeePage: { page } }) => {
    await page.goto("/reports");
    await expect(page.getByText("No reports submitted")).toBeVisible();
  });

  test("employee submits daily report and it appears in history", async ({ employeePage: { page } }) => {
    await page.goto("/reports");

    await page.locator("#report-text").fill("Implemented E2E test suite for attendance module");
    await page.getByRole("button", { name: "Submit Report" }).click();
    await page.waitForResponse((res) =>
      res.url().includes("/api/reports") && res.request().method() === "POST",
    );

    // Success toast
    await expect(page.getByText("Report submitted")).toBeVisible();

    // Report stored in DB
    const today = todayDate();
    const reports = await db.getReports("JP001", today);
    expect(reports.length).toBeGreaterThan(0);
  });

  test("re-submitting report for same day creates new version", async ({ employeePage: { page } }) => {
    await page.goto("/reports");

    await page.locator("#report-text").fill("Updated: also fixed cross-effects tests");
    await page.getByRole("button", { name: "Submit Report" }).click();
    await page.waitForResponse((res) =>
      res.url().includes("/api/reports") && res.request().method() === "POST",
    );

    await expect(page.getByText("Report submitted")).toBeVisible();

    // DB should have multiple versions
    const today = todayDate();
    const reports = await db.getReports("JP001", today);
    expect(reports.length).toBeGreaterThanOrEqual(2);
  });

  test("report with no references shows warning badge", async ({ employeePage: { page } }) => {
    await page.goto("/reports");
    // Reports submitted above had no JIRA/GitHub references
    await expect(page.getByText("No references found").first()).toBeVisible();
  });
});
