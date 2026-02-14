import { useEffect, useState } from "react";
import "./styles.css";

import { defaultBooks } from "./constants";
import { loadBooks, saveBooks as persistBooks } from "./storage";

const FILTERS = ["All", "Reading", "Read", "Want to Read", "DNF"];

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
            className="panel"
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
            <div className="form-row">
              <input
                className="input"
                type="text"
                placeholder="Title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                autoFocus
              />
              <input
                className="input"
                type="text"
                placeholder="Author"
                value={newAuthor}
                onChange={(event) => setNewAuthor(event.target.value)}
              />
              <select
                className="input"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value)}
              >
                <option value="Reading">Reading</option>
                <option value="Read">Read</option>
                <option value="Want to Read">Want to Read</option>
                <option value="DNF">DNF</option>
              </select>
            </div>

            <div className="form-actions">
              <button className="btn-primary" type="submit">
                Add
              </button>
              <button
                className="btn-ghost"
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
          </form>
        )}

        <div id="book-container">
          {pageItems.map((book) => (
            <BookCard key={`${book.title}-${book.author}`} book={book} />
          ))}
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onChangePage={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
    </div>
  );
}
