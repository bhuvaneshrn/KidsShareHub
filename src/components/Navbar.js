
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      {userProfile?.role === "Admin" && (
        <div className="admin-banner">
          🛡️ Admin Mode Active — You can delete any listing and manage turf bookings
        </div>
      )}

      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">
          Kid<span>Share</span> Hub
        </Link>

        {currentUser && (
          <ul className="navbar-links">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                🏠 Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/turf-booking" className={({ isActive }) => isActive ? "active" : ""}>
                🏟️ Turf
              </NavLink>
            </li>
            <li>
              <NavLink to="/add-item" className={({ isActive }) => isActive ? "active" : ""}>
                ➕ Add Item
              </NavLink>
            </li>
            <li>
              <NavLink to="/my-activity" className={({ isActive }) => isActive ? "active" : ""}>
                📋 My Activity
              </NavLink>
            </li>
          </ul>
        )}

        {currentUser && (
          <div className="navbar-user">
            <span>
              👤 {userProfile?.name || currentUser.email}
              {userProfile?.role === "Admin" && (
                <span style={{
                  marginLeft: "6px", background: "#7c3aed", color: "white",
                  borderRadius: "6px", fontSize: "0.7rem", padding: "1px 6px", fontWeight: 700,
                }}>
                  ADMIN
                </span>
              )}
            </span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </nav>
    </>
  );
}