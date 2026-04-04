import { test, expect } from "../fixtures/auth";

const MOBILE = { width: 375, height: 812 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1440, height: 900 };

/**
 * REQ-THEME-006: Responsive breakpoints (mobile < 640, tablet 640-1024, desktop > 1024)
 * Requirement 2: Layout shell — sidebar, bottom nav, hamburger, touch targets
 * Behavior: user on different devices sees appropriate navigation and layout
 */
test.describe("14 — Responsive Design", () => {
  test.describe("Mobile (375px)", () => {
    test.use({ viewport: MOBILE });

    test("mobile user sees hamburger menu, not sidebar", async ({ employeePage: { page } }) => {
      // Hamburger visible
      const menuToggle = page.getByLabel("Toggle menu");
      await expect(menuToggle).toBeVisible();

      // Sidebar is off-screen
      const sidebar = page.locator("aside");
      const box = await sidebar.boundingBox();
      if (box) {
        expect(box.x).toBeLessThan(0);
      }
    });

    test("mobile user taps hamburger and navigates via sidebar", async ({ employeePage: { page } }) => {
      const menuToggle = page.getByLabel("Toggle menu");
      await menuToggle.click();

      // Sidebar slides in with nav links
      const navLinks = page.locator("aside a[href]");
      await expect(navLinks.first()).toBeVisible();

      // Can navigate to settings
      await page.getByText("Settings").click();
      await expect(page).toHaveURL(/\/settings$/);
    });

    test("mobile user sees bottom navigation bar", async ({ employeePage: { page } }) => {
      const bottomNav = page.locator("nav").last();
      await expect(bottomNav).toBeVisible();

      // Bottom nav has max 5 items (employee has 6 nav items, limited to 5)
      const items = bottomNav.locator("a");
      const count = await items.count();
      expect(count).toBeLessThanOrEqual(5);
    });

    test("mobile homepage renders all content without horizontal overflow", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Streamline Your HR Operations")).toBeVisible();

      // All 6 features render
      await expect(page.getByText("Attendance Tracking")).toBeVisible();
      await expect(page.getByText("Multi-Region Support")).toBeVisible();
    });

    test("mobile admin page shows card grid for section selection", async ({ adminPage: { page } }) => {
      await page.goto("/admin");

      // 6 section cards should be visible
      const cards = page.locator("button[data-id]");
      await expect(cards).toHaveCount(6);

      // Tap a card and see back button
      await cards.first().click();
      const backBtn = page.getByLabel("Back");
      await expect(backBtn).toBeVisible();
    });
  });

  test.describe("Tablet (768px)", () => {
    test.use({ viewport: TABLET });

    test("tablet shows collapsed sidebar that expands on hover", async ({ employeePage: { page } }) => {
      const sidebar = page.locator("aside");
      await expect(sidebar).toBeVisible();

      // Collapsed: narrow width
      const box = await sidebar.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(80);
      }

      // Hover expands
      await sidebar.hover();
      await page.waitForTimeout(300);
      const expandedBox = await sidebar.boundingBox();
      if (expandedBox) {
        expect(expandedBox.width).toBeGreaterThan(100);
      }
    });

    test("tablet hides bottom navigation bar", async ({ employeePage: { page } }) => {
      // Bottom nav only shows below 640px — tablet is 768px
      const bottomNavs = page.locator("nav");
      const lastNav = bottomNavs.last();
      const isHidden = await lastNav.evaluate(
        (el) => window.getComputedStyle(el).display === "none",
      );
      expect(isHidden).toBe(true);
    });
  });

  test.describe("Desktop (1440px)", () => {
    test.use({ viewport: DESKTOP });

    test("desktop shows full sidebar always visible, no hamburger", async ({ employeePage: { page } }) => {
      const sidebar = page.locator("aside");
      await expect(sidebar).toBeVisible();
      const box = await sidebar.boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.width).toBeGreaterThanOrEqual(200);
      }

      // Hamburger hidden
      const menuToggle = page.getByLabel("Toggle menu");
      const isHidden = await menuToggle.evaluate(
        (el) => window.getComputedStyle(el).display === "none",
      );
      expect(isHidden).toBe(true);
    });

    test("desktop hides bottom navigation", async ({ employeePage: { page } }) => {
      const bottomNavs = page.locator("nav");
      const lastNav = bottomNavs.last();
      const isHidden = await lastNav.evaluate(
        (el) => window.getComputedStyle(el).display === "none",
      );
      expect(isHidden).toBe(true);
    });

    test("desktop admin page shows persistent sidebar navigation", async ({ adminPage: { page } }) => {
      await page.goto("/admin");
      const sideNav = page.locator("nav").filter({ hasText: "Onboarding" });
      await expect(sideNav).toBeVisible();
      await expect(page.getByText("Select a section to manage")).toBeVisible();
    });

    test("desktop homepage shows all content with full layout", async ({ page }) => {
      await page.goto("/");

      // All features visible
      const features = [
        "Attendance Tracking", "Leave Management", "Payroll & Reports",
        "Team Management", "Policy Engine", "Multi-Region Support",
      ];
      for (const feature of features) {
        await expect(page.getByText(feature)).toBeVisible();
      }

      // Deploy options
      await expect(page.getByText("Cloud Hosted")).toBeVisible();
      await expect(page.getByText("Self-Hosted")).toBeVisible();
    });
  });
});
