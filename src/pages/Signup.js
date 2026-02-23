import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export default function Signup() {
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    password: "",
    role: "Student",
  });

  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Update individual form fields
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate age range
    const age = parseInt(form.age);
    if (isNaN(age) || age < 7 || age > 25) {
      return setError("Age must be between 7 and 25.");
    }

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);

    try {
      // Step 1: Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // Step 2: Save extra profile data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: form.name.trim(),
        age: age,
        email: form.email,
        role: form.role,
        ratings: [],          // Array of rating numbers from other users
        createdAt: serverTimestamp(),
      });

      // Redirect to dashboard on success
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-logo">
          <h1>Kid<span>Share</span> Hub</h1>
          <p>Create your account — it's free! 🎉</p>
        </div>

        {/* Error message */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Signup form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-control"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age (7–25)</label>
            <input
              id="age"
              name="age"
              type="number"
              min="7"
              max="25"
              className="form-control"
              placeholder="Your age"
              value={form.age}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a...</label>
            <select
              id="role"
              name="role"
              className="form-control"
              value={form.role}
              onChange={handleChange}
            >
              <option value="Student">Student</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? "Creating account..." : " Sign Up"}
          </button>
        </form>

        {/* Link to login */}
        <div className="auth-divider">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--coral)", fontWeight: 700 }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}