import type { BookStatus, ListBooksQuery } from "./books.types";

const allowedStatuses: BookStatus[] = ["Reading", "Read", "Want to Read", "DNF"];

type NormalizedListBooksQuery = {
  status?: BookStatus;
  search: string;
  sort: NonNullable<ListBooksQuery["sort"]>;
  page: number;
  pageSize: number;
};

export function parseListBooksQuery(rawQuery: any): NormalizedListBooksQuery {
  const page = clampInt(rawQuery.page, 1, 10_000, 1);
  const pageSize = clampInt(rawQuery.pageSize, 1, 100, 5);

  const statusRaw = typeof rawQuery.status === "string" ? rawQuery.status : undefined;
  const status =
    statusRaw && allowedStatuses.includes(statusRaw as BookStatus)
      ? (statusRaw as BookStatus)
      : undefined;

  const search = typeof rawQuery.search === "string" ? rawQuery.search.trim() : "";

  const sortRaw = typeof rawQuery.sort === "string" ? rawQuery.sort : "title-asc";
  const allowedSorts = new Set([
    "title-asc",
    "title-desc",
    "author-asc",
    "author-desc",
    "rating-asc",
    "rating-desc",
  ]);

  const sort = (allowedSorts.has(sortRaw) ? sortRaw : "title-asc") as NonNullable<
    ListBooksQuery["sort"]
  >;

  return {
    status,
    search,
    sort,
    page,
    pageSize,
  };
}

function clampInt(value: any, min: number, max: number, fallback: number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const intValue = Math.trunc(num);
  if (intValue < min) return min;
  if (intValue > max) return max;
  return intValue;
}

export function validateCreateBook(body: any) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const author = typeof body?.author === "string" ? body.author.trim() : "";
  const status = typeof body?.status === "string" ? body.status : "Reading";
  const rating = typeof body?.rating === "number" ? body.rating : 0;

  if (!title) return { ok: false as const, message: "title is required" };
  if (!author) return { ok: false as const, message: "author is required" };
  if (!allowedStatuses.includes(status as BookStatus)) return { ok: false as const, message: "invalid status" };
  if (!Number.isInteger(rating) || rating < 0 || rating > 5) return { ok: false as const, message: "invalid rating" };

  const normalizedRating = status === "Want to Read" ? 0 : rating;

  return {
    ok: true as const,
    value: { title, author, status: status as BookStatus, rating: normalizedRating },
  };
}

export function validateUpdateBook(body: any) {
  const updates: any = {};

  if (body?.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return { ok: false as const, message: "title must be non-empty string" };
    updates.title = title;
  }

  if (body?.author !== undefined) {
    const author = typeof body.author === "string" ? body.author.trim() : "";
    if (!author) return { ok: false as const, message: "author must be non-empty string" };
    updates.author = author;
  }

  if (body?.status !== undefined) {
    if (typeof body.status !== "string" || !allowedStatuses.includes(body.status as BookStatus)) {
      return { ok: false as const, message: "invalid status" };
    }
    updates.status = body.status as BookStatus;
  }

  if (body?.rating !== undefined) {
    const rating = body.rating;
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      return { ok: false as const, message: "invalid rating" };
    }
    updates.rating = rating;
  }


  if (updates.status === "Want to Read") {
    updates.rating = 0;
  }

   if (Object.keys(updates).length === 0) {
    return { ok: false as const, message: "no updates provided" };
  }

  return { ok: true as const, value: updates };
}

// function clampInt(value: any, min: number, max: number, fallback: number) {
//   const num = Number(value);
//   if (!Number.isFinite(num)) return fallback;
//   const intValue = Math.trunc(num);
//   if (intValue < min) return min;
//   if (intValue > max) return max;
//   return intValue;
// }