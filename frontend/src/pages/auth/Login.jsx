import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/inputs/Input1";
import '../../styles/Login.css';
import '../../index.css';
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";
import { UserContext } from "../../context/UserContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resendingCode, setResendingCode] = useState(false);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      setError("Please enter a valid Email!");
      return;
    }
    if (!password) {
      setError("Please enter a valid Password!");
      return;
    }
    setError("");

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email: normalizedEmail,
        password,
      });

      const { token, user } = response.data;
      if (token) {
        localStorage.setItem("token", token);
        updateUser(user);
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(normalizedEmail);
        setResendMessage("");
      } else {
        setUnverifiedEmail("");
      }
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again");
      }
    }
  };

  const handleResendVerification = async () => {
    setResendingCode(true);
    setResendMessage("");
    try {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.RESEND_VERIFICATION,
        { email: unverifiedEmail }
      );
      setResendMessage(response.data.message);
    } catch (resendError) {
      setResendMessage(
        resendError.response?.data?.message || "Unable to resend the verification code."
      );
    } finally {
      setResendingCode(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Welcome Back</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please Enter Your Details To Login
        </p>

        <form onSubmit={handleLogin}>
          <Input
            type="text"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setUnverifiedEmail("");
              setResendMessage("");
            }}
            label="Email Address"
            placeholder="example@gmail.com"
          />

          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            placeholder="Min 8 characters"
          />

          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

          {unverifiedEmail && (
            <div className="pb-2.5">
              <button
                type="button"
                className="text-xs font-semibold text-[#0f766e] underline"
                disabled={resendingCode}
                onClick={handleResendVerification}
              >
                {resendingCode ? "Sending verification code..." : "Resend verification email"}
              </button>
              {resendMessage && (
                <p role="status" className="mt-1 text-xs text-slate-600">
                  {resendMessage}
                </p>
              )}
            </div>
          )}

          <button className="btn-primary" type="submit">
            LOGIN
          </button>

          <p className="text-[13px] text-slate-800 mt-3">
            Don't Have an Account?{" "}
            <Link className="font-medium font-primary underline" to="/signUp">
              SignUp
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
