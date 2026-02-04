const defaultBooks = [
  { title: "The Hobbit", author: "J.R.R. Tolkien", status: "Reading" },
  { title: "Harry Potter", author: "J. Rowling", status: "Read" },
];

let books = JSON.parse(localStorage.getItem("books")) || defaultBooks;

function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

const container = document.getElementById("book-container");

const form = document.getElementById("book-form");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const status = document.getElementById("status").value;

  const newBook = {
    title,
    author,
    status,
  };

  books.push(newBook);
  saveBooks();

  const currentFilter = localStorage.getItem("selectedFilter") || "All";

  renderBooks(currentFilter);
  form.reset();
});

function renderBooks(filter = "All") {
  container.innerHTML = "";

  const filtered = books.filter((b) =>
    filter === "All" ? true : b.status === filter,
  );

  filtered.forEach((book) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <p>Status: ${book.status}</p>
      <button class="status-btn">Toggle status</button>
      <button class="delete-btn">Delete</button>
      <button class="edit-btn">Edit</button>
    `;

    const statusBtn = card.querySelector(".status-btn");
    const editBtn = card.querySelector(".edit-btn");

    const deleteBtn = card.querySelector(".delete-btn");

    editBtn.addEventListener("click", () => {
      card.innerHTML = `
    <input class="edit-title" value="${book.title}" />
    <input class="edit-author" value="${book.author}" />

    <select class="edit-status">
      <option value="Reading">Reading</option>
      <option value="Read">Read</option>
      <option value="Want to Read">Want to Read</option>
    </select>

    <button class="save-btn">Save</button>
    <button class="cancel-btn">Cancel</button>
  `;

      card.querySelector(".edit-status").value = book.status;

      card.querySelector(".save-btn").addEventListener("click", () => {
        book.title = card.querySelector(".edit-title").value;
        book.author = card.querySelector(".edit-author").value;
        book.status = card.querySelector(".edit-status").value;

        saveBooks();
        renderBooks(filter);
      });

      card.querySelector(".cancel-btn").addEventListener("click", () => {
        renderBooks(filter);
      });
    });

    statusBtn.addEventListener("click", () => {
      if (book.status === "Read") book.status = "Reading";
      else if (book.status === "Reading") book.status = "Want to Read";
      else book.status = "Read";

      saveBooks();
      renderBooks(filter);
    });
    deleteBtn.addEventListener("click", () => {
      books = books.filter((b) => b !== book);
      saveBooks();
      renderBooks(filter);
    });

    container.appendChild(card);
  });
}

function setActiveButton(filter) {
  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

document.querySelectorAll(".filters button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;

    localStorage.setItem("selectedFilter", filter);
    setActiveButton(filter);
    renderBooks(filter);
  });
});

const savedFilter = localStorage.getItem("selectedFilter") || "All";
setActiveButton(savedFilter);
renderBooks(savedFilter);
