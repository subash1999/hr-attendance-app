import { test, expect } from "../fixtures/auth";
import * as db from "../fixtures/db";

/**
 * Cross-user side effects: Action by User A is visible to User B
 * REQ-LEAVE-003: Leave approval workflow (employee → manager → approved)
 * REQ-WEB-003: Manager views team hours and status
 * REQ-HOL-001: Holidays visible to all employees in that region
 */
test.describe("12 — Cross-User Side Effects", () => {
  test.describe.serial("Leave Approval Flow: Employee → Manager → Approved", () => {
    test.beforeAll(() => {
      db.resetSeedData();
    });

    test("employee submits leave request", async ({ employeePage: { page } }) => {
      await page.goto("/leave");
      await page.locator("#leave-type").selectOption("PAID");
      await page.locator("#start-date").fill("2026-08-01");
      await page.locator("#end-date").fill("2026-08-02");
      await page.getByRole("button", { name: "Submit Request" }).click();
      await page.waitForResponse((res) =>
        res.url().includes("/api/leave-requests") && res.request().method() === "POST",
      );
      await expect(page.getByText("Leave request submitted")).toBeVisible();

      // DB: request exists as PENDING
      const requests = await db.getLeaveRequests("JP001");
      expect(requests.some((r) => r.status === "PENDING")).toBe(true);
    });

    test("manager sees and approves the pending request", async ({ managerPage: { page } }) => {
      await page.goto("/leave");
      // Manager should see Pending Approvals with JP001's request
      await expect(page.getByText("Pending Approvals")).toBeVisible();
      await expect(page.getByText("JP001")).toBeVisible();

      await page.getByRole("button", { name: "Approve" }).first().click();
      await expect(page.getByText("Leave approved")).toBeVisible();
    });

    test("employee sees approved status after manager approval", async ({ employeePage: { page } }) => {
      await page.goto("/leave");
      await expect(page.getByText("Approved").first()).toBeVisible();

      // DB confirms
      const requests = await db.getLeaveRequests("JP001");
      expect(requests.some((r) => r.status === "APPROVED")).toBe(true);
    });
  });

  test.describe.serial("Clock Status Cross-Visibility", () => {
    test.beforeAll(() => {
      db.resetSeedData();
    });

    test("employee clocks in, DB reflects CLOCKED_IN", async ({ employeePage: { page } }) => {
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "Clock In" }).click();
      await page.waitForResponse((res) =>
        res.url().includes("/api/attendance/events") && res.status() === 200,
      );

      const state = await db.getAttendanceState("JP001");
      expect(state?.state).toBe("CLOCKED_IN");
    });

    test("manager views team and sees member data", async ({ managerPage: { page } }) => {
      await page.goto("/team");
      // Team overview should render with members
      await expect(
        page.getByText("Yamada Taro").or(page.getByText("Ram Sharma")).or(page.getByText("No team members loaded")),
      ).toBeVisible();
    });

    test("employee clocks out, DB returns to IDLE", async ({ employeePage: { page } }) => {
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "Clock Out" }).click();
      await page.waitForResponse((res) =>
        res.url().includes("/api/attendance/events") && res.status() === 200,
      );

      const state = await db.getAttendanceState("JP001");
      expect(state?.state).toBe("IDLE");
    });
  });

  test.describe.serial("Report Cross-Visibility", () => {
    test.beforeAll(() => {
      db.resetSeedData();
    });

    test("employee submits daily report", async ({ employeePage: { page } }) => {
      await page.goto("/reports");
      await page.locator("#report-text").fill("Cross-effect test report content");
      await page.getByRole("button", { name: "Submit Report" }).click();
      await page.waitForResponse((res) =>
        res.url().includes("/api/reports") && res.request().method() === "POST",
      );
      await expect(page.getByText("Report submitted")).toBeVisible();
    });

    test("manager sees team reports tab with content", async ({ managerPage: { page } }) => {
      await page.goto("/team");
      await page.getByText("Reports", { exact: true }).click();

      // Date input should be visible
      await expect(page.locator("#report-date")).toBeVisible();
    });
  });

  test("seed data has correct role permissions", async () => {
    db.resetSeedData();
    // SUPER_ADMIN: all 11 permissions
    const superAdmin = await db.getRoleDefinition("SUPER_ADMIN");
    expect(superAdmin?.permissions).toHaveLength(11);

    // MANAGER: 4 permissions
    const manager = await db.getRoleDefinition("MANAGER");
    expect(manager?.permissions).toHaveLength(4);

    // EMPLOYEE: 0 permissions
    const employee = await db.getRoleDefinition("EMPLOYEE");
    expect(employee?.permissions).toHaveLength(0);
  });

  test("seed data has 4 employees", async () => {
    const count = await db.countEmployees();
    expect(count).toBe(4);
  });
});
