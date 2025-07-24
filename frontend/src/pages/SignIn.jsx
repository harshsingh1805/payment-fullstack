import { BottomWarning } from "../components/BottomWarning";
import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { InputBox } from "../components/InputBox";
import { SubHeading } from "../components/SubHeading";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { BACKEND_URL } from "../config";

export const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get(`${BACKEND_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.user) {
          navigate("/dashboard");
        }
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 animate-fadein">
      <div className="flex flex-col justify-center items-center w-full">
        <div className="rounded-3xl bg-white w-96 text-center p-6 shadow-2xl shadow-blue-100 transition-transform duration-300 hover:scale-105 animate-slideup">
          {/* Logo/Icon Placeholder */}
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shadow-md">
              <span className="text-2xl text-blue-600 font-bold">₹</span>
            </div>
          </div>
          <Heading label={"Sign in"} />
          <SubHeading label={"Enter your credentials to access your account"} />
          <InputBox placeholder="harsh@gmail.com" label={"Email"} onChange={(e) => setEmail(e.target.value)} />
          <InputBox placeholder="123456" label={"Password"} onChange={(e) => setPassword(e.target.value)} />
          <div className="pt-4">
            <Button label={loading ? "Signing in..." : "Sign in"} onClick={async () => {
              setLoading(true);
              try {
                const response = await axios.post(`${BACKEND_URL}/api/v1/user/signin`, {
                  username: email,
                  password: password
                });
                const token = response.data.token;
                localStorage.setItem("token", token);
                const decoded = jwtDecode(token);
                localStorage.setItem("userId", decoded.userid);
                window.location.href = "/dashboard";
              } catch (error) {
                alert("Invalid credentials or server error");
              } finally {
                setLoading(false);
              }
            }} />
          </div>
          <BottomWarning label={"Don't have an account?"} buttonText={"Sign up"} to={"/signup"} />
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
