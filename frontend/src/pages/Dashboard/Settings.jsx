import { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/UserContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";

const Settings = () => {
  useUserAuth();
  const { user, updateUser } = useContext(UserContext);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user?.fullName]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = fullName.trim();

    setSuccessMessage("");
    setErrorMessage("");

    if (!trimmedName) {
      setErrorMessage("Full name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {
        fullName: trimmedName,
      });
      updateUser({ ...user, ...data });
      setFullName(data.fullName);
      setSuccessMessage("Your profile has been updated.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to update your profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Settings">
      <section className="max-w-3xl mx-auto py-6 sm:py-8">
        <header className="mb-7">
          <h1 className="text-2xl font-bold text-[#172a27]">Settings</h1>
          <p className="text-sm text-[#78908a] mt-1">Manage your profile information.</p>
        </header>

        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-7 shadow-sm">
          <h2 className="text-lg font-semibold text-[#172a27] mb-5">Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
              />
            </div>

            {successMessage && (
              <p role="status" className="text-sm text-emerald-700">{successMessage}</p>
            )}
            {errorMessage && (
              <p role="alert" className="text-sm text-red-600">{errorMessage}</p>
            )}

            <button type="submit" className="add-btn add-btn-fill" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default Settings;