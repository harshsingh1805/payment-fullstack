// components/Appbar.jsx
import { SignOutMenu } from "./SignOutMenu";

export const Appbar = () => {
    return (
        <div className="shadow-lg h-16 flex justify-between items-center px-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white sticky top-0 z-50 rounded-b-2xl">
            <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md mr-2">
                    <span className="text-2xl text-blue-600 font-bold">₹</span>
                </div>
                <span className="text-xl font-extrabold tracking-tight drop-shadow-sm">PayTM App</span>
            </div>
            <SignOutMenu />
        </div>
    );
};
