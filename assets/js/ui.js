/** 296 Library — helper UI, sesi, animasi */
window.UI = {
  esc: s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  date: d => { const x = new Date(d); return isNaN(x) ? "-" : x.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); },
  rupiah: n => "Rp " + Number(n || 0).toLocaleString("id-ID"),
  toast(msg, type) {
    let box = document.querySelector(".toasts");
    if (!box) { box = document.createElement("div"); box.className = "toasts"; document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast" + (type === "err" ? " err" : ""); t.textContent = msg; box.appendChild(t);
    setTimeout(() => { t.style.transition = ".3s"; t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 3200);
  },
  chrome(active) {
    const u = Auth.user(), home = u ? (u.role === "Anggota" ? "member-portal.html" : "dashboard.html") : "login.html";
    const h = document.getElementById("siteHeader");
    if (h) h.innerHTML = `<div class="container"><a href="index.html" class="logo"><i>📚</i>296 Library</a>
      <nav class="nav"><a href="index.html" class="${active === "home" ? "on" : ""}">Beranda</a>
      <a href="catalog.html" class="${active === "catalog" ? "on" : ""}">Katalog</a>
      <a href="${home}" class="cta">${u ? "Akun saya" : "Masuk"}</a></nav></div>`;
    const f = document.getElementById("siteFooter");
    if (f) f.innerHTML = "© 2026 296 Library — dibuat oleh 296 Studios";
  },
  reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
  },
  tilt(root) {
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    root.addEventListener("mousemove", e => {
      const c = e.target.closest(".book-card"); if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 16 + "deg");
      c.style.setProperty("--rx", (.5 - (e.clientY - r.top) / r.height) * 12 + "deg");
    });
    root.addEventListener("mouseout", e => { const c = e.target.closest(".book-card"); if (c) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); } });
  },
  // Sampul gagal dimuat -> tampilkan sampul gradien bawaan
  coverFallback(root) { root.addEventListener("error", e => { if (e.target.tagName === "IMG") e.target.remove(); }, true); }
};
window.Auth = {
  user() { try { return JSON.parse(localStorage.getItem(APP_CONFIG.USER_KEY)); } catch (e) { return null; } },
  guard(roles) {
    const u = this.user();
    if (!u || !localStorage.getItem(APP_CONFIG.SESSION_KEY) || (roles && !roles.includes(u.role))) { location.replace("login.html"); return null; }
    return u;
  },
  logout() { localStorage.removeItem(APP_CONFIG.SESSION_KEY); localStorage.removeItem(APP_CONFIG.USER_KEY); location.href = "login.html"; }
};
