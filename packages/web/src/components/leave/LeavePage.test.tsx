import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { LeavePage } from "./LeavePage";

describe("LeavePage", () => {
  it("renders leave request form", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByText("New Request")).toBeInTheDocument();
  });

  it("renders leave request list", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByText("My Requests")).toBeInTheDocument();
  });

  it("renders date picker inputs", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
  });

  it("renders leave type selector", () => {
    renderWithProviders(<LeavePage />);
    expect(screen.getByLabelText("Leave Type")).toBeInTheDocument();
  });
});
