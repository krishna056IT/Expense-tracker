const configuredApiUrl = import.meta.env.VITE_API_URL;
const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:8000"
  : "https://expense-tracker-z6ao.onrender.com";

export const BASE_URL = (configuredApiUrl || defaultApiUrl).replace(/\/+$/, "");

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    VERIFY_EMAIL: "/api/auth/verify-email",
    RESEND_VERIFICATION: "/api/auth/resend-verification",

    FORGOT_PASSWORD: "/api/auth/forgot-password",
    VERIFY_RESET_OTP: "/api/auth/verify-reset-otp",
    RESET_PASSWORD: "/api/auth/reset-password",

    GET_USER_INFO: "/api/auth/getUser",
    UPDATE_PROFILE: "/api/auth/profile",
  },
  DASHBOARD: {
    GET_DATA: "/api/dashboard",
    MONTHLY_COMPARISON: "/api/dashboard/monthly-comparison",
  },
  INCOME: {
    ADD_INCOME: "/api/income/add",
    GET_ALL_INCOME: "/api/income/get",
    DELETE_INCOME: (incomeId) => `/api/income/${incomeId}`,
    DOWNLOAD_INCOME: "/api/income/downloadexcel",
  },
  EXPENSE: {
    ADD_EXPENSE: "/api/expense/add",
    GET_ALL_EXPENSE: "/api/expense/get",
    DELETE_EXPENSE: (expenseId) => `/api/expense/${expenseId}`,
    DOWNLOAD_EXPENSE: "/api/expense/downloadexcel",
  },
   CSV: {
    IMPORT: "/api/csv/import",
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/auth/upload-image",
  },
  OCR: {
  ANALYZE: "/api/ocr/analyze",
},
};

