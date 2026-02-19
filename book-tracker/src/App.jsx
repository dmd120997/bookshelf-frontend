import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

import BookCard from "./components/BookCard";
import Pagination from "./components/Pagination";

import {
  loadBooks,
  saveBooks as persistBooks,
} from "./lib/storage/booksStorage";
import { loadTheme, saveTheme } from "./lib/storage/themeStorage";
import {
  applySort,
  selectFilteredBooks,
  selectSearchedBooks,
  selectPagedBooks,
} from "./lib/books/booksView";

const FILTERS = ["All", "Reading", "Read", "Want to Read", "DNF"];

export default function App() {
  const [books, setBooks] = useState(() => loadBooks([]));
  const [currentFilter, setCurrentFilter] = useState("All");
  const [sortMode, setSortMode] = useState("title-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newStatus, setNewStatus] = useState("Reading");
  const addFormRef = useRef(null);

  const [theme, setTheme] = useState(() => loadTheme("dark"));

  const pageSize = 5;

  function closeAddForm() {
    setIsAddOpen(false);
    setNewTitle("");
    setNewAuthor("");
    setNewStatus("Reading");
  }

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

  function handleDeleteBook(bookToDelete) {
    setBooks((previousBooks) =>
      previousBooks.filter((book) => {
        if (book.id && bookToDelete.id) return book.id !== bookToDelete.id;

        const sameKey =
          book.title === bookToDelete.title &&
          book.author === bookToDelete.author;

        return !sameKey;
      }),
    );
  }

  function handleEditBook(bookToUpdate, updates) {
    const nextStatus = String(updates.status ?? "").trim();
    const isWantToRead = nextStatus.toLowerCase() === "want to read";

    const normalizedUpdates = {
      ...updates,
      status: nextStatus || updates.status,
      ...(isWantToRead ? { rating: 0 } : {}),
    };

    setBooks((previousBooks) =>
      previousBooks.map((book) => {
        if (book.id && bookToUpdate.id) {
          return book.id === bookToUpdate.id
            ? { ...book, ...normalizedUpdates }
            : book;
        }

        const sameKey =
          book.title === bookToUpdate.title &&
          book.author === bookToUpdate.author;

        return sameKey ? { ...book, ...normalizedUpdates } : book;
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

    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    if (!isAddOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") closeAddForm();
    }

    function handlePointerDown(event) {
      const formElement = addFormRef.current;
      if (!formElement) return;

      if (!formElement.contains(event.target)) closeAddForm();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [isAddOpen]);

  useEffect(() => {
    if (!searchQuery) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSearchQuery("");
        setCurrentPage(1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchQuery]);

  const filteredBooks = useMemo(
    () => selectFilteredBooks(books, currentFilter),
    [books, currentFilter],
  );

  const searchedBooks = useMemo(
    () => selectSearchedBooks(filteredBooks, searchQuery),
    [filteredBooks, searchQuery],
  );

  const sortedBooks = useMemo(
    () => applySort(searchedBooks, sortMode),
    [searchedBooks, sortMode],
  );

  const { pageItems, totalPages, safePage } = useMemo(
    () => selectPagedBooks(sortedBooks, currentPage, pageSize),
    [sortedBooks, currentPage],
  );

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
            ref={addFormRef}
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

              closeAddForm();
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
                  onClick={closeAddForm}
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
              onDeleteBook={handleDeleteBook}
              onEditBook={handleEditBook}
            />
          ))}

          {pageItems.length === 0 && (
            <div className="empty-state">
              <p>No books yet.</p>
              <p>Click "+ Add book" to get started 📚</p>
            </div>
          )}
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
