import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/inputs/Input1";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      setError("Please enter a valid Email!");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.FORGOT_PASSWORD,
        { email: normalizedEmail }
      );

      setMessage(response.data.message);
      setStep(2);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to send reset code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.VERIFY_RESET_OTP,
        {
          email: email.trim().toLowerCase(),
          code,
        }
      );

      setMessage(response.data.message);
      setStep(3);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invalid verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.RESET_PASSWORD,
        {
          email: email.trim().toLowerCase(),
          newPassword,
        }
      );

      setMessage(response.data.message);
      setStep(4);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        {step === 1 && (
          <>
            <h3 className="text-xl font-semibold text-black">
              Forgot Password?
            </h3>

            <p className="text-xs text-slate-700 mt-[5px] mb-6">
              Enter your email address and we'll send you a verification code.
            </p>

            <form onSubmit={handleSendCode}>
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Email Address"
                placeholder="example@gmail.com"
              />

              {error && (
                <p className="text-red-500 text-xs pb-2.5">{error}</p>
              )}

              {message && (
                <p className="text-green-600 text-xs pb-2.5">{message}</p>
              )}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "SENDING..." : "SEND CODE"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-xl font-semibold text-black">
              Verify Code
            </h3>

            <p className="text-xs text-slate-700 mt-[5px] mb-6">
              Enter the 6-digit code sent to your email.
            </p>

            <form onSubmit={handleVerifyCode}>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                label="Verification Code"
                placeholder="Enter 6-digit code"
              />

              {error && (
                <p className="text-red-500 text-xs pb-2.5">{error}</p>
              )}

              {message && (
                <p className="text-green-600 text-xs pb-2.5">{message}</p>
              )}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "VERIFYING..." : "VERIFY CODE"}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="text-xl font-semibold text-black">
              Reset Password
            </h3>

            <p className="text-xs text-slate-700 mt-[5px] mb-6">
              Enter your new password.
            </p>

            <form onSubmit={handleResetPassword}>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                label="New Password"
                placeholder="Min 8 characters"
              />

              {error && (
                <p className="text-red-500 text-xs pb-2.5">{error}</p>
              )}

              {message && (
                <p className="text-green-600 text-xs pb-2.5">{message}</p>
              )}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "RESETTING..." : "RESET PASSWORD"}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="text-xl font-semibold text-black">
              Password Reset Successful
            </h3>

            <p className="text-xs text-slate-700 mt-[5px] mb-6">
              Your password has been changed successfully.
            </p>

            <Link to="/login">
              <button className="btn-primary w-full" type="button">
                GO TO LOGIN
              </button>
            </Link>
          </>
        )}

        {step !== 4 && (
          <p className="text-[13px] text-slate-800 mt-3">
            Remember your password?{" "}
            <Link
              className="font-medium font-primary underline"
              to="/login"
            >
              Login
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;