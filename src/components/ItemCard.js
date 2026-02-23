import React from "react";
import { statusClass, typeBadgeClass, categoryEmoji } from "../utils/helpers";

export default function ItemCard({ item, onRequest, onDelete, isOwner, isAdmin }) {
  const canDelete = isOwner || isAdmin;
  const canRequest = !isOwner && item.status === "Available";

  return (
    <div className="item-card">
      {/* Image or placeholder */}
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} />
      ) : (
        <div className="item-card-img-placeholder">
          {categoryEmoji(item.category)}
        </div>
      )}

      {/* Item title */}
      <h3>{item.name}</h3>

      {/* Tags row */}
      <div className="item-card-meta">
        <span className="badge badge-category">{item.category}</span>
        <span className={typeBadgeClass(item.type)}>{item.type}</span>
        <span className="badge badge-condition">{item.condition}</span>
      </div>

      {/* Status */}
      <span className={`status-badge ${statusClass(item.status)}`}>
        {item.status === "Available" && "🟢"}
        {item.status === "Pending"   && "🟡"}
        {item.status === "Completed" && "🔵"}
        {" "}{item.status}
      </span>

      {/* Owner info */}
      <p className="item-card-owner">
        Posted by: <strong>{item.ownerName || "User"}</strong>
      </p>

      {/* Action buttons */}
      <div className="item-card-actions">
        {/* Request button — only shown to other users when item is available */}
        {canRequest && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onRequest(item)}
          >
            🤝 Request
          </button>
        )}

        {/* Delete button — shown to admin or owner */}
        {canDelete && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(item.id)}
          >
            🗑️ Delete
          </button>
        )}

        {/* Ownership label */}
        {isOwner && (
          <span style={{ fontSize: "0.78rem", color: "#888", alignSelf: "center" }}>
            📌 Your listing
          </span>
        )}
      </div>
    </div>
  );
}