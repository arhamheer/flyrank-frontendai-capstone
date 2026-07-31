import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import BriefForm from "@/components/BriefForm";

describe("BriefForm", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<BriefForm onSubmit={vi.fn()} disabled={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders a labeled required keyword field", () => {
    render(<BriefForm onSubmit={vi.fn()} disabled={false} />);
    const input = screen.getByLabelText(/target keyword/i);
    expect(input).toBeRequired();
  });

  it("blocks submission and shows an error when the keyword is too short", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BriefForm onSubmit={onSubmit} disabled={false} />);

    await user.type(screen.getByLabelText(/target keyword/i), "ab");
    await user.click(screen.getByRole("button", { name: /generate content brief/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 3 characters/i);
  });

  it("submits the trimmed, structured request on valid input", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BriefForm onSubmit={onSubmit} disabled={false} />);

    await user.type(screen.getByLabelText(/target keyword/i), "  best crm software  ");
    await user.type(screen.getByLabelText(/target audience/i), "sales teams");
    await user.selectOptions(screen.getByLabelText(/content type/i), "landing");
    await user.selectOptions(screen.getByLabelText(/tone/i), "authoritative");
    await user.click(screen.getByRole("button", { name: /generate content brief/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      keyword: "best crm software",
      audience: "sales teams",
      contentType: "landing",
      tone: "authoritative",
      notes: undefined,
    });
  });

  it("disables the submit button while a request is in flight", () => {
    render(<BriefForm onSubmit={vi.fn()} disabled={true} />);
    expect(screen.getByRole("button", { name: /generating brief/i })).toBeDisabled();
  });

  it("surfaces server-provided field errors", () => {
    render(
      <BriefForm onSubmit={vi.fn()} disabled={false} fieldErrors={{ keyword: "Keyword already taken" }} />,
    );
    const input = screen.getByLabelText(/target keyword/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Keyword already taken");
  });

  it("associates the error message with the input via aria-describedby", async () => {
    const user = userEvent.setup();
    render(<BriefForm onSubmit={vi.fn()} disabled={false} />);
    await user.type(screen.getByLabelText(/target keyword/i), "ab");
    await user.click(screen.getByRole("button", { name: /generate content brief/i }));

    const input = screen.getByLabelText(/target keyword/i);
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).not.toBeNull();
    expect(within(errorEl!).getByText(/at least 3 characters/i)).toBeInTheDocument();
  });
});
