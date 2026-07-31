import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import ErrorState from "@/components/ErrorState";

describe("ErrorState", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<ErrorState message="Something broke." onRetry={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("announces the message via role=alert", () => {
    render(<ErrorState message="The server timed out." />);
    expect(screen.getByRole("alert")).toHaveTextContent("The server timed out.");
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState message="Failed." onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("omits the retry button when no handler is provided", () => {
    render(<ErrorState message="Failed." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
