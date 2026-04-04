import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

/**
 * REQ-PERM-001: Roles (Employee, Manager, Admin, Super Admin)
 * REQ-WEB-001: Dashboard for logged-in user
 * Behavior: users log in with dev auth, session persists, logout works
 */
test.describe("02 — Authentication Flows", () => {
  test("employee logs in via dev mode and lands on dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Select JP001 and see their info chips
    await login.employeeSelect.selectOption("JP001");
    await expect(page.getByText("JP")).toBeVisible();
    await expect(page.getByText("taro@example.com")).toBeVisible();

    // Log in
    await login.loginAsDev("JP001");
    await expect(page).toHaveURL(/\/dashboard$/);

    // Session is stored correctly
    const stored = await page.evaluate(() => sessionStorage.getItem("hr-app-auth"));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.employeeId).toBe("JP001");
    expect(parsed.role).toBe("EMPLOYEE");
    expect(parsed.token).toBeTruthy();
  });

  test("manager logs in and lands on dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAsDev("MGR001");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("admin logs in and lands on dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAsDev("ADMIN001");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("NP employee logs in and lands on dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAsDev("NP001");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("session survives page reload", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAsDev("JP001");

    await page.reload();
    // User should still be on dashboard, not kicked to login
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("authenticated user visiting / is redirected to dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAsDev("JP001");

    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("user logs out, session is cleared, redirected to homepage", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAsDev("JP001");

    // Open sidebar on mobile if needed
    const menuToggle = page.getByLabel("Toggle menu");
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
    }

    await page.getByRole("button", { name: "Log Out" }).click();
    await expect(page).toHaveURL(/\/$/);

    // Session cleared
    const stored = await page.evaluate(() => sessionStorage.getItem("hr-app-auth"));
    expect(stored).toBeNull();
  });
});
