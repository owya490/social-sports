/** @jest-environment jsdom */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { ComponentProps, ReactNode, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { EventId } from "@/interfaces/EventTypes";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { EventTicketTypeFormDialog } from "@/components/organiser/event/settings/EventTicketTypeFormDialog";
import { EventHubEditForm } from "./EventHubEditForm";
import { EventHubScheduleFields } from "./EventHubScheduleFields";

jest.mock("@/config/SportsConfig", () => ({ SPORTS_CONFIG: {} }));
jest.mock("@/services/src/maps/mapsService", () => ({
  useGoogleMapsScript: () => ({ isLoaded: false, loadError: new Error("Maps unavailable") }),
  initializeAutocomplete: jest.fn(), getLocationCoordinates: jest.fn(),
}));
jest.mock("./EventHubDescriptionEditor", () => ({ EventHubDescriptionEditor: () => null }));
jest.mock("./EventHubScheduleFields", () => ({
  EventHubFieldWithIcon: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  eventHubFieldClass: "",
  EventHubScheduleFields: function Schedule(props: ComponentProps<typeof EventHubScheduleFields>) {
    useEffect(() => {
      props.onChange({ startDate: props.eventStartDate, endDate: props.eventEndDate, registrationDeadline: props.eventRegistrationDeadline, hasBlockingWarning: false });
    }, [props.onChange, props.eventStartDate, props.eventEndDate, props.eventRegistrationDeadline]);
    return null;
  },
}));
jest.mock("next/image", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/events/create/forms/FormSelector", () => ({ FormSelector: () => null }));
jest.mock("@headlessui/react", () => ({
  Transition: ({ show, children }: { show?: boolean; children: ReactNode }) => show === false ? null : <>{children}</>,
  TransitionChild: ({ children }: { children: ReactNode }) => <>{children}</>,
  Dialog: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
  DialogPanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));
jest.mock("@material-tailwind/react", () => ({
  Input: ({ label, crossOrigin: _origin, ...props }: ComponentProps<"input"> & { label: string; crossOrigin?: string }) => <input aria-label={label} {...props} />,
}));
jest.mock("@/components/elements/HighlightButton", () => ({
  BlackHighlightButton: ({ text, ...props }: ComponentProps<"button"> & { text: string }) => <button {...props}>{text}</button>,
  InvertedHighlightButton: ({ text, ...props }: ComponentProps<"button"> & { text: string }) => <button {...props}>{text}</button>,
}));

it("keeps detail drafts editable and dirty while blocking both footer eligibility and direct submits", async () => {
  const updateData = jest.fn().mockResolvedValue(undefined);
  const onSaved = jest.fn();
  const onStateChange = jest.fn();
  const props: ComponentProps<typeof EventHubEditForm> = {
    eventId: "event-1" as EventId, eventName: "Original", eventDescription: "", eventLocation: "Existing address",
    eventSport: "", eventStartDate: Timestamp.fromMillis(1000), eventEndDate: Timestamp.fromMillis(2000),
    eventRegistrationDeadline: Timestamp.fromMillis(1000), eventEventLink: "", isActive: true,
    updateData, onSaved, onStateChange, commitBlocked: true,
  };
  const view = render(<EventHubEditForm {...props} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Event title" }), { target: { value: "Retained draft" } });
  expect(onStateChange).toHaveBeenLastCalledWith({ dirty: true, saving: false, canSave: false });
  fireEvent.submit(screen.getByRole("textbox", { name: "Event title" }).closest("form")!);
  expect(updateData).not.toHaveBeenCalled();
  expect(onSaved).not.toHaveBeenCalled();

  view.rerender(<EventHubEditForm {...props} commitBlocked={false} />);
  expect(onStateChange).toHaveBeenLastCalledWith({ dirty: true, saving: false, canSave: true });
  await act(async () => { fireEvent.submit(screen.getByRole("textbox", { name: "Event title" }).closest("form")!); });
  expect(updateData).toHaveBeenCalledWith("event-1", { name: "Retained draft", nameTokens: ["retained", "draft"] });
  expect(onSaved).toHaveBeenCalledTimes(1);
});

it("retains editable ticket drafts while blocking Save and direct form submissions", async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  const props: ComponentProps<typeof EventTicketTypeFormDialog> = {
    open: true, onClose, title: "Edit ticket type", initialValues: { name: "General", capacity: 10, priceDollars: 5, formId: null },
    user: { ...EmptyUserData, userId: "owner-1" as UserId } as UserData,
    onSave, hideFormSelector: true, commitBlocked: true,
  };
  const view = render(<EventTicketTypeFormDialog {...props} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Kept ticket draft" } });
  expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
  fireEvent.submit(screen.getByRole("textbox", { name: "Name" }).closest("form")!);
  expect(onSave).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();

  view.rerender(<EventTicketTypeFormDialog {...props} commitBlocked={false} />);
  expect((screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement).value).toBe("Kept ticket draft");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Save" })); });
  expect(onSave).toHaveBeenCalledWith({ name: "Kept ticket draft", capacity: 10, priceDollars: 5, formId: null });
});
