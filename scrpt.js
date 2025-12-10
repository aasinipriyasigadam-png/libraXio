// Simple client-side library search + book page (no backend).
// Data is stored in-memory (array). To keep the example focused and simple,
// we include a few sample books. You can extend it or wire up to a server/API.

(() => {
  const sampleBooks = [
    {
      id: "b1",
      title: "Pride and Prejudice",
      author: "Jane Austen",
      isbn: "9780141040349",
      year: 1813,
      cover: "https://covers.openlibrary.org/b/isbn/9780141040349-M.jpg",
      description:
        "A classic novel of manners that charts the emotional development of Elizabeth Bennet."
    },
    {
      id: "b2",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "9780261102217",
      year: 1937,
      cover: "https://covers.openlibrary.org/b/isbn/9780261102217-M.jpg",
      description:
        "Bilbo Baggins goes on an unexpected journey in this prelude to the Lord of the Rings."
    },
    {
      id: "b3",
      title: "Thinking, Fast and Slow",
      author: "Daniel Kahneman",
      isbn: "9780374533557",
      year: 2011,
      cover: "https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg",
      description:
        "A tour of the mind from Nobel laureate Kahneman, exploring the two systems that drive the way we think."
    }
  ];

  // State
  let books = [...sampleBooks];

  // Elements
  const searchInput = document.getElementById("search-input");
  const resultsEl = document.getElementById("results");
  const bookPageEl = document.getElementById("book-page");
  const clearBtn = document.getElementById("clear-btn");
  const addBookForm = document.getElementById("add-book-form");

  // Helpers
  function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function makeCardHTML(book) {
    const cover = book.cover || "";
    return `
      <article class="card" data-id="${book.id}">
        <div class="cover" style="background-image:url('${escapeHtml(cover || "")}');"></div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(book.title)}</h3>
          <div class="card-meta">${escapeHtml(book.author)} • ${escapeHtml(String(book.year || ""))}</div>
          <div class="card-actions">
            <button class="btn open-btn" data-id="${book.id}">Open page</button>
            <button class="btn secondary copy-btn" data-isbn="${escapeHtml(book.isbn || "")}">Copy ISBN</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderResults(list) {
    if (!list.length) {
      resultsEl.innerHTML = `<div class="card" style="padding:18px"><strong>No books found</strong><div class="help">Try different keywords or add a sample book below.</div></div>`;
      return;
    }
    resultsEl.innerHTML = list.map(makeCardHTML).join("");
  }

  function getQueryMatches(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return books.slice();
    return books.filter((b) => {
      return (
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    });
  }

  function openBookPageById(id) {
    const book = books.find((b) => b.id === id);
    if (!book) {
      history.replaceState(null, "", location.pathname);
      hideBookPage();
      return;
    }
    renderBookPage(book);
    // update URL hash so users can share / bookmark
    location.hash = `book-${id}`;
  }

  function renderBookPage(book) {
    bookPageEl.classList.remove("hidden");
    const cover = book.cover || "";
    bookPageEl.innerHTML = `
      <div class="book-page-inner">
        <div class="top">
          <div class="book-cover-large" style="background-image:url('${escapeHtml(cover)}')"></div>
          <div class="details">
            <h2 id="book-title">${escapeHtml(book.title)}</h2>
            <div class="meta">${escapeHtml(book.author)} • ${escapeHtml(String(book.year || ""))}</div>
            <div class="meta">ISBN: <strong>${escapeHtml(book.isbn || "—")}</strong></div>
            <p>${escapeHtml(book.description || "No description provided.")}</p>
            <div style="margin-top:12px;display:flex;gap:8px">
              <button class="btn go-back">Back to results</button>
              <a class="btn secondary" href="#" id="open-external">Open external (Open Library)</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // set external link to Open Library / ISBN if present
    const ext = document.getElementById("open-external");
    if (book.isbn) {
      ext.href = `https://openlibrary.org/isbn/${encodeURIComponent(book.isbn)}`;
      ext.target = "_blank";
    } else {
      ext.style.display = "none";
    }

    bookPageEl.querySelector(".go-back").addEventListener("click", (e) => {
      e.preventDefault();
      hideBookPage();
      history.replaceState(null, "", location.pathname);
    });
  }

  function hideBookPage() {
    bookPageEl.classList.add("hidden");
    bookPageEl.innerHTML = "";
  }

  // Event bindings
  searchInput.addEventListener("input", (e) => {
    const q = e.target.value;
    const matches = getQueryMatches(q);
    renderResults(matches);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    renderResults(getQueryMatches(""));
    history.replaceState(null, "", location.pathname);
    hideBookPage();
  });

  resultsEl.addEventListener("click", (e) => {
    const openBtn = e.target.closest(".open-btn");
    const copyBtn = e.target.closest(".copy-btn");
    if (openBtn) {
      const id = openBtn.dataset.id;
      openBookPageById(id);
    } else if (copyBtn) {
      const isbn = copyBtn.dataset.isbn;
      if (isbn) {
        navigator.clipboard?.writeText(isbn).then(() => {
          copyBtn.textContent = "Copied ✓";
          setTimeout(() => (copyBtn.textContent = "Copy ISBN"), 1200);
        }).catch(() => {
          alert("Unable to copy ISBN. Browser blocked clipboard.");
        });
      } else {
        alert("No ISBN available for this book.");
      }
    } else {
      // clicking elsewhere in a card will also open the page
      const card = e.target.closest(".card");
      if (card) {
        const id = card.dataset.id;
        openBookPageById(id);
      }
    }
  });

  // Handle deep links like #book-b2
  function handleHash() {
    const h = location.hash || "";
    if (h.startsWith("#book-")) {
      const id = h.replace("#book-", "");
      const found = books.find((b) => b.id === id);
      if (found) {
        renderBookPage(found);
      } else {
        hideBookPage();
      }
    } else {
      hideBookPage();
    }
  }
  window.addEventListener("hashchange", handleHash);
  // initial hash handling
  handleHash();

  // Add-book form (adds to in-memory list)
  addBookForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(addBookForm);
    const title = fd.get("title").toString().trim();
    const author = fd.get("author").toString().trim();
    const isbn = fd.get("isbn").toString().trim();
    const year = fd.get("year").toString().trim();
    const cover = fd.get("cover").toString().trim();

    const id = "b" + Math.random().toString(36).slice(2, 9);
    const newBook = { id, title, author, isbn, year: year ? Number(year) : undefined, cover: cover || undefined, description: "" };
    books.unshift(newBook);

    addBookForm.reset();
    // show the newly added book in results and open it
    searchInput.value = title.slice(0, 7);
    renderResults(getQueryMatches(searchInput.value));
    openBookPageById(id);
  });

  // Initial render (all)
  renderResults(getQueryMatches(""));

  // Expose for debugging in console (optional)
  window.__LIBRARY = {
    books,
    getQueryMatches,
    openBookPageById,
  };
})();
