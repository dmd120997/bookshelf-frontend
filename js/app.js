import { Status, defaultBooks } from "./constants.js";
import {
  loadBooks,
  saveBooks as persistBooks,
  loadUiState,
  saveUiState,
} from "./storage.js";

let books = loadBooks(defaultBooks);
let editingBook = null;

let { currentFilter, currentPage } = loadUiState();
const pageSize = 5;

const container = document.getElementById("book-container");
const form = document.getElementById("book-form");
const submitBtn = form.querySelector('button[type="submit"]');
const paginationEl = document.getElementById("pagination");

function saveBooks() {
  persistBooks(books);
}

function setActiveFilterButton(filter) {
  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

function renderBooks(filter = currentFilter, page = currentPage) {
  currentFilter = filter;
  currentPage = page;

  saveUiState({ currentFilter, currentPage });

  container.innerHTML = "";

  const filtered = books.filter((b) =>
    filter === "All" ? true : b.status === filter,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  pageItems.forEach((book) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      

      <p class="rating-text">${
        book.rating > 0 ? `${book.rating} / 5 ⭐` : "not rated ⭐"
      }</p>

     <div class="status-row">
  <span class="badge badge--${book.status.split(" ").join("-")}">${book.status}</span>
</div>



      <div class="rating-stars">
        <span data-value="1">☆</span>
        <span data-value="2">☆</span>
        <span data-value="3">☆</span>
        <span data-value="4">☆</span>
        <span data-value="5">☆</span>
      </div>

      
      <div class="card-actions">
  <button class="icon-btn edit-btn" title="Edit">✏️</button>
  <button class="icon-btn delete-btn" title="Delete">🗑️</button>
</div>

    `;

    card.addEventListener("dblclick", (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest(".rating-stars") ||
        e.target.closest("select")
      )
        return;

      editingBook = null;
      submitBtn.textContent = "Add book";
      form.reset();

      enterInlineEdit(card, book);
    });

    const stars = card.querySelectorAll(".rating-stars span");

    function updateStars() {
      stars.forEach((star) => {
        star.textContent =
          Number(star.dataset.value) <= book.rating ? "★" : "☆";
      });

      card.querySelector(".rating-text").textContent =
        book.rating > 0 ? `${book.rating} / 5 ⭐` : "not rated ⭐";
    }

    updateStars();

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        book.rating = Number(star.dataset.value);
        saveBooks();
        updateStars();
      });
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      books = books.filter((b) => b !== book);

      if (editingBook === book) {
        editingBook = null;
        submitBtn.textContent = "Add book";
        form.reset();
      }

      saveBooks();
      renderBooks(currentFilter, currentPage);
    });

    card.querySelector(".edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      enterInlineEdit(card, book);
    });

    container.appendChild(card);
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  paginationEl.innerHTML = "";

  const createBtn = (
    label,
    onClick,
    { active = false, disabled = false } = {},
  ) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (active) btn.classList.add("active");
    btn.disabled = disabled;
    btn.addEventListener("click", onClick);
    return btn;
  };

  const createDots = () => {
    const span = document.createElement("span");
    span.textContent = "...";
    span.className = "dots";
    return span;
  };

  paginationEl.appendChild(
    createBtn("Prev", () => renderBooks(currentFilter, currentPage - 1), {
      disabled: currentPage === 1,
    }),
  );

  if (totalPages <= 5) {
    for (let p = 1; p <= totalPages; p++) {
      paginationEl.appendChild(
        createBtn(String(p), () => renderBooks(currentFilter, p), {
          active: p === currentPage,
        }),
      );
    }

    paginationEl.appendChild(
      createBtn("Next", () => renderBooks(currentFilter, currentPage + 1), {
        disabled: currentPage === totalPages,
      }),
    );
    return;
  }

  paginationEl.appendChild(
    createBtn("1", () => renderBooks(currentFilter, 1), {
      active: currentPage === 1,
    }),
  );

  const leftWindowStart = Math.max(2, currentPage - 1);
  const leftWindowHasGap = leftWindowStart > 2;
  if (leftWindowHasGap) paginationEl.appendChild(createDots());

  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  for (let p = windowStart; p <= windowEnd; p++) {
    paginationEl.appendChild(
      createBtn(String(p), () => renderBooks(currentFilter, p), {
        active: p === currentPage,
      }),
    );
  }

  const rightWindowEnd = Math.min(totalPages - 1, currentPage + 1);
  const rightWindowHasGap = rightWindowEnd < totalPages - 1;
  if (rightWindowHasGap) paginationEl.appendChild(createDots());

  paginationEl.appendChild(
    createBtn(
      String(totalPages),
      () => renderBooks(currentFilter, totalPages),
      {
        active: currentPage === totalPages,
      },
    ),
  );

  paginationEl.appendChild(
    createBtn("Next", () => renderBooks(currentFilter, currentPage + 1), {
      disabled: currentPage === totalPages,
    }),
  );
}

function enterInlineEdit(card, book) {
  if (card.dataset.editing === "1") return;

  card.dataset.editing = "1";
  card.classList.add("editing");

  const prev = { title: book.title, author: book.author, status: book.status };

  const editor = document.createElement("div");
  editor.className = "inline-editor";
  editor.innerHTML = `
    <input class="edit-title" type="text" value="${escapeHtml(book.title)}" />
    <input class="edit-author" type="text" value="${escapeHtml(book.author)}" />
    <select class="edit-status">
      <option value="Reading">Reading</option>
      <option value="Read">Read</option>
      <option value="Want to Read">Want to Read</option>
    </select>

    <div class="inline-actions">
      <button class="inline-save">Save</button>
      <button class="inline-cancel">Cancel</button>
    </div>
  `;

  editor.querySelector(".edit-status").value = book.status;
  card.prepend(editor);

  const titleInput = editor.querySelector(".edit-title");
  const authorInput = editor.querySelector(".edit-author");
  const statusSelect = editor.querySelector(".edit-status");

  const controller = new AbortController();

  const cleanup = () => {
    controller.abort();
    card.dataset.editing = "0";
    card.classList.remove("editing");
    editor.remove();
  };

  const save = () => {
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const status = statusSelect.value;

    if (!title || !author) {
      alert("Title and author are required");
      return;
    }

    book.title = title;
    book.author = author;
    book.status = status;

    saveBooks();
    renderBooks(currentFilter, currentPage);
  };

  const cancel = () => {
    book.title = prev.title;
    book.author = prev.author;
    book.status = prev.status;
    cleanup();
  };

  editor.addEventListener("pointerdown", (e) => e.stopPropagation(), {
    signal: controller.signal,
  });

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!card.contains(e.target)) {
        cancel(); // save() for saving
      }
    },
    { capture: true, signal: controller.signal },
  );

  editor
    .querySelector(".inline-save")
    .addEventListener("click", save, { signal: controller.signal });
  editor
    .querySelector(".inline-cancel")
    .addEventListener("click", cancel, { signal: controller.signal });

  editor.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") cancel();
    },
    { signal: controller.signal },
  );

  titleInput.focus();
  titleInput.select();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

  if (!title || !author) return;

  if (editingBook) {
    editingBook.title = title;
    editingBook.author = author;
    editingBook.status = status;

    editingBook = null;
    submitBtn.textContent = "Add book";
  } else {
    const newBook = { title, author, status, rating: 0 };
    books.push(newBook);

    saveBooks();

    const filtered = books.filter((b) =>
      currentFilter === "All" ? true : b.status === currentFilter,
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = totalPages;

    renderBooks(currentFilter, currentPage);
    form.reset();
    return;
  }

  saveBooks();
  renderBooks(currentFilter, currentPage);
  form.reset();
});

document.querySelectorAll(".filters button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    setActiveFilterButton(filter);
    renderBooks(filter, 1);
  });
});

const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.dataset.theme = savedTheme;
  themeToggle.textContent = savedTheme === "dark" ? "🌙" : "☀️";

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";

    document.body.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    themeToggle.textContent = nextTheme === "dark" ? "🌙" : "☀️";
  });
}

setActiveFilterButton(currentFilter);
renderBooks(currentFilter, currentPage);
