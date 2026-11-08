import {
  isArchivedRecurringEventsPath,
  ORGANISER_MAIN_NAV,
  resolveOrganiserBreadcrumbs,
} from "./organiserNav";

describe("recurring events navigation", () => {
  const recurring = ORGANISER_MAIN_NAV.find((item) => item.label === "Recurring events");
  const archived = recurring?.children?.find((item) => item.label === "Archived");

  it("gives recurring events an Archived page under the same group", () => {
    expect(recurring?.href).toBe("/organiser/v2/event/recurring-events");
    expect(archived?.href).toBe("/organiser/v2/event/recurring-events/archived");
    expect(recurring?.isActive("/organiser/v2/event/recurring-events")).toBe(true);
    expect(recurring?.isActive("/organiser/v2/event/recurring-events/template-1")).toBe(true);
    expect(recurring?.isActive("/organiser/v2/event/recurring-events/archived")).toBe(false);
    expect(archived?.isActive("/organiser/v2/event/recurring-events/archived")).toBe(true);
    expect(archived?.isActive("/organiser/v2/event/recurring-events/template-1")).toBe(false);
    expect(isArchivedRecurringEventsPath("/organiser/v2/event/recurring-events/archived-template")).toBe(
      false
    );
  });

  it("breadcrumbs the archived list separately from a template", () => {
    expect(
      resolveOrganiserBreadcrumbs("/organiser/v2/event/recurring-events/archived").map((crumb) => crumb.label)
    ).toEqual(["Recurring events", "Archived"]);
    expect(
      resolveOrganiserBreadcrumbs("/organiser/v2/event/recurring-events/template-1", "Friday social").map(
        (crumb) => crumb.label
      )
    ).toEqual(["Recurring events", "Friday social"]);
  });
});
