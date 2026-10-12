/**
 * 296 Library — Web App Entry Point (satu-satunya doGet/doPost)
 * Semua respons: { success, data?, message? }
 */
var PUBLIC_ACTIONS = ["ping", "getPublicCatalog"];

function route_(action, p) {
  p = p || {};
  switch (action) {
    case "ping": return { success: true, data: { time: new Date() } };
    case "getPublicCatalog": return { success: true, data: getPublicCatalog() };
    case "login": return apiLogin(p.username, p.password);
    case "getDashboardStats":
      if (!requireUser(p.token, STAFF_ROLES)) return { success: false, message: "Akses ditolak." };
      var loans = getTableData("Loans"), fines = getTableData("Fines");
      return { success: true, data: {
        booksCount: getTableData("Books").length,
        copiesCount: getTableData("BookCopies").length,
        membersCount: getTableData("Members").length,
        activeLoans: loans.filter(function(l) { return l.status === "Dipinjam"; }).length,
        unpaidFines: fines.filter(function(f) { return f.status !== "Lunas"; })
          .reduce(function(t, f) { return t + Number(f.amount || 0); }, 0)
      } };
    case "getLoans":
      if (!requireUser(p.token, STAFF_ROLES)) return { success: false, message: "Akses ditolak." };
      return { success: true, data: getLoansDetailed() };
    case "getMyLoans":
      var me = requireUser(p.token);
      if (!me) return { success: false, message: "Sesi berakhir. Silakan login ulang." };
      var mem = getTableData("Members").filter(function(m) { return String(m.member_number) === String(me.username); })[0];
      return { success: true, data: mem ? getLoansDetailed(mem.member_id) : [] };
    case "getCopies":
      if (!requireUser(p.token, STAFF_ROLES)) return { success: false, message: "Akses ditolak." };
      return { success: true, data: getCopiesDetailed() };
    case "addBook": return addBook(p.token, p);
    case "getMembers":
      if (!requireUser(p.token, STAFF_ROLES)) return { success: false, message: "Akses ditolak." };
      return { success: true, data: getAllMembers().map(function(m) {
        return { member_number: m.member_number, full_name: m.full_name, member_type: m.member_type, unit_class: m.unit_class, status: m.status, expiry_date: m.expiry_date }; }) };
    case "addMember": return addMember(p.token, p);
    case "getFines":
      if (!requireUser(p.token, STAFF_ROLES)) return { success: false, message: "Akses ditolak." };
      return { success: true, data: getFinesDetailed() };
    case "payFine": return processPayFine(p.token, p.fineId);
    case "getReport":
      if (!requireUser(p.token, STAFF_ROLES)) return { success: false, message: "Akses ditolak." };
      return { success: true, data: generateLoanReport(p.from, p.to) };
    case "createReservation": return createReservation(p.token, p.bookId);
    case "getReservations":
      var ru = requireUser(p.token);
      if (!ru) return { success: false, message: "Sesi berakhir. Silakan login ulang." };
      return { success: true, data: getReservationsDetailed(ru) };
    case "cancelReservation": return cancelReservation(p.token, p.reservationId);
    case "borrowBook": return processBorrowBook(p.token, p.memberId, p.copyId);
    case "returnBook": return processReturnBook(p.token, p.loanId);
    default: return { success: false, message: "Aksi tidak dikenal: " + action };
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "ping";
  if (PUBLIC_ACTIONS.indexOf(action) === -1) return out_({ success: false, message: "Gunakan POST untuk aksi ini." });
  try { return out_(route_(action, {})); } catch (err) { return out_({ success: false, message: err.toString() }); }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    return out_(route_(payload.action, payload));
  } catch (err) {
    return out_({ success: false, message: "Server Exception: " + err.toString() });
  }
}
