const configuredApiUrl = import.meta.env.VITE_API_URL;
const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:8000"
  : "https://expense-tracker-z6ao.onrender.com";

export const BASE_URL = (configuredApiUrl || defaultApiUrl).replace(/\/+$/, "");

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    GET_USER_INFO: "/api/auth/getUser",
  },
  DASHBOARD: {
    GET_DATA: "/api/dashboard",
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

