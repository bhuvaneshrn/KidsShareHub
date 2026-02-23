// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";

// Pages
import Login       from "./pages/Login";
import Signup      from "./pages/Signup";
import Dashboard   from "./pages/Dashboard";
import AddItem     from "./pages/AddItem";
import MyActivity  from "./pages/MyActivity";
import TurfBooking from "./pages/TurfBooking"; // ← NEW

import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/add-item"     element={<PrivateRoute><AddItem /></PrivateRoute>} />
          <Route path="/my-activity"  element={<PrivateRoute><MyActivity /></PrivateRoute>} />
          <Route path="/turf-booking" element={<PrivateRoute><TurfBooking /></PrivateRoute>} /> {/* ← NEW */}

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}