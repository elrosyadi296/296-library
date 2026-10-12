// Katalog publik: data dari backend action "getPublicCatalog".
AppNav.render();
(function () {
  const e = UI.esc;
  const grid = document.getElementById("catalog-grid");
  const count = document.getElementById("catalog-count");
  const search = document.getElementById("catalog-search");
  const sortSel = document.getElementById("catalog-sort");
  const catBox = document.getElementById("category-filter-list");
  let books = [], activeCat = "Semua";

  const catOf = b => b.category || "Umum";
  const msg = (title, text) =>
    '<div class="col-span-full text-center py-16 text-slate-500"><b class="block text-slate-800 mb-1">' + title + '</b>' + text + '</div>';

  grid.innerHTML = Array.from({ length: 6 }, () =>
    '<div class="aspect-[3/4] rounded-2xl bg-slate-200 animate-pulse"></div>').join("");

  function drawCategories() {
    const counts = {};
    books.forEach(b => counts[catOf(b)] = (counts[catOf(b)] || 0) + 1);
    const cats = ["Semua", ...Object.keys(counts)];
    catBox.innerHTML = cats.map(c =>
      '<button type="button" data-cat="' + e(c) + '" class="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition ' +
      (c === activeCat ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-600 hover:bg-slate-50") + '">' +
      '<span>' + e(c) + '</span><span class="text-xs text-slate-400">' + (c === "Semua" ? books.length : counts[c]) + '</span></button>').join("");
  }

  function visible() {
    const k = search.value.trim().toLowerCase();
    const list = books.filter(b =>
      (activeCat === "Semua" || catOf(b) === activeCat) &&
      (!k || [b.title, b.author, b.isbn].some(v => String(v || "").toLowerCase().includes(k))));
    if (sortSel.value === "newest") {
      list.sort((a, b) => (Number(b.publish_year) || 0) - (Number(a.publish_year) || 0));
    } else { // populer = paling banyak sedang dipinjam
      const out = x => (Number(x.total_copies) || 0) - (Number(x.available_copies) || 0);
      list.sort((a, b) => out(b) - out(a));
    }
    return list;
  }

  function draw() {
    const list = visible();
    count.textContent = list.length + " buku ditemukan";
    if (!list.length) { grid.innerHTML = msg("Tidak ada buku yang cocok", "Coba kata kunci lain atau ganti kategori."); return; }
    grid.innerHTML = list.map(b => {
      const ok = Number(b.available_copies) > 0;
      return '<a href="book-detail.html?id=' + encodeURIComponent(b.book_id) + '" class="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden flex flex-col">' +
        '<div class="relative aspect-[3/4] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center p-5 text-center text-white font-bold">' +
          '<span>' + e(b.title) + '</span>' +
          (b.cover_url ? '<img src="' + e(b.cover_url) + '" alt="Sampul ' + e(b.title) + '" loading="lazy" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()">' : "") +
        '</div>' +
        '<div class="p-4 flex-1 flex flex-col gap-1.5">' +
          '<span class="text-xs font-semibold text-blue-600">' + e(catOf(b)) + '</span>' +
          '<h3 class="font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition line-clamp-2">' + e(b.title) + '</h3>' +
          '<p class="text-sm text-slate-500">' + e(b.author || "Penulis tidak diketahui") + '</p>' +
          '<span class="mt-auto pt-2"><span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ' +
            (ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200") + '">' +
            (ok ? b.available_copies + " tersedia" : "Sedang dipinjam") + '</span></span>' +
        '</div></a>';
    }).join("");
  }

  search.addEventListener("input", draw);
  sortSel.addEventListener("change", draw);
  catBox.addEventListener("click", ev => {
    const b = ev.target.closest("[data-cat]"); if (!b) return;
    activeCat = b.dataset.cat; drawCategories(); draw();
  });

  (async () => {
    const r = await LibraryAPI.call("getPublicCatalog");
    if (!r.success) {
      grid.innerHTML = msg("Katalog belum bisa dimuat", e(r.message || "") + " Periksa koneksi lalu muat ulang halaman.");
      count.textContent = ""; return;
    }
    books = r.data || [];
    drawCategories(); draw();
  })();
})();
