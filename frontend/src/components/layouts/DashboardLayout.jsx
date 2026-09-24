import React, { useContext } from "react";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import { UserContext } from "../../context/UserContext";

const DashboardLayout = ({children, activeMenu}) => {

    const user = useContext(UserContext);
    return(
        <div className="min-h-screen bg-[#f6f8f5]">
            <Navbar activeMenu={activeMenu} />
            {user && (
                <div className="flex max-w-[1600px] mx-auto">
                    <div className="hidden lg:block shrink-0">
                        <SideMenu activeMenu={activeMenu} />
                    </div>
                <main className="grow min-w-0 px-4 sm:px-6 lg:px-8">{children}</main>
                </div>
            )}         
        </div>
    )
}
export default DashboardLayout;