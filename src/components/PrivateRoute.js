
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  // If not authenticated, send to login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}