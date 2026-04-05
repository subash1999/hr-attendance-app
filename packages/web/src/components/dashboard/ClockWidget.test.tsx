import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { theme } from "../../theme/theme";
import { AttendanceActions } from "@hr-attendance-app/types";
import "../../i18n/index";
import { ClockWidget } from "./ClockWidget";
import type { ReactElement } from "react";

const BASE_PROPS = {
  breakMinutesToday: 0,
  lastEventTimestamp: null,
  onAction: vi.fn(),
};

const renderWithTheme = (ui: ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("ClockWidget", () => {
  it("shows Clock In button when idle", () => {
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={0} {...BASE_PROPS} />);
    expect(screen.getByRole("button", { name: /clock in/i })).toBeInTheDocument();
  });

  it("shows Clock Out and Break buttons when clocked in", () => {
    renderWithTheme(<ClockWidget status="CLOCKED_IN" hoursToday={3.5} {...BASE_PROPS} />);
    expect(screen.getByRole("button", { name: /clock out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /break/i })).toBeInTheDocument();
  });

  it("shows Back button when on break", () => {
    renderWithTheme(<ClockWidget status="ON_BREAK" hoursToday={2} {...BASE_PROPS} />);
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("fires CLOCK_IN action when idle button clicked", () => {
    const onAction = vi.fn();
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={0} {...BASE_PROPS} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /clock in/i }));
    expect(onAction).toHaveBeenCalledWith(AttendanceActions.CLOCK_IN);
  });

  it("fires CLOCK_OUT action when clock out button clicked", () => {
    const onAction = vi.fn();
    renderWithTheme(<ClockWidget status="CLOCKED_IN" hoursToday={8} {...BASE_PROPS} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /clock out/i }));
    expect(onAction).toHaveBeenCalledWith(AttendanceActions.CLOCK_OUT);
  });

  it("fires BREAK_START action when break button clicked", () => {
    const onAction = vi.fn();
    renderWithTheme(<ClockWidget status="CLOCKED_IN" hoursToday={4} {...BASE_PROPS} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /break/i }));
    expect(onAction).toHaveBeenCalledWith(AttendanceActions.BREAK_START);
  });

  it("fires BREAK_END action when back button clicked", () => {
    const onAction = vi.fn();
    renderWithTheme(<ClockWidget status="ON_BREAK" hoursToday={4} {...BASE_PROPS} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onAction).toHaveBeenCalledWith(AttendanceActions.BREAK_END);
  });

  it("displays hours when idle", () => {
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={5.2} {...BASE_PROPS} />);
    expect(screen.getByText("5.2h")).toBeInTheDocument();
  });

  it("renders touch-friendly buttons", () => {
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={0} {...BASE_PROPS} />);
    expect(screen.getByRole("button", { name: /clock in/i })).toBeInTheDocument();
  });

  it("shows loading state when submitting", () => {
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={0} {...BASE_PROPS} loading />);
    expect(screen.getByRole("button", { name: /clock in/i })).toBeDisabled();
  });

  it("shows status label", () => {
    renderWithTheme(<ClockWidget status="CLOCKED_IN" hoursToday={2} {...BASE_PROPS} />);
    expect(screen.getByText(/working/i)).toBeInTheDocument();
  });

  it("shows progress bar with today's hours", () => {
    renderWithTheme(<ClockWidget status="IDLE" hoursToday={4} {...BASE_PROPS} />);
    expect(screen.getByText("4.0 / 8h")).toBeInTheDocument();
  });
});
