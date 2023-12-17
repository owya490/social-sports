export function BasicForm() {
  return (
    <div>
      <p>Basic Event Info</p>
      <label>Date</label>
      <input autoFocus required type="date" />
      <label>Time</label>
      <input required type="time" />
      <label>Location</label>
      <input required type="text" />
      <label>Cost per person</label>
      <input required type="number" min={0} />
      <label>Maximum amount of people</label>
      <input required type="number" min={1} />
    </div>
  );
}
