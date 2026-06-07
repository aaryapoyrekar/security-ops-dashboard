import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  
  if (!token) return <Navigate to="/login" />;

  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.clear();
      return <Navigate to="/login" />;
    }
  } catch {
    localStorage.clear();
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;