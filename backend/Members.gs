/**
 * 296 Library - Members Management Module
 */
function getAllMembers() {
  return getTableData("Members");
}

// Tambah anggota + akun login (username = nomor anggota). Password awal dikembalikan sekali.
function addMember(token, p) {
  var user = requireUser(token, STAFF_ROLES);
  if (!user) return { success: false, message: "Akses ditolak." };
  if (!p.full_name || !String(p.full_name).trim()) return { success: false, message: "Nama lengkap wajib diisi." };
  if (p.email && !validateEmail(p.email)) return { success: false, message: "Format email tidak valid." };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var members = getTableData("Members");
    var number = p.member_number ? String(p.member_number).trim() : "M" + new Date().getFullYear() + "-" + ("0000" + (members.length + 1)).slice(-4);
    var taken = members.some(function(m) { return String(m.member_number) === number; }) ||
      getTableData("Users").some(function(u) { return String(u.username) === number; });
    if (taken) return { success: false, message: "Nomor anggota " + number + " sudah dipakai." };

    var now = new Date(), exp = new Date(now.getTime() + 365 * 86400000), pwd = randomPassword_();
    insertTableRow("Members", { member_id: "MEM_" + now.getTime(), member_number: number, full_name: sanitizeInput(p.full_name),
      member_type: p.member_type || "Umum", unit_class: sanitizeInput(p.unit_class || ""), phone: p.phone || "", email: p.email || "",
      join_date: now, expiry_date: exp, status: "Aktif", created_at: now, updated_at: now });
    insertTableRow("Users", { user_id: "USR_" + now.getTime() + "m", username: number, password_hash: sha256Hex_(pwd),
      full_name: sanitizeInput(p.full_name), role: "Anggota", email: p.email || "", status: "Active", created_at: now, updated_at: now });
    logAudit(user.user_id, "ADD_MEMBER", "Members", number);
    return { success: true, message: "Anggota " + number + " dibuat. Password awal: " + pwd + " (catat sekarang, tidak ditampilkan lagi).",
      data: { member_number: number, password: pwd } };
  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}
