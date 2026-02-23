// src/context/AuthContext.js
// ─────────────────────────────────────────────────────────────
// Global authentication context.
// Wraps the entire app so any component can access:
//   - currentUser  → Firebase Auth user object
//   - userProfile  → Extra data from Firestore (name, role, age, etc.)
//   - loading      → Whether auth state is still being determined
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

// Create the context
const AuthContext = createContext();

// Custom hook for easy access to auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component that wraps the app
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes (login/logout)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch additional profile data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = { currentUser, userProfile, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}