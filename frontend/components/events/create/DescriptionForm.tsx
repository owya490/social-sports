export function DescriptionForm() {
  return (
    <div>
      <p>Additional Event Info</p>
      <label>Name of Event</label>
      <input required type="text" />
      <label>Description</label>
      <input required type="text" />
      <label>Image</label>
      <input required type="file" />
    </div>
  );
}
