import { test, expect } from "../fixtures/auth";
import { DashboardPage } from "../pages/dashboard.page";
import * as db from "../fixtures/db";

/**
 * REQ-SLACK-012: 3-state attendance machine (IDLE → CLOCKED_IN → ON_BREAK → CLOCKED_IN → IDLE)
 * REQ-WEB-001: Dashboard shows clock status, hours, leave balance, pending actions
 * REQ-WEB-003: Manager sees team link
 * Behavior: employee clocks full cycle, sees stats, navigates via quick actions
 */
test.describe("04 — Dashboard", () => {
  test.beforeAll(() => {
    db.resetSeedData();
  });

  test("employee completes full clock cycle: in → break → back → out with DB validation", async ({ employeePage: { page } }) => {
    const dash = new DashboardPage(page);

    // Step 1: IDLE — only Clock In available
    await expect(dash.clockInButton).toBeVisible();
    await expect(dash.clockOutButton).not.toBeVisible();
    await expect(dash.breakButton).not.toBeVisible();

    // Step 2: Clock In → CLOCKED_IN
    await dash.clockIn();
    await expect(dash.clockOutButton).toBeVisible();
    await expect(dash.breakButton).toBeVisible();
    await expect(dash.clockInButton).not.toBeVisible();
    // Elapsed timer appears
    await expect(dash.elapsedTimer).toBeVisible();
    // DB: state is CLOCKED_IN
    const stateAfterIn = await db.getAttendanceState("JP001");
    expect(stateAfterIn?.state).toBe("CLOCKED_IN");

    // Step 3: Break → ON_BREAK
    await dash.startBreak();
    await expect(dash.backFromBreakButton).toBeVisible();
    await expect(dash.clockOutButton).not.toBeVisible();
    const stateOnBreak = await db.getAttendanceState("JP001");
    expect(stateOnBreak?.state).toBe("ON_BREAK");

    // Step 4: End Break → CLOCKED_IN
    await dash.endBreak();
    await expect(dash.clockOutButton).toBeVisible();
    await expect(dash.breakButton).toBeVisible();
    const stateAfterBreak = await db.getAttendanceState("JP001");
    expect(stateAfterBreak?.state).toBe("CLOCKED_IN");

    // Step 5: Clock Out → IDLE
    await dash.clockOut();
    await expect(dash.clockInButton).toBeVisible();
    await expect(dash.clockOutButton).not.toBeVisible();
    const stateFinal = await db.getAttendanceState("JP001");
    expect(stateFinal?.state).toBe("IDLE");
  });

  test("employee sees leave balance of 8 days (JP001 seed data)", async ({ employeePage: { page } }) => {
    const dash = new DashboardPage(page);
    await dash.goto();
    // REQ-WEB-001: leave balance on dashboard
    await expect(page.getByText("8 days")).toBeVisible();
  });

  test("employee uses quick action links to navigate", async ({ employeePage: { page } }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // Quick actions exist
    await expect(dash.newLeaveLink).toBeVisible();
    await expect(dash.viewReportsLink).toBeVisible();
    await expect(dash.viewPayrollLink).toBeVisible();

    // Employee does NOT see View Team
    await expect(dash.viewTeamLink).not.toBeVisible();

    // Click New Leave Request → navigates to /leave
    await dash.newLeaveLink.click();
    await expect(page).toHaveURL(/\/leave$/);
  });

  test("manager sees View Team quick action", async ({ managerPage: { page } }) => {
    const dash = new DashboardPage(page);
    await expect(dash.viewTeamLink).toBeVisible();

    await dash.viewTeamLink.click();
    await expect(page).toHaveURL(/\/team$/);
  });

  test("dashboard shows hours progress cards for today/week/month", async ({ employeePage: { page } }) => {
    const dash = new DashboardPage(page);
    await dash.goto();

    // All 4 stat categories are present
    await expect(dash.hoursToday).toBeVisible();
    await expect(dash.hoursWeek).toBeVisible();
    await expect(dash.hoursMonth).toBeVisible();
    await expect(dash.leaveBalance).toBeVisible();
  });
});
