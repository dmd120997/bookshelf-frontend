import { useEffect, useRef, useState } from "react";
import "./styles.css";

import BookCard from "./components/BookCard";
import Pagination from "./components/Pagination";

import { getBooks, createBook, updateBook, deleteBook } from "./lib/api/booksApi";
import { loadTheme, saveTheme } from "./lib/storage/themeStorage";

const FILTERS = ["All", "Reading", "Read", "Want to Read", "DNF"];

export default function App() {
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

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

  async function reloadBooks(requestedPage = currentPage) {
    setIsLoading(true);
    setLoadError("");

    try {
      const result = await getBooks({
        status: currentFilter,
        search: searchQuery,
        sort: sortMode,
        page: requestedPage,
        pageSize,
      });

      setBooks(result.data);
      setTotalPages(result.meta.totalPages);

      // если сервер сказал, что страниц меньше (например после удаления)
      const safePage = Math.min(requestedPage, result.meta.totalPages);
      if (safePage !== currentPage) setCurrentPage(safePage);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }

  // загрузка списка при изменении фильтра/поиска/сортировки/страницы
  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await getBooks({
          status: currentFilter,
          search: searchQuery,
          sort: sortMode,
          page: currentPage,
          pageSize,
        });

        if (isCancelled) return;

        setBooks(result.data);
        setTotalPages(result.meta.totalPages);

        const safePage = Math.min(currentPage, result.meta.totalPages);
        if (safePage !== currentPage) setCurrentPage(safePage);
      } catch (error) {
        if (isCancelled) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [currentFilter, searchQuery, sortMode, currentPage, pageSize]);

  // тема
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

  // Escape + click outside для add form
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

  // Escape для search
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

  // CRUD через API
  async function handleChangeBookRating(bookToUpdate, newRating) {
    if (!bookToUpdate?.id) return;
    await updateBook(bookToUpdate.id, { rating: newRating });
    await reloadBooks();
  }

  async function handleDeleteBook(bookToDelete) {
    if (!bookToDelete?.id) return;
    await deleteBook(bookToDelete.id);
    await reloadBooks();
  }

  async function handleEditBook(bookToUpdate, updates) {
    if (!bookToUpdate?.id) return;
    await updateBook(bookToUpdate.id, updates);
    await reloadBooks();
  }

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
          <button className="btn-primary" type="button" onClick={() => setIsAddOpen(true)}>
            + Add book
          </button>
        </div>

        {isAddOpen && (
          <form
            ref={addFormRef}
            className="panel panel-form"
            onSubmit={async (event) => {
              event.preventDefault();

              const title = newTitle.trim();
              const author = newAuthor.trim();
              const status = newStatus;

              if (!title || !author) return;

              await createBook({ title, author, status, rating: 0 });

              closeAddForm();
              setCurrentPage(1); // просто и надёжно
              await reloadBooks(1);
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
                <button className="btn-primary btn-primary--pill" type="submit" disabled={isLoading}>
                  Save
                </button>

                <button
                  className="btn-danger btn-danger--pill"
                  type="button"
                  onClick={closeAddForm}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {loadError && (
          <div className="panel" style={{ marginTop: 12 }}>
            <p style={{ margin: 0 }}>Error: {loadError}</p>
          </div>
        )}

        <div id="book-container">
          {isLoading && <div className="empty-state"><p>Loading...</p></div>}

          {!isLoading &&
            books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onChangeRating={handleChangeBookRating}
                onDeleteBook={handleDeleteBook}
                onEditBook={handleEditBook}
              />
            ))}

          {!isLoading && books.length === 0 && (
            <div className="empty-state">
              <p>No books yet.</p>
              <p>Click "+ Add book" to get started 📚</p>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChangePage={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}