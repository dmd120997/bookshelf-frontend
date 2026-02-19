import { useMemo, useRef, useState } from "react";

export default function RatingStars({ rating, isDisabled, onChangeRating }) {
  const wrapRef = useRef(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [poppedStarValue, setPoppedStarValue] = useState(null);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const displayRating = hoverRating || rating;
  const starValues = useMemo(() => [1, 2, 3, 4, 5], []);

  function createConfettiPieces(leftPx, topPx) {
    const colors = ["#facc15", "#fb7185", "#60a5fa", "#34d399", "#a78bfa"];

    const pieces = Array.from({ length: 12 }, () => {
      const deltaX = Math.round((Math.random() * 2 - 1) * 28);
      const deltaY = Math.round(-(Math.random() * 30 + 10));
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        id: crypto.randomUUID(),
        style: {
          "--dx": `${deltaX}px`,
          "--dy": `${deltaY}px`,
          left: `${leftPx}px`,
          top: `${topPx}px`,
          background: color,
        },
      };
    });

    setConfettiPieces(pieces);
    window.setTimeout(() => setConfettiPieces([]), 450);
  }

  function handleClickStar(starValue, clickEvent) {
    if (isDisabled) return;

    onChangeRating(starValue);

    setPoppedStarValue(starValue);
    window.setTimeout(() => setPoppedStarValue(null), 220);

    const wrapElement = wrapRef.current;
    if (!wrapElement) return;

    const wrapRect = wrapElement.getBoundingClientRect();
    const starRect = clickEvent.currentTarget.getBoundingClientRect();

    const leftPx = starRect.left - wrapRect.left + starRect.width / 2;
    const topPx = starRect.top - wrapRect.top + starRect.height / 2;

    createConfettiPieces(leftPx, topPx);
  }

  return (
    <div
      ref={wrapRef}
      className={`rating-stars ${isDisabled ? "is-disabled" : ""}`}
      onMouseLeave={() => setHoverRating(0)}
      aria-label="Rating"
    >
      {starValues.map((starValue) => (
        <span
          key={starValue}
          className={[
            starValue <= displayRating ? "filled" : "",
            poppedStarValue === starValue ? "pop" : "",
          ]
            .join(" ")
            .trim()}
          onMouseEnter={() => !isDisabled && setHoverRating(starValue)}
          onClick={(event) => handleClickStar(starValue, event)}
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          onKeyDown={(keyboardEvent) => {
            if (isDisabled) return;
            if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
              keyboardEvent.preventDefault();
              handleClickStar(starValue, keyboardEvent);
            }
          }}
          aria-label={`Set rating ${starValue}`}
        >
          {starValue <= displayRating ? "★" : "☆"}
        </span>
      ))}

      {confettiPieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti"
          style={piece.style}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
