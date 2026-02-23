import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { statusClass, formatDate, calcAverage } from "../utils/helpers";
import StarRating from "../components/StarRating";

// ── Fixed list of admin-approved safe meetup zones ──
const SAFE_ZONES = [
  "📚 Library Entrance",
  "🍽️ Main Canteen",
  "🏫 Admin Block Lobby",
  "🚪 Main Gate",
  "⚽ Sports Ground Gate",
  "💻 Computer Lab Corridor",
];

// ── Generate a random 6-digit meeting code ──
function generateMeetingCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Trust badge based on average rating and total ratings ──
function TrustBadge({ ratings }) {
  if (!ratings || ratings.length === 0) {
    return (
      <span style={{
        background: "#dbeafe", color: "#1e40af",
        borderRadius: "6px", fontSize: "0.7rem",
        padding: "2px 7px", fontWeight: 700, marginLeft: "6px"
      }}>
        🆕 New Member
      </span>
    );
  }
  const avg = calcAverage(ratings);
  if (avg < 3) {
    return (
      <span style={{
        background: "#fee2e2", color: "#b91c1c",
        borderRadius: "6px", fontSize: "0.7rem",
        padding: "2px 7px", fontWeight: 700, marginLeft: "6px"
      }}>
        ⚠️ Low Trust
      </span>
    );
  }
  return (
    <span style={{
      background: "#d1fae5", color: "#065f46",
      borderRadius: "6px", fontSize: "0.7rem",
      padding: "2px 7px", fontWeight: 700, marginLeft: "6px"
    }}>
      ✅ Trusted
    </span>
  );
}

