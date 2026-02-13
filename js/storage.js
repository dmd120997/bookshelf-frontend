const BOOKS_KEY = "books";
const FILTER_KEY = "currentFilter";
const PAGE_KEY = "currentPage";
const SORT_KEY = "sortKey";
const SORT_DIR_KEY = "sortDir";
const SORT_MODE_KEY = "sortMode";
const SEARCH_KEY = "searchQuery";


export function loadBooks(defaultBooks) {
  return JSON.parse(localStorage.getItem(BOOKS_KEY)) || defaultBooks;
}

export function saveBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function loadUiState() {
  return {
    currentFilter: localStorage.getItem(FILTER_KEY) || "All",
    currentPage: Number(localStorage.getItem(PAGE_KEY)) || 1,

    sortKey: localStorage.getItem(SORT_KEY) || "title", 
    sortDir: localStorage.getItem(SORT_DIR_KEY) || "asc", 
    sortMode: localStorage.getItem(SORT_MODE_KEY) || "title-asc",
    searchQuery: localStorage.getItem(SEARCH_KEY) || "",
  };
}

export function saveUiState({ currentFilter, currentPage, sortMode, searchQuery }) {
  localStorage.setItem(FILTER_KEY, currentFilter);
  localStorage.setItem(PAGE_KEY, String(currentPage));

  if (sortMode !== undefined) localStorage.setItem(SORT_MODE_KEY, sortMode);
  if (searchQuery !== undefined) localStorage.setItem(SEARCH_KEY, searchQuery);
}
