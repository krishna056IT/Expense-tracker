import React from "react";

const InfoCard = ({ icon, label, color, value }) => {
  return (
    <div className="relative overflow-hidden flex gap-4 bg-white p-5 rounded-[20px] shadow-[0_10px_30px_rgba(23,42,39,0.04)] border border-[#e6ece8]">
      <div
        className={`w-12 h-12 shrink-0 flex items-center justify-center text-[23px] text-white ${color} rounded-2xl`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h6 className="text-[11px] uppercase tracking-[0.12em] text-[#78908a] mb-1 font-bold">{label}</h6>
        <span className="text-2xl font-bold text-[#172a27]">₹{value}</span>
      </div>
      <div className="absolute -right-5 -bottom-8 w-20 h-20 rounded-full border-[10px] border-[#f0f5f1]" />
    </div>
  );
};
export default InfoCard;
