// Dashboard staf. Semua alur backend dipertahankan dari versi asli:
// getDashboardStats, getLoans, getPublicCatalog, getCopies, getMembers, addMember, addBook,
// getFines, payFine, getReservations, cancelReservation, getReport
// + CirculationController.borrowBook / returnBook (assets/js/circulation.js).
AppNav.render();
(function () {
  const me = Auth.guard(["Superadmin", "Admin Perpustakaan", "Petugas"]);
  if (!me) return;
  const $ = id => document.getElementById(id), e = UI.esc;

  /* ---------- helper tampilan ---------- */
  const BADGE = {
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bad: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200"
  };
  const badge = (t, k) => '<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ' + (BADGE[k] || BADGE.neutral) + '">' + e(t) + '</span>';
  const loanBadge = s => badge(s, s === "Dipinjam" ? "warn" : "ok");
  const BTN_P = "px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50";
  const BTN_L = "px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50";
  const TD = "px-6 py-3";
  const table = (heads, rows, emptyMsg) => rows.length
    ? '<div class="overflow-x-auto"><table class="w-full text-left text-sm text-slate-600"><thead class="bg-slate-50 text-slate-700 text-xs uppercase border-b border-slate-200"><tr>' +
      heads.map(h => '<th class="px-6 py-3">' + h + '</th>').join("") +
      '</tr></thead><tbody class="divide-y divide-slate-200">' + rows.join("") + '</tbody></table></div>'
    : '<div class="px-6 py-10 text-center text-sm text-slate-500">' + emptyMsg + '</div>';

  /* ---------- tab ---------- */
  const TAB_BASE = "px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ";
  const TAB_ON = "border-blue-600 text-blue-600", TAB_OFF = "border-transparent text-slate-500 hover:text-slate-800";
  const loaders = {
    circ: () => { loadLoans(); loadCopies(); },
    members: loadMembers, fines: loadFines, resv: loadResv, report: loadReport
  };
  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
    const t = b.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach(x => {
      x.className = TAB_BASE + (x === b ? TAB_ON : TAB_OFF);
    });
    document.querySelectorAll("[data-view]").forEach(v => v.classList.toggle("hidden", v.dataset.view !== t));
    if (loaders[t]) loaders[t]();
  });

  /* ---------- ringkasan ---------- */
  async function loadStats() {
    const r = await LibraryAPI.call("getDashboardStats");
    if (!r.success) {
      if (/Akses|Sesi/.test(r.message || "")) { UI.toast("Sesi berakhir, silakan masuk lagi.", "err"); setTimeout(Auth.logout, 1200); }
      else UI.toast(r.message, "err");
      return;
    }
    const d = r.data;
    $("stat-total-books").textContent = d.booksCount;
    $("stat-borrowed").textContent = d.activeLoans;
    $("stat-members").textContent = d.membersCount;
    $("stat-fines").textContent = UI.rupiah(d.unpaidFines);
  }

  async function loadInventory() {
    const r = await LibraryAPI.call("getPublicCatalog");
    if (!r.success) { UI.toast(r.message, "err"); return; }
    $("dashboard-books-table").innerHTML = r.data.length
      ? r.data.map(b => {
          const ok = Number(b.available_copies) > 0;
          const sub = [b.author, b.shelf_location].filter(Boolean).map(e).join(" &middot; ");
          return '<tr class="hover:bg-slate-50"><td class="' + TD + ' font-medium text-slate-900">' + e(b.title) +
            (sub ? '<div class="text-xs text-slate-400 font-normal">' + sub + '</div>' : "") + '</td>' +
            '<td class="' + TD + '">' + e(b.category || "Umum") + '</td>' +
            '<td class="' + TD + '">' + badge(b.available_copies + " / " + b.total_copies, ok ? "ok" : "warn") + '</td>' +
            '<td class="' + TD + ' text-right"><a href="book-detail.html?id=' + encodeURIComponent(b.book_id) + '" class="text-blue-600 hover:underline font-semibold">Detail</a></td></tr>';
        }).join("")
      : '<tr><td colspan="4" class="px-6 py-10 text-center text-slate-500">Katalog masih kosong. Tambahkan buku pertama lewat tombol di atas.</td></tr>';
  }

  /* ---------- sirkulasi ---------- */
  const LOAN_H = ["Anggota", "Buku", "Pinjam", "Jatuh tempo", "Status"];
  const loanCells = l =>
    '<td class="' + TD + ' font-medium text-slate-900">' + e(l.member) + '</td><td class="' + TD + '">' + e(l.books) +
    '</td><td class="' + TD + '">' + UI.date(l.loan_date) + '</td><td class="' + TD + '">' + UI.date(l.due_date) +
    '</td><td class="' + TD + '">' + loanBadge(l.status) + '</td>';

  async function loadLoans() {
    const r = await LibraryAPI.call("getLoans");
    if (!r.success) { UI.toast(r.message, "err"); return; }
    const d = r.data;
    $("recent").innerHTML = table(LOAN_H, d.slice(0, 6).map(l => '<tr>' + loanCells(l) + '</tr>'), "Belum ada transaksi");
    $("loans").innerHTML = table([...LOAN_H, ""], d.map(l =>
      '<tr>' + loanCells(l) + '<td class="' + TD + ' text-right">' +
      (l.status === "Dipinjam" ? '<button class="' + BTN_P + '" data-ret="' + e(l.loan_id) + '">Kembalikan</button>' : "") +
      '</td></tr>'), "Belum ada transaksi. Catat peminjaman pertama di atas.");
  }

  async function loadCopies() {
    const r = await LibraryAPI.call("getCopies");
    if (!r.success) { UI.toast(r.message, "err"); return; }
    $("copies").innerHTML = table(["Kode", "Judul", "Status"], r.data.map(x =>
      '<tr><td class="' + TD + ' font-mono font-semibold text-slate-900">' + e(x.barcode) + '</td><td class="' + TD + '">' + e(x.title) +
      '</td><td class="' + TD + '">' + badge(x.status, x.status === "Tersedia" ? "ok" : "warn") + '</td></tr>'), "Belum ada eksemplar.");
  }

  $("borrow-form").onsubmit = async ev => {
    ev.preventDefault();
    const f = ev.target, b = f.querySelector("button[type=submit]");
    b.disabled = true;
    const fd = new FormData(f);
    const r = await CirculationController.borrowBook(String(fd.get("m")).trim(), String(fd.get("c")).trim());
    b.disabled = false;
    UI.toast(r.message, r.success ? "" : "err");
    if (r.success) { f.reset(); loadLoans(); loadCopies(); loadInventory(); loadStats(); }
  };

  $("loans").onclick = async ev => {
    const btn = ev.target.closest("[data-ret]"); if (!btn) return;
    btn.disabled = true;
    const r = await CirculationController.returnBook(btn.dataset.ret);
    UI.toast(r.message, r.success ? "" : "err");
    loadLoans(); loadCopies(); loadInventory(); loadStats();
  };

  /* ---------- tambah buku (modal) ---------- */
  const modal = $("book-modal");
  const openModal = () => modal.classList.remove("hidden"), closeModal = () => modal.classList.add("hidden");
  $("add-book-btn").onclick = openModal;
  modal.querySelectorAll("[data-close]").forEach(x => x.onclick = closeModal);
  modal.addEventListener("click", ev => { if (ev.target === modal) closeModal(); });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape") closeModal(); });

  $("book-form").onsubmit = async ev => {
    ev.preventDefault();
    const f = ev.target, b = f.querySelector("button[type=submit]");
    b.disabled = true;
    const r = await LibraryAPI.call("addBook", Object.fromEntries(new FormData(f)));
    b.disabled = false;
    UI.toast(r.message, r.success ? "" : "err");
    if (r.success) { f.reset(); closeModal(); loadInventory(); loadCopies(); loadStats(); }
  };

  /* ---------- anggota ---------- */
  async function loadMembers() {
    const r = await LibraryAPI.call("getMembers");
    if (!r.success) { UI.toast(r.message, "err"); return; }
    $("members-list").innerHTML = table(["No. anggota", "Nama", "Kelas / unit", "Berlaku s.d.", "Status"], r.data.map(m =>
      '<tr><td class="' + TD + ' font-mono font-semibold text-slate-900">' + e(m.member_number) + '</td><td class="' + TD + '">' + e(m.full_name) +
      '</td><td class="' + TD + '">' + e(m.unit_class) + '</td><td class="' + TD + '">' + UI.date(m.expiry_date) +
      '</td><td class="' + TD + '">' + badge(m.status, "ok") + '</td></tr>'),
      "Belum ada anggota. Tambahkan anggota pertama di atas.");
  }

  $("member-form").onsubmit = async ev => {
    ev.preventDefault();
    const f = ev.target, b = f.querySelector("button[type=submit]"), n = $("new-pwd");
    b.disabled = true;
    const r = await LibraryAPI.call("addMember", Object.fromEntries(new FormData(f)));
    b.disabled = false;
    UI.toast(r.success ? "Anggota ditambahkan." : r.message, r.success ? "" : "err");
    if (r.success) { n.classList.remove("hidden"); n.textContent = r.message; f.reset(); loadMembers(); loadStats(); }
    else n.classList.add("hidden");
  };

  /* ---------- denda ---------- */
  async function loadFines() {
    const r = await LibraryAPI.call("getFines");
    if (!r.success) { UI.toast(r.message, "err"); return; }
    $("fines-list").innerHTML = table(["Anggota", "Jumlah", "Alasan", "Tanggal", "Status", ""], r.data.map(f =>
      '<tr><td class="' + TD + ' font-medium text-slate-900">' + e(f.member) + '</td><td class="' + TD + '">' + UI.rupiah(f.amount) +
      '</td><td class="' + TD + '">' + e(f.reason) + '</td><td class="' + TD + '">' + UI.date(f.assigned_date) +
      '</td><td class="' + TD + '">' + badge(f.status, f.status === "Lunas" ? "ok" : "bad") + '</td><td class="' + TD + ' text-right">' +
      (f.status !== "Lunas" ? '<button class="' + BTN_P + '" data-pay="' + e(f.fine_id) + '">Tandai lunas</button>' : "") + '</td></tr>'),
      "Tidak ada denda. Denda muncul otomatis saat buku terlambat dikembalikan.");
  }
  $("fines-list").onclick = async ev => {
    const btn = ev.target.closest("[data-pay]"); if (!btn) return;
    btn.disabled = true;
    const r = await LibraryAPI.call("payFine", { fineId: btn.dataset.pay });
    UI.toast(r.message, r.success ? "" : "err");
    loadFines(); loadStats();
  };

  /* ---------- reservasi ---------- */
  async function loadResv() {
    const r = await LibraryAPI.call("getReservations");
    if (!r.success) { UI.toast(r.message, "err"); return; }
    $("resv-list").innerHTML = table(["Anggota", "Buku", "Tanggal", "Berlaku s.d.", "Status", ""], r.data.map(x =>
      '<tr><td class="' + TD + ' font-medium text-slate-900">' + e(x.member) + '</td><td class="' + TD + '">' + e(x.title) +
      '</td><td class="' + TD + '">' + UI.date(x.reservation_date) + '</td><td class="' + TD + '">' + UI.date(x.expiry_date) +
      '</td><td class="' + TD + '">' + badge(x.status, x.status === "Menunggu" ? "warn" : "neutral") + '</td><td class="' + TD + ' text-right">' +
      (x.status === "Menunggu" ? '<button class="' + BTN_L + '" data-cx="' + e(x.reservation_id) + '">Batalkan</button>' : "") + '</td></tr>'),
      "Belum ada reservasi. Anggota bisa reservasi dari halaman detail buku yang sedang dipinjam.");
  }
  $("resv-list").onclick = async ev => {
    const btn = ev.target.closest("[data-cx]"); if (!btn) return;
    btn.disabled = true;
    const r = await LibraryAPI.call("cancelReservation", { reservationId: btn.dataset.cx });
    UI.toast(r.message, r.success ? "" : "err");
    loadResv();
  };

  /* ---------- laporan ---------- */
  let repRows = [];
  async function loadReport() {
    const fd = new FormData($("report-form"));
    const r = await LibraryAPI.call("getReport", { from: fd.get("from") || "", to: fd.get("to") || "" });
    if (!r.success) { UI.toast(r.message, "err"); return; }
    const d = r.data, s = d.summary;
    repRows = d.rows;
    $("report-chips").innerHTML = [
      ["Total transaksi", s.total], ["Dikembalikan", s.returned], ["Masih dipinjam", s.active],
      ["Lewat jatuh tempo", s.overdue], ["Total denda", UI.rupiah(s.fines)]
    ].map(x => '<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p class="text-xs font-semibold text-slate-400 uppercase">' + x[0] +
      '</p><b class="block text-2xl font-extrabold text-slate-900 mt-1">' + x[1] + '</b></div>').join("");
    $("report-rows").innerHTML = table(LOAN_H, d.rows.map(l => '<tr>' + loanCells(l) + '</tr>'), "Tidak ada transaksi pada rentang tanggal ini.");
  }
  $("report-form").onsubmit = ev => { ev.preventDefault(); loadReport(); };

  $("csv-btn").onclick = () => {
    if (!repRows.length) { UI.toast("Tampilkan laporan dulu.", "err"); return; }
    const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const rows = [["Anggota", "Buku", "Tanggal pinjam", "Jatuh tempo", "Status"],
      ...repRows.map(l => [l.member, l.books, l.loan_date, l.due_date, l.status])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map(r => r.map(q).join(",")).join("\n")], { type: "text/csv" }));
    a.download = "laporan-peminjaman.csv";
    a.click();
  };

  /* ---------- mulai ---------- */
  loadStats(); loadLoans(); loadInventory();
})();
