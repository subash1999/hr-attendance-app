import { test, expect } from "../fixtures/auth";
import { SettingsPage } from "../pages/settings.page";

/**
 * Requirement 14: Settings — language, notifications, profile
 * REQ-WEB-005: i18n with en, ja, ne
 * Behavior: employee views profile, changes language (UI updates), toggles notifications
 */
test.describe("11 — Settings", () => {
  test("JP employee sees their profile data from seed", async ({ employeePage: { page } }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    // JP001: Yamada Taro, taro@example.com, JP_FULL_TIME, JP region, probation
    await expect(page.getByText("Yamada Taro")).toBeVisible();
    await expect(page.getByText("taro@example.com")).toBeVisible();
    await expect(page.getByText("Full-Time (JP)")).toBeVisible();
    await expect(page.getByText("Japan")).toBeVisible();
    // JP001 has probationEndDate: "2025-04-01"
    await expect(settings.probationBadge).toBeVisible();
  });

  test("NP employee sees Nepal region", async ({ employeeNPPage: { page } }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    await expect(page.getByText("Ram Sharma")).toBeVisible();
    await expect(page.getByText("Nepal")).toBeVisible();
  });

  test("employee changes language to Japanese and UI updates immediately", async ({ employeePage: { page } }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    // 3 language options available
    const options = settings.languageSelect.locator("option");
    await expect(options).toHaveCount(3);

    // Switch to Japanese — profile heading should change
    await settings.changeLanguage("ja");
    await expect(page.getByText("プロフィール")).toBeVisible();
  });

  test("language persists after page reload", async ({ employeePage: { page } }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.changeLanguage("ja");
    await page.reload();
    await expect(page.getByText("プロフィール")).toBeVisible();

    // Reset to English
    await settings.changeLanguage("en");
  });

  test("employee toggles notification preferences", async ({ employeePage: { page } }) => {
    const settings = new SettingsPage(page);
    await settings.goto();

    // Initial state: push OFF, email ON
    await expect(settings.pushNotifToggle).not.toBeChecked();
    await expect(settings.emailNotifToggle).toBeChecked();

    // Toggle push ON
    await settings.pushNotifToggle.check();
    await expect(settings.pushNotifToggle).toBeChecked();

    // Toggle email OFF
    await settings.emailNotifToggle.uncheck();
    await expect(settings.emailNotifToggle).not.toBeChecked();
  });
});
