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

  const prev = document.createElement("button");
  prev.textContent = "Prev";
  prev.disabled = currentPage === 1;
  prev.addEventListener("click", () =>
    renderBooks(currentFilter, currentPage - 1),
  );
  paginationEl.appendChild(prev);

  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement("button");
    btn.textContent = p;
    btn.classList.toggle("active", p === currentPage);
    btn.addEventListener("click", () => renderBooks(currentFilter, p));
    paginationEl.appendChild(btn);
  }

  const next = document.createElement("button");
  next.textContent = "Next";
  next.disabled = currentPage === totalPages;
  next.addEventListener("click", () =>
    renderBooks(currentFilter, currentPage + 1),
  );
  paginationEl.appendChild(next);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    books.push({ title, author, status, rating: 0 });
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
    const nextTheme =
      document.body.dataset.theme === "dark" ? "light" : "dark";

    document.body.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    themeToggle.textContent = nextTheme === "dark" ? "🌙" : "☀️";
  });
}


setActiveFilterButton(currentFilter);
renderBooks(currentFilter, currentPage);



