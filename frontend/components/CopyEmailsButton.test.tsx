import { renderToStaticMarkup } from "react-dom/server";
import CopyEmailsButton from "./CopyEmailsButton";

describe("CopyEmailsButton", () => {
  it("offers a copy action for the supplied addresses", () => {
    const markup = renderToStaticMarkup(<CopyEmailsButton emails={["ada@example.com", "grace@example.com"]} />);

    expect(markup).toContain("Copy emails");
    expect(markup).toContain('aria-label="Copy 2 emails"');
    expect(markup).not.toContain('disabled=""');
  });

  it("disables the control when there are no emails", () => {
    const markup = renderToStaticMarkup(<CopyEmailsButton compact emails={[]} />);

    expect(markup).toContain("Copy emails");
    expect(markup).toContain('aria-label="Copy 0 emails"');
    expect(markup).toContain('disabled=""');
  });

  it("uses a singular label for one email", () => {
    const markup = renderToStaticMarkup(<CopyEmailsButton emails={["ada@example.com"]} />);

    expect(markup).toContain('aria-label="Copy 1 email"');
  });
});
