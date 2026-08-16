import { overlayFrameFromVisualViewport } from "./organiserV2Chrome";

describe("overlayFrameFromVisualViewport", () => {
  it("falls back to the window inner box when visualViewport is missing", () => {
    expect(
      overlayFrameFromVisualViewport(null, { innerWidth: 390, innerHeight: 844 })
    ).toEqual({ top: 0, left: 0, width: 390, height: 844 });
  });

  it("uses the visual viewport so the scrim does not cover browser chrome", () => {
    expect(
      overlayFrameFromVisualViewport(
        { offsetTop: 0, offsetLeft: 0, width: 390, height: 668 },
        { innerWidth: 390, innerHeight: 844 }
      )
    ).toEqual({ top: 0, left: 0, width: 390, height: 668 });
  });
});
