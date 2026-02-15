import { useEffect, useMemo, useState, useRef } from "react";
import "./styles.css";

import { defaultBooks } from "./constants";
import { loadBooks, saveBooks as persistBooks } from "./storage";

const FILTERS = ["All", "Reading", "Read", "Want to Read", "DNF"];

function RatingStars({ rating, isDisabled, onChangeRating }) {
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
              handleClickStar(starValue);
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

function BookCard({ book, onChangeRating }) {
  return (
    <div className="card">
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
    </div>
  );
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim();
}

function compareText(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function applySort(list, mode) {
  const arr = [...list];

  switch (mode) {
    case "title-asc":
      return arr.sort((a, b) => compareText(a.title, b.title));
    case "title-desc":
      return arr.sort((a, b) => compareText(b.title, a.title));
    case "author-asc":
      return arr.sort((a, b) => compareText(a.author, b.author));
    case "author-desc":
      return arr.sort((a, b) => compareText(b.author, a.author));
    case "rating-desc":
      return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "rating-asc":
      return arr.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    default:
      return arr;
  }
}

function Pagination({ currentPage, totalPages, onChangePage }) {
  const pages = [];

  const addPage = (page) => pages.push({ type: "page", page });
  const addDots = (key) => pages.push({ type: "dots", key });

  if (totalPages <= 5) {
    for (let page = 1; page <= totalPages; page++) addPage(page);
  } else {
    addPage(1);

    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);

    if (windowStart > 2) addDots("left");

    for (let page = windowStart; page <= windowEnd; page++) addPage(page);

    if (windowEnd < totalPages - 1) addDots("right");

    addPage(totalPages);
  }

  return (
    <div className="pagination" role="navigation" aria-label="Pagination">
      <button
        type="button"
        className="page-btn"
        disabled={currentPage === 1}
        onClick={() => onChangePage(currentPage - 1)}
      >
        Prev
      </button>

      {pages.map((item) => {
        if (item.type === "dots") {
          return (
            <span key={item.key} className="dots">
              ...
            </span>
          );
        }

        return (
          <button
            key={item.page}
            type="button"
            className={`page-btn ${item.page === currentPage ? "active" : ""}`}
            onClick={() => onChangePage(item.page)}
          >
            {item.page}
          </button>
        );
      })}

      <button
        type="button"
        className="page-btn"
        disabled={currentPage === totalPages}
        onClick={() => onChangePage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState(() => loadBooks(defaultBooks));
  const [currentFilter, setCurrentFilter] = useState("All");
  const [sortMode, setSortMode] = useState("title-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newStatus, setNewStatus] = useState("Reading");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("book-tracker-theme") || "dark";
  });

  const pageSize = 5;

  function handleChangeBookRating(bookToUpdate, newRating) {
    setBooks((previousBooks) =>
      previousBooks.map((book) => {
        if (book.id && bookToUpdate.id) {
          return book.id === bookToUpdate.id
            ? { ...book, rating: newRating }
            : book;
        }

        const sameKey =
          book.title === bookToUpdate.title &&
          book.author === bookToUpdate.author;

        return sameKey ? { ...book, rating: newRating } : book;
      }),
    );
  }

  useEffect(() => {
    persistBooks(books);
  }, [books]);

  useEffect(() => {
    if (theme === "light") {
      document.body.setAttribute("data-theme", "light");
    } else {
      document.body.removeAttribute("data-theme");
    }

    localStorage.setItem("book-tracker-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const filteredBooks = books.filter((book) =>
    currentFilter === "All" ? true : book.status === currentFilter,
  );

  const searchedBooks = filteredBooks.filter((book) => {
    const q = normalize(searchQuery);
    if (!q) return true;
    return (
      normalize(book.title).includes(q) || normalize(book.author).includes(q)
    );
  });

  const sortedBooks = applySort(searchedBooks, sortMode);

  const totalPages = Math.max(1, Math.ceil(sortedBooks.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = sortedBooks.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  return (
    <div className="app">
      <div className="container">
        <div className="theme-toggle">
          <button
            type="button"
            className="theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "light" ? "🌙" : "🌞"}
          </button>
        </div>

        <h1>My Book Tracker</h1>
        <div className="filters">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={currentFilter === filter ? "active" : ""}
              onClick={() => {
                setCurrentFilter(filter);
                setCurrentPage(1);
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <div className={`search-wrap ${searchQuery ? "has-value" : ""}`}>
            <input
              id="search"
              className="input"
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
            />

            <button
              type="button"
              className="search-icon-btn"
              onClick={() => {
                if (searchQuery) {
                  setSearchQuery("");
                  setCurrentPage(1);
                }
              }}
              aria-label={searchQuery ? "Clear search" : "Search"}
              title={searchQuery ? "Clear" : "Search"}
            >
              {searchQuery ? "×" : "🔍"}
            </button>
          </div>

          <select
            className="input"
            value={sortMode}
            onChange={(event) => {
              setSortMode(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="title-asc">Title (A–Z)</option>
            <option value="title-desc">Title (Z–A)</option>
            <option value="author-asc">Author (A–Z)</option>
            <option value="author-desc">Author (Z–A)</option>
            <option value="rating-desc">Rating (high → low)</option>
            <option value="rating-asc">Rating (low → high)</option>
          </select>
        </div>

        <div className="toolbar-actions">
          <button
            className="btn-primary"
            type="button"
            onClick={() => setIsAddOpen(true)}
          >
            + Add book
          </button>
        </div>

        {isAddOpen && (
          <form
            className="panel panel-form"
            onSubmit={(event) => {
              event.preventDefault();

              const title = newTitle.trim();
              const author = newAuthor.trim();
              const status = newStatus;

              if (!title || !author) return;

              const createdBook = {
                id: crypto.randomUUID(),
                title,
                author,
                status,
                rating: 0,
              };

              setBooks((prevBooks) => [...prevBooks, createdBook]);

              setIsAddOpen(false);
              setNewTitle("");
              setNewAuthor("");
              setNewStatus("Reading");

              setCurrentPage(totalPages + 1);
            }}
          >
            <div className="form-row form-row--pill">
              <input
                className="input input--pill"
                type="text"
                placeholder="Book title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                autoFocus
              />

              <input
                className="input input--pill"
                type="text"
                placeholder="Author"
                value={newAuthor}
                onChange={(event) => setNewAuthor(event.target.value)}
              />

              <select
                className="input input--pill input--select"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value)}
              >
                <option value="Reading">Reading</option>
                <option value="Read">Read</option>
                <option value="Want to Read">Want to Read</option>
                <option value="DNF">DNF</option>
              </select>

              <div className="form-actions form-actions--inline">
                <button className="btn-primary btn-primary--pill" type="submit">
                  Save
                </button>

                <button
                  className="btn-danger btn-danger--pill"
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setNewTitle("");
                    setNewAuthor("");
                    setNewStatus("Reading");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div id="book-container">
          {pageItems.map((book) => (
            <BookCard
              key={book.id ?? `${book.title}-${book.author}`}
              book={book}
              onChangeRating={handleChangeBookRating}
            />
          ))}
        </div>
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onChangePage={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
