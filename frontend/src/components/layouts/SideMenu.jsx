import React, { useContext, useState } from "react";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import CharAvatar from "../cards/CharAvatar";
import Modal from "../Modal";

const SideMenu = ({ activeMenu, onNavigate }) => {
  const { user, clearUser } = useContext(UserContext);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const navigate = useNavigate();

  const handleClick = (route) => {
    if (route === "logout") {
      setConfirmSignOut(true);
    } else {
      navigate(route);
      onNavigate?.();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/login");
  };

  return (
    <>
    <div className="w-64 h-[calc(100vh-60px)] bg-[#172a27] text-white p-5 sticky top-[60px] z-20">
      <div className="flex items-center gap-3 mt-3 mb-8 pb-6 border-b border-white/10">
        {user?.profilePicUrl ? (
          <img
            src={user?.profilePicUrl || ""}
            alt="Profile Image"
            className="w-12 h-12 bg-slate-400 rounded-2xl object-cover"
          />
        ) : (
          <CharAvatar
            fullName={user?.fullName}
            width="w-12"
            height="h-12"
            style="text-lg"
          />
        )}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/45 font-bold">Signed in as</p>
          <h5 className="text-white font-semibold leading-6 truncate">{user?.fullName || ""}</h5>
        </div>
      </div>

      {SIDE_MENU_DATA.map((item, index) => (
        <button
          key={`menu_${index}`}
          className={`w-full flex items-center gap-3 text-[14px] font-semibold ${
            activeMenu == item.label ? "text-[#172a27] bg-[#d3f1e4]" : "text-white/60 hover:text-white hover:bg-white/10"
          } py-3 px-4 rounded-xl mb-2 transition-colors`}
          onClick={() => handleClick(item.path)}
        >
          <item.icon className="text-xl" />
          {item.label}
        </button>
      ))}
    </div>
    <Modal
      isOpen={confirmSignOut}
      onClose={() => setConfirmSignOut(false)}
      title="Sign Out"
    >
      <p className="text-sm text-gray-600">Are you sure you want to sign out?</p>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="add-btn"
          onClick={() => setConfirmSignOut(false)}
        >
          Cancel
        </button>
        <button type="button" className="add-btn add-btn-fill" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </Modal>
    </>
  );
};
export default SideMenu;
