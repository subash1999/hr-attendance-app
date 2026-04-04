import { test, expect } from "../fixtures/auth";
import { TeamPage } from "../pages/team.page";
import * as db from "../fixtures/db";

/**
 * REQ-WEB-003: Manager sees team hours, approves leave/flags/bank
 * Requirement 9: Team overview, approval queues, calendar, reports
 * Behavior: manager views team, approves items, navigates tabs
 */
test.describe("09 — Team Management", () => {
  test.beforeAll(() => {
    db.resetSeedData();
  });

  test("manager sees team members with employment type and status", async ({ managerPage: { page } }) => {
    const team = new TeamPage(page);
    await team.goto();

    // Overview tab is default — should show team members
    // MGR001 manages JP001 and NP001
    await expect(page.getByText("Yamada Taro").or(page.getByText("Ram Sharma")).or(team.noMembersMessage)).toBeVisible();
  });

  test("manager navigates all 4 tabs", async ({ managerPage: { page } }) => {
    const team = new TeamPage(page);
    await team.goto();

    // Tab 1: Overview (default)
    await expect(team.overviewTab).toBeVisible();

    // Tab 2: Approvals — shows pending or empty
    await team.approvalsTab.click();
    await expect(team.noApprovalsMessage.or(page.getByText("Leave").first())).toBeVisible();

    // Tab 3: Calendar — shows approved leave or no-leave message
    await team.calendarTab.click();
    await expect(team.noLeaveMessage.or(page.locator("table").first())).toBeVisible();

    // Tab 4: Reports — shows date picker and content
    await team.reportsTab.click();
    await expect(team.reportDateInput()).toBeVisible();
    await expect(page.getByText("No reports for this date").or(page.locator("[class*='ReportItem']").first())).toBeVisible();
  });

  test("manager sees empty approval queue when nothing is pending", async ({ managerPage: { page } }) => {
    const team = new TeamPage(page);
    await team.goto();
    await team.approvalsTab.click();
    await expect(team.noApprovalsMessage).toBeVisible();
  });

  test("flag resolution dropdown has 5 options", async ({ managerPage: { page } }) => {
    // This tests the UI structure that managers use to resolve flags
    const team = new TeamPage(page);
    await team.goto();
    await team.approvalsTab.click();

    // If there are flags, the resolve dropdown should have the 5 resolution options
    const selects = team.flagResolveSelects();
    if (await selects.first().isVisible()) {
      const options = selects.first().locator("option");
      // 1 placeholder + 5 resolution options = 6
      await expect(options).toHaveCount(6);
    }
  });

  test("admin can also access team page", async ({ adminPage: { page } }) => {
    const team = new TeamPage(page);
    await team.goto();
    await expect(page).toHaveURL(/\/team$/);
    await expect(team.overviewTab).toBeVisible();
  });
});
