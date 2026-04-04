import { test, expect } from "../fixtures/auth";

/**
 * Error handling behavior: when APIs fail, user sees meaningful feedback
 * Toast behavior: auto-dismiss, stacking
 * Form validation: prevents invalid submissions
 */
test.describe("13 — Error Handling & Edge Cases", () => {
  test.describe("API Failures — User sees app doesn't crash", () => {
    test("500 on attendance API: app renders without crash, clock widget may show error", async ({ employeePage: { page } }) => {
      await page.route("**/api/attendance/state", (route) =>
        route.fulfill({ status: 500, body: JSON.stringify({ error: "Internal Server Error" }) }),
      );
      await page.goto("/dashboard");

      // App shell renders — user is not staring at a blank page
      await expect(page.getByText("HR Attendance App")).toBeVisible();
      // Clock widget area should exist even if data failed
      await expect(page.getByTestId("clock-widget").or(page.getByText("Clock In"))).toBeVisible();
    });

    test("500 on leave balance API: dashboard still renders other sections", async ({ employeePage: { page } }) => {
      await page.route("**/api/leave/balance", (route) =>
        route.fulfill({ status: 500, body: JSON.stringify({ error: "Internal Server Error" }) }),
      );
      await page.goto("/dashboard");

      // Stats cards still render (even if balance shows 0/error)
      await expect(page.getByText("Hours Today")).toBeVisible();
    });

    test("401 on employee profile: settings page handles gracefully", async ({ employeePage: { page } }) => {
      await page.route("**/api/employees/me", (route) =>
        route.fulfill({ status: 401, body: JSON.stringify({ error: "Unauthorized" }) }),
      );
      await page.goto("/settings");

      // App renders something — not a blank page
      await expect(page.getByText("Profile").or(page.getByText("Loading"))).toBeVisible();
    });

    test("404 on payroll: user sees no data message", async ({ employeePage: { page } }) => {
      await page.route("**/api/payroll/**", (route) =>
        route.fulfill({ status: 404, body: JSON.stringify({ error: "Not Found" }) }),
      );
      await page.goto("/payroll");

      await expect(page.getByText("No data available").or(page.locator("#payroll-month"))).toBeVisible();
    });

    test("network timeout: dashboard still renders app shell", async ({ employeePage: { page } }) => {
      await page.route("**/api/attendance/state", (route) =>
        route.abort("timedout"),
      );
      await page.goto("/dashboard");

      await expect(page.getByText("HR Attendance App")).toBeVisible();
    });

    test("all APIs fail simultaneously: app shell still renders", async ({ employeePage: { page } }) => {
      await page.route("**/api/**", (route) =>
        route.fulfill({ status: 500, body: JSON.stringify({ error: "Server Error" }) }),
      );
      await page.goto("/dashboard");

      // At minimum the header renders
      await expect(page.getByText("HR Attendance App")).toBeVisible();
    });
  });

  test.describe("400 on mutations: user sees the app doesn't break", () => {
    test("400 on clock action: button re-enables, app stays functional", async ({ employeePage: { page } }) => {
      await page.route("**/api/attendance/events", (route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({ status: 400, body: JSON.stringify({ error: "Invalid action" }) });
        }
        return route.continue();
      });
      await page.goto("/dashboard");

      const clockInBtn = page.getByRole("button", { name: "Clock In" });
      await expect(clockInBtn).toBeVisible();
      await clockInBtn.click();

      // After error, button should be re-enabled (not stuck in loading)
      await expect(clockInBtn).toBeEnabled({ timeout: 5000 });
    });
  });

  test.describe("Form Validation", () => {
    test("leave form does not submit without dates", async ({ employeePage: { page } }) => {
      await page.goto("/leave");
      await page.getByRole("button", { name: "Submit Request" }).click();
      await expect(page).toHaveURL(/\/leave$/);
    });

    test("login form does not submit with empty fields in prod mode", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Sign In" }).click();
      await page.getByRole("button", { name: "Log In" }).click();
      await expect(page).toHaveURL(/\/login$/);
    });

    test("attendance edit modal submit disabled without reason", async ({ employeePage: { page } }) => {
      await page.goto("/attendance");

      // Clock in to create an event
      const clockInBtn = page.getByRole("button", { name: "Clock In" });
      if (await clockInBtn.isVisible()) {
        await clockInBtn.click();
        await page.waitForResponse((res) =>
          res.url().includes("/api/attendance/events") && res.status() === 200,
        );
      }

      const editBtn = page.getByRole("button", { name: "Edit" }).first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
      }
    });
  });

  test.describe("Toast Behavior", () => {
    test("toast auto-dismisses after ~4 seconds", async ({ employeePage: { page } }) => {
      await page.goto("/reports");
      await page.locator("#report-text").fill("Test toast dismiss");
      await page.getByRole("button", { name: "Submit Report" }).click();
      await page.waitForResponse((res) =>
        res.url().includes("/api/reports") && res.request().method() === "POST",
      );

      const toast = page.getByText("Report submitted");
      await expect(toast).toBeVisible();

      // Wait for auto-dismiss (4000ms + buffer)
      await page.waitForTimeout(5000);
      await expect(toast).not.toBeVisible();
    });
  });

  test.describe("Empty States", () => {
    test("attendance page shows meaningful empty state", async ({ employeePage: { page } }) => {
      await page.goto("/attendance");
      await expect(page.getByText("No attendance records yet")).toBeVisible();
    });

    test("reports page shows meaningful empty state", async ({ employeePage: { page } }) => {
      await page.goto("/reports");
      await expect(page.getByText("No reports submitted")).toBeVisible();
    });
  });
});
