/**
 * 296 Library — UI Helper & Notification Toast Controller
 */
class LibraryUI {
    static showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `fixed bottom-5 right-5 z-50 px-6 py-3 rounded-xl text-white shadow-lg text-sm font-medium transition transform translate-y-0 ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`;
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add("translate-y-10", "opacity-0");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}