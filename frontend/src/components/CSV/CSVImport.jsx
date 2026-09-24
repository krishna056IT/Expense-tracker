import React, { useRef, useState } from "react";
import { LuUpload } from "react-icons/lu";
import { toast } from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";

const CSVImport = ({ onImportSuccess }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const response = await axiosInstance.post(
        API_PATHS.CSV.IMPORT,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(
        `${response.data.imported} transactions imported successfully`
      );

      if (response.data.errors?.length) {
        console.warn("CSV row errors:", response.data.errors);
      }

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error("CSV import error:", error);

      toast.error(
        error.response?.data?.message || "Failed to import CSV"
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="card-btn"
      >
        <LuUpload className="text-base" />
        {loading ? "Importing..." : "Import CSV"}
      </button>
    </>
  );
};

export default CSVImport;