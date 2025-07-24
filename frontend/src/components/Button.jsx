export function Button({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 font-semibold rounded-full text-base px-5 py-2.5 transition-all duration-200 shadow-md"
    >
      {label}
    </button>
  );
}
