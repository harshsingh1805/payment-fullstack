export function InputBox({ label, placeholder, onChange }) {
  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-left py-2 text-blue-700">{label}</div>
      <input
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-blue-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 bg-blue-50 text-gray-800 shadow-sm"
      />
    </div>
  );
}
