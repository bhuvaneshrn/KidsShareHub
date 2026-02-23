import React, { useState } from "react";

export default function StarRating({ rating, onChange, size = "1.3rem" }) {
  // Track hovered star for visual feedback
  const [hovered, setHovered] = useState(0);

  const isInteractive = typeof onChange === "function";

  return (
    <div className="stars" style={{ cursor: isInteractive ? "pointer" : "default" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (isInteractive ? hovered || rating : rating);
        return (
          <span
            key={star}
            className={`star ${isFilled ? "filled" : ""}`}
            style={{ fontSize: size }}
            onClick={() => isInteractive && onChange(star)}
            onMouseEnter={() => isInteractive && setHovered(star)}
            onMouseLeave={() => isInteractive && setHovered(0)}
            role={isInteractive ? "button" : undefined}
            aria-label={`${star} star`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}