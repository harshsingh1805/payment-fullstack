import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { BACKEND_URL } from "../config";

export const SendMoney = () => {
    const [searchParams] = useSearchParams();
    const [amount, setAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const id = searchParams.get("id");
    const name = searchParams.get("name");

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 animate-fadein">
            <div className="flex flex-col justify-center items-center w-full">
                <div className="border h-min text-card-foreground max-w-md p-6 space-y-8 w-96 bg-white shadow-2xl rounded-3xl transition-transform duration-300 hover:scale-105 animate-slideup">
                    {/* Logo/Icon Placeholder */}
                    <div className="flex justify-center mb-2">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shadow-md">
                            <span className="text-2xl text-blue-600 font-bold">₹</span>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-1.5 p-2">
                        <h2 className="text-3xl font-bold text-center text-blue-700">Send Money</h2>
                    </div>
                    <div className="p-2">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-2xl text-white font-bold">{name ? name[0] : "?"}</span>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-700">{name}</h3>
                        </div>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-blue-700" htmlFor="amount">
                                    Amount (in Rs)
                                </label>
                                <input
                                    onChange={(e) => setAmount(e.target.value)}
                                    value={amount}
                                    type="number"
                                    className="flex h-10 w-full rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-150 text-gray-800 shadow-sm"
                                    id="amount"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await axios.post(`${BACKEND_URL}/api/v1/account/transfer`, {
                                            amount,
                                            to: id
                                        }, {
                                            headers: {
                                                Authorization: `Bearer ${localStorage.getItem("token")}`
                                            }
                                        });
                                        alert("Transfer successful");
                                        window.location.href = "/dashboard";
                                    } catch (error) {
                                        alert("Transfer failed");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="justify-center rounded-full text-sm font-semibold ring-offset-background transition-colors h-10 px-4 py-2 w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200"
                                disabled={loading}
                            >
                                {loading ? "Transferring..." : "Initiate Transfer"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Animations (add to global CSS or Tailwind config if needed):
// .animate-fadein { animation: fadein 0.7s; }
// .animate-slideup { animation: slideup 0.7s; }
// @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slideup { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
