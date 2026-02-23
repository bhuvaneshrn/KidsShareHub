import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const CATEGORIES  = ["Books", "Games", "Sports", "Turf Slots"];
const CONDITIONS  = ["New", "Like New", "Good", "Fair", "Poor"];
const TYPES       = ["Sell", "Rent", "Exchange", "Free"];

export default function AddItem() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "Books",
    condition: "Good",
    type: "Sell",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  // Update form field
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      return setError("Please enter an item name.");
    }

    setLoading(true);

    try {
      // Add item document to Firestore
      await addDoc(collection(db, "items"), {
        name: form.name.trim(),
        category: form.category,
        condition: form.condition,
        type: form.type,
        imageUrl: form.imageUrl.trim() || "",
        ownerId: currentUser.uid,
        ownerName: userProfile?.name || currentUser.email,
        status: "Available",        // Always starts as Available
        createdAt: serverTimestamp(),
      });

      setSuccess("🎉 Item listed successfully!");

      // Reset form
      setForm({ name: "", category: "Books", condition: "Good", type: "Sell", imageUrl: "" });

      // Navigate to dashboard after short delay
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError("Failed to list item. Please try again.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>➕ List an Item</h1>
        <p>Share something with your community</p>
      </div>

      {/* Max width form card */}
      <div style={{ maxWidth: "560px" }}>
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Item Name */}
            <div className="form-group">
              <label htmlFor="name">Item Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g., Harry Potter Book Set"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                className="form-control"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div className="form-group">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                name="condition"
                className="form-control"
                value={form.condition}
                onChange={handleChange}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="form-group">
              <label htmlFor="type">Listing Type *</label>
              <select
                id="type"
                name="type"
                className="form-control"
                value={form.type}
                onChange={handleChange}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Optional Image URL */}
            <div className="form-group">
              <label htmlFor="imageUrl">Image URL (optional)</label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                className="form-control"
                placeholder="https://example.com/photo.jpg"
                value={form.imageUrl}
                onChange={handleChange}
              />
            </div>

            {/* Preview image if URL entered */}
            {form.imageUrl && (
              <div style={{ marginBottom: "1rem" }}>
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: "2px solid var(--border)",
                  }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? "Listing..." : "📦 List Item"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}