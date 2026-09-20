import { renderToStaticMarkup } from "react-dom/server";
import { EventHubSavingIndicator } from "./EventHubStage";

describe("EventHubSavingIndicator", () => {
  it("stays outside document flow while saving", () => {
    const markup = renderToStaticMarkup(<EventHubSavingIndicator saving />);

    expect(markup).toContain("fixed");
    expect(markup).toContain("Saving changes…");
    expect(markup).toContain("opacity-100");
  });

  it("keeps the fixed status region mounted when idle", () => {
    const markup = renderToStaticMarkup(<EventHubSavingIndicator saving={false} />);

    expect(markup).toContain("fixed");
    expect(markup).toContain("opacity-0");
    expect(markup).not.toContain("Saving changes…");
  });
});
