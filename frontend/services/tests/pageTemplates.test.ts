import { screenForPathname, tabScreenTemplate } from "../src/analytics/pageTemplates";

describe("screenForPathname", () => {
  it("groups static and dynamic routes", () => {
    expect(screenForPathname("/")).toEqual({ pageTemplate: "/", pageGroup: "public" });
    expect(screenForPathname("/event/abc123")).toEqual({ pageTemplate: "/event/[id]", pageGroup: "public" });
    expect(screenForPathname("/event/abc123/friday-social/")).toEqual({
      pageTemplate: "/event/[id]/[customEventLink]",
      pageGroup: "public",
    });
    expect(screenForPathname("/organiser/event/dashboard")).toEqual({
      pageTemplate: "/organiser/event/dashboard",
      pageGroup: "organiser",
    });
    expect(screenForPathname("/organiser/event/evt-1")).toEqual({
      pageTemplate: "/organiser/event/[id]",
      pageGroup: "organiser",
    });
    expect(screenForPathname("/organiser/event/recurring-events/tmpl-1")).toEqual({
      pageTemplate: "/organiser/event/recurring-events/[id]",
      pageGroup: "organiser",
    });
    expect(screenForPathname("/organiser/forms/form-1/editor")).toEqual({
      pageTemplate: "/organiser/forms/[formId]/editor",
      pageGroup: "organiser",
    });
    expect(screenForPathname("/fulfilment/session-1/entity-1")).toEqual({
      pageTemplate: "/fulfilment/[fulfilmentSessionId]/[fulfilmentEntityId]",
      pageGroup: "booking",
    });
    expect(screenForPathname("/onboarding/organiser")).toEqual({
      pageTemplate: "/onboarding/organiser",
      pageGroup: "account",
    });
    expect(screenForPathname("/event/create")).toEqual({
      pageTemplate: "/event/create",
      pageGroup: "organiser",
    });
    expect(screenForPathname("/organiser/v2/event/dashboard")).toEqual({
      pageTemplate: "/organiser/v2/event/dashboard",
      pageGroup: "organiser",
    });
    expect(screenForPathname("/organiser/v2/event/evt-1")).toEqual({
      pageTemplate: "/organiser/v2/event/[id]",
      pageGroup: "organiser",
    });
    expect(screenForPathname("/organiser/v2/forms/form-1/editor")).toEqual({
      pageTemplate: "/organiser/v2/forms/[formId]/editor",
      pageGroup: "organiser",
    });
  });

  it("builds a stable template for in-page tabs", () => {
    expect(tabScreenTemplate("/organiser/event/[id]", "Manage Attendees")).toBe(
      "/organiser/event/[id]/manage-attendees"
    );
    expect(tabScreenTemplate("/event/create", "Preview and Create")).toBe("/event/create/preview-and-create");
  });
});
