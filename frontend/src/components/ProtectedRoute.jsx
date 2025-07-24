
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";


export const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");


    if (!token) {
        window.alert("No token found, redirecting to sign in");
        return <Navigate to="/signin" />;
    }

    try {
        jwtDecode(token); // Throws if token is invalid
        return children;
    } catch (e) {
        window.alert("Token expired or invalid, redirecting to sign in");
        localStorage.removeItem("token");
        return <Navigate to="/signin" />;
    }
};

