import { pool } from "../db";
import type { Book, BookStatus, ListBooksQuery } from "./books.types";

function mapRow(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    status: row.status,
    rating: Number(row.rating),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildSort(sort: ListBooksQuery["sort"]) {
  switch (sort) {
    case "title-desc":
      return `title DESC`;
    case "author-asc":
      return `author ASC`;
    case "author-desc":
      return `author DESC`;
    case "rating-asc":
      return `rating ASC, title ASC`;
    case "rating-desc":
      return `rating DESC, title ASC`;
    case "title-asc":
    default:
      return `title ASC`;
  }
}

export async function listBooks(query: {
  status?: BookStatus;
  search: string;
  sort: NonNullable<ListBooksQuery["sort"]>;
  page: number;
  pageSize: number;
}) {
  const where: string[] = [];
  const params: any[] = [];

  if (query.status) {
    params.push(query.status);
    where.push(`status = $${params.length}`);
  }

  if (query.search) {
    params.push(`%${query.search}%`);
    params.push(`%${query.search}%`);
    where.push(
      `(title ILIKE $${params.length - 1} OR author ILIKE $${params.length})`,
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = buildSort(query.sort);

  // count
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM books ${whereSql}`,
    params,
  );
  const total = Number(countResult.rows[0]?.total ?? 0);

  const offset = (query.page - 1) * query.pageSize;

  params.push(query.pageSize);
  params.push(offset);

  const dataResult = await pool.query(
    `SELECT id, title, author, status, rating, created_at, updated_at
     FROM books
     ${whereSql}
     ORDER BY ${orderSql}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    data: dataResult.rows.map(mapRow),
    total,
  };
}

export async function createBook(input: {
  title: string;
  author: string;
  status: BookStatus;
  rating: number;
}) {
  const rating = input.status === "Want to Read" ? 0 : input.rating;

  const result = await pool.query(
    `INSERT INTO books (title, author, status, rating)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, author, status, rating, created_at, updated_at`,
    [input.title, input.author, input.status, rating],
  );

  return mapRow(result.rows[0]);
}

export async function updateBook(bookId: string, updates: any) {
  if (updates.status === "Want to Read") updates.rating = 0;

  const keys = Object.keys(updates);
  if (keys.length === 0) return null;

  const setParts: string[] = [];
  const params: any[] = [];

  keys.forEach((key) => {
    params.push(updates[key]);
    setParts.push(`${toSnakeCase(key)} = $${params.length}`);
  });

  params.push(bookId);

  const result = await pool.query(
    `UPDATE books
     SET ${setParts.join(", ")}
     WHERE id = $${params.length}
     RETURNING id, title, author, status, rating, created_at, updated_at`,
    params,
  );

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteBook(bookId: string) {
  const result = await pool.query(
    `DELETE FROM books WHERE id = $1 RETURNING id`,
    [bookId],
  );
  return Boolean(result.rows[0]);
}

function toSnakeCase(camel: string) {
  return camel.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
