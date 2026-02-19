const BOOKS_STORAGE_KEY = "book-tracker-books";

export function loadBooks(fallbackBooks = []) {
  try {
    const rawValue = localStorage.getItem(BOOKS_STORAGE_KEY);
    if (!rawValue) return fallbackBooks;

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : fallbackBooks;
  } catch {
    return fallbackBooks;
  }
}

export function saveBooks(books) {
  try {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books ?? []));
  } catch {
    
  }
}
