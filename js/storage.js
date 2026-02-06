const BOOKS_KEY = "books";
const FILTER_KEY = "currentFilter";
const PAGE_KEY = "currentPage";

export function loadBooks(defaultBooks) {
  const saved = localStorage.getItem("books");

  if (saved) {
    return JSON.parse(saved);
  }

  localStorage.setItem("books", JSON.stringify(defaultBooks));
  return defaultBooks;
}



export function saveBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function loadUiState() {
  return {
    currentFilter: localStorage.getItem(FILTER_KEY) || "All",
    currentPage: Number(localStorage.getItem(PAGE_KEY)) || 1,
  };
}

export function saveUiState({ currentFilter, currentPage }) {
  localStorage.setItem(FILTER_KEY, currentFilter);
  localStorage.setItem(PAGE_KEY, String(currentPage));
}
