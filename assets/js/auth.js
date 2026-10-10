/**
 * 296 Library - Authentication Frontend Controller
 */
document.getElementById("loginForm")?.addEventListener("submit", async function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await LibraryAPI.call("login", { username, password });
    if (res.success) {
        localStorage.setItem(window.APP_CONFIG.SESSION_KEY, res.token);
        localStorage.setItem(window.APP_CONFIG.USER_KEY, JSON.stringify(res.user));
        alert("Login berhasil!");
        window.location.href = "dashboard.html";
    } else {
        alert("Login Gagal: " + res.message);
    }
});