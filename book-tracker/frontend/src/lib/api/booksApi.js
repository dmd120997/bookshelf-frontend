const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request(path, options) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function getBooks({
  status,
  search,
  sort,
  page,
  pageSize,
} = {}) {
  const params = new URLSearchParams();

  if (status && status !== "All") params.set("status", status);
  if (search) params.set("search", search);
  if (sort) params.set("sort", sort);
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));

  const queryString = params.toString();
  return request(`/api/books${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}

export async function createBook(payload) {
  return request("/api/books", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBook(bookId, payload) {
  return request(`/api/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteBook(bookId) {
  return request(`/api/books/${bookId}`, {
    method: "DELETE",
  });
}