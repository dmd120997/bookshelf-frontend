export type BookStatus = "Reading" | "Read" | "Want to Read" | "DNF";

export type Book = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: number;
  createdAt: string;
  updatedAt: string;
};

export type ListBooksQuery = {
  status?: BookStatus;
  search?: string;
  sort?: "title-asc" | "title-desc" | "author-asc" | "author-desc" | "rating-asc" | "rating-desc";
  page?: number;
  pageSize?: number;
};