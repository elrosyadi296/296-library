/** 296 Library — API client (satu-satunya; menggantikan 2api.js) */
window.LibraryAPI = {
  async call(action, payload = {}) {
    const url = window.APP_CONFIG && APP_CONFIG.API_BASE_URL;
    if (!url) return { success: false, message: "API_BASE_URL belum diatur di config.js." };
    const token = localStorage.getItem(APP_CONFIG.SESSION_KEY);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ token, ...payload, action })
      });
      return await res.json();
    } catch (err) {
      console.error("API Error:", err);
      return { success: false, message: "Tidak dapat terhubung ke server." };
    }
  }
};
