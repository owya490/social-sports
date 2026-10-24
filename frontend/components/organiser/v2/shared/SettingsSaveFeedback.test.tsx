/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsSaveFeedback } from "./SettingsSaveFeedback";

describe("SettingsSaveFeedback", () => {
  it("announces Saving and Saved with neutral styling and reduced-motion support", () => {
    const { rerender } = render(<SettingsSaveFeedback status="saving" onRetry={() => {}} />);
    expect(screen.getByRole("status").textContent).toBe("Saving changes…");
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
    expect(screen.getByRole("status").querySelector("[aria-hidden]")?.className).toContain("motion-reduce:animate-none");

    rerender(<SettingsSaveFeedback status="saved" onRetry={() => {}} />);
    expect(screen.getByRole("status").textContent).toBe("Saved");
    expect(screen.getByText("Saved").className).toContain("text-foreground");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("announces the failure explanation and offers a keyboard Retry with a mobile touch target", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<SettingsSaveFeedback status="error" errorMessage="Connect Stripe, then try again." onRetry={onRetry} />);
    expect(screen.getByRole("alert").getAttribute("aria-live")).toBe("assertive");
    expect(screen.getByRole("alert").textContent).toContain("Connect Stripe, then try again.");
    const retry = screen.getByRole("button", { name: "Retry" });
    expect(retry.className).toContain("min-h-[44px]");
    expect(retry.parentElement?.className).toContain("flex-wrap");
    await user.tab();
    expect(document.activeElement).toBe(retry);
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("disables Retry while another owner mutation is busy and removes idle interaction", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    const { rerender } = render(<SettingsSaveFeedback status="error" retryDisabled onRetry={onRetry} />);
    const retry = screen.getByRole("button", { name: "Retry" });
    expect(retry.hasAttribute("disabled")).toBe(true);
    await user.click(retry);
    expect(onRetry).not.toHaveBeenCalled();
    rerender(<SettingsSaveFeedback status="idle" onRetry={onRetry} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
