import { test, expect } from "../fixtures/auth";
import { LeavePage } from "../pages/leave.page";
import * as db from "../fixtures/db";

/**
 * REQ-LEAVE-001..007: Leave types, accrual, approval workflow, balance
 * Requirement 17: Full leave management — types, balance, calendar, approvals
 * Behavior: employee requests leave, manager approves, balance updates
 */
test.describe("06 — Leave Management", () => {
  test.beforeAll(() => {
    db.resetSeedData();
  });

  test("employee submits paid leave request and it appears in request list", async ({ employeePage: { page } }) => {
    const leave = new LeavePage(page);
    await leave.goto();

    // All 9 leave types available in dropdown
    const options = leave.leaveTypeSelect.locator("option");
    await expect(options).toHaveCount(9);

    // Submit a paid leave request
    await leave.submitLeaveRequest("PAID", "2026-05-01", "2026-05-02");
    await expect(page.getByText("Leave request submitted")).toBeVisible();

    // Request appears in the list with Pending status
    await expect(page.getByText("Paid Leave")).toBeVisible();
    await expect(page.getByText("Pending")).toBeVisible();

    // DB confirms request stored
    const requests = await db.getLeaveRequests("JP001");
    const pending = requests.filter((r) => r.status === "PENDING");
    expect(pending.length).toBeGreaterThan(0);
  });

  test("employee submits unpaid leave and shift permission", async ({ employeePage: { page } }) => {
    const leave = new LeavePage(page);
    await leave.goto();

    await leave.submitLeaveRequest("UNPAID", "2026-06-01", "2026-06-01");
    await expect(page.getByText("Leave request submitted")).toBeVisible();

    await leave.submitLeaveRequest("SHIFT_PERMISSION", "2026-07-01", "2026-07-01");
    await expect(page.getByText("Leave request submitted")).toBeVisible();
  });

  test("employee views balance tab showing correct JP001 leave data", async ({ employeePage: { page } }) => {
    const leave = new LeavePage(page);
    await leave.goto();
    await leave.balanceTab.click();

    // JP001 has paidLeaveRemaining: 8, carryOver: 0
    await expect(leave.paidRemaining).toBeVisible();
    await expect(page.getByText("8").first()).toBeVisible();
    await expect(leave.carryOver).toBeVisible();

    // REQ-LEAVE-006: mandatory 5-day tracking for JP employees
    await expect(leave.mandatory5Days).toBeVisible();
  });

  test("employee views calendar tab", async ({ employeePage: { page } }) => {
    const leave = new LeavePage(page);
    await leave.goto();
    await leave.calendarTab.click();

    // Calendar or empty state should show
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });

  test("manager sees pending leave approvals and approves a request", async ({ managerPage: { page } }) => {
    const leave = new LeavePage(page);
    await leave.goto();

    // Manager should see Pending Approvals if JP001's request is pending
    const approvals = page.getByText("Pending Approvals");
    await expect(approvals).toBeVisible();
    await expect(page.getByText("JP001")).toBeVisible();

    // Approve the first request
    const approveBtn = leave.approveButtons().first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();
    await expect(page.getByText("Leave approved")).toBeVisible();
  });

  test("NP employee (NP001) with no prior leave requests sees empty state", async ({ employeeNPPage: { page } }) => {
    const leave = new LeavePage(page);
    await leave.goto();
    await expect(leave.noRequestsMessage).toBeVisible();
  });

  test("leave form does not submit without selecting dates", async ({ employeePage: { page } }) => {
    const leave = new LeavePage(page);
    await leave.goto();

    // Click submit without dates — should stay on page
    await leave.submitButton.click();
    await expect(page).toHaveURL(/\/leave$/);
  });
});
