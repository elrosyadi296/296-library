/**
 * 296 Library - Frontend API Handler
 */
class LibraryAPI {
    static async call(action, payload = {}) {
        payload.action = action;
        try {
            const response = await fetch(window.APP_CONFIG.API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return { success: false, message: "Koneksi ke server gagal." };
        }
    }
}
