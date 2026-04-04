import { test, expect } from "../fixtures/auth";
import { AttendancePage } from "../pages/attendance.page";
import * as db from "../fixtures/db";

/**
 * REQ-ATT-001: Track CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END with timestamps
 * REQ-WEB-002: Employee can edit attendance records with audit trail
 * Requirement 10: Monthly calendar, day detail, edit with mandatory reason, locked period
 */
test.describe("05 — Attendance", () => {
  test.beforeAll(() => {
    db.resetSeedData();
  });

  test("employee clocks in from attendance page and sees event in day detail", async ({ employeePage: { page } }) => {
    const att = new AttendancePage(page);
    await att.goto();

    // Calendar and day detail sections are present
    await expect(att.calendarHeading).toBeVisible();
    await expect(att.dayDetailHeading).toBeVisible();

    // Initially no records for today
    await expect(att.noRecordsMessage).toBeVisible();

    // Clock in
    await page.getByRole("button", { name: "Clock In" }).click();
    await page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );

    // Clock In action badge should now appear in day detail
    await expect(page.getByText("Clock In").first()).toBeVisible();

    // DB validates CLOCKED_IN state
    const state = await db.getAttendanceState("JP001");
    expect(state?.state).toBe("CLOCKED_IN");
  });

  test("employee clocks out and DB returns to IDLE", async ({ employeePage: { page } }) => {
    const att = new AttendancePage(page);
    await att.goto();

    const clockOutBtn = page.getByRole("button", { name: "Clock Out" });
    await expect(clockOutBtn).toBeVisible();
    await clockOutBtn.click();
    await page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );

    const state = await db.getAttendanceState("JP001");
    expect(state?.state).toBe("IDLE");
  });

  test("employee edits an attendance event with reason and sees success toast", async ({ employeePage: { page } }) => {
    const att = new AttendancePage(page);
    await att.goto();

    // Create an event first
    await page.getByRole("button", { name: "Clock In" }).click();
    await page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );

    // Click Edit on the event
    const editBtn = att.editButtons().first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Modal opens with reason field
    await expect(att.editModal).toBeVisible();
    await expect(att.editReasonInput).toBeVisible();

    // Submit disabled when reason empty
    await expect(att.editSubmitButton).toBeDisabled();

    // Fill reason and submit
    await att.editReasonInput.fill("Correcting timestamp — arrived earlier");
    await expect(att.editSubmitButton).toBeEnabled();
    await att.editSubmitButton.click();

    // Success toast
    await expect(page.getByText("Edit saved")).toBeVisible();
  });

  test("unlocked period does not show lock notice", async ({ employeePage: { page } }) => {
    const att = new AttendancePage(page);
    await att.goto();
    await expect(att.lockedNotice).not.toBeVisible();
  });

  test("full clock in/out cycle validates DB state at each step", async ({ employeePage: { page } }) => {
    db.resetSeedData();
    const att = new AttendancePage(page);
    await att.goto();

    // Clock in
    await page.getByRole("button", { name: "Clock In" }).click();
    await page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );
    expect((await db.getAttendanceState("JP001"))?.state).toBe("CLOCKED_IN");

    // Clock out
    await page.getByRole("button", { name: "Clock Out" }).click();
    await page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );
    expect((await db.getAttendanceState("JP001"))?.state).toBe("IDLE");
  });
});
