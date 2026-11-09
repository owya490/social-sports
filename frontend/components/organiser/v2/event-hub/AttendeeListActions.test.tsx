import { renderToStaticMarkup } from "react-dom/server";
import { AttendeeListActions } from "./AttendeeListActions";

const headers = [{ label: "Email", key: "Email" }];

describe("AttendeeListActions", () => {
  it("keeps labeled export buttons on larger screens and an actions menu on mobile", () => {
    const markup = renderToStaticMarkup(
      <AttendeeListActions
        emails={["ada@example.com", "grace@example.com"]}
        csvData={[{ Email: "ada@example.com" }]}
        csvHeaders={headers}
        csvFilename="Attendees_event.csv"
      />
    );

    expect(markup).toContain("hidden items-center gap-1.5 sm:flex");
    expect(markup).toContain("Copy emails");
    expect(markup).toContain(">CSV<");
    expect(markup).toContain('aria-label="Export as CSV"');
    expect(markup).toContain('class="relative shrink-0 sm:hidden"');
    expect(markup).toContain('aria-label="Attendee actions"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-label="Copy 2 emails"');
    expect(markup).toContain('download="Attendees_event.csv"');
  });

  it("disables copy when the registration list has no emails", () => {
    const markup = renderToStaticMarkup(
      <AttendeeListActions emails={[]} csvData={[]} csvHeaders={headers} csvFilename="Attendees_event.csv" />
    );

    expect(markup).toContain('aria-label="Copy 0 emails"');
    expect(markup).toContain('disabled=""');
  });
});
