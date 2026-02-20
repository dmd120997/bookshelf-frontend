import { useEffect, useRef, useState } from "react";
import RatingStars from "./RatingStars";

export default function BookCard({ book, onChangeRating, onDeleteBook, onEditBook }) {
  const cardRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title ?? "");
  const [editAuthor, setEditAuthor] = useState(book.author ?? "");
  const [editStatus, setEditStatus] = useState(book.status ?? "Reading");

  function openEditor() {
    setEditTitle(book.title ?? "");
    setEditAuthor(book.author ?? "");
    setEditStatus(book.status ?? "Reading");
    setIsEditing(true);
  }

  function closeEditor() {
    setIsEditing(false);
  }

  useEffect(() => {
    if (!isEditing) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") closeEditor();
    }

    function handlePointerDown(event) {
      const cardElement = cardRef.current;
      if (!cardElement) return;

      if (!cardElement.contains(event.target)) closeEditor();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [isEditing]);

  function handleSubmit(event) {
    event.preventDefault();

    const title = editTitle.trim();
    const author = editAuthor.trim();
    const status = editStatus;

    if (!title || !author) return;

    onEditBook(book, { title, author, status });
    closeEditor();
  }

  return (
    <div
      ref={cardRef}
      className="card"
      onDoubleClick={(event) => {
        const targetNode = event.target;

        if (!(targetNode instanceof Element)) {
          openEditor();
          return;
        }

        const isInteractive = targetNode.closest(
          "button, a, input, select, textarea, .rating-stars",
        );

        if (isInteractive) return;

        openEditor();
      }}
    >
      {isEditing ? (
        <form className="inline-editor" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            autoFocus
          />

          <input
            className="input"
            type="text"
            value={editAuthor}
            onChange={(event) => setEditAuthor(event.target.value)}
          />

          <select
            className="input"
            value={editStatus}
            onChange={(event) => setEditStatus(event.target.value)}
          >
            <option value="Reading">Reading</option>
            <option value="Read">Read</option>
            <option value="Want to Read">Want to Read</option>
            <option value="DNF">DNF</option>
          </select>

          <div className="inline-actions">
            <button className="btn-primary" type="submit">
              Save
            </button>

            <button className="btn-danger" type="button" onClick={closeEditor}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="card-main">
            <h3 title={book.title}>{book.title}</h3>
            <p>{book.author}</p>
            <p className="rating-text">
              {book.rating > 0 ? `${book.rating} / 5 ⭐` : "not rated ⭐"}
            </p>
          </div>

          <div className="card-spacer"></div>

          <div className="card-meta">
            <div className="status-row">
              <span className={`badge badge--${book.status.split(" ").join("-")}`}>
                {book.status}
              </span>
            </div>

            <RatingStars
              rating={book.rating ?? 0}
              isDisabled={book.status === "Want to Read"}
              onChangeRating={(newRating) => onChangeRating(book, newRating)}
            />
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={openEditor}
              aria-label="Edit"
              title="Edit"
            >
              ✏️
            </button>

            <button
              type="button"
              className="icon-btn delete-btn"
              onClick={() => onDeleteBook(book)}
              aria-label="Delete"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  );
}
