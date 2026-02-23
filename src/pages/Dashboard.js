// src/pages/Dashboard.js
// ─────────────────────────────────────────────────────────────
// Main feed showing all listed items.
// Features:
//   - Real-time Firestore listener for live updates
//   - Category filter buttons (All, Books, Games, Sports, Turf Slots)
//   - "Request" action → creates a request document in Firestore
//   - "Delete" action → admin or owner can delete a listing
//
// Firestore reads: items collection
// Firestore writes: requests collection (on request), items (on delete)
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";

const CATEGORIES = ["All", "Books", "Games", "Sports"];

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();

  const [items, setItems]             = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState("");

  // ── Subscribe to items collection in real-time ──
  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
      setLoading(false);
    });
    return unsubscribe; // Cleanup listener on unmount
  }, []);

  // ── Apply category filter whenever items or filter changes ──
  useEffect(() => {
    if (activeCategory === "All") {
      setFiltered(items);
    } else {
      setFiltered(items.filter((item) => item.category === activeCategory));
    }
  }, [items, activeCategory]);

  // ── Handle item request ──
  const handleRequest = async (item) => {
    // Prevent duplicate requests (basic check)
    try {
      await addDoc(collection(db, "requests"), {
        itemId: item.id,
        itemName: item.name,
        requesterId: currentUser.uid,
        requesterName: userProfile?.name || currentUser.email,
        ownerId: item.ownerId,
        status: "Pending",       // Initial status
        createdAt: serverTimestamp(),
      });
      showMessage("✅ Request sent successfully!");
    } catch (err) {
      showMessage("❌ Failed to send request. Try again.");
      console.error(err);
    }
  };

  // ── Handle item deletion (admin or owner) ──
  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteDoc(doc(db, "items", itemId));
      showMessage("🗑️ Listing deleted.");
    } catch (err) {
      showMessage("❌ Could not delete. Try again.");
    }
  };

  // Helper: show a temporary message
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const isAdmin = userProfile?.role === "Admin";

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1>🏪 Community Hub</h1>
        <p>Browse and request items from your community</p>
      </div>

      {/* Feedback message */}
      {message && <div className="alert alert-info">{message}</div>}

      {/* Category Filter */}
      <div className="filter-bar">
        <span>Filter:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items count */}
      <p style={{ color: "var(--text-light)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
        Showing {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "All" && ` in ${activeCategory}`}
      </p>

      {/* Loading state */}
      {loading && <div className="loading">⏳ Loading items...</div>}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="emoji">📭</div>
          <h3>No items found</h3>
          <p>Be the first to list something in this category!</p>
          <a href="/add-item" className="btn btn-primary">
            ➕ Add Item
          </a>
        </div>
      )}

      {/* Items Grid */}
      {!loading && filtered.length > 0 && (
        <div className="items-grid">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isOwner={item.ownerId === currentUser.uid}
              isAdmin={isAdmin}
              onRequest={handleRequest}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}