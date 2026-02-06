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
const pageSize = 6;


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
    filter === "All" ? true : b.status === filter
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
      <p>Status: ${book.status}</p>

      <p class="rating-text">${
        book.rating > 0 ? `${book.rating} / 5 ⭐` : "not rated ⭐"
      }</p>

      <div class="rating-stars">
        <span data-value="1">☆</span>
        <span data-value="2">☆</span>
        <span data-value="3">☆</span>
        <span data-value="4">☆</span>
        <span data-value="5">☆</span>
      </div>

      <button class="status-btn">Toggle status</button>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    `;

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

    
    card.querySelector(".status-btn").addEventListener("click", () => {
      if (book.status === Status.READ) book.status = Status.READING;
      else if (book.status === Status.READING) book.status = Status.WANT_TO_READ;
      else book.status = Status.READ;

      saveBooks();
      renderBooks(currentFilter, currentPage);
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

    
    card.querySelector(".edit-btn").addEventListener("click", () => {
      editingBook = book;

      document.getElementById("title").value = book.title;
      document.getElementById("author").value = book.author;
      document.getElementById("status").value = book.status;

      submitBtn.textContent = "Save";
      document.getElementById("title").focus();
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
    renderBooks(currentFilter, currentPage - 1)
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
    renderBooks(currentFilter, currentPage + 1)
  );
  paginationEl.appendChild(next);
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


setActiveFilterButton(currentFilter);
renderBooks(currentFilter, currentPage);
