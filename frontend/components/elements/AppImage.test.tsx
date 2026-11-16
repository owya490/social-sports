import { renderToStaticMarkup } from "react-dom/server";
import AppImage, { shouldOptimiseImage } from "./AppImage";

const FIREBASE_URL =
  "https://firebasestorage.googleapis.com/v0/b/socialsportsprod.appspot.com/o/users%2Fabc%2FeventThumbnails%2Fimg?alt=media&token=t";
const GOOGLE_PHOTO_URL = "https://lh3.googleusercontent.com/a/photo=s96-c";

describe("shouldOptimiseImage", () => {
  it.each([
    ["Firebase Storage URL", FIREBASE_URL, true],
    ["local public path", "/images/logo.png", true],
    ["static import", { src: "/_next/static/media/logo.png", width: 10, height: 10 }, true],
    ["social login profile photo", GOOGLE_PHOTO_URL, false],
    ["third-party CDN image", "https://d1n9ior3u0lhlo.cloudfront.net/australia--sydney.webp", false],
    ["protocol-relative URL", "//example.com/image.png", false],
    ["unparseable string", "not a url", false],
  ])("%s -> %s", (_label, src, expected) => {
    expect(shouldOptimiseImage(src)).toBe(expected);
  });
});

describe("AppImage", () => {
  it("serves Firebase Storage images through the Next image optimiser", () => {
    const markup = renderToStaticMarkup(<AppImage src={FIREBASE_URL} alt="" width={32} height={32} />);

    expect(markup).toContain("/_next/image?url=");
    expect(markup).toContain(encodeURIComponent(FIREBASE_URL));
  });

  it("loads non-allow-listed hosts directly instead of through the optimiser", () => {
    const markup = renderToStaticMarkup(<AppImage src={GOOGLE_PHOTO_URL} alt="" width={32} height={32} />);

    expect(markup).not.toContain("/_next/image");
    expect(markup).toContain(`src="${GOOGLE_PHOTO_URL}"`);
  });

  it("respects an explicit unoptimized prop", () => {
    const markup = renderToStaticMarkup(<AppImage src={FIREBASE_URL} alt="" width={32} height={32} unoptimized />);

    expect(markup).not.toContain("/_next/image");
  });

  it("defaults CSS-sized images to responsive widths instead of a 32px variant", () => {
    const markup = renderToStaticMarkup(
      <AppImage src={FIREBASE_URL} alt="" width={0} height={0} className="w-full h-auto" />
    );

    expect(markup).toContain('sizes="100vw"');
    expect(markup).toContain("w=640");
    expect(markup).toContain("w=1920");
  });

  it("keeps caller-provided sizes", () => {
    const markup = renderToStaticMarkup(<AppImage src={FIREBASE_URL} alt="" width={0} height={0} sizes="40px" />);

    expect(markup).toContain('sizes="40px"');
    expect(markup).not.toContain('sizes="100vw"');
  });
});
