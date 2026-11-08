import { ImageSection } from "@/components/gallery/ImageSection";
import { EmptyUserData } from "@/interfaces/UserTypes";
import { uploadEventThumbnail } from "@/services/src/images/imageService";
import { renderToStaticMarkup } from "react-dom/server";
import { ImageForm } from "./ImageForm";

jest.mock("@/components/gallery/ImageSection", () => ({ ImageSection: jest.fn(() => null) }));
jest.mock("@/services/src/images/imageService", () => ({
  uploadEventImage: jest.fn(),
  uploadEventThumbnail: jest.fn(),
}));

describe("ImageForm upload state", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([false, true])("keeps the parent busy until an upload settles (failure: %s)", async (fails) => {
    let resolveUpload!: (url: string) => void;
    let rejectUpload!: (error: Error) => void;
    const upload = new Promise<string>((resolve, reject) => {
      resolveUpload = resolve;
      rejectUpload = reject;
    });
    jest.mocked(uploadEventThumbnail).mockReturnValue(upload);
    let finish!: () => void;
    const finished = new Promise<void>(resolve => { finish = resolve; });
    const onUploadingChange = jest.fn((uploading: boolean) => { if (!uploading) finish(); });
    const updateField = jest.fn();
    renderToStaticMarkup(<ImageForm
      user={EmptyUserData} image="original.jpg" thumbnail="original-thumb.jpg"
      eventImageUrls={[]} eventThumbnailsUrls={[]}
      setImageUrls={jest.fn()} setThumbnailUrls={jest.fn()}
      updateField={updateField} onUploadingChange={onUploadingChange}
    />);

    const logError = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      jest.mocked(ImageSection).mock.calls[0][0].onImageUploaded(new File(["photo"], "photo.png", { type: "image/png" }));
      expect(onUploadingChange.mock.calls).toEqual([[true]]);
      expect(updateField).not.toHaveBeenCalled();

      if (fails) rejectUpload(new Error("upload failed"));
      else resolveUpload("new-thumb.jpg");
      await finished;

      expect(onUploadingChange.mock.calls).toEqual([[true], [false]]);
      if (fails) expect(updateField).not.toHaveBeenCalled();
      else expect(updateField).toHaveBeenCalledWith({ thumbnail: "new-thumb.jpg" });
    } finally {
      logError.mockRestore();
    }
  });
});
