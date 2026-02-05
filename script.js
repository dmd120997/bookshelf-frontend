const Status = {
  READING: "Reading",
  READ: "Read",
  WANT_TO_READ: "Want to Read",
};

const defaultBooks = [
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    status: Status.READING,
    rating: 0,
  },
  {
    title: "Harry Potter",
    author: "J. Rowling",
    status: Status.READ,
    rating: 0,
  },
];

let books = JSON.parse(localStorage.getItem("books")) || defaultBooks;
let editingBook = null;

const paginationEl = document.getElementById("pagination");

let currentFilter = localStorage.getItem("currentFilter") || "All";
let currentPage = Number(localStorage.getItem("currentPage")) || 1;
const pageSize = 6;

const container = document.getElementById("book-container");
const form = document.getElementById("book-form");
const submitBtn = form.querySelector('button[type="submit"]');

function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

function renderBooks(filter = currentFilter, page = currentPage) {
  currentFilter = filter;
  currentPage = page;

  localStorage.setItem("currentFilter", currentFilter);
  localStorage.setItem("currentPage", currentPage);

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
      <p>Status: ${book.status}</p>

      <p class="rating-text">${book.rating > 0 ? `${book.rating} / 5 ⭐` : "not rated ⭐"}</p>

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
      else if (book.status === Status.READING)
        book.status = Status.WANT_TO_READ;
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
    renderBooks(currentFilter, currentPage - 1),
  );
  paginationEl.appendChild(prev);

  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement("button");
    btn.textContent = p;
    if (p === currentPage) btn.classList.add("active");
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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

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
  if (btn.dataset.filter === currentFilter) {
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    document
      .querySelectorAll(".filters button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderBooks(filter, 1);
  });
});

renderBooks();
