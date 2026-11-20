import { DASHBOARD_ANNOUNCEMENTS } from "./dashboardAnnouncements";

describe("organiser dashboard announcements", () => {
  it("leads with the Pyng payments rollout", () => {
    expect(DASHBOARD_ANNOUNCEMENTS[0]).toEqual({
      id: "pay-with-pyng",
      tag: "Pyng",
      label: "Use Pyng for payments",
      description: "A $15 ticket drops from a 70¢ card surcharge to 15¢",
      href: "https://www.sportshub.net.au/blogs/features/pay-with-pyng",
      external: true,
    });
  });
});