export default function MyActivity() {
  const { currentUser, userProfile } = useAuth();

  const [myItems,    setMyItems]    = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [incoming,   setIncoming]   = useState([]);
  const [ratings,    setRatings]    = useState({});
  const [message,    setMessage]    = useState("");

  // For accept modal — pick safe zone before accepting
  const [acceptingReq,    setAcceptingReq]    = useState(null);
  const [chosenZone,      setChosenZone]      = useState(SAFE_ZONES[0]);

  // For meeting code verification — owner enters code
  const [verifyingReq,    setVerifyingReq]    = useState(null);
  const [enteredCode,     setEnteredCode]     = useState("");
  const [codeError,       setCodeError]       = useState("");

  // For report modal
  const [reportingReq,    setReportingReq]    = useState(null);
  const [reportReason,    setReportReason]    = useState("");

  const uid = currentUser.uid;

  // ── Firestore subscriptions ──
  useEffect(() => {
    const q = query(collection(db, "items"), where("ownerId", "==", uid));
    return onSnapshot(q, (snap) => {
      setMyItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  useEffect(() => {
    const q = query(collection(db, "requests"), where("requesterId", "==", uid));
    return onSnapshot(q, (snap) => {
      setMyRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  useEffect(() => {
    const q = query(collection(db, "requests"), where("ownerId", "==", uid));
    return onSnapshot(q, (snap) => {
      setIncoming(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  // ── Accept: generate meeting code + save safe zone ──
  const handleAccept = async () => {
    const req = acceptingReq;
    const code = generateMeetingCode();
    try {
      await updateDoc(doc(db, "requests", req.id), {
        status: "Accepted",
        safeZone: chosenZone,
        meetingCode: code,
        ownerConfirmed: false,
        requesterConfirmed: false,
      });
      await updateDoc(doc(db, "items", req.itemId), { status: "Pending" });
      setAcceptingReq(null);
      showMessage("✅ Request accepted! Meeting code generated.");
    } catch (err) { console.error(err); }
  };

  // ── Reject ──
  const handleReject = async (req) => {
    try {
      await updateDoc(doc(db, "requests", req.id), { status: "Rejected" });
      showMessage("❌ Request rejected.");
    } catch (err) { console.error(err); }
  };

  // ── Requester confirms they received the item ──
  const handleRequesterConfirm = async (req) => {
    try {
      await updateDoc(doc(db, "requests", req.id), { requesterConfirmed: true });
      showMessage("✅ You confirmed the exchange!");
    } catch (err) { console.error(err); }
  };

  // ── Owner verifies meeting code entered by requester ──
  const handleVerifyCode = async () => {
    const req = verifyingReq;
    if (enteredCode.trim() !== req.meetingCode) {
      setCodeError("❌ Wrong code! Ask the requester to show their meeting code.");
      return;
    }
    try {
      await updateDoc(doc(db, "requests", req.id), { ownerConfirmed: true });

      // If requester already confirmed → mark fully complete
      if (req.requesterConfirmed) {
        await updateDoc(doc(db, "requests", req.id), { status: "Completed" });
        await updateDoc(doc(db, "items", req.itemId), { status: "Completed" });
      }

      setVerifyingReq(null);
      setEnteredCode("");
      setCodeError("");
      showMessage("🎉 Code verified! Exchange confirmed.");
    } catch (err) { console.error(err); }
  };

  // ── Auto-complete when both confirm ──
  // (handled reactively — if owner was already confirmed and requester just confirmed)
  const handleRequesterConfirmFull = async (req) => {
    try {
      const newData = { requesterConfirmed: true };
      if (req.ownerConfirmed) {
        newData.status = "Completed";
        await updateDoc(doc(db, "items", req.itemId), { status: "Completed" });
      }
      await updateDoc(doc(db, "requests", req.id), newData);
      showMessage(req.ownerConfirmed ? "🎉 Exchange fully confirmed and completed!" : "✅ Your confirmation saved! Waiting for owner to verify the meeting code.");
    } catch (err) { console.error(err); }
  };

  // ── Submit a rating ──
  const handleRating = async (req, starValue) => {
    try {
      await updateDoc(doc(db, "users", req.requesterId), {
        ratings: arrayUnion(starValue),
      });
      await updateDoc(doc(db, "requests", req.id), { rated: true });
      showMessage(`⭐ Rated ${req.requesterName} ${starValue} star${starValue > 1 ? "s" : ""}!`);
    } catch (err) { console.error(err); }
  };

  // ── Report an issue ──
  const handleReport = async () => {
    const req = reportingReq;
    if (!reportReason.trim()) return;
    try {
      await updateDoc(doc(db, "requests", req.id), {
        reported: true,
        reportReason: reportReason.trim(),
        reportedBy: uid,
      });
      setReportingReq(null);
      setReportReason("");
      showMessage("🚨 Issue reported. Admin will review it.");
    } catch (err) { console.error(err); }
  };

  const myAvg = calcAverage(userProfile?.ratings);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  return (
    <div className="page">

      {/* ── Profile Card ── */}
      <div className="profile-card">
        <div className="profile-avatar">
          {(userProfile?.name || "U")[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>
            {userProfile?.name}
            <TrustBadge ratings={userProfile?.ratings} />
          </h2>
          <p>{userProfile?.role} · Age {userProfile?.age} · {currentUser.email}</p>
          <div className="profile-rating">
            {userProfile?.ratings?.length > 0
              ? `⭐ ${myAvg} / 5.0 (${userProfile.ratings.length} rating${userProfile.ratings.length !== 1 ? "s" : ""})`
              : "No ratings yet"}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {message && <div className="alert alert-info">{message}</div>}

      {/* ════════════════════════════════════════
          MODAL — Accept: Pick Safe Zone
          ════════════════════════════════════════ */}
      {acceptingReq && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>📍 Pick a Safe Meetup Zone</h3>
            <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: "0.5rem 0 1rem" }}>
              Choose an admin-approved location on campus for the exchange. Both parties will see this.
            </p>
            <div className="form-group">
              <label>Safe Zone</label>
              <select
                className="form-control"
                value={chosenZone}
                onChange={(e) => setChosenZone(e.target.value)}
              >
                {SAFE_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Safety note */}
            <div className="safety-note">
              🛡️ Always meet in public, well-lit areas. Never share personal address or meet alone.
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button className="btn btn-primary" onClick={handleAccept}>
                ✅ Confirm & Generate Meeting Code
              </button>
              <button className="btn btn-ghost" onClick={() => setAcceptingReq(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL — Verify Meeting Code (Owner)
          ════════════════════════════════════════ */}
      {verifyingReq && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🔐 Verify Meeting Code</h3>
            <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: "0.5rem 0 1rem" }}>
              Ask <strong>{verifyingReq.requesterName}</strong> to show their 6-digit meeting code and enter it below.
            </p>
            <div className="form-group">
              <label>Enter Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="6-digit code"
                maxLength={6}
                value={enteredCode}
                onChange={(e) => { setEnteredCode(e.target.value); setCodeError(""); }}
                style={{ fontSize: "1.4rem", letterSpacing: "0.4rem", fontWeight: 700, textAlign: "center" }}
              />
            </div>
            {codeError && <div className="alert alert-error">{codeError}</div>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary" onClick={handleVerifyCode}>
                🔓 Verify Code
              </button>
              <button className="btn btn-ghost" onClick={() => { setVerifyingReq(null); setEnteredCode(""); setCodeError(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL — Report Issue
          ════════════════════════════════════════ */}
      {reportingReq && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🚨 Report an Issue</h3>
            <p style={{ color: "var(--text-light)", fontSize: "0.88rem", margin: "0.5rem 0 1rem" }}>
              Describe what went wrong. Admin will review and take action.
            </p>
            <div className="form-group">
              <label>What happened?</label>
              <select
                className="form-control"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                <option value="Item not as described">Item not as described</option>
                <option value="Person didn't show up">Person didn't show up</option>
                <option value="Payment not made">Payment not made</option>
                <option value="Item not handed over">Item not handed over</option>
                <option value="Unsafe behaviour">Unsafe behaviour</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn btn-danger" onClick={handleReport} disabled={!reportReason}>
                🚨 Submit Report
              </button>
              <button className="btn btn-ghost" onClick={() => { setReportingReq(null); setReportReason(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── My Listings ── */}
      <section className="activity-section">
        <h2>📦 My Listings ({myItems.length})</h2>
        {myItems.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📭</div>
            <p>You haven't listed anything yet.</p>
            <a href="/add-item" className="btn btn-primary">➕ Add Item</a>
          </div>
        ) : (
          <div className="activity-list">
            {myItems.map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-item-info">
                  <h4>{item.name}</h4>
                  <p>{item.category} · {item.type} · {item.condition}</p>
                </div>
                <span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Requests I Made ── */}
      <section className="activity-section">
        <h2>🤝 My Requests ({myRequests.length})</h2>
        {myRequests.length === 0 ? (
          <p style={{ color: "var(--text-light)" }}>You haven't made any requests yet.</p>
        ) : (
          <div className="activity-list">
            {myRequests.map((req) => (
              <div key={req.id} className="activity-item" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div className="activity-item-info">
                    <h4>{req.itemName}</h4>
                    <p>Requested on {formatDate(req.createdAt)}</p>
                  </div>
                  <span className={`status-badge ${statusClass(req.status)}`}>{req.status}</span>
                </div>

                {/* Show safe zone + meeting code when accepted */}
                {req.status === "Accepted" && (
                  <div className="meetup-info-box">
                    <div className="meetup-row">
                      <span>📍 Meet at:</span>
                      <strong>{req.safeZone}</strong>
                    </div>
                    <div className="meetup-row">
                      <span>🔐 Your Meeting Code:</span>
                      <span className="meeting-code">{req.meetingCode}</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-light)", marginTop: "0.4rem" }}>
                      Show this code to the owner when you meet. They will enter it to confirm.
                    </p>

                    {/* Requester confirmation button */}
                    {!req.requesterConfirmed ? (
                      <button
                        className="btn btn-teal btn-sm"
                        style={{ marginTop: "0.5rem" }}
                        onClick={() => handleRequesterConfirmFull(req)}
                      >
                        ✅ I received the item
                      </button>
                    ) : (
                      <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.82rem", marginTop: "0.4rem", display: "block" }}>
                        ✅ You confirmed receipt
                        {!req.ownerConfirmed && " — waiting for owner to verify code"}
                      </span>
                    )}

                    {/* Report button */}
                    {!req.reported && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: "0.4rem" }}
                        onClick={() => setReportingReq(req)}
                      >
                        🚨 Report Issue
                      </button>
                    )}
                    {req.reported && (
                      <span style={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 700, marginTop: "0.4rem", display: "block" }}>
                        🚨 Issue reported — Admin reviewing
                      </span>
                    )}
                  </div>
                )}

                {req.status === "Completed" && (
                  <div style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    🎉 Exchange completed successfully!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Incoming Requests ── */}
      <section className="activity-section">
        <h2>📬 Incoming Requests ({incoming.length})</h2>
        {incoming.length === 0 ? (
          <p style={{ color: "var(--text-light)" }}>No one has requested your items yet.</p>
        ) : (
          <div className="activity-list">
            {incoming.map((req) => (
              <div key={req.id} className="activity-item" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div className="activity-item-info">
                    <h4>
                      {req.requesterName}
                      <TrustBadge ratings={req.requesterRatings} />
                      {" wants "}<strong>{req.itemName}</strong>
                    </h4>
                    <p>Requested on {formatDate(req.createdAt)}</p>
                  </div>
                  <span className={`status-badge ${statusClass(req.status)}`}>{req.status}</span>
                </div>

                {/* Pending — Accept/Reject */}
                {req.status === "Pending" && (
                  <div className="activity-item-actions" style={{ marginTop: "0.5rem" }}>
                    <button className="btn btn-success btn-sm" onClick={() => { setAcceptingReq(req); setChosenZone(SAFE_ZONES[0]); }}>
                      ✅ Accept
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(req)}>
                      ❌ Reject
                    </button>
                  </div>
                )}

                {/* Accepted — show meetup info + verify code */}
                {req.status === "Accepted" && (
                  <div className="meetup-info-box">
                    <div className="meetup-row">
                      <span>📍 Meetup Location:</span>
                      <strong>{req.safeZone}</strong>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-mid)", marginTop: "0.3rem" }}>
                      Owner confirmed: {req.ownerConfirmed ? "✅ Yes" : "⏳ Pending code verification"}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-mid)" }}>
                      Requester confirmed: {req.requesterConfirmed ? "✅ Yes" : "⏳ Not yet"}
                    </div>

                    {/* Verify code button */}
                    {!req.ownerConfirmed && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: "0.6rem" }}
                        onClick={() => { setVerifyingReq(req); setEnteredCode(""); setCodeError(""); }}
                      >
                        🔐 Verify Meeting Code
                      </button>
                    )}

                    {/* Report button */}
                    {!req.reported && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: "0.4rem", marginLeft: "0.5rem" }}
                        onClick={() => setReportingReq(req)}
                      >
                        🚨 Report Issue
                      </button>
                    )}
                    {req.reported && (
                      <span style={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 700, marginTop: "0.4rem", display: "block" }}>
                        🚨 Issue reported — Admin reviewing
                      </span>
                    )}
                  </div>
                )}

                {/* Completed — Rate */}
                {req.status === "Completed" && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {!req.rated ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-mid)" }}>
                          Rate {req.requesterName}:
                        </span>
                        <StarRating
                          rating={ratings[req.id] || 0}
                          onChange={async (val) => {
                            setRatings((prev) => ({ ...prev, [req.id]: val }));
                            await handleRating(req, val);
                          }}
                          size="1.4rem"
                        />
                      </div>
                    ) : (
                      <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.85rem" }}>
                        ⭐ Rated!
                      </span>
                    )}
                  </div>
                )}

                {req.status === "Rejected" && (
                  <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.85rem", marginTop: "0.3rem" }}>
                    ❌ You rejected this request
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}