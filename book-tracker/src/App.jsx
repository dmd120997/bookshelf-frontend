import { useEffect, useState } from "react";
import "./styles.css";

import { defaultBooks } from "./constants";
import { loadBooks, saveBooks as persistBooks } from "./storage";

function BookCard({ book }) {
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

export default function App() {
  const [books, setBooks] = useState(() => loadBooks(defaultBooks));
  const [currentFilter, setCurrentFilter] = useState("All");
  const [sortMode, setSortMode] = useState("title-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;

  useEffect(() => {
    persistBooks(books);
  }, [books]);

  

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
        <h1>My Book Tracker</h1>

        <div className="toolbar">
          <div className={`search-wrap ${searchQuery ? "has-value" : ""}`}>
            <input
              id="search"
              className="input"
              type="search"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
            <button
              id="clear-search"
              type="button"
              className="clear-btn"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          </div>

          <select
            id="sort"
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

        <div id="book-container">
          {pageItems.map((book) => (
            <BookCard key={`${book.title}-${book.author}`} book={book} />
          ))}
        </div>
      </div>
    </div>
  );
}
