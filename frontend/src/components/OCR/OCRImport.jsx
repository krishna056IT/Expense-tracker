import React, { useRef, useState } from "react";
import { LuUpload } from "react-icons/lu";
import { toast } from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";

const OCRImport = ({ onOCRSuccess }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Check image type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }

    // Optional 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);

    try {
      const response = await axiosInstance.post(
        API_PATHS.OCR.ANALYZE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("OCR response:", response.data);

      toast.success("Image processed successfully");

      // Send OCR result to parent component
      if (onOCRSuccess) {
        onOCRSuccess(response.data);
      }
    } catch (error) {
      console.error("OCR error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to process image"
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
        accept="image/*"
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

        {loading ? "Processing..." : "Import Image"}
      </button>
    </>
  );
};

export default OCRImport;