/**
 * @jest-environment jsdom
 */
import { FulfilmentEntityType, FulfilmentSessionId } from "@/interfaces/FulfilmentTypes";
import { FULFILMENT_SESSION_EXPIRY_MILLIS } from "@/services/src/fulfilment/fulfilmentConstants";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import FulfilmentEntityPage from "./FulfilmentEntityPage";

jest.mock("next/navigation", () => {
  const router = { push: jest.fn() };
  return { useRouter: () => router };
});

jest.mock("@material-tailwind/react", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  Button: ({
    children,
    onClick,
    type,
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
  }) => (
    <button type={type ?? "button"} onClick={onClick}>
      {children}
    </button>
  ),
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function sessionWithRemainingMs(remainingMs: number) {
  return {
    fulfilmentEntityTypes: [FulfilmentEntityType.FORMS],
    currentEntityIndex: 0,
    fulfilmentSessionStartTime: {
      toMillis: () => Date.now() - (FULFILMENT_SESSION_EXPIRY_MILLIS - remainingMs),
    },
  };
}

describe("session timeout warning confirm", () => {
  it("closes on confirm and stays closed while time is still remaining", async () => {
    const user = userEvent.setup();

    render(
      <FulfilmentEntityPage
        fulfilmentSessionId={"session" as FulfilmentSessionId}
        fulfilmentSessionInfo={sessionWithRemainingMs(20 * 1000) as never}
      >
        <p>Checkout form</p>
      </FulfilmentEntityPage>,
    );

    expect(await screen.findByText("Session Timeout Warning")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.queryByText("Session Timeout Warning")).toBeNull();
    expect(screen.getByText("Checkout form")).toBeTruthy();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    });

    expect(screen.queryByText("Session Timeout Warning")).toBeNull();
    expect(screen.getByText("Checkout form")).toBeTruthy();
  });
});
