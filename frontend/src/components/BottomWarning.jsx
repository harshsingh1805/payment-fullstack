import { Link } from "react-router-dom";

export function BottomWarning({ label, buttonText, to }) {
  return (
    <div className="py-2 text-sm flex justify-center">
      <div>{label}</div>
      <Link className="pl-1 text-blue-600 hover:underline font-semibold transition-colors duration-150" to={to}>
        {buttonText}
      </Link>
    </div>
  );
}
