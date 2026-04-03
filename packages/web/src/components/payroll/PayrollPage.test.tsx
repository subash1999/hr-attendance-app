import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { PayrollPage } from "./PayrollPage";

describe("PayrollPage", () => {
  it("renders payroll breakdown section", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByText("Payroll Breakdown")).toBeInTheDocument();
  });

  it("renders month selector", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByLabelText("Month")).toBeInTheDocument();
  });

  it("renders salary components", () => {
    renderWithProviders(<PayrollPage />);
    expect(screen.getByText("Base Salary")).toBeInTheDocument();
    expect(screen.getByText("Net Amount")).toBeInTheDocument();
  });
});
