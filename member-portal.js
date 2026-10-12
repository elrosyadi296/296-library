// Portal anggota: "getMyLoans", "getReservations", "cancelReservation".
AppNav.render();
(function () {
  const me = Auth.guard();
  if (!me) return;
  const e = UI.esc, $ = id => document.getElementById(id);

  const name = me.fullName || "Anggota";
  $("member-name").textContent = name;
  $("member-avatar").textContent = name.trim()[0].toUpperCase();
  // Nomor anggota = username akun (di dashboard: "Username-nya adalah nomor anggota").
  if (me.username) $("member-id").textContent = me.username;
  else $("member-id").parentElement.classList.add("hidden");

  const BADGE = {
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200"
  };
  const badge = (t, k) => '<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ' + BADGE[k] + '">' + e(t) + '</span>';
  const empty = (t, s) => '<div class="text-center py-8 text-slate-500"><b class="block text-slate-800 mb-1">' + t + '</b>' + s + '</div>';
  const row = (title, sub, right) =>
    '<div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200">' +
    '<div><p class="font-semibold text-slate-900">' + title + '</p><p class="text-xs text-slate-500 mt-1">' + sub + '</p></div>' +
    '<div class="flex items-center gap-2">' + right + '</div></div>';

  async function loadLoans() {
    const r = await LibraryAPI.call("getMyLoans");
    const active = $("member-active-loans");
    if (!r.success) { active.innerHTML = empty("Data belum bisa dimuat", e(r.message || "")); return; }

    const open = r.data.filter(l => l.status === "Dipinjam");
    const done = r.data.filter(l => l.status !== "Dipinjam");
    const loanRow = l => row(e(l.books),
      "Dipinjam " + UI.date(l.loan_date) + " &middot; Jatuh tempo " + UI.date(l.due_date),
      badge(l.status, l.status === "Dipinjam" ? "warn" : "ok"));

    active.innerHTML = open.length
      ? open.map(loanRow).join("")
      : empty("Belum ada pinjaman aktif", 'Jelajahi <a href="catalog.html" class="text-blue-600 font-semibold hover:underline">katalog</a> lalu pinjam di meja petugas.');

    $("member-history-card").classList.toggle("hidden", !done.length);
    $("member-loan-history").innerHTML = done.map(loanRow).join("");
  }

  async function loadReservations() {
    const box = $("member-reservations");
    const r = await LibraryAPI.call("getReservations");
    if (!r.success) { box.innerHTML = empty("Data belum bisa dimuat", e(r.message || "")); return; }
    box.innerHTML = r.data.length
      ? r.data.map(x => row(e(x.title),
          "Tanggal " + UI.date(x.reservation_date) + " &middot; Berlaku s.d. " + UI.date(x.expiry_date),
          badge(x.status, x.status === "Menunggu" ? "warn" : "neutral") +
          (x.status === "Menunggu"
            ? '<button data-cx="' + e(x.reservation_id) + '" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50">Batalkan</button>'
            : ""))).join("")
      : empty("Belum ada reservasi", "Buku yang sedang dipinjam bisa kamu reservasi dari halaman detailnya.");
  }

  $("member-reservations").onclick = async ev => {
    const btn = ev.target.closest("[data-cx]"); if (!btn) return;
    btn.disabled = true;
    const r = await LibraryAPI.call("cancelReservation", { reservationId: btn.dataset.cx });
    UI.toast(r.message, r.success ? "" : "err");
    loadReservations();
  };

  loadLoans();
  loadReservations();
})();
