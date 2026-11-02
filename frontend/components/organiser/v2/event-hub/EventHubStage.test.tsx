import { renderToStaticMarkup } from "react-dom/server";
import { EventHubSavingIndicator, EventHubSettingTile } from "./EventHubStage";

describe("EventHubSettingTile", () => {
  it("disables a locked tile while preserving its stored switch value", () => {
    const markup = renderToStaticMarkup(
      <EventHubSettingTile title="Bookings" icon={null} checked locked onChange={() => {}} />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain("Locked");
  });

  it("keeps a temporary save lock separate from a permanent availability lock", () => {
    const markup = renderToStaticMarkup(
      <EventHubSettingTile title="Bookings" icon={null} checked disabled onChange={() => {}} />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).not.toContain("Locked");
  });
});

describe("EventHubSavingIndicator", () => {
  it("stays outside document flow while saving", () => {
    const markup = renderToStaticMarkup(<EventHubSavingIndicator status="saving" onRetry={() => {}} />);

    expect(markup).toContain("fixed");
    expect(markup).toContain("Saving changes…");
    expect(markup).toContain("opacity-100");
    expect(markup).toContain("safe-area-inset-bottom");
    expect(markup).toContain("safe-area-inset-right");
    expect(markup).toContain("animate-spin");
    expect(markup).toContain("motion-reduce:animate-none");
    expect(markup).not.toContain("Retry");
  });

  it("keeps the fixed status region mounted when idle", () => {
    const markup = renderToStaticMarkup(<EventHubSavingIndicator status="idle" onRetry={() => {}} />);

    expect(markup).toContain("fixed");
    expect(markup).toContain("opacity-0");
    expect(markup).not.toContain("Saving changes…");
    expect(markup).not.toContain("animate-spin");
    expect(markup).not.toContain("Retry");
  });

  it("shows a persistent retry action when saving fails", () => {
    const markup = renderToStaticMarkup(<EventHubSavingIndicator status="error" onRetry={() => {}} />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Couldn’t save changes.");
    expect(markup).toContain("Retry");
    expect(markup).toContain('class="pointer-events-none fixed');
    expect(markup).toContain('class="pointer-events-auto inline-flex');
    expect(markup).toContain("min-h-[44px]");
    expect(markup).toContain("flex-wrap");
    expect(markup).not.toContain("animate-spin");
  });
});
