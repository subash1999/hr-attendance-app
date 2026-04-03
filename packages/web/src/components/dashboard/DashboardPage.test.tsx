import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders the clock widget section", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId("clock-widget")).toBeInTheDocument();
  });

  it("renders hours summary cards", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Hours Today")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("This Month")).toBeInTheDocument();
  });

  it("renders leave balance card", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Leave Balance")).toBeInTheDocument();
  });

  it("renders pending actions section", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
