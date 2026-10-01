import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/inputs/Input1";
import { validateEmail } from "../../utils/helper";
import ProfilePhotoSelector from "../../components/inputs/ProfilePhotoSelector";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";
import { UserContext } from "../../context/UserContext";
import uploadImage from "../../utils/uploadImage";

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resendingCode, setResendingCode] = useState(false);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    let profilePicUrl = "";

    if (!fullName) {
      setError("Please enter your name");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      setError("Please enter your email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError("");

    try {
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profilePicUrl = imgUploadRes.imageUrl || "";
      }

      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        fullName,
        email: normalizedEmail,
        password,
        profilePicUrl,
      });

      if (response.data.emailAccepted !== true) {
        setError("The verification email was not accepted. Please try again.");
        return;
      }

      setEmail(normalizedEmail);
      setVerificationPending(true);
      setVerificationMessage(response.data.message);
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again");
      }
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.VERIFY_EMAIL, {
        email: email.trim().toLowerCase(),
        code: verificationCode,
      });
      localStorage.setItem("token", response.data.token);
      updateUser(response.data.user);
      navigate("/dashboard");
    } catch (verifyError) {
      setError(
        verifyError.response?.data?.message || "Unable to verify your email. Please try again."
      );
    }
  };

  const handleResendCode = async () => {
    setResendingCode(true);
    setError("");
    try {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.RESEND_VERIFICATION,
        { email: email.trim().toLowerCase() }
      );
      setVerificationMessage(response.data.message);
    } catch (resendError) {
      setError(
        resendError.response?.data?.message || "Unable to resend the verification code."
      );
    } finally {
      setResendingCode(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[100%] h-auto md:h-full mt-10 md:mt-10 flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Create an Account</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          {verificationPending
            ? "Verify your email to finish creating your account."
            : "Join Today By entering your details."}
        </p>

        {verificationPending ? (
          <form onSubmit={handleVerifyEmail}>
            <p className="text-sm text-slate-700 mb-4">{verificationMessage}</p>
            <Input
              type="text"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              label="Email verification code"
              placeholder="6-digit code"
            />
            {error && <p className="text-red-500 text-xs py-2.5">{error}</p>}
            <button className="btn-primary" type="submit">
              Verify Email
            </button>
            <button
              className="w-full text-sm font-semibold text-[#0f766e] p-3"
              type="button"
              disabled={resendingCode}
              onClick={handleResendCode}
            >
              {resendingCode ? "Sending..." : "Resend verification code"}
            </button>
            <p className="text-[13px] text-slate-800 mt-3">
              Already have an account?{" "}
              <Link className="font-medium font-primary underline" to="/login">
                Login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                label="Full Name"
                placeholder="John Doe"
                type="text"
              />
              <Input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                label="Email Address"
                placeholder="example@gmail.com"
              />

              <div className="col-span-2">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="Password"
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

            <button className="btn-primary" type="submit">
              Sign-up
            </button>

            <p className="text-[13px] text-slate-800 mt-3">
              Already have an account?{" "}
              <Link className="font-medium font-primary underline" to="/login">
                Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default SignUp;
