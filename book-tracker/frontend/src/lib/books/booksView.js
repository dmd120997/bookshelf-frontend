function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function compareText(firstText, secondText) {
  return String(firstText || "").localeCompare(String(secondText || ""), undefined, {
    sensitivity: "base",
  });
}

export function applySort(list, mode) {
  const arrayCopy = [...list];

  switch (mode) {
    case "title-asc":
      return arrayCopy.sort((a, b) => compareText(a.title, b.title));
    case "title-desc":
      return arrayCopy.sort((a, b) => compareText(b.title, a.title));
    case "author-asc":
      return arrayCopy.sort((a, b) => compareText(a.author, b.author));
    case "author-desc":
      return arrayCopy.sort((a, b) => compareText(b.author, a.author));
    case "rating-desc":
      return arrayCopy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "rating-asc":
      return arrayCopy.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    default:
      return arrayCopy;
  }
}

export function selectFilteredBooks(books, currentFilter) {
  return books.filter((book) =>
    currentFilter === "All" ? true : book.status === currentFilter,
  );
}

export function selectSearchedBooks(books, searchQuery) {
  const normalizedQuery = normalize(searchQuery);
  if (!normalizedQuery) return books;

  return books.filter((book) => {
    return (
      normalize(book.title).includes(normalizedQuery) ||
      normalize(book.author).includes(normalizedQuery)
    );
  });
}

export function selectPagedBooks(books, currentPage, pageSize) {
  const totalPages = Math.max(1, Math.ceil(books.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const pageItems = books.slice(startIndex, startIndex + pageSize);

  return { pageItems, totalPages, safePage };
}
