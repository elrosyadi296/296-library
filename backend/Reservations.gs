/**
 * 296 Library - Reservations & Antrean
 */
function findMemberByUser_(user) {
  return getTableData("Members").filter(function(m) { return String(m.member_number) === String(user.username); })[0];
}

function createReservation(token, bookId) {
  var user = requireUser(token);
  if (!user) return { success: false, message: "Silakan login terlebih dahulu." };
  var member = findMemberByUser_(user);
  if (!member) return { success: false, message: "Akun ini belum terhubung dengan data anggota." };
  var book = getTableData("Books").filter(function(b) { return b.book_id === bookId; })[0];
  if (!book) return { success: false, message: "Buku tidak ditemukan." };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var dup = getTableData("Reservations").some(function(r) { return r.member_id === member.member_id && r.book_id === bookId && r.status === "Menunggu"; });
    if (dup) return { success: false, message: "Kamu sudah masuk antrean untuk buku ini." };
    var now = new Date();
    insertTableRow("Reservations", { reservation_id: "RSV_" + now.getTime(), member_id: member.member_id, book_id: bookId,
      reservation_date: now, expiry_date: new Date(now.getTime() + 7 * 86400000), status: "Menunggu", created_at: now, updated_at: now });
    var pos = getTableData("Reservations").filter(function(r) { return r.book_id === bookId && r.status === "Menunggu"; }).length;
    return { success: true, message: "Reservasi tercatat. Posisi antreanmu: " + pos + "." };
  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function getReservationsDetailed(user) {
  var isStaff = STAFF_ROLES.indexOf(user.role) > -1, mine = isStaff ? null : findMemberByUser_(user);
  if (!isStaff && !mine) return [];
  var names = {}, titles = {};
  getTableData("Members").forEach(function(m) { names[m.member_id] = m.full_name; });
  getTableData("Books").forEach(function(b) { titles[b.book_id] = b.title; });
  return getTableData("Reservations").reverse()
    .filter(function(r) { return isStaff || r.member_id === mine.member_id; }).slice(0, 100)
    .map(function(r) {
      return { reservation_id: r.reservation_id, member: names[r.member_id] || r.member_id, title: titles[r.book_id] || r.book_id,
        reservation_date: r.reservation_date, expiry_date: r.expiry_date, status: r.status };
    });
}

function cancelReservation(token, reservationId) {
  var user = requireUser(token);
  if (!user) return { success: false, message: "Silakan login terlebih dahulu." };
  var r = getTableData("Reservations").filter(function(x) { return x.reservation_id === reservationId; })[0];
  if (!r) return { success: false, message: "Reservasi tidak ditemukan." };
  var mem = findMemberByUser_(user);
  if (STAFF_ROLES.indexOf(user.role) === -1 && (!mem || mem.member_id !== r.member_id)) return { success: false, message: "Akses ditolak." };
  updateTableRow("Reservations", "reservation_id", reservationId, { status: "Dibatalkan", updated_at: new Date() });
  return { success: true, message: "Reservasi dibatalkan." };
}
