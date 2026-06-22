import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Dashboard from "./components/Dashboard";
import { User } from "./types";

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("landing");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if a session already exists on load
  useEffect(() => {
    const savedUser = localStorage.getItem("copilot_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
          setCurrentPage("dashboard");
        }
      } catch (e) {
        localStorage.removeItem("copilot_user");
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("copilot_user", JSON.stringify(user));
    setCurrentPage("dashboard");
  };

  const handleRegisterSuccess = () => {
    // Navigate straight to login layout and show the pre-configured credentials
    setCurrentPage("login");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("copilot_user");
    setCurrentPage("landing");
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      {currentPage === "landing" && (
        <LandingPage onNavigate={setCurrentPage} />
      )}
      
      {currentPage === "login" && (
        <LoginPage onNavigate={setCurrentPage} onLoginSuccess={handleLoginSuccess} />
      )}

      {currentPage === "register" && (
        <RegisterPage onNavigate={setCurrentPage} onRegisterSuccess={handleRegisterSuccess} />
      )}

      {currentPage === "dashboard" && currentUser && (
        <Dashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
