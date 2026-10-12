// Detail buku: data dari "getPublicCatalog", reservasi lewat "createReservation".
AppNav.render();
(async function () {
  const e = UI.esc, box = document.getElementById("book-detail-container");
  const note = (t, s) => '<div class="text-center py-12 text-slate-500"><b class="block text-slate-800 mb-1">' + t + '</b>' + s + '</div>';
  box.innerHTML = '<div class="h-80 rounded-xl bg-slate-100 animate-pulse"></div>';

  const id = new URLSearchParams(location.search).get("id");
  if (!id) { box.innerHTML = note("Buku tidak ditentukan", "Pilih buku dari katalog."); return; }

  const r = await LibraryAPI.call("getPublicCatalog");
  if (!r.success) { box.innerHTML = note("Gagal memuat data", e(r.message || "")); return; }
  const b = (r.data || []).find(x => x.book_id === id);
  if (!b) { box.innerHTML = note("Buku tidak ditemukan", "Mungkin sudah dinonaktifkan dari katalog."); return; }

  document.title = b.title + " - Literasi MTs YAPIKA";
  const ok = Number(b.available_copies) > 0;
  const fact = (k, v) => '<div class="p-3 rounded-xl bg-slate-50 border border-slate-200"><small class="block text-xs text-slate-400 uppercase font-semibold">' + k + '</small><b class="text-sm text-slate-800">' + v + '</b></div>';

  let action = "";
  if (!ok) {
    action = Auth.user()
      ? '<button id="rsv" class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition disabled:opacity-50">Reservasi buku ini</button>'
      : '<a href="login.html" class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition">Masuk untuk reservasi</a>';
  }
  if (b.digital_url) {
    action += ' <a href="' + e(b.digital_url) + '" target="_blank" rel="noopener" class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition">Baca versi digital</a>';
  }

  box.innerHTML =
    '<div class="grid grid-cols-1 md:grid-cols-3 gap-8">' +
      '<div class="relative aspect-[3/4] rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center p-6 text-center text-white text-xl font-bold shadow-lg overflow-hidden">' +
        '<span>' + e(b.title) + '</span>' +
        (b.cover_url ? '<img src="' + e(b.cover_url) + '" alt="Sampul ' + e(b.title) + '" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()">' : "") +
      '</div>' +
      '<div class="md:col-span-2">' +
        '<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">' + e(b.category || "Umum") + '</span>' +
        '<h1 class="text-3xl font-bold text-slate-900 mt-3">' + e(b.title) + '</h1>' +
        (b.subtitle ? '<p class="text-lg text-slate-500 mt-1">' + e(b.subtitle) + '</p>' : "") +
        '<p class="mt-2 text-slate-600">Oleh <b>' + e(b.author || "-") + '</b></p>' +
        '<p class="mt-4"><span class="inline-flex px-3 py-1 rounded-full text-xs font-semibold border ' +
          (ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200") + '">' +
          (ok ? b.available_copies + " dari " + b.total_copies + " eksemplar tersedia" : "Semua eksemplar sedang dipinjam") + '</span></p>' +
        '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">' +
          fact("Penerbit", e(b.publisher || "-") + (b.publish_year ? " (" + e(b.publish_year) + ")" : "")) +
          fact("ISBN", e(b.isbn || "-")) + fact("Halaman", e(b.pages || "-")) +
          fact("Bahasa", e(b.language || "Indonesia")) + fact("Lokasi rak", e(b.shelf_location || "Rak utama")) +
        '</div>' +
        '<h3 class="font-bold text-slate-900 mt-6 mb-2">Sinopsis</h3>' +
        '<p class="text-slate-500 leading-relaxed">' + e(b.description || "Belum ada sinopsis untuk buku ini.") + '</p>' +
        '<div class="mt-6 flex flex-wrap gap-3">' + action + '</div>' +
      '</div></div>';

  const rb = document.getElementById("rsv");
  if (rb) rb.onclick = async () => {
    rb.disabled = true;
    const x = await LibraryAPI.call("createReservation", { bookId: b.book_id });
    UI.toast(x.message, x.success ? "" : "err");
    if (!x.success && /Sesi|login/i.test(x.message || "")) setTimeout(Auth.logout, 1200);
    else rb.disabled = false;
  };
})();
