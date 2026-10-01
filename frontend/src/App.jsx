//import React, { useState } from "react";
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Home from "./pages/Dashboard/Home";
import Income from "./pages/Dashboard/Income";
import Expense from "./pages/Dashboard/Expense";
import MonthlyComparison from "./pages/Dashboard/MonthlyComparison";
import Settings from "./pages/Dashboard/Settings";
import UserProvider from "./context/UserContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <UserProvider>
      <div>
        <Router>
          <AuthNavigationHandler />
          <Routes>
            <Route path="/" element={<Root />} />
            <Route path="/login" exact element={<Login />} />
            <Route path="/signUp" exact element={<SignUp />} />
            <Route path="/dashboard" exact element={<Home />} />
            <Route path="/income" exact element={<Income />} />
            <Route path="/expense" exact element={<Expense />} />
            <Route path="/monthly-comparison" element={<MonthlyComparison />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Router>
      </div>

      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "13px",
          },
        }}
      />
    </UserProvider>
  );
}

export default App;

const Root = () => {
  const isAuthenticated = localStorage.getItem("token");

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

const AuthNavigationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => navigate("/login", { replace: true });
    window.addEventListener("moneymate:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("moneymate:unauthorized", handleUnauthorized);
    };
  }, [navigate]);

  return null;
};
