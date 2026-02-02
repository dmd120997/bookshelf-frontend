const books = [
  { title: "The Hobbit", author: "J.R.R. Tolkien", status: "Reading" },
  { title: "Harry Potter", author: "J. Rowling", status: "Read" },
];

const container = document.getElementById("book-container");

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
    `;
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
