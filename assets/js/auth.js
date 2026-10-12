/** 296 Library — controller login */
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector("button"), label = btn.textContent;
  btn.disabled = true; btn.textContent = "Memeriksa...";
  const res = await LibraryAPI.call("login", { username: e.target.username.value.trim(), password: e.target.password.value });
  if (res.success) {
    localStorage.setItem(APP_CONFIG.SESSION_KEY, res.token);
    localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(res.user));
    UI.toast("Selamat datang, " + res.user.fullName);
    setTimeout(() => location.href = res.user.role === "Anggota" ? "member-portal.html" : "dashboard.html", 500);
  } else {
    UI.toast(res.message || "Login gagal.", "err");
    btn.disabled = false; btn.textContent = label;
  }
});
