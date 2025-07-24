import { BottomWarning } from "../components/BottomWarning"
import { Button } from "../components/Button"
import { Heading } from "../components/Heading"
import { InputBox } from "../components/InputBox"
import { SubHeading } from "../components/SubHeading"
import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { BACKEND_URL } from "../config";

export const Signup = () => {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
          <Heading label={"Sign up"} />
          <SubHeading label={"Enter your information to create an account"} />
          <InputBox onChange={e => setFirstName(e.target.value)} placeholder="John" label={"First Name"} />
          <InputBox onChange={e => setLastName(e.target.value)} placeholder="Doe" label={"Last Name"} />
          <InputBox onChange={e => setEmail(e.target.value)} placeholder="harsh@gmail.com" label={"Email"} />
          <InputBox onChange={e => setPassword(e.target.value)} placeholder="123456" label={"Password"} />
          <div className="pt-4">
            <Button onClick={async () => {
              setLoading(true);
              try {
                const response = await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
                  firstName: firstName,
                  lastName: lastName,
                  username: email,
                  password: password
                })
                localStorage.setItem("token", response.data.token)
                navigate("/dashboard")
              } catch (e) {
                alert("Signup failed. Please try again.");
              } finally {
                setLoading(false);
              }
            }} label={loading ? "Signing up..." : "Sign up"} />
          </div>
          <BottomWarning label={"Already have an account?"} buttonText={"Sign in"} to={"/signin"} />
        </div>
      </div>
    </div>
  )
}

// Animations (add to global CSS or Tailwind config if needed):
// .animate-fadein { animation: fadein 0.7s; }
// .animate-slideup { animation: slideup 0.7s; }
// @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slideup { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }