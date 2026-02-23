// src/utils/helpers.js
// ─────────────────────────────────────────────────────────────
// Shared utility functions used across multiple components.
// ─────────────────────────────────────────────────────────────

/**
 * Returns a CSS class name for a given status string.
 * Used to color-code item status badges.
 */
export function statusClass(status) {
  switch (status) {
    case "Available":  return "status-available";
    case "Pending":    return "status-pending";
    case "Completed":  return "status-completed";
    default:           return "";
  }
}

/**
 * Returns a CSS class for the listing type badge.
 */
export function typeBadgeClass(type) {
  switch (type) {
    case "Sell":     return "badge badge-type-sell";
    case "Rent":     return "badge badge-type-rent";
    case "Exchange": return "badge badge-type-exchange";
    case "Free":     return "badge badge-type-free";
    default:         return "badge";
  }
}

/**
 * Returns an emoji icon for each category.
 */
export function categoryEmoji(category) {
  const map = {
    Books: "📚",
    Games: "🎮",
    Sports: "⚽",
    "Turf Slots": "🏟️",
  };
  return map[category] || "📦";
}

/**
 * Formats a Firestore Timestamp or JS Date to a readable string.
 */
export function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculates the average from an array of numbers.
 */
export function calcAverage(arr) {
  if (!arr || arr.length === 0) return 0;
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}