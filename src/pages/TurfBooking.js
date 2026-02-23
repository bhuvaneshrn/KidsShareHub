
import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/helpers";

// ── Fixed configuration ──
const TURFS = ["Turf A", "Turf B", "Turf C"];

const SLOTS = [
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
];

// Emoji for each turf
const TURF_EMOJI = { "Turf A": "🟢", "Turf B": "🔵", "Turf C": "🟠" };

// Get today's date as YYYY-MM-DD string (for date input min value)
function todayString() {
  return new Date().toISOString().split("T")[0];
}

// Format date string nicely for display
function niceDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TurfBooking() {
  const { currentUser, userProfile } = useAuth();
  const isAdmin = userProfile?.role === "Admin";

  // ── All bookings from Firestore ──
  const [bookings, setBookings] = useState([]);

  // ── Form state ──
  const [selectedTurf, setSelectedTurf] = useState("Turf A");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [purpose, setPurpose]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [message, setMessage]           = useState({ text: "", type: "" });

  // ── Subscribe to all turf bookings in real-time ──
  useEffect(() => {
    const q = query(
      collection(db, "turfBookings"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // ── Check if a specific slot is already booked ──
  const isSlotBooked = (turf, date, slot) => {
    return bookings.some(
      (b) =>
        b.turfName === turf &&
        b.date === date &&
        b.slot === slot &&
        b.status !== "Cancelled"
    );
  };

  // ── Get booking details for a slot (to show who booked) ──
  const getBookingInfo = (turf, date, slot) => {
    return bookings.find(
      (b) =>
        b.turfName === turf &&
        b.date === date &&
        b.slot === slot &&
        b.status !== "Cancelled"
    );
  };

  // ── Handle booking submission ──
  const handleBook = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!selectedDate) return setMessage({ text: "Please select a date.", type: "error" });
    if (!selectedSlot) return setMessage({ text: "Please select a time slot.", type: "error" });
    if (!purpose.trim()) return setMessage({ text: "Please enter the purpose of booking.", type: "error" });

    // Double-check slot is still free
    if (isSlotBooked(selectedTurf, selectedDate, selectedSlot)) {
      return setMessage({ text: "This slot was just booked by someone else! Please choose another.", type: "error" });
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "turfBookings"), {
        turfName: selectedTurf,
        date: selectedDate,
        slot: selectedSlot,
        purpose: purpose.trim(),
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.email,
        status: "Confirmed",
        createdAt: serverTimestamp(),
      });

      setMessage({ text: `✅ ${selectedTurf} booked for ${selectedSlot} on ${niceDate(selectedDate)}!`, type: "success" });
      // Reset form
      setSelectedSlot("");
      setPurpose("");
    } catch (err) {
      setMessage({ text: "❌ Booking failed. Please try again.", type: "error" });
      console.error(err);
    }

    setLoading(false);
  };

  // ── Admin: cancel/delete a booking ──
  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await deleteDoc(doc(db, "turfBookings", bookingId));
      setMessage({ text: "🗑️ Booking cancelled.", type: "success" });
    } catch (err) {
      console.error(err);
    }
  };

  // ── My bookings ──
  const myBookings = bookings.filter(
    (b) => b.userId === currentUser.uid && b.status !== "Cancelled"
  );

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>🏟️ Turf Booking</h1>
        <p>Book a turf slot for your game — 3:00 PM to 6:00 PM daily</p>
      </div>

      {/* ── Feedback message ── */}
      {message.text && (
        <div className={`alert alert-${message.text.startsWith("✅") || message.text.startsWith("🗑️") ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      <div className="turf-layout">
        {/* ════════════════════════════════
            LEFT — Booking Form
            ════════════════════════════════ */}
        <div className="turf-form-section">
          <div className="card">
            <h2 style={{ marginBottom: "1.25rem", fontSize: "1.2rem" }}>
              📅 Make a Booking
            </h2>

            <form onSubmit={handleBook}>
              {/* Select Turf */}
              <div className="form-group">
                <label>Select Turf</label>
                <div className="turf-selector">
                  {TURFS.map((turf) => (
                    <button
                      key={turf}
                      type="button"
                      className={`turf-btn ${selectedTurf === turf ? "active" : ""}`}
                      onClick={() => {
                        setSelectedTurf(turf);
                        setSelectedSlot(""); // Reset slot on turf change
                      }}
                    >
                      {TURF_EMOJI[turf]} {turf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Date */}
              <div className="form-group">
                <label htmlFor="date">Select Date</label>
                <input
                  id="date"
                  type="date"
                  className="form-control"
                  min={todayString()}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(""); // Reset slot on date change
                  }}
                  required
                />
              </div>

              {/* Select Time Slot */}
              {selectedDate && (
                <div className="form-group">
                  <label>Select Time Slot</label>
                  <div className="slot-grid">
                    {SLOTS.map((slot) => {
                      const booked = isSlotBooked(selectedTurf, selectedDate, slot);
                      const bookedBy = getBookingInfo(selectedTurf, selectedDate, slot);
                      const isSelected = selectedSlot === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={booked}
                          className={`slot-btn ${booked ? "booked" : "available"} ${isSelected ? "selected" : ""}`}
                          onClick={() => !booked && setSelectedSlot(slot)}
                          title={booked ? `Booked by ${bookedBy?.userName}` : "Available"}
                        >
                          <span className="slot-time">{slot}</span>
                          <span className="slot-status">
                            {booked ? `🔴 Booked by ${bookedBy?.userName}` : "🟢 Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div className="form-group">
                <label htmlFor="purpose">Purpose of Booking</label>
                <textarea
                  id="purpose"
                  className="form-control"
                  placeholder="e.g., Football practice with friends, Cricket match, School team training..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={3}
                  style={{ resize: "vertical" }}
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading || !selectedSlot || !selectedDate}
              >
                {loading ? "Booking..." : "🏟️ Confirm Booking"}
              </button>
            </form>
          </div>
        </div>

        {/* ════════════════════════════════
            RIGHT — Availability Overview
            ════════════════════════════════ */}
        <div className="turf-overview-section">
          {/* My Upcoming Bookings */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>📋 My Bookings ({myBookings.length})</h3>
            {myBookings.length === 0 ? (
              <p style={{ color: "var(--text-light)", fontSize: "0.88rem" }}>
                You haven't booked any slots yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {myBookings.map((b) => (
                  <div key={b.id} className="booking-pill">
                    <div>
                      <strong>{TURF_EMOJI[b.turfName]} {b.turfName}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-mid)", marginTop: "2px" }}>
                        {niceDate(b.date)} · {b.slot}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>
                        {b.purpose}
                      </div>
                    </div>
                    <span className="status-badge status-available">Confirmed</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick availability for today */}
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Today's Overview</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginBottom: "1rem" }}>
              {niceDate(todayString())}
            </p>
            {TURFS.map((turf) => (
              <div key={turf} style={{ marginBottom: "1rem" }}>
                <div style={{ fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                  {TURF_EMOJI[turf]} {turf}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {SLOTS.map((slot) => {
                    const booked = isSlotBooked(turf, todayString(), slot);
                    return (
                      <div key={slot} className={`mini-slot ${booked ? "mini-booked" : "mini-free"}`}>
                        <span>{slot}</span>
                        <span>{booked ? "🔴 Booked" : "🟢 Free"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          ADMIN — All Bookings Table
          ════════════════════════════════ */}
      {isAdmin && (
        <div style={{ marginTop: "2.5rem" }}>
          <h2 style={{
            fontSize: "1.3rem",
            marginBottom: "1rem",
            paddingBottom: "0.5rem",
            borderBottom: "3px solid var(--purple)",
            display: "inline-block",
            color: "#7c3aed"
          }}>
            🛡️ Admin — All Bookings ({bookings.filter(b => b.status !== "Cancelled").length})
          </h2>

          {bookings.filter(b => b.status !== "Cancelled").length === 0 ? (
            <p style={{ color: "var(--text-light)" }}>No bookings yet.</p>
          ) : (
            <div className="activity-list">
              {bookings
                .filter((b) => b.status !== "Cancelled")
                .map((b) => (
                  <div key={b.id} className="activity-item">
                    <div className="activity-item-info">
                      <h4>{TURF_EMOJI[b.turfName]} {b.turfName} — {b.slot}</h4>
                      <p>
                        {niceDate(b.date)} · Booked by <strong>{b.userName}</strong> · "{b.purpose}"
                      </p>
                    </div>
                    <div className="activity-item-actions">
                      <span className="status-badge status-available">Confirmed</span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(b.id)}
                      >
                        🗑️ Cancel
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}