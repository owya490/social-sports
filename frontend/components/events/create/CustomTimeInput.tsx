export default function CustomTimeInput({
  placeholder,
  value,
  handleChange,
}: {
  placeholder: string;
  value: string;
  handleChange: (value: any) => void;
}) {
  return (
    <div className="relative">
      <input
        required
        className="w-full h-full bg-transparent text-blue-gray-700 font-sans font-normal outline outline-0 focus:outline-0 disabled:bg-blue-gray-50 disabled:border-0 disabled:cursor-not-allowed transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 border focus:border-1 placeholder:opacity-0 focus:placeholder:opacity-100 text-sm px-3 py-3 border-blue-gray-200 focus:border-gray-900 rounded-md"
        placeholder=" "
        value={value}
        type="time"
        onChange={(e) => {
          handleChange(e.target.value);
        }}
      ></input>
      <label className="absolute -top-2 left-3 bg-white flex px-1 text-xs font-light">
        {placeholder}
      </label>
    </div>
  );
}
