/* Jembatan UI untuk tampilan Tailwind.
   - Mengganti UI.toast (dari assets/js/ui.js) supaya tampil dengan gaya Tailwind.
     Tanda tangannya sama: UI.toast(pesan, "" | "err"), jadi auth.js dkk tetap jalan.
   - AppNav.render(): status login di header + link menu sesuai peran (pengganti UI.chrome).
   Tidak ada logika backend di file ini. */
(function () {
  if (typeof UI === "undefined") { console.error("assets/js/ui.js belum dimuat"); return; }

  UI.toast = function (message, type) {
    let box = document.getElementById("toast-stack");
    if (!box) {
      box = document.createElement("div");
      box.id = "toast-stack";
      box.className = "fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm";
      document.body.appendChild(box);
    }
    const bad = type === "err" || type === "error";
    const t = document.createElement("div");
    t.className = "px-4 py-3 rounded-xl text-sm font-medium shadow-lg border " +
      (bad ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200");
    t.setAttribute("role", bad ? "alert" : "status");
    t.textContent = message || "";
    box.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  };

  // Peran sesuai alur asli (auth.js / UI.chrome): Anggota -> portal, selain itu -> dashboard.
  const STAFF = ["Superadmin", "Admin Perpustakaan", "Petugas"];
  const homeOf = u => !u ? "login.html" : (u.role === "Anggota" ? "member-portal.html" : "dashboard.html");

  window.AppNav = {
    render() {
      const u = (typeof Auth !== "undefined" && Auth.user) ? Auth.user() : null;

      // Link menu hanya muncul untuk peran yang berhak (menggantikan UI.chrome milik tampilan lama).
      const isStaff = !!u && STAFF.includes(u.role), isMember = !!u && u.role === "Anggota";
      document.querySelectorAll('header a[href="dashboard.html"]').forEach(a => a.classList.toggle("hidden", !isStaff));
      document.querySelectorAll('header a[href="member-portal.html"]').forEach(a => a.classList.toggle("hidden", !isMember));

      const slot = document.getElementById("auth-slot");
      if (!slot || !u) return; // belum login: biarkan tombol "Masuk" bawaan
      slot.innerHTML =
        '<a href="' + homeOf(u) + '" title="Akun saya" class="hidden sm:flex flex-col leading-tight text-right hover:opacity-80">' +
          '<b class="text-sm text-slate-900">' + UI.esc(u.fullName || "Pengguna") + '</b>' +
          '<small class="text-xs text-slate-500">' + UI.esc(u.role || "") + '</small></a>' +
        '<button id="nav-logout" type="button" class="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition">' +
          '<i class="fa-solid fa-right-from-bracket mr-1"></i> Keluar</button>';
      document.getElementById("nav-logout").onclick = () => Auth.logout();
    }
  };
})();
