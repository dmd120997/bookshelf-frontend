export const Status = {
  READING: "Reading",
  READ: "Read",
  WANT_TO_READ: "Want to Read",
  DNF: "DNF",
};

export const defaultBooks = [
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
