import React, { useState } from "react";
import SideMenu from "./SideMenu";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { LuCircleDollarSign } from "react-icons/lu";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  return (
    <div className="flex items-center gap-4 bg-[#172a27] text-white py-3.5 px-4 sm:px-7 sticky top-0 z-30 shadow-[0_8px_24px_rgba(23,42,39,0.12)]">
      <button
        aria-label={openSideMenu ? "Close navigation" : "Open navigation"}
        className="block lg:hidden text-white/80 hover:text-white"
        onClick={() => {
          setOpenSideMenu(!openSideMenu);
        }}
      >
        {openSideMenu ? (
          <HiOutlineX className="text-2xl"/>
        ) : (
          <HiOutlineMenu className="text-2xl"/>
        )}
      </button>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#d3f1e4] text-[#0f766e]">
          <LuCircleDollarSign className="text-xl" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">MoneyMate</h2>
      </div>
      <span className="hidden sm:block text-xs text-white/55 border-l border-white/15 pl-4">Personal finance, made clear</span>

      {openSideMenu && (
        <div className="fixed inset-0 top-[60px] -ml-4 bg-[#172a27] lg:hidden">
          <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </div>
  );
};
export default Navbar;
