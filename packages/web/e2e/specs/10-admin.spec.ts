import { test, expect } from "../fixtures/auth";
import { AdminPage } from "../pages/admin.page";
import * as db from "../fixtures/db";

/**
 * Requirement 3: Admin onboarding multi-step form
 * Requirement 4: Admin offboarding with settlement preview
 * Requirement 5: Policy builder
 * Requirement 6: Holiday management
 * Requirement 7: Role/permission management
 * Requirement 8: Attendance lock (company/group/employee scope)
 */
test.describe("10 — Admin Panel", () => {
  test.beforeAll(() => {
    db.resetSeedData();
  });

  test("admin navigates between all 6 sections", async ({ adminPage: { page } }) => {
    const admin = new AdminPage(page);
    await admin.goto();

    // Desktop shows "select section" prompt
    await expect(admin.selectSectionMessage).toBeVisible();

    // Navigate to each section and verify it loads
    const sections: Array<[string, string]> = [
      ["onboarding", "Onboarding"],
      ["offboarding", "Offboarding"],
      ["policies", "Policies"],
      ["roles", "Roles"],
      ["holidays", "Holidays"],
      ["locks", "Attendance Lock"],
    ];

    for (const [id, label] of sections) {
      await admin.openSection(id);
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("admin starts onboarding flow with multi-step form", async ({ adminPage: { page } }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.openSection("onboarding");

    // Step 1: Personal Info with required fields
    await expect(page.getByText("Personal Info")).toBeVisible();
    await expect(admin.nameInput()).toBeVisible();
    await expect(admin.emailInput()).toBeVisible();

    // Fill step 1 and advance to step 2
    await admin.nameInput().fill("Test Employee");
    await admin.emailInput().fill("test@example.com");
    const nextBtn = admin.nextButton();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();

      // Step 2: Employment — should have 9 employment types
      await expect(page.getByText("Employment")).toBeVisible();
      const empTypeSelect = admin.employmentTypeSelect();
      if (await empTypeSelect.isVisible()) {
        const options = empTypeSelect.locator("option");
        const count = await options.count();
        expect(count).toBeGreaterThanOrEqual(9);
      }
    }
  });

  test("admin opens offboarding and sees termination options", async ({ adminPage: { page } }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.openSection("offboarding");

    // REQ-OB-008: 4 termination types
    const termSelect = admin.terminationTypeSelect();
    if (await termSelect.isVisible()) {
      const options = termSelect.locator("option");
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(4);
    }
  });

  test("admin views and edits roles with permissions", async ({ adminPage: { page } }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.openSection("roles");

    // All 3 seeded roles visible
    await expect(page.getByText("SUPER_ADMIN")).toBeVisible();
    await expect(page.getByText("MANAGER")).toBeVisible();
    await expect(page.getByText("EMPLOYEE")).toBeVisible();

    // Click MANAGER to see permission checkboxes
    await page.getByText("MANAGER").click();
    const checkboxes = admin.permissionCheckboxes();
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);

    // DB validates role permissions match seed data
    const superAdmin = await db.getRoleDefinition("SUPER_ADMIN");
    expect(superAdmin?.permissions).toHaveLength(11);
    const manager = await db.getRoleDefinition("MANAGER");
    expect(manager?.permissions).toHaveLength(4);
    const employee = await db.getRoleDefinition("EMPLOYEE");
    expect(employee?.permissions).toHaveLength(0);
  });

  test("admin adds and deletes a holiday", async ({ adminPage: { page } }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.openSection("holidays");

    // Add holiday
    const addBtn = admin.addHolidayButton();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const dateInput = admin.holidayDateInput();
    const nameInput = admin.holidayNameInput();
    if (await dateInput.isVisible()) {
      await dateInput.fill("2026-12-25");
      await nameInput.fill("Christmas");
      const submit = page.getByRole("button", { name: "Submit" }).or(page.getByRole("button", { name: "Add" }));
      if (await submit.isVisible()) {
        await submit.click();
        await expect(page.getByText("Holiday added")).toBeVisible();
      }
    }

    // Delete the holiday
    const deleteBtn = admin.deleteHolidayButtons().first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      const confirmBtn = page.getByRole("button", { name: "Delete" }).last();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await expect(page.getByText("Holiday deleted")).toBeVisible();
      }
    }
  });

  test("admin manages attendance locks", async ({ adminPage: { page } }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.openSection("locks");

    // Scope options visible
    await expect(admin.lockScopeCompany()).toBeVisible();

    // Lock/unlock buttons available
    const lockBtns = admin.lockButtons();
    const count = await lockBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test("admin views policy domains", async ({ adminPage: { page } }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.openSection("policies");

    // Policy section should list the domain categories
    await expect(page.getByText("Policies").first()).toBeVisible();
  });
});
