/* Jembatan UI untuk tampilan Tailwind.
   - Mengganti UI.toast (dari assets/js/ui.js) supaya tampil dengan gaya Tailwind.
     Tanda tangannya sama: UI.toast(pesan, "" | "err"), jadi auth.js dkk tetap jalan.
   - AppNav.render(): menu pengguna di header (Dashboard/Portal, Pengaturan Akun, Keluar)
     + link menu sesuai peran (pengganti UI.chrome).
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

      const name = u.fullName || "Pengguna";
      const item = "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-slate-50 transition";
      slot.classList.add("relative");
      slot.innerHTML =
        '<button id="nav-user" type="button" aria-haspopup="menu" aria-expanded="false" class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition">' +
          '<span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">' + UI.esc(name.trim().charAt(0).toUpperCase()) + '</span>' +
          '<span class="hidden sm:flex flex-col leading-tight text-left"><b class="text-sm text-slate-900 max-w-[9rem] truncate">' + UI.esc(name) + '</b>' +
          '<small class="text-xs text-slate-500">' + UI.esc(u.role || "") + '</small></span>' +
          '<i class="fa-solid fa-chevron-down text-xs text-slate-400"></i></button>' +
        '<div id="nav-menu" role="menu" class="hidden absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-50">' +
          '<div class="px-4 py-3 border-b border-slate-100 sm:hidden"><b class="block text-sm text-slate-900 truncate">' + UI.esc(name) + '</b><small class="text-xs text-slate-500">' + UI.esc(u.role || "") + '</small></div>' +
          '<a role="menuitem" href="' + homeOf(u) + '" class="' + item + '"><i class="fa-solid ' + (isMember ? "fa-id-card" : "fa-chart-pie") + ' w-4 text-slate-400"></i>' + (isMember ? "Portal Anggota" : "Dashboard") + '</a>' +
          '<a role="menuitem" href="account.html" class="' + item + '"><i class="fa-solid fa-user-gear w-4 text-slate-400"></i>Pengaturan Akun</a>' +
          '<div class="my-1 border-t border-slate-100"></div>' +
          '<button role="menuitem" id="nav-logout" type="button" class="' + item.replace("text-slate-700", "text-red-600").replace("hover:bg-slate-50", "hover:bg-red-50") + '"><i class="fa-solid fa-right-from-bracket w-4"></i>Keluar</button>' +
        '</div>';

      const btn = document.getElementById("nav-user"), menu = document.getElementById("nav-menu");
      const close = () => { menu.classList.add("hidden"); btn.setAttribute("aria-expanded", "false"); };
      btn.onclick = ev => {
        ev.stopPropagation();
        const open = menu.classList.toggle("hidden") === false;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      };
      if (!AppNav._bound) { // pasang pendengar global satu kali saja
        AppNav._bound = true;
        document.addEventListener("click", ev => { const m = document.getElementById("nav-menu"), b = document.getElementById("nav-user");
          if (m && !m.classList.contains("hidden") && !m.contains(ev.target) && ev.target !== b) { m.classList.add("hidden"); b && b.setAttribute("aria-expanded", "false"); } });
        document.addEventListener("keydown", ev => { if (ev.key === "Escape") { const m = document.getElementById("nav-menu"); m && m.classList.add("hidden"); } });
      }
      document.getElementById("nav-logout").onclick = () => Auth.logout();
    }
  };
})();
