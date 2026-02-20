import { Router } from "express";
import { createBook, deleteBook, listBooks, updateBook } from "./books.repo";
import { parseListBooksQuery, validateCreateBook, validateUpdateBook } from "./books.validators";

export const booksRouter = Router();

booksRouter.get("/", async (req, res, next) => {
  try {
    const query = parseListBooksQuery(req.query);
    const { data, total } = await listBooks(query);

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

    res.json({
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
});

booksRouter.post("/", async (req, res, next) => {
  try {
    const validation = validateCreateBook(req.body);
    if (!validation.ok) return res.status(400).json({ message: validation.message });

    const created = await createBook(validation.value);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

booksRouter.patch("/:id", async (req, res, next) => {
  try {
    const bookId = String(req.params.id || "").trim();
    if (!bookId) return res.status(400).json({ message: "id is required" });

    const validation = validateUpdateBook(req.body);
    if (!validation.ok) return res.status(400).json({ message: validation.message });

    const updated = await updateBook(bookId, validation.value);
    if (!updated) return res.status(404).json({ message: "Book not found" });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

booksRouter.delete("/:id", async (req, res, next) => {
  try {
    const bookId = String(req.params.id || "").trim();
    if (!bookId) return res.status(400).json({ message: "id is required" });

    const ok = await deleteBook(bookId);
    if (!ok) return res.status(404).json({ message: "Book not found" });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});