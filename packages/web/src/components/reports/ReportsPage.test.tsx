import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { ReportsPage } from "./ReportsPage";

describe("ReportsPage", () => {
  it("renders report submission form", () => {
    renderWithProviders(<ReportsPage />);
    expect(screen.getByText("Daily Report")).toBeInTheDocument();
  });

  it("renders yesterday/today/blockers fields", () => {
    renderWithProviders(<ReportsPage />);
    expect(screen.getByLabelText("Yesterday")).toBeInTheDocument();
    expect(screen.getByLabelText("Today")).toBeInTheDocument();
    expect(screen.getByLabelText("Blockers")).toBeInTheDocument();
  });

  it("renders report history section", () => {
    renderWithProviders(<ReportsPage />);
    expect(screen.getByText("Report History")).toBeInTheDocument();
  });
});
