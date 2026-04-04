import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";
import { LoginPage } from "../pages/login.page";

/**
 * REQ-WEB-005: i18n with en, ja, ne
 * REQ-THEME-001: WillDesign brand identity on public pages
 * Behavior: unauthenticated visitors land on homepage, can navigate to login, switch languages
 */
test.describe("01 — Public Pages", () => {
  test("visitor sees homepage and can navigate to login", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    // Visitor sees the product pitch
    await expect(home.heroTitle).toBeVisible();
    await expect(home.heroSubtitle).toBeVisible();

    // Visitor sees all 6 features the platform offers
    const features = [
      "Attendance Tracking", "Leave Management", "Payroll & Reports",
      "Team Management", "Policy Engine", "Multi-Region Support",
    ];
    for (const feature of features) {
      await expect(page.getByText(feature, { exact: true })).toBeVisible();
    }

    // Visitor sees deployment options
    await expect(page.getByText("Cloud Hosted")).toBeVisible();
    await expect(page.getByText("Self-Hosted")).toBeVisible();

    // Visitor clicks Login and arrives at login page
    await home.loginButton.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("visitor clicks Get Started CTA and reaches login", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.getStartedButton.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("visitor switches language to Japanese and sees translated content", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    // Switch to Japanese
    await home.languageSwitcher.selectOption("ja");

    // Hero title should now be in Japanese
    await expect(page.getByText("人事業務を効率化")).toBeVisible();

    // Language choice persists in localStorage
    const stored = await page.evaluate(() => localStorage.getItem("hr-app-language"));
    expect(stored).toBe("ja");
  });

  test("visitor switches to Nepali then back to English", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await home.languageSwitcher.selectOption("ne");
    // Switching back should restore English
    await home.languageSwitcher.selectOption("en");
    await expect(home.heroTitle).toBeVisible();
  });

  test("visitor on login page sees dev-mode employee selector with all test users", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Dev mode is active, employee selector visible
    await expect(login.employeeSelect).toBeVisible();

    // All 4 test users appear
    const options = login.employeeSelect.locator("option");
    await expect(options).toHaveCount(4);
    const texts = await options.allTextContents();
    expect(texts.join(",")).toContain("Tanaka Admin");
    expect(texts.join(",")).toContain("Suzuki Manager");
    expect(texts.join(",")).toContain("Yamada Taro");
    expect(texts.join(",")).toContain("Ram Sharma");
  });

  test("visitor on login page can switch to prod mode and sees email/password fields", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.prodModeButton.click();
    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.emailInput).toHaveAttribute("type", "email");
    await expect(login.passwordInput).toHaveAttribute("type", "password");
    await expect(login.forgotPasswordLink).toBeVisible();
  });

  test("visitor entering invalid credentials sees error message", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.attemptProdLogin("bad@example.com", "wrongpass");
    await expect(login.errorText).toBeVisible();
    // Should stay on login page
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login form does not submit with empty fields in prod mode", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.prodModeButton.click();
    await login.submitButton.click();
    // HTML5 validation prevents submission — stays on login
    await expect(page).toHaveURL(/\/login$/);
  });
});
