import { test, expect } from "../fixtures/auth";

/**
 * REQ-PERM-001..005: RBAC with Employee, Manager, Admin, Super Admin
 * REQ-PERM-003: Manager sees only direct reports
 * Behavior: each role sees appropriate nav items and can/cannot access routes
 */
test.describe("03 — Access Control", () => {
  test("employee sees 6 nav items and cannot access Team or Admin", async ({ employeePage: { page } }) => {
    // Open sidebar
    const menuToggle = page.getByLabel("Toggle menu");
    if (await menuToggle.isVisible()) await menuToggle.click();

    const navItems = page.locator("nav a[href]").filter({ hasText: /.+/ });
    const visibleItems = await navItems.allTextContents();

    // Employee has: Dashboard, Attendance, Leave, Reports, Payroll, Settings
    for (const item of ["Dashboard", "Attendance", "Leave", "Reports", "Payroll", "Settings"]) {
      expect(visibleItems.some((v) => v.includes(item))).toBe(true);
    }
    // No Team or Admin
    expect(visibleItems.some((v) => v.includes("Team"))).toBe(false);
    expect(visibleItems.some((v) => v.includes("Admin"))).toBe(false);

    // Trying to access /team → redirected to /dashboard
    await page.goto("/team");
    await expect(page).toHaveURL(/\/dashboard$/);

    // Trying to access /admin → redirected to /dashboard
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("employee can access all non-restricted routes", async ({ employeePage: { page } }) => {
    const routes = ["/dashboard", "/attendance", "/leave", "/reports", "/payroll", "/settings"];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route}$`));
    }
  });

  test("manager sees Team nav but not Admin, can access /team", async ({ managerPage: { page } }) => {
    const menuToggle = page.getByLabel("Toggle menu");
    if (await menuToggle.isVisible()) await menuToggle.click();

    const navItems = page.locator("nav a[href]").filter({ hasText: /.+/ });
    const visibleItems = await navItems.allTextContents();
    expect(visibleItems.some((v) => v.includes("Team"))).toBe(true);
    expect(visibleItems.some((v) => v.includes("Admin"))).toBe(false);

    // Can access /team
    await page.goto("/team");
    await expect(page).toHaveURL(/\/team$/);

    // Cannot access /admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("admin sees both Team and Admin nav, can access all routes", async ({ adminPage: { page } }) => {
    const menuToggle = page.getByLabel("Toggle menu");
    if (await menuToggle.isVisible()) await menuToggle.click();

    const navItems = page.locator("nav a[href]").filter({ hasText: /.+/ });
    const visibleItems = await navItems.allTextContents();
    expect(visibleItems.some((v) => v.includes("Team"))).toBe(true);
    expect(visibleItems.some((v) => v.includes("Admin"))).toBe(true);

    await page.goto("/team");
    await expect(page).toHaveURL(/\/team$/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("unauthenticated user is redirected to /login from protected routes", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    for (const route of ["/dashboard", "/attendance", "/leave", "/settings"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    }

    await ctx.close();
  });
});
