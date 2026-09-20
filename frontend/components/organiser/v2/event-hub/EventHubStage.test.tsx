import { renderToStaticMarkup } from "react-dom/server";
import { EventHubSavingIndicator } from "./EventHubStage";

describe("EventHubSavingIndicator", () => {
  it("stays outside document flow while saving", () => {
    const markup = renderToStaticMarkup(<EventHubSavingIndicator status="saving" onRetry={() => {}} />);

    expect(markup).toContain("fixed");
    expect(markup).toContain("Saving changes…");
    expect(markup).toContain("opacity-100");
    expect(markup).toContain("safe-area-inset-bottom");
    expect(markup).toContain("safe-area-inset-right");
    expect(markup).toContain("animate-spin");
    expect(markup).not.toContain("Retry");
  });

  it("keeps the fixed status region mounted when idle", () => {
    const markup = renderToStaticMarkup(<EventHubSavingIndicator status="idle" onRetry={() => {}} />);

    expect(markup).toContain("fixed");
    expect(markup).toContain("opacity-0");
    expect(markup).not.toContain("Saving changes…");
    expect(markup).not.toContain("animate-spin");
  });

  it("shows a persistent retry action when saving fails", () => {
    const markup = renderToStaticMarkup(<EventHubSavingIndicator status="error" onRetry={() => {}} />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Couldn’t save changes.");
    expect(markup).toContain("Retry");
    expect(markup).toContain('class="pointer-events-none fixed');
    expect(markup).toContain('class="pointer-events-auto inline-flex');
    expect(markup).not.toContain("animate-spin");
  });
});
