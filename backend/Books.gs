/**
 * 296 Library - Books & Copies Management Module
 */
function getAllBooks() {
  return getTableData("Books");
}

function getBookCopies(bookId) {
  return getTableData("BookCopies").filter(function(c) { return c.book_id === bookId; });
}

// Katalog publik: hanya buku aktif + jumlah eksemplar tersedia
function getPublicCatalog() {
  var copies = getTableData("BookCopies");
  return getTableData("Books")
    .filter(function(b) { return b.catalog_status !== "Nonaktif"; })
    .map(function(b) {
      var mine = copies.filter(function(c) { return c.book_id === b.book_id; });
      b.total_copies = mine.length;
      b.available_copies = mine.filter(function(c) { return c.status === "Tersedia"; }).length;
      return b;
    });
}

// Tambah buku + N eksemplar (petugas)
function addBook(token, p) {
  var user = requireUser(token, STAFF_ROLES);
  if (!user) return { success: false, message: "Akses ditolak." };
  if (!p.title || !String(p.title).trim()) return { success: false, message: "Judul wajib diisi." };
  var n = Math.max(1, Math.min(50, parseInt(p.copies, 10) || 1));
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var now = new Date(), t = now.getTime(), bookId = "BK_" + t;
    insertTableRow("Books", { book_id: bookId, isbn: p.isbn || "", title: sanitizeInput(p.title), author: sanitizeInput(p.author || ""),
      publisher: sanitizeInput(p.publisher || ""), publish_year: p.publish_year || "", language: p.language || "Indonesia",
      category: sanitizeInput(p.category || "Umum"), description: sanitizeInput(p.description || ""), pages: p.pages || "",
      cover_url: p.cover_url || "", shelf_location: sanitizeInput(p.shelf_location || ""), catalog_status: "Aktif",
      input_date: now, input_by: user.user_id, created_at: now, updated_at: now });
    var base = getTableData("BookCopies").length, codes = [];
    for (var i = 1; i <= n; i++) {
      var code = "INV-" + ("00000" + (base + i)).slice(-5);
      insertTableRow("BookCopies", { copy_id: "CP_" + t + "_" + i, book_id: bookId, inventory_number: code, barcode: code,
        shelf_location: sanitizeInput(p.shelf_location || ""), condition: "Baik", status: "Tersedia", created_at: now, updated_at: now });
      codes.push(code);
    }
    logAudit(user.user_id, "ADD_BOOK", "Books", bookId + " (" + n + " eksemplar)");
    return { success: true, message: "Buku ditambahkan dengan kode " + codes.join(", ") + ".", data: { book_id: bookId, codes: codes } };
  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function getCopiesDetailed() {
  var titles = {};
  getTableData("Books").forEach(function(b) { titles[b.book_id] = b.title; });
  return getTableData("BookCopies").map(function(c) {
    return { copy_id: c.copy_id, barcode: c.barcode, title: titles[c.book_id] || c.book_id, status: c.status, shelf_location: c.shelf_location };
  });
}
