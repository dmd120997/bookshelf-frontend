export default function Pagination({ currentPage, totalPages, onChangePage }) {
  const pages = [];

  const addPage = (page) => pages.push({ type: "page", page });
  const addDots = (key) => pages.push({ type: "dots", key });

  if (totalPages <= 5) {
    for (let page = 1; page <= totalPages; page++) addPage(page);
  } else {
    addPage(1);

    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);

    if (windowStart > 2) addDots("left");
    for (let page = windowStart; page <= windowEnd; page++) addPage(page);
    if (windowEnd < totalPages - 1) addDots("right");

    addPage(totalPages);
  }

  return (
    <div className="pagination" role="navigation" aria-label="Pagination">
      <button
        type="button"
        className="page-btn"
        disabled={currentPage === 1}
        onClick={() => onChangePage(currentPage - 1)}
      >
        Prev
      </button>

      {pages.map((item) => {
        if (item.type === "dots") {
          return (
            <span key={item.key} className="dots">
              ...
            </span>
          );
        }

        return (
          <button
            key={item.page}
            type="button"
            className={`page-btn ${item.page === currentPage ? "active" : ""}`}
            onClick={() => onChangePage(item.page)}
          >
            {item.page}
          </button>
        );
      })}

      <button
        type="button"
        className="page-btn"
        disabled={currentPage === totalPages}
        onClick={() => onChangePage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
